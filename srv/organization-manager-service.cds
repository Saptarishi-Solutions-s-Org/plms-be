service ManagerDashboardService {
  function getManagerDashboard()     returns {
    totalLeads     : Integer;
    convertedLeads : Integer;
    thisweekLeads  : Integer;
    activeOffers   : Integer;
  };

  function getLeadStatusOverview()   returns {
    New       : Integer;
    Contacted : Integer;
    Qualified : Integer;
    Lost      : Integer;
  };

  function getExecutivePerformance() returns array of {
    name        : String;
    performance : Integer;
  };
}