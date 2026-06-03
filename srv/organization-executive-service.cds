service OrganizationExecutiveService {
    function getExecutiveStats() returns {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
        activeOffers : Integer;
    };


     function getExecutiveLeadStats() returns {
        New       : Integer;
        Contacted : Integer;
        Qualified : Integer;
        Lost      : Integer;
    };

    function getExecutiveRecentLeads() returns array of {
        leadId    : Integer;
        leadName  : String;
        createdAt : Timestamp;
        status    : String;
    };

    function getExecutiveOffers() returns array of {
        assignmentId         : UUID;
        offerId              : UUID;
        title                : String;
        code                 : String;
        description          : String;
        isGlobal             : Boolean;
        status               : String;
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
        assignedAt           : Timestamp;
        assignedBy           : UUID;
        assignedByName       : String;
    };
}
