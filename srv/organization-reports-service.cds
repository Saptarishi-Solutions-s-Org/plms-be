service ReportDashboardService {
    function getReportStats() returns {
        totalLeads     : Integer;
        leadsAssigned  : Integer;
        convertedLeads : Integer;
        activeOffers   : Integer;
        offersUtilized : Integer;
    };

    function getLeadSourceData() returns array of {
        source : String;
        leads  : Integer;
    };

    function getSourceConversionData() returns array of {
        source : String;
        leads  : Integer;
        rate   : Decimal;
    };
}
