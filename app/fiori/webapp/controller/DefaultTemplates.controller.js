sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService"
], function (Controller, JSONModel, ApiService) {
    "use strict";

    return Controller.extend("lma.fiori.controller.DefaultTemplates", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("defaultTemplates").attachMatched(this._onRouteMatched, this);

            var oModel = new JSONModel({
                modules: [],
                roles: [],
                rmp: [],
                segmentFilters: []
            });
            this.getView().setModel(oModel);
        },

        _onRouteMatched: function () {
            var oView = this.getView();
            var oModel = oView.getModel();

            oView.setBusy(true);

            ApiService.api("/odata/v4/system-admin/getDefaultTemplates()")
                .then(function (data) {
                    oView.setBusy(false);
                    if (!data) return;

                    oModel.setProperty("/modules", data.modules || []);
                    oModel.setProperty("/roles", data.roles || []);
                    oModel.setProperty("/rmp", data.rmp || []);
                    oModel.setProperty("/segmentFilters", data.segmentFilters || []);
                })
                .catch(function (error) {
                    oView.setBusy(false);
                    console.error("Templates Load Error:", error);
                    sap.m.MessageBox.error("Failed to load templates: " + error.message);
                });
        }
    });
});
