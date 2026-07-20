sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "lma/fiori/services/ApiService",
    "lma/fiori/services/SocketService"
], function (UIComponent, JSONModel, ApiService, SocketService) {
    "use strict";

    return UIComponent.extend("lma.fiori.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // create the device model
            var oDeviceModel = new JSONModel({
                isPhone: sap.ui.Device.system.phone,
                isTablet: sap.ui.Device.system.tablet,
                isDesktop: sap.ui.Device.system.desktop,
                supportTouch: sap.ui.Device.support.touch
            });
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // create user/auth model
            var oAuthModel = new JSONModel({
                isLoggedIn: false,
                user: null
            });
            this.setModel(oAuthModel, "auth");

            // Initialize API and Socket services
            ApiService.init(this);
            SocketService.init(this);

            // create the views based on the url/hash
            this.getRouter().initialize();
        }
    });
});
