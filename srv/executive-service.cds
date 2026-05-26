service ExecutiveService {
    type TopCardStats {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
        activeOffers : Integer;
    }

    
    function getExecutiveStats() returns TopCardStats;

    
}