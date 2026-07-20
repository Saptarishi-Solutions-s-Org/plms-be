sap.ui.define([], function () {
    "use strict";

    return {
        activeStatusText: function (bActive) {
            return bActive ? "Active" : "Inactive";
        },

        activeStatusState: function (bActive) {
            return bActive ? "Success" : "Error";
        },

        activeStatusIcon: function (bActive) {
            return bActive ? "sap-icon://accept" : "sap-icon://decline";
        },

        trialBadgeText: function (sTrial) {
            return sTrial ? sTrial : "N/A";
        },

        trialBadgeState: function (sTrial) {
            if (sTrial === "Premium") {
                return "Warning";
            } else if (sTrial === "Free") {
                return "Success";
            }
            return "None";
        },

        formatDate: function (sDate) {
            if (!sDate) return "";
            try {
                var oDate = new Date(sDate);
                return oDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (err) {
                return sDate;
            }
        }
    };
});
