service ReportDashboardService {
    function getReportStats()                         returns {
        leadsAssigned  : Integer;
        convertedLeads : Integer;
        conversionRate : Decimal(5, 2);
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

    function getReportOffers(search: String, status: String, discountType: String, page: Integer, limit: Integer, all: Boolean)
                            returns {
        offers : array of {
            id                   : UUID;
            title                : String;
            code                 : String;
            description          : String;
            status               : String;
            isGlobal             : Boolean;
            discountType         : String;
            discountAmount       : Decimal(10, 2);
            discountPercentage   : Decimal(5, 2);
            maxDiscountAmount    : Decimal(10, 2);
            comboDescription     : String;
            buyQuantity          : Integer;
            getQuantity          : Integer;
            minPurchaseAmount    : Decimal(10, 2);
            discountValue        : Decimal(10, 2);
            flagDiscountAmount   : Decimal(10, 2);
            validFrom            : Date;
            validTo              : Date;
            createdAt            : Timestamp;
            assignmentStatus     : String;
        };
        pagination : {
            page     : Integer;
            limit    : Integer;
            total    : Integer;
            pages    : Integer;
            hasNext  : Boolean;
            hasPrev  : Boolean;
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
