service ReportDashboardService {
    function getReportStats() returns {
        totalLeads     : Integer;
        leadsAssigned  : Integer;
        convertedLeads : Integer;
        activeOffers   : Integer;
        offersUtilized : Integer;
    };
    function getLeadSourceAnalytics() returns array of {
        source    : String;
        leads     : Integer;
        converted : Integer;
        conversionRate : Decimal(5,2);
    };
}
