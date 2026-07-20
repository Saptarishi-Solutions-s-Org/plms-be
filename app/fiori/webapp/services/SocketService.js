sap.ui.define([], function () {
    "use strict";

    var _oComponent = null;
    var _oSocket = null;
    var _sActiveToken = null;
    var _mSubscriptions = new Map();

    function dispatchEvent(oEvent) {
        if (!oEvent || !oEvent.type) return;
        var sType = oEvent.type;
        var oHandlers = _mSubscriptions.get(sType);
        if (oHandlers) {
            oHandlers.forEach(function (fnHandler) {
                try {
                    fnHandler(oEvent);
                } catch (err) {
                    console.error("Error in socket event handler:", err);
                }
            });
        }
    }

    return {
        init: function (oComponent) {
            _oComponent = oComponent;
        },

        connect: function (sToken) {
            if (typeof io === "undefined") {
                console.warn("Socket.io library not loaded. Realtime updates disabled.");
                return null;
            }

            if (!sToken) return null;

            if (_oSocket && _oSocket.connected && _sActiveToken === sToken) {
                return _oSocket;
            }

            if (_oSocket) {
                var bTokenChanged = _sActiveToken !== sToken;
                _sActiveToken = sToken;
                _oSocket.auth = { token: sToken };

                if (bTokenChanged && _oSocket.connected) {
                    _oSocket.disconnect();
                }
                _oSocket.connect();
                return _oSocket;
            }

            _sActiveToken = sToken;
            
            // Connect to same host/origin
            _oSocket = io({
                auth: { token: sToken },
                transports: ["websocket", "polling"],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5
            });

            _oSocket.on("connect", function () {
                console.log("Socket connected, id:", _oSocket.id);
            });

            _oSocket.on("disconnect", function () {
                console.log("Socket disconnected");
            });

            _oSocket.on("connect_error", function (error) {
                console.warn("Socket connection failed:", error.message);
            });

            _oSocket.on("event", function (oEvent) {
                dispatchEvent(oEvent);
            });

            return _oSocket;
        },

        disconnect: function () {
            if (_oSocket) {
                _oSocket.disconnect();
                _oSocket = null;
            }
            _sActiveToken = null;
        },

        subscribe: function (sType, fnHandler) {
            var oHandlers = _mSubscriptions.get(sType);
            if (!oHandlers) {
                oHandlers = new Set();
                _mSubscriptions.set(sType, oHandlers);
            }
            oHandlers.add(fnHandler);

            var that = this;
            return function () {
                that.unsubscribe(sType, fnHandler);
            };
        },

        unsubscribe: function (sType, fnHandler) {
            var oHandlers = _mSubscriptions.get(sType);
            if (oHandlers) {
                oHandlers.delete(fnHandler);
                if (oHandlers.size === 0) {
                    _mSubscriptions.delete(sType);
                }
            }
        }
    };
});
