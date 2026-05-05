using { crm as db } from '../db/schema';

service OfferService {

    // ─── Types ───────────────────────────────────────────────
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
    };

    type ManagerItem {
        id    : UUID;
        name  : String;
        email : String;
        phone : String;
    };

    // ─── Actions ─────────────────────────────────────────────
    action createOffer(
        is_global            : Boolean,      // ✅ FIXED: was `false` (a value), must be a type

        title                : String,
        code                 : String,
        description          : String,

        discount_type        : String,
        discount_amount      : Decimal(10, 2),
        discount_percentage  : Decimal(5, 2),
        max_discount_amount  : Decimal(10, 2),

        combo_description    : String,
        buy_quantity         : Integer,
        get_quantity         : Integer,

        min_purchase_amount  : Decimal(10, 2),
        discount_value       : Decimal(10, 2),
        flag_discount_amount : Decimal(10, 2),

        valid_from           : Date,
        valid_to             : Date,

        manager_ids          : many UUID
    ) returns {
        id : UUID;
    };

    action toggleOfferStatus(id : UUID) returns {
        status : String;
    };

    // ─── Functions ───────────────────────────────────────────
    function getOffers()     returns many OfferItem;
    function getManagers()   returns many ManagerItem;

    function getOfferSummary() returns {
        totalCount    : Integer;
        activeCount   : Integer;
        inactiveCount : Integer;
        expiredCount  : Integer;
        globalCount   : Integer;
    };
}