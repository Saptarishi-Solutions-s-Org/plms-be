using { plms.common.PaginationMeta } from './types/pagination';

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

 function getExecutiveOverview(page: Integer,
                                  limit: Integer,
                                  search: String,
                                  status: String,
                                  managerId: String) returns {
  stats : {
    totalExecutives   : Integer;
    activeExecutives  : Integer;
    inactiveExecutives : Integer;
  };
  executives : many ManagerExecutiveItem;
  pagination : PaginationMeta;
 };

 action createExecutive(
  name    : String,
  email   : String,
  phone   : String,
  gender  : String,
  dob     : Date,
  country : UUID,
  state   : UUID,
  city    : String
 ) returns {
  message      : String;
  userId       : UUID;
  tempPassword : String;
 };

 function getManagerOfferOverview(page: Integer,
                                  limit: Integer,
                                  status: String,
                                  search: String,
                                  discountType: String,
                                  all: Boolean) returns {
  stats : {
    totalOffers    : Integer;
    activeOffers   : Integer;
    inactiveOffers : Integer;
    globalOffers   : Integer;
  };
  offers     : many ManagerOfferItem;
  pagination : PaginationMeta;
 };

 action assignOfferToExecutive(
  offerId     : UUID,
  executiveId : UUID
 ) returns {
  assignmentId : UUID;
  message      : String;
 };

 type BulkOfferAssignmentItem {
  offerId      : UUID;
  executiveId  : UUID;
  assignmentId : UUID;
 };

 type BulkOfferAssignmentSkip {
  offerId      : UUID;
  executiveId  : UUID;
  reason       : String;
 };

 action bulkAssignOffersToExecutives(
  offerIds     : many UUID,
  executiveIds : many UUID
 ) returns {
  message  : String;
  assigned : many BulkOfferAssignmentItem;
  skipped  : many BulkOfferAssignmentSkip;
 };

 function getAvailableExecutivesForOffer(offerId: UUID) returns array of {
  id    : UUID;
  name  : String;
  email : String;
  phone : String;
 };

 action deactivateExecutiveForManager(
  executiveId       : UUID,
  targetExecutiveId : UUID
 ) returns {
  message               : String;
  executiveName         : String;
  targetExecutiveName   : String;
  leadsReassigned       : Integer;
 };
 

 function getOtherExecutivesForReassign(executiveId: UUID) returns array of {
  id    : UUID;
  name  : String;
  email : String;
  phone : String;
 };

 function getAssignedOffersForExecutive(executiveId: UUID) returns array of {
  id                  : UUID;
  title               : String;
  code                : String;
  description         : String;
  status              : String;
  discount_type       : String;
  discount_amount     : Decimal(10, 2);
  discount_percentage : Decimal(5, 2);
  valid_from          : Date;
  valid_to            : Date;
 };
}
