sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("lma.fiori.controller.Contact", {
        onInit: function () {
        },

        onSubmitInquiry: function () {
            var sName = this.byId("contactName").getValue();
            var sEmail = this.byId("contactEmail").getValue();
            var sMessage = this.byId("contactMessage").getValue();

            if (!sName || !sEmail || !sMessage) {
                MessageBox.error("Please fill in all required fields (Name, Email, Message).");
                return;
            }

            var sEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!sEmailRegex.test(sEmail)) {
                MessageBox.error("Please enter a valid email address.");
                return;
            }

            var that = this;
            MessageBox.success("Thank you for your message! Our team will contact you shortly.", {
                onClose: function () {
                    that.byId("contactName").setValue("");
                    that.byId("contactEmail").setValue("");
                    that.byId("contactOrg").setValue("");
                    that.byId("contactMessage").setValue("");
                }
            });
        }
    });
});
