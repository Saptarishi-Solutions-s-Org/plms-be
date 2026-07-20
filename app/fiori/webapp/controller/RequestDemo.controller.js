sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("lma.fiori.controller.RequestDemo", {
        onInit: function () {
        },

        onSubmitRequest: function () {
            var sName = this.byId("demoName").getValue();
            var sEmail = this.byId("demoEmail").getValue();
            var sCompany = this.byId("demoCompany").getValue();

            if (!sName || !sEmail || !sCompany) {
                MessageBox.error("Please fill in all required fields (Name, Email, Company Name).");
                return;
            }

            var sEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!sEmailRegex.test(sEmail)) {
                MessageBox.error("Please enter a valid email address.");
                return;
            }

            var that = this;
            MessageBox.success("Thank you for your interest! A representative will reach out shortly to schedule your demo.", {
                onClose: function () {
                    that.byId("demoName").setValue("");
                    that.byId("demoEmail").setValue("");
                    that.byId("demoCompany").setValue("");
                }
            });
        }
    });
});
