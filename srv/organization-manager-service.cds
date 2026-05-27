service ManagerDashboardService {
  type ManagerOfferItem {
    id                   : UUID;
    title                : String;
    code                 : String;
    description          : String;
    is_global            : Boolean;
    status               : String;
    assignStatus         : String;
    discount_type        : String;
    discount_amount      : Decimal(10, 2);
    discount_percentage  : Decimal(5, 2);
    max_discount_amount  : Decimal(10, 2);
    combo_description    : String;
    buy_quantity         : Integer;
    get_quantity         : Integer;
    min_purchase_amount  : Decimal(10, 2);
    discount_value       : Decimal(10, 2);
    flag_discount_amount : Decimal(10, 2);
    valid_from           : Date;
    valid_to             : Date;
    createdat            : DateTime;
  };

  type ManagerExecutiveItem {
    id            : UUID;
    name          : String;
    email         : String;
    phone         : String;
    status        : String;
    leadCount     : Integer;
    offerCount    : Integer;
  };

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
  executiveName : String;
  total         : Integer;
  qualified     : Integer;
};

 function getExecutiveOverview() returns {
  stats : {
    totalExecutives   : Integer;
    activeExecutives  : Integer;
    inactiveExecutives : Integer;
  };
  executives : many ManagerExecutiveItem;
 };

 function getManagerOfferOverview() returns {
  stats : {
    totalOffers    : Integer;
    activeOffers   : Integer;
    inactiveOffers : Integer;
    globalOffers   : Integer;
  };
  offers : many ManagerOfferItem;
 };

 action assignOfferToExecutive(
  offerId     : UUID,
  executiveId : UUID
 ) returns {
  assignmentId : UUID;
  message      : String;
 };
}