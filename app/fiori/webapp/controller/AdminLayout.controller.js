sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService"
], function (Controller, JSONModel, ApiService) {
    "use strict";

    return Controller.extend("lma.fiori.controller.AdminLayout", {
        onInit: function () {
            var oViewModel = new JSONModel({
                selectedKey: "adminDashboard"
            });
            this.getView().setModel(oViewModel);

            // Synchronize active sidebar keys based on route changes
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("adminDashboard").attachMatched(function () {
                oViewModel.setProperty("/selectedKey", "adminDashboard");
            });
            oRouter.getRoute("organizations").attachMatched(function () {
                oViewModel.setProperty("/selectedKey", "organizations");
            });
            oRouter.getRoute("organizationDetails").attachMatched(function () {
                oViewModel.setProperty("/selectedKey", "organizations");
            });
            oRouter.getRoute("defaultTemplates").attachMatched(function () {
                oViewModel.setProperty("/selectedKey", "defaultTemplates");
            });
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onSideNavItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this.getOwnerComponent().getRouter().navTo(sKey);
        },

        onLogout: function () {
            var that = this;
            sap.m.MessageBox.confirm("Are you sure you want to log out?", {
                title: "Log Out",
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        ApiService.logout();
                    }
                }
            });
        }
    });
});
