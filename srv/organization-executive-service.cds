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
        title     : String;
        description   : String;
        discountType  : String;
        discountValue : Decimal(10, 2);
        validFrom     : Date;
        validTo       : Date;
        status        : String;
    };
}
 