sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService",
    "lma/fiori/services/SocketService",
    "lma/fiori/model/formatter",
    "sap/m/MessageBox"
], function (Controller, JSONModel, ApiService, SocketService, formatter, MessageBox) {
    "use strict";

    // Blocked system-critical permissions from Next.js page.tsx
    var BLOCKED_PERMISSIONS = {
        Admin: {
            lead: ["import", "delete"],
            "lead activity": ["import", "export", "delete"],
            offers: ["import", "delete"],
            permission: ["create", "import", "export", "delete"],
            reports: ["create", "update", "import", "delete"],
            user: ["import", "delete"],
            segmentation: ["create", "update", "delete", "import", "export"]
        },
        Manager: {
            lead: ["delete"],
            "lead activity": ["import", "export", "delete"],
            offers: ["import", "delete"],
            permission: ["create", "view", "update", "delete", "import", "export"],
            reports: ["create", "update", "import", "delete"],
            user: ["import", "delete"],
            segmentation: ["import"]
        },
        Executive: {
            lead: ["delete"],
            "lead activity": ["import", "export", "delete"],
            offers: ["create", "update", "import", "delete"],
            permission: ["create", "view", "update", "delete", "import", "export"],
            reports: ["create", "update", "import", "delete"],
            user: ["create", "view", "update", "delete", "import", "export"],
            segmentation: ["import"]
        }
    };

    var PERMISSION_LIST = ["create", "view", "update", "delete", "import", "export"];

    function isPermissionBlocked(sRoleName, sModuleName, sPermName) {
        var sRole = sRoleName ? sRoleName.toLowerCase() : "";
        var sMod = sModuleName ? sModuleName.toLowerCase() : "";
        var sPerm = sPermName ? sPermName.toLowerCase() : "";

        // Map standard display roles to BLOCKED_PERMISSIONS keys
        var sKey = "";
        if (sRole.indexOf("admin") !== -1) sKey = "Admin";
        else if (sRole.indexOf("manager") !== -1) sKey = "Manager";
        else if (sRole.indexOf("executive") !== -1) sKey = "Executive";

        if (sKey && BLOCKED_PERMISSIONS[sKey] && BLOCKED_PERMISSIONS[sKey][sMod]) {
            return BLOCKED_PERMISSIONS[sKey][sMod].indexOf(sPerm) !== -1;
        }
        return false;
    }

    return Controller.extend("lma.fiori.controller.OrganizationDetails", {
        formatter: formatter,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("organizationDetails").attachMatched(this._onRouteMatched, this);

            var oModel = new JSONModel({
                organization: null,
                roles: [],
                modules: [],
                permissions: [],
                allRoles: [],
                allModules: [],
                users: [],
                rolesList: [],
                selectedRole: "",
                activePermissions: [],
                draftPermissions: [],
                canEditAdminPermissions: false,
                userData: {
                    name: "",
                    email: "",
                    phone: "",
                    gender: "Male",
                    dob: "",
                    country: "",
                    state: ""
                },
                userCountries: [],
                userStates: []
            });
            this.getView().setModel(oModel);

            this._fnUnsubscribeRealtime = null;
        },

        _onRouteMatched: function (oEvent) {
            var sCode = oEvent.getParameter("arguments").code;
            this._sOrgCode = sCode;
            this._fetchOrgDetails("initial");

            if (!this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime = SocketService.subscribe(
                    "organization:detail:changed",
                    this._onRealtimeOrgDetailChanged.bind(this)
                );
            }
        },

        onExit: function () {
            if (this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime();
                this._fnUnsubscribeRealtime = null;
            }
        },

        _onRealtimeOrgDetailChanged: function (oEvent) {
            var oModel = this.getView().getModel();
            var oOrg = oModel.getProperty("/organization");
            
            // Check if socket payload matches current organization ID or Code
            if (oOrg && oEvent && oEvent.data) {
                if (oEvent.data.orgId === oOrg.id || oEvent.data.orgCode === oOrg.code) {
                    this._fetchOrgDetails("realtime");
                }
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("organizations");
        },

        _fetchOrgDetails: function (sMode) {
            var oView = this.getView();
            var oModel = oView.getModel();

            if (sMode === "initial") {
                oView.setBusy(true);
            }

            var that = this;
            ApiService.api("/odata/v4/organization/getOrganizationByCode(code='" + this._sOrgCode + "')")
                .then(function (data) {
                    if (!data || !data.organization) {
                        oView.setBusy(false);
                        MessageBox.error("Organization details not found.");
                        return;
                    }

                    oModel.setProperty("/organization", data.organization);
                    oModel.setProperty("/roles", data.roles || []);
                    oModel.setProperty("/modules", data.modules || []);
                    oModel.setProperty("/permissions", data.permissions || []);

                    // Map allRoles with active checks
                    var aActiveRoleNames = (data.roles || []).map(function(r){ return r.name; });
                    var aAllRoles = (data.allRoles || []).map(function(r) {
                        return {
                            id: r.id,
                            name: r.name,
                            isActive: aActiveRoleNames.indexOf(r.name) !== -1
                        };
                    });
                    oModel.setProperty("/allRoles", aAllRoles);

                    // Map allModules with enabled checks
                    var aActiveModNames = (data.modules || []).map(function(m){ return m.name; });
                    var aAllModules = (data.allModules || []).map(function(m) {
                        return {
                            id: m.id,
                            name: m.name,
                            isEnabled: aActiveModNames.indexOf(m.name) !== -1
                        };
                    });
                    oModel.setProperty("/allModules", aAllModules);

                    // Map unique roles list for dropdown
                    var aPermissions = data.permissions || [];
                    var oUniqueRoles = {};
                    aPermissions.forEach(function (p) {
                        if (p.role) oUniqueRoles[p.role] = true;
                    });
                    var aRolesList = Object.keys(oUniqueRoles);
                    oModel.setProperty("/rolesList", aRolesList);

                    var sSelectedRole = oModel.getProperty("/selectedRole");
                    if (!sSelectedRole && aRolesList.length > 0) {
                        sSelectedRole = aRolesList[0];
                        oModel.setProperty("/selectedRole", sSelectedRole);
                        that.byId("roleSelect").setSelectedKey(sSelectedRole);
                    }

                    if (sSelectedRole) {
                        that._updatePermissionsMatrix(sSelectedRole);
                    }

                    // Check if system admin is logged in to allow role updates
                    var oAuthUser = that.getOwnerComponent().getModel("auth").getProperty("/user");
                    var bCanEdit = false;
                    if (oAuthUser && oAuthUser.role === "System Admin") {
                        bCanEdit = true;
                    }
                    oModel.setProperty("/canEditAdminPermissions", bCanEdit);

                    // Fetch users
                    return ApiService.api("/odata/v4/organization/getAdminUsers(organizationId='" + data.organization.id + "')");
                })
                .then(function (aUsers) {
                    oView.setBusy(false);
                    oModel.setProperty("/users", aUsers || []);
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error("Org Details Load Error:", error);
                    MessageBox.error("Failed to load organization details: " + error.message);
                });
        },

        onRoleChange: function (oEvent) {
            var sRole = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel().setProperty("/selectedRole", sRole);
            this._updatePermissionsMatrix(sRole);
        },

        _updatePermissionsMatrix: function (sRole) {
            var oModel = this.getView().getModel();
            var aPermissions = oModel.getProperty("/permissions") || [];
            
            // Filter permissions for chosen role
            var aFiltered = aPermissions.filter(function (p) {
                return p.role === sRole;
            });

            // Group by module name
            var oGrouped = {};
            aFiltered.forEach(function (p) {
                var sMod = p.module;
                if (!oGrouped[sMod]) {
                    oGrouped[sMod] = {
                        moduleName: sMod,
                        create: false, createBlocked: isPermissionBlocked(sRole, sMod, "create"),
                        view: false, viewBlocked: isPermissionBlocked(sRole, sMod, "view"),
                        update: false, updateBlocked: isPermissionBlocked(sRole, sMod, "update"),
                        "delete": false, deleteBlocked: isPermissionBlocked(sRole, sMod, "delete"),
                        import: false, importBlocked: isPermissionBlocked(sRole, sMod, "import"),
                        export: false, exportBlocked: isPermissionBlocked(sRole, sMod, "export"),
                        // Keep references to raw records to fetch IDs
                        records: {}
                    };
                }
                oGrouped[sMod][p.permission] = p.access;
                oGrouped[sMod].records[p.permission] = p;
            });

            var aMatrix = Object.keys(oGrouped).map(function(k){ return oGrouped[k]; });
            oModel.setProperty("/activePermissions", aMatrix);
        },

        onOpenPermissionsDialog: function () {
            var oModel = this.getView().getModel();
            var aActive = oModel.getProperty("/activePermissions") || [];
            
            // Deep copy to draft permissions
            var aDraft = JSON.parse(JSON.stringify(aActive));
            oModel.setProperty("/draftPermissions", aDraft);

            this.byId("permissionsDialog").open();
        },

        onClosePermissionsDialog: function () {
            this.byId("permissionsDialog").close();
        },

        onSavePermissions: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oDialog = this.byId("permissionsDialog");
            
            var aDraft = oModel.getProperty("/draftPermissions") || [];
            var aOriginal = oModel.getProperty("/activePermissions") || [];
            
            var aChanges = [];

            aDraft.forEach(function (oDraftModule, nIndex) {
                var oOrigModule = aOriginal[nIndex];
                PERMISSION_LIST.forEach(function (sPerm) {
                    // Check if value changed and it's not a blocked feature
                    if (!oDraftModule[sPerm + "Blocked"] && oDraftModule[sPerm] !== oOrigModule[sPerm]) {
                        var oOrigRecord = oOrigModule.records[sPerm];
                        if (oOrigRecord && oOrigRecord.orgRoleModulePermissionId) {
                            aChanges.push({
                                orgRoleModulePermissionId: oOrigRecord.orgRoleModulePermissionId,
                                access: oDraftModule[sPerm]
                            });
                        }
                    }
                });
            });

            if (aChanges.length === 0) {
                oDialog.close();
                sap.m.MessageToast.show("No changes detected.");
                return;
            }

            var oOrg = oModel.getProperty("/organization");
            var aRolePermissions = oModel.getProperty("/permissions").filter(function(p){
                return p.role === oModel.getProperty("/selectedRole");
            });

            // Read orgRoleId of chosen admin role
            var sOrgRoleId = aRolePermissions.length > 0 ? aRolePermissions[0].orgRoleId : null;

            if (!oOrg || !sOrgRoleId) {
                MessageBox.error("Required references missing.");
                return;
            }

            oDialog.setBusy(true);

            var that = this;
            ApiService.api("/odata/v4/system-admin/updateOrganizationAdminPermissions", {
                method: "POST",
                body: JSON.stringify({
                    organizationId: oOrg.id,
                    orgRoleId: sOrgRoleId,
                    permissions: aChanges
                })
            })
            .then(function (res) {
                oDialog.setBusy(false);
                oDialog.close();
                sap.m.MessageToast.show("Admin permissions updated successfully!");
                that._fetchOrgDetails("realtime");
            })
            .catch(function (error) {
                oDialog.setBusy(false);
                MessageBox.error("Failed to update admin permissions: " + error.message);
            });
        },

        onOpenAddUserDialog: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/userData", {
                name: "",
                email: "",
                phone: "",
                gender: "Male",
                dob: "",
                country: "",
                state: ""
            });

            this._loadUserLocations().then(function() {
                this.byId("userDialog").open();
            }.bind(this));
        },

        onCloseUserDialog: function () {
            this.byId("userDialog").close();
        },

        _loadUserLocations: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            oView.setBusy(true);

            return ApiService.api("/odata/v4/location/getCountries()")
                .then(function (aCountries) {
                    oModel.setProperty("/userCountries", aCountries || []);
                    if (aCountries && aCountries.length > 0) {
                        var sCountryId = aCountries[0].id;
                        oModel.setProperty("/userData/country", sCountryId);
                        return ApiService.api("/odata/v4/location/getStatesByCountry(countryId='" + sCountryId + "')");
                    }
                    return [];
                })
                .then(function (aStates) {
                    oView.setBusy(false);
                    oModel.setProperty("/userStates", aStates || []);
                    if (aStates && aStates.length > 0) {
                        oModel.setProperty("/userData/state", aStates[0].id);
                        oView.byId("userState").setSelectedKey(aStates[0].id);
                    }
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error(error);
                });
        },

        onUserCountryChange: function (oEvent) {
            var sCountryId = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel();
            oModel.setProperty("/userData/country", sCountryId);

            var oView = this.getView();
            oView.setBusy(true);

            ApiService.api("/odata/v4/location/getStatesByCountry(countryId='" + sCountryId + "')")
                .then(function (aStates) {
                    oView.setBusy(false);
                    oModel.setProperty("/userStates", aStates || []);
                    if (aStates && aStates.length > 0) {
                        oModel.setProperty("/userData/state", aStates[0].id);
                        oView.byId("userState").setSelectedKey(aStates[0].id);
                    } else {
                        oModel.setProperty("/userData/state", "");
                    }
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error(error);
                });
        },

        onAddUser: function () {
            var oModel = this.getView().getModel();
            var oUserData = oModel.getProperty("/userData");
            var oOrg = oModel.getProperty("/organization");
            var oDialog = this.byId("userDialog");

            var sName = oUserData.name;
            var sEmail = oUserData.email;
            var sPhone = oUserData.phone;
            var sGender = oUserData.gender;
            var sDob = this.byId("userDob").getValue();
            var sCountry = this.byId("userCountry").getSelectedKey();
            var sState = this.byId("userState").getSelectedKey();

            if (!sName || !sEmail || !sPhone || !sDob || !sCountry || !sState) {
                MessageBox.error("Please fill in all user details fields.");
                return;
            }

            oDialog.setBusy(true);

            var oPayload = {
                name: sName,
                email: sEmail,
                phone: sPhone,
                gender: sGender,
                dob: sDob,
                country: sCountry,
                state: sState,
                organizationId: oOrg.id
            };

            var that = this;
            ApiService.api("/odata/v4/organization/createUser", {
                method: "POST",
                body: JSON.stringify(oPayload)
            })
            .then(function () {
                oDialog.setBusy(false);
                oDialog.close();
                sap.m.MessageToast.show("Admin user added successfully! Password sent via mail.");
                
                // Reload users list
                return ApiService.api("/odata/v4/organization/getAdminUsers(organizationId='" + oOrg.id + "')");
            })
            .then(function (aUsers) {
                oModel.setProperty("/users", aUsers || []);
            })
            .catch(function (error) {
                oDialog.setBusy(false);
                MessageBox.error("Failed to add user: " + error.message);
            });
        }
    });
});
