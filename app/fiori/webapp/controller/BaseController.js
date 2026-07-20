sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("lma.fiori.controller.BaseController", {
        onNavTo: function (sRouteName) {
            this.getOwnerComponent().getRouter().navTo(sRouteName);
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("public", {}, true);
            }
        }
    });
});
