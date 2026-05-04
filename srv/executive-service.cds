service ExecutiveService {
    type TopCardStats {
        myLeads      : Integer;
        converted    : Integer;
        newThisWeek  : Integer;
    }

    
    function getExecutiveStats() returns TopCardStats;

    
}