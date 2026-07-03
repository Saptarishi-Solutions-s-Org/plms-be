service OrganizationExecutiveService {
    type PaginationMeta {
        page       : Integer;
        limit      : Integer;
        total      : Integer;
        totalPages : Integer;
    };

    type ExecutiveOfferItem {
        id            : UUID;
        title         : String;
        description   : String;
        discountType  : String;
        discountValue : Decimal(10, 2);
        validFrom     : Date;
        validTo       : Date;
        status        : String;
    };

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

    function getExecutiveOffers(page: Integer,
                                limit: Integer) returns {
        offers     : many ExecutiveOfferItem;
        pagination : PaginationMeta;
    };

    action assignOfferToLead(
        offerId: UUID, 
        leadId: UUID
       ) returns {
        assignmentId : UUID;
        message      : String;
    };
}
 
