service ExecutiveService {
    function getExecutiveStats() returns {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
        activeOffers : Integer;
    };


     function getLeadStats() returns {
        New       : Integer;
        Contacted : Integer;
        Qualified : Integer;
        Lost      : Integer;
    };

    function getExecutivePerformance() returns array of {
        leadId    : Integer;
        leadName  : String;
        createdAt : Timestamp;
        status    : String;
    };
}
