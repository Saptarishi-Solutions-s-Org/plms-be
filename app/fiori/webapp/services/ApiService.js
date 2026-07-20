sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (JSONModel) {
    "use strict";

    var _oComponent = null;
    var _sAccessToken = null;
    var _oUser = null;
    var _oRefreshPromise = null;

    return {
        init: function (oComponent) {
            _oComponent = oComponent;
        },

        getAccessToken: function () {
            return _sAccessToken;
        },

        getUser: function () {
            return _oUser;
        },

        setSession: function (sAccessToken, oUser) {
            _sAccessToken = sAccessToken;
            _oUser = oUser;

            var oAuthModel = _oComponent.getModel("auth");
            oAuthModel.setProperty("/isLoggedIn", true);
            oAuthModel.setProperty("/user", oUser);

            // Connect WebSocket
            var SocketService = sap.ui.require("lma/fiori/services/SocketService");
            if (SocketService) {
                SocketService.connect(sAccessToken);
            }
        },

        clearSession: function () {
            _sAccessToken = null;
            _oUser = null;

            var oAuthModel = _oComponent.getModel("auth");
            oAuthModel.setProperty("/isLoggedIn", false);
            oAuthModel.setProperty("/user", null);

            // Disconnect WebSocket
            var SocketService = sap.ui.require("lma/fiori/services/SocketService");
            if (SocketService) {
                SocketService.disconnect();
            }
        },

        refreshSession: function (bForce) {
            if (_sAccessToken && !bForce) {
                return Promise.resolve({ accessToken: _sAccessToken, user: _oUser });
            }

            if (_oRefreshPromise) {
                return _oRefreshPromise;
            }

            var that = this;
            _oRefreshPromise = fetch("/odata/v4/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error("Refresh failed");
                }
                return res.json();
            })
            .then(function (data) {
                var payload = data.value || data;
                if (!payload || !payload.accessToken || !payload.user) {
                    throw new Error("Invalid refresh payload");
                }
                that.setSession(payload.accessToken, payload.user);
                return { accessToken: payload.accessToken, user: payload.user };
            })
            .catch(function () {
                that.clearSession();
                return null;
            })
            .finally(function () {
                _oRefreshPromise = null;
            });

            return _oRefreshPromise;
        },

        redirectToLogin: function () {
            this.clearSession();
            var oRouter = _oComponent.getRouter();
            oRouter.navTo("login");
        },

        api: function (sPath, oOptions) {
            oOptions = oOptions || {};
            oOptions.headers = oOptions.headers || {};

            if (_sAccessToken) {
                oOptions.headers["Authorization"] = "Bearer " + _sAccessToken;
            }
            oOptions.headers["Content-Type"] = "application/json";
            oOptions.credentials = "include";

            var that = this;
            return fetch(sPath, oOptions)
                .then(function (res) {
                    if (res.status === 401) {
                        return that.refreshSession(true).then(function (session) {
                            if (session && session.accessToken) {
                                // Retry with new token
                                oOptions.headers["Authorization"] = "Bearer " + session.accessToken;
                                return fetch(sPath, oOptions);
                            } else {
                                that.redirectToLogin();
                                throw new Error("Unauthorized");
                            }
                        });
                    }
                    return res;
                })
                .then(function (res) {
                    if (!res.ok) {
                        if (res.status === 403) {
                            // Redirect to not-authorized route if needed
                            sap.m.MessageToast.show("Access Denied: You do not have permissions");
                        }
                        return res.json().then(function (data) {
                            var sMsg = (data && data.error && data.error.message) || (data && data.message) || "Something went wrong";
                            throw new Error(sMsg);
                        }).catch(function() {
                            throw new Error("Server error (status: " + res.status + ")");
                        });
                    }
                    return res.json().then(function (data) {
                        return (data && data.value !== undefined) ? data.value : data;
                    }).catch(function() {
                        return null; // Empty response (e.g. 204)
                    });
                });
        },

        login: function (sEmail, sPassword) {
            var that = this;
            return this.api("/odata/v4/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: sEmail, password: sPassword })
            }).then(function (data) {
                if (data && data.accessToken && data.user) {
                    that.setSession(data.accessToken, data.user);
                    return data;
                }
                throw new Error("Invalid credentials payload");
            });
        },

        logout: function () {
            var that = this;
            return this.api("/odata/v4/auth/logout", {
                method: "POST"
            }).finally(function () {
                that.clearSession();
                var oRouter = _oComponent.getRouter();
                oRouter.navTo("public");
            });
        }
    };
});
