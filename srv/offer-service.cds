using { plms.common.PaginationMeta } from './types/pagination';

service OfferService {
    type OfferManagerItem {
        id    : UUID;
        name  : String;
        email : String;
    };

    type OfferItem {
        id                   : UUID;
        organization_ID      : UUID;
        title                : String;
        code                 : String;
        description          : String;
        is_global            : Boolean;
        status               : String;
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
        created_at           : DateTime;
        managers             : many OfferManagerItem;
    };

    type ManagerItem {
        id    : UUID;
        name  : String;
        email : String;
        phone : String;
    };

    type AssignedExecutiveItem {
        id    : UUID;
        name  : String;
        email : String;
        phone : String;
    };

    action   createOffer(is_global: Boolean,
                         title: String,
                         code: String,
                         description: String,
                         discount_type: String,
                         discount_amount: Decimal(10, 2),
                         discount_percentage: Decimal(5, 2),
                         max_discount_amount: Decimal(10, 2),
                         combo_description: String,
                         buy_quantity: Integer,
                         get_quantity: Integer,
                         min_purchase_amount: Decimal(10, 2),
                         discount_value: Decimal(10, 2),
                         flag_discount_amount: Decimal(10, 2),
                         valid_from: Date,
                         valid_to: Date,
                         manager_ids: many UUID) returns {
        id : UUID;
    };

    action   toggleOfferStatus(id: UUID)         returns {
        status : String;
    };

    action   updateOffer(id: UUID,
                         is_global: Boolean,
                         title: String,
                         description: String,
                         discount_type: String,
                         discount_amount: Decimal(10, 2),
                         discount_percentage: Decimal(5, 2),
                         max_discount_amount: Decimal(10, 2),
                         combo_description: String,
                         buy_quantity: Integer,
                         get_quantity: Integer,
                         min_purchase_amount: Decimal(10, 2),
                         discount_value: Decimal(10, 2),
                         flag_discount_amount: Decimal(10, 2),
                         valid_from: Date,
                         valid_to: Date,
                         manager_ids: many UUID) returns {
        id : UUID;
    };


    function getOffers(page: Integer,
                       limit: Integer,
                       status: String,
                       search: String,
                       discountType: String,
                       all: Boolean)            returns {
        offers     : many OfferItem;
        pagination : PaginationMeta;
    };
    function getManagers()                       returns many ManagerItem;
    function getExecutivesByOffer(offerId: UUID) returns many AssignedExecutiveItem;

    function getOfferSummary()                   returns {
        totalCount    : Integer;
        activeCount   : Integer;
        inactiveCount : Integer;
        expiredCount  : Integer;
        globalCount   : Integer;
    };

    action   getOfferAssignStatus(offerId: UUID) returns {
        assignStatus  : String;
        assignedCount : Integer;
    };
}
 