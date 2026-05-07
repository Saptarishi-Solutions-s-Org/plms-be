service ExecutiveService {
    type TopCardStats {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
        activeOffers : Integer;
    }
    
    function getExecutiveStats() returns TopCardStats;
    type Leadstat {
        New : Integer;
        Contacted : Integer;
        Qualified : Integer;
        Lost : Integer;
    }
    function getLeadStats() returns Leadstat;

    type RecentLead {
        leadId : Integer;
        leadName : String;
        createdAt : Timestamp;
        status : String;
    }
    function getExecutiveRecentLeads() returns array of RecentLead;
}

