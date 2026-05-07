service ExecutiveService {
    type TopCardStats {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
        activeOffers : Integer;
    }


    type Leadstat {
        New       : Integer;
        Contacted : Integer;
        Qualified : Integer;
        Lost      : Integer;
    }

    type RecentLead {
        leadId    : Integer;
        leadName  : String;
        createdAt : Timestamp;
        status    : String;
    }

    function getExecutiveStats()       returns TopCardStats;
    function getLeadStats()            returns Leadstat;
    function getExecutiveRecentLeads() returns array of RecentLead;
}
