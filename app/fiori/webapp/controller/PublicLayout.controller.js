sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("lma.fiori.controller.PublicLayout", {
        onInit: function () {
        },

        onNavTo: function (sRouteName) {
            this.getOwnerComponent().getRouter().navTo(sRouteName);
        },

        onNavToAuth: function () {
            var oAuthModel = this.getView().getModel("auth");
            var bIsLoggedIn = oAuthModel.getProperty("/isLoggedIn");

            if (bIsLoggedIn) {
                // If logged in, go to dashboard
                this.getOwnerComponent().getRouter().navTo("adminDashboard");
            } else {
                // Otherwise navigate to login page
                this.getOwnerComponent().getRouter().navTo("login");
            }
        }
    });
});
