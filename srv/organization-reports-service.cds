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

    action exportExecutives() returns many {
        name           : String;
        email          : String;
        phone          : String;
        status         : String;
        assignedLeads  : Integer;
        qualifiedLeads : Integer;
        conversionRate : Decimal(5,2);
        assignedOffers : Integer;
    };
}
