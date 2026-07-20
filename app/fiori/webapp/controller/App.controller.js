sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "lma/fiori/services/ApiService"
], function (Controller, ApiService) {
    "use strict";

    return Controller.extend("lma.fiori.controller.App", {
        onInit: function () {
            // Check session on app load
            ApiService.refreshSession(false);
        }
    });
});
