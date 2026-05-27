service ReportDashboardService {
    function getReportStats() returns {
        leadsAssigned  : Integer;
        convertedLeads : Integer;
        conversionRate : Decimal(5,2);
    };

    function getLeadSourceAnalytics() returns array of {
        source    : String;
        leads     : Integer;
        converted : Integer;
        conversionRate : Decimal(5,2);
    };
}
