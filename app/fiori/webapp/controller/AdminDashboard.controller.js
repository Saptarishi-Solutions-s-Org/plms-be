sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService",
    "lma/fiori/services/SocketService"
], function (Controller, JSONModel, ApiService, SocketService) {
    "use strict";

    return Controller.extend("lma.fiori.controller.AdminDashboard", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("adminDashboard").attachMatched(this._onRouteMatched, this);
            
            // Local model for dashboard variables
            var oModel = new JSONModel({
                totalOrganizations: 0,
                totalUsers: 0,
                usersPerOrg: [],
                roles: [],
                roleMatrix: [],
                activePermissions: []
            });
            this.getView().setModel(oModel);

            // Keep reference to unsubscribe function
            this._fnUnsubscribeRealtime = null;
        },

        _onRouteMatched: function () {
            this._fetchDashboardData("initial");
            
            // Subscribe to real-time syncs
            if (!this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime = SocketService.subscribe(
                    "system-admin:dashboard:changed", 
                    this._onRealtimeDashboardChanged.bind(this)
                );
            }
        },

        onExit: function () {
            if (this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime();
                this._fnUnsubscribeRealtime = null;
            }
        },

        _onRealtimeDashboardChanged: function () {
            sap.m.MessageToast.show("Dashboard updated in real-time!");
            this._fetchDashboardData("realtime");
        },

        _fetchDashboardData: function (sMode) {
            var oView = this.getView();
            var oModel = oView.getModel();

            if (sMode === "initial") {
                oView.setBusy(true);
            }

            var that = this;
            ApiService.api("/odata/v4/system-admin/getDashboard()")
                .then(function (data) {
                    oView.setBusy(false);
                    if (!data) return;

                    oModel.setProperty("/totalOrganizations", data.totalOrganizations);
                    oModel.setProperty("/totalUsers", data.totalUsers);
                    oModel.setProperty("/usersPerOrg", data.usersPerOrg || []);
                    oModel.setProperty("/roles", data.roles || []);
                    oModel.setProperty("/roleMatrix", data.roleMatrix || []);

                    // Select first role by default if none is selected
                    var sSelectedRole = oModel.getProperty("/selectedRole");
                    var aRoles = data.roles || [];
                    
                    if (aRoles.length > 0) {
                        var oRoleSelect = that.byId("roleSelect");
                        var sCurrentSelect = oRoleSelect.getSelectedKey();
                        
                        if (!sCurrentSelect || !aRoles.some(function(r){ return r.orgRoleId === sCurrentSelect; })) {
                            sSelectedRole = aRoles[0].orgRoleId;
                            oRoleSelect.setSelectedKey(sSelectedRole);
                        } else {
                            sSelectedRole = sCurrentSelect;
                        }
                        
                        oModel.setProperty("/selectedRole", sSelectedRole);
                        that._updateActivePermissions(sSelectedRole);
                    }
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error("Dashboard Load Error:", error);
                    sap.m.MessageBox.error("Failed to load dashboard data: " + error.message);
                });
        },

        onRoleChange: function (oEvent) {
            var sSelectedRole = oEvent.getParameter("selectedItem").getKey();
            this.getView().getModel().setProperty("/selectedRole", sSelectedRole);
            this._updateActivePermissions(sSelectedRole);
        },

        _updateActivePermissions: function (sSelectedRoleId) {
            var oModel = this.getView().getModel();
            var aRoleMatrix = oModel.getProperty("/roleMatrix") || [];
            
            var oCurrentRole = aRoleMatrix.find(function (item) {
                return item.orgRoleId === sSelectedRoleId;
            });

            var aPermissions = ["create", "view", "update", "delete", "import", "export"];
            var aActivePermissions = [];

            if (oCurrentRole && oCurrentRole.modules) {
                Object.keys(oCurrentRole.modules).forEach(function (sModuleName) {
                    var oPerms = oCurrentRole.modules[sModuleName] || {};
                    aActivePermissions.push({
                        moduleName: sModuleName,
                        create: !!oPerms.create,
                        view: !!oPerms.view,
                        update: !!oPerms.update,
                        "delete": !!oPerms["delete"] || !!oPerms.delete,
                        import: !!oPerms.import,
                        export: !!oPerms.export
                    });
                });
            }

            oModel.setProperty("/activePermissions", aActivePermissions);
        }
    });
});
