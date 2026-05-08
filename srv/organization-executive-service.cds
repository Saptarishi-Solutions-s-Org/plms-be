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
}
