service ReportDashboardService {
    function getReportStats()                         returns {
        totalLeads     : Integer;
        leadsAssigned  : Integer;
        convertedLeads : Integer;
        conversionRate : Decimal(5, 2);
        activeOffers   : Integer;
        totalUsers     : Integer;
        activeUsers    : Integer;
    };

    function getLeadSourceAnalytics()                 returns array of {
        source         : String;
        leads          : Integer;
        converted      : Integer;
        conversionRate : Decimal(5, 2);
    };

    function getReportExecutives(search: String, page: Integer, limit: Integer)
                            returns {
        executives : array of {
            id    : UUID;
            name  : String;
            email : String;
            phone : String;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };

    function getReportManagers(search: String, page: Integer, limit: Integer)
                            returns {
        managers : array of {
            id    : UUID;
            name  : String;
            email : String;
            phone : String;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };

    function getReportExecutivesForManager(managerId: UUID, search: String, page: Integer, limit: Integer)
                            returns {
        executives : array of {
            id    : UUID;
            name  : String;
            email : String;
            phone : String;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };

    function getReportExecutivePerformance(search: String, status: String, startDate: String, endDate: String, page: Integer, limit: Integer)
                            returns {
        executives : array of {
            id              : UUID;
            name            : String;
            executiveName   : String;
            email           : String;
            phone           : String;
            status          : String;
            assignedLeads   : Integer;
            total           : Integer;
            qualifiedLeads  : Integer;
            qualified       : Integer;
            conversionRate  : Decimal(5, 2);
            assignedOffers  : Integer;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };

    function getReportManagerPerformance(search: String, status: String, startDate: String, endDate: String, page: Integer, limit: Integer)
                            returns {
        managers : array of {
            id              : UUID;
            name            : String;
            managerName     : String;
            email           : String;
            phone           : String;
            status          : String;
            assignedLeads   : Integer;
            total           : Integer;
            convertedLeads  : Integer;
            qualified       : Integer;
            conversionRate  : Decimal(5, 2);
            assignedOffers  : Integer;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };


    function getReportLeads(search: String, status: String, priority: String, leadSource: String, assignedTo: String, startDate: String, endDate: String, page: Integer, limit: Integer)
                            returns {
        leads      : array of {
            id             : UUID;
            code           : String;
            name           : String;
            email          : String;
            phone          : String;
            status         : String;
            priority       : String;
            leadSource     : String;
            city           : String;
            postalCode     : String;
            state          : UUID;
            stateName      : String;
            country        : UUID;
            countryName    : String;
            assignedTo     : UUID;
            assignedToName : String;
            createdById    : UUID;
            createdByName  : String;
            createdAt      : Timestamp;
            updatedAt      : Timestamp;
            notes          : String;
        };
        pagination : {
            page       : Integer;
            limit      : Integer;
            total      : Integer;
            totalPages : Integer;
        };
    };

    action   exportExecutives()                       returns many {
        name           : String;
        email          : String;
        phone          : String;
        status         : String;
        assignedLeads  : Integer;
        qualifiedLeads : Integer;
        conversionRate : Decimal(5, 2);
        assignedOffers : Integer;
    };
}
