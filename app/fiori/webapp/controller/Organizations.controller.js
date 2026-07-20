sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService",
    "lma/fiori/services/SocketService",
    "sap/m/MessageBox"
], function (Controller, JSONModel, ApiService, SocketService, MessageBox) {
    "use strict";

    return Controller.extend("lma.fiori.controller.Organizations", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("organizations").attachMatched(this._onRouteMatched, this);

            var oModel = new JSONModel({
                orgs: [],
                filteredOrgs: [],
                totalOrgs: 0,
                activeOrgs: 0,
                inactiveOrgs: 0,
                countries: [],
                states: [],
                dialogTitle: "",
                dialogData: {
                    id: "",
                    name: "",
                    code: "",
                    email: "",
                    phone: "",
                    address: "",
                    country: "",
                    state: "",
                    trial: "Free",
                    is_active: true,
                    isEdit: false
                }
            });
            this.getView().setModel(oModel);

            this._fnUnsubscribeRealtime = null;
        },

        _onRouteMatched: function () {
            this._fetchOrganizations("initial");

            if (!this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime = SocketService.subscribe(
                    "organization:list:changed",
                    this._onRealtimeOrgsChanged.bind(this)
                );
            }
        },

        onExit: function () {
            if (this._fnUnsubscribeRealtime) {
                this._fnUnsubscribeRealtime();
                this._fnUnsubscribeRealtime = null;
            }
        },

        _onRealtimeOrgsChanged: function () {
            this._fetchOrganizations("realtime");
        },

        _fetchOrganizations: function (sMode) {
            var oView = this.getView();
            var oModel = oView.getModel();

            if (sMode === "initial") {
                oView.setBusy(true);
            }

            ApiService.api("/odata/v4/organization/getOrganizations()")
                .then(function (data) {
                    oView.setBusy(false);
                    var aOrgs = data || [];
                    
                    oModel.setProperty("/orgs", aOrgs);
                    oModel.setProperty("/totalOrgs", aOrgs.length);
                    
                    var nActive = aOrgs.filter(function (o) { return o.is_active; }).length;
                    oModel.setProperty("/activeOrgs", nActive);
                    oModel.setProperty("/inactiveOrgs", aOrgs.length - nActive);

                    // Re-apply search filter
                    var oSearchField = oView.byId("searchField");
                    var sQuery = oSearchField ? oSearchField.getValue() : "";
                    this._applyFilter(sQuery);
                }.bind(this))
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error("Organizations Load Error:", error);
                    MessageBox.error("Failed to load organizations: " + error.message);
                });
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue") || "";
            this._applyFilter(sQuery);
        },

        _applyFilter: function (sQuery) {
            var oModel = this.getView().getModel();
            var aOrgs = oModel.getProperty("/orgs") || [];

            if (!sQuery) {
                oModel.setProperty("/filteredOrgs", aOrgs);
                return;
            }

            sQuery = sQuery.toLowerCase();
            var aFiltered = aOrgs.filter(function (org) {
                return (org.name && org.name.toLowerCase().indexOf(sQuery) !== -1) ||
                       (org.code && org.code.toLowerCase().indexOf(sQuery) !== -1) ||
                       (org.email && org.email.toLowerCase().indexOf(sQuery) !== -1);
            });

            oModel.setProperty("/filteredOrgs", aFiltered);
        },

        onOpenCreateDialog: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/dialogTitle", "Create Organization");
            oModel.setProperty("/dialogData", {
                id: "",
                name: "",
                code: "",
                email: "",
                phone: "",
                address: "",
                country: "",
                state: "",
                trial: "Free",
                is_active: true,
                isEdit: false
            });

            this._loadLocations().then(function () {
                this.byId("orgDialog").open();
            }.bind(this));
        },

        onEditPress: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent(); // GridListItem -> VBox -> Button
            var oContext = oItem.getBindingContext();
            var oOrgData = oContext.getObject();

            var oModel = this.getView().getModel();
            oModel.setProperty("/dialogTitle", "Edit Organization");
            oModel.setProperty("/dialogData", {
                id: oOrgData.id,
                name: oOrgData.name,
                code: oOrgData.code,
                email: oOrgData.email || "",
                phone: oOrgData.phone || "",
                address: oOrgData.address || "",
                country: oOrgData.country_id || "",
                state: oOrgData.state_id || "",
                trial: oOrgData.trial || "Free",
                is_active: oOrgData.is_active,
                isEdit: true
            });

            this._loadLocations(oOrgData.country_id).then(function () {
                // Set Selected dropdown values
                this.byId("dialogCountry").setSelectedKey(oOrgData.country_id);
                this.byId("dialogState").setSelectedKey(oOrgData.state_id);
                this.byId("orgDialog").open();
            }.bind(this));
        },

        onDetailsPress: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oOrgData = oItem.getBindingContext().getObject();
            this.getOwnerComponent().getRouter().navTo("organizationDetails", {
                code: oOrgData.code
            });
        },

        _loadLocations: function (sSelectedCountryId) {
            var oView = this.getView();
            var oModel = oView.getModel();
            oView.setBusy(true);

            // Fetch countries first
            return ApiService.api("/odata/v4/location/getCountries()")
                .then(function (aCountries) {
                    oModel.setProperty("/countries", aCountries || []);

                    var sCountryId = sSelectedCountryId;
                    if (!sCountryId && aCountries && aCountries.length > 0) {
                        sCountryId = aCountries[0].id;
                    }

                    if (sCountryId) {
                        oModel.setProperty("/dialogData/country", sCountryId);
                        // Fetch states
                        return ApiService.api("/odata/v4/location/getStatesByCountry(countryId='" + sCountryId + "')");
                    }
                    return [];
                })
                .then(function (aStates) {
                    oView.setBusy(false);
                    oModel.setProperty("/states", aStates || []);
                    if (aStates && aStates.length > 0 && !oModel.getProperty("/dialogData/state")) {
                        oModel.setProperty("/dialogData/state", aStates[0].id);
                    }
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error("Locations Load Error:", error);
                    sap.m.MessageToast.show("Failed to load country/state list");
                });
        },

        onCountryChange: function (oEvent) {
            var sCountryId = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel();
            oModel.setProperty("/dialogData/country", sCountryId);

            var oView = this.getView();
            oView.setBusy(true);

            ApiService.api("/odata/v4/location/getStatesByCountry(countryId='" + sCountryId + "')")
                .then(function (aStates) {
                    oView.setBusy(false);
                    oModel.setProperty("/states", aStates || []);
                    if (aStates && aStates.length > 0) {
                        oModel.setProperty("/dialogData/state", aStates[0].id);
                        oView.byId("dialogState").setSelectedKey(aStates[0].id);
                    } else {
                        oModel.setProperty("/dialogData/state", "");
                    }
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error(error);
                });
        },

        onSaveOrganization: function () {
            var oModel = this.getView().getModel();
            var oData = oModel.getProperty("/dialogData");
            var oDialog = this.byId("orgDialog");

            var sName = oData.name;
            var sCode = oData.code;
            var sEmail = oData.email;
            var sPhone = oData.phone;
            var sAddress = oData.address;
            var sCountry = this.byId("dialogCountry").getSelectedKey();
            var sState = this.byId("dialogState").getSelectedKey();
            var sTrial = oData.trial;
            var bActive = this.byId("dialogActive").getState();

            if (!sName || (!oData.isEdit && !sCode) || !sCountry || !sState) {
                MessageBox.error("Please fill in Name, Code, Country, and State.");
                return;
            }

            oDialog.setBusy(true);

            var sToday = new Date().toISOString().split("T")[0];
            var oNextYear = new Date();
            oNextYear.setFullYear(oNextYear.getFullYear() + 1);
            var sNextYear = oNextYear.toISOString().split("T")[0];

            var oPayload = {
                name: sName,
                email: sEmail,
                phone: sPhone,
                address: sAddress,
                state: sState,
                country: sCountry,
                trial: sTrial,
                is_active: bActive
            };

            var sPath = "/odata/v4/organization/createOrganization";
            if (oData.isEdit) {
                sPath = "/odata/v4/organization/updateOrganization";
                oPayload.id = oData.id;
            } else {
                oPayload.start_date = sToday;
                oPayload.end_date = sNextYear;
            }

            var that = this;
            ApiService.api(sPath, {
                method: "POST",
                body: JSON.stringify(oPayload)
            })
            .then(function () {
                oDialog.setBusy(false);
                oDialog.close();
                sap.m.MessageToast.show(oData.isEdit ? "Organization updated successfully!" : "Organization created successfully!");
                that._fetchOrganizations("realtime");
            })
            .catch(function (error) {
                oDialog.setBusy(false);
                MessageBox.error("Failed to save organization: " + error.message);
            });
        },

        onCloseDialog: function () {
            this.byId("orgDialog").close();
        }
    });
});
