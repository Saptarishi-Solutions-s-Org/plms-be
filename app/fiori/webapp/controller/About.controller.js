sap.ui.define([
    "lma/fiori/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("lma.fiori.controller.About", {
        onInit: function () {
        },

        onSignIn: function () {
            var oAuthModel = this.getView().getModel("auth");
            var bIsLoggedIn = oAuthModel.getProperty("/isLoggedIn");

            if (bIsLoggedIn) {
                this.getOwnerComponent().getRouter().navTo("adminDashboard");
            } else {
                this.getOwnerComponent().getRouter().navTo("login");
            }
        }
    });
});
