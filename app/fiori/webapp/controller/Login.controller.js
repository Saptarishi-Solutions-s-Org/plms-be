sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "lma/fiori/services/ApiService"
], function (Controller, ApiService) {
    "use strict";

    return Controller.extend("lma.fiori.controller.Login", {
        onInit: function () {
            // Load saved login email
            var sSavedLogin = localStorage.getItem("savedLogin");
            if (sSavedLogin) {
                this.byId("emailInput").setValue(sSavedLogin);
                this.byId("rememberCheck").setSelected(true);
            }

            // Route matching to check session state
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("login").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // If already logged in, redirect to dashboard
            var oAuthModel = this.getOwnerComponent().getModel("auth");
            if (oAuthModel && oAuthModel.getProperty("/isLoggedIn")) {
                this.getOwnerComponent().getRouter().navTo("adminDashboard");
            }
        },

        onTogglePassword: function () {
            var oPassInput = this.byId("passwordInput");
            var oToggleBtn = this.byId("passwordToggleBtn");
            
            if (oPassInput.getType() === "Password") {
                oPassInput.setType("Text");
                oToggleBtn.setIcon("sap-icon://hide");
            } else {
                oPassInput.setType("Password");
                oToggleBtn.setIcon("sap-icon://show");
            }
        },

        onLoginPress: function () {
            var oEmailInput = this.byId("emailInput");
            var oPassInput = this.byId("passwordInput");
            var oErrorStrip = this.byId("errorStrip");
            var oLoginBtn = this.byId("loginBtn");

            var sEmail = oEmailInput.getValue();
            var sPassword = oPassInput.getValue();

            if (!sEmail || !sPassword) {
                oErrorStrip.setText("Please enter both email and password.");
                oErrorStrip.setVisible(true);
                return;
            }

            oErrorStrip.setVisible(false);
            oLoginBtn.setBusy(true);

            var bRemember = this.byId("rememberCheck").getSelected();
            var that = this;

            ApiService.login(sEmail, sPassword)
                .then(function (data) {
                    oLoginBtn.setBusy(false);

                    if (bRemember) {
                        localStorage.setItem("savedLogin", sEmail);
                    } else {
                        localStorage.removeItem("savedLogin");
                    }

                    // Reset form fields
                    oPassInput.setValue("");
                    oErrorStrip.setVisible(false);

                    sap.m.MessageToast.show("Signed in successfully. Welcome back!");
                    
                    // Navigate to Admin Dashboard
                    that.getOwnerComponent().getRouter().navTo("adminDashboard");
                })
                .catch(function (error) {
                    oLoginBtn.setBusy(false);
                    var sErrorMsg = error.message || "Failed to sign in. Please verify your credentials.";
                    oErrorStrip.setText(sErrorMsg);
                    oErrorStrip.setVisible(true);
                });
        },

        onForgotPassword: function () {
            sap.m.MessageBox.information("Please contact your administrator to reset your password.");
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("public");
        }
    });
});
