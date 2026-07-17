using { crm as db } from '../db/schema';
using { plms.common.PaginationMeta } from './types/pagination';

service SegmentService {
    // 1. Get all segments configuration with current lead count, search and pagination
    function getSegments(
        page : Integer,
        limit : Integer,
        search : String,
        type : String,
        is_active : String
    ) returns {
        segments : many {
            id           : UUID;
            code         : String;
            name         : String;
            description  : String;
            type         : String;
            is_active    : Boolean;
            color        : String;
            notes        : String;
            lead_count   : Integer;
            offer_titles : String;
            modifiedAt   : Timestamp;
            createdBy    : String;
            createdByName: String;
        };
        pagination : PaginationMeta;
    };

    // 2. Fetch leads matches for a set of draft filter expressions (live preview)
    action previewSegment(
        segment_id : UUID,
        type : String, // 'Static' or 'Dynamic'
        filters : array of {
            id             : UUID;
            filter_type_id : UUID;
            filter_type_name: String;
            operator       : String;
            value          : String;
            group_id       : String;
            logical_op     : String;
        },
        static_lead_ids : array of UUID
    ) returns {
        total_count : Integer;
        male_count  : Integer;
        female_count: Integer;
        avg_age     : Decimal(5, 2);
        leads       : array of {
            id      : UUID;
            name    : String;
            gender  : String;
            dob     : Date;
            status  : String;
            city    : String;
            assignedToName : String;
        };
    };

    // 3. Save a segment (creates/updates metadata and configuration)
    action saveSegment(
        id          : UUID,
        name        : String,
        description : String,
        type        : String,
        color       : String,
        notes       : String,
        is_active   : Boolean,
        filters     : array of {
            filter_type_id : UUID;
            operator       : String;
            value          : String;
            group_id       : String;
            logical_op     : String;
        },
        static_lead_ids : array of UUID
    ) returns {
        segmentId : UUID;
        code      : String;
        message   : String;
    };

    // 4. Delete segment
    action deleteSegment(id: UUID) returns {
        message : String;
    };

    // 5. Assign Offers to a Segment
    action assignOffersToSegment(
        segmentId : UUID,
        offerIds  : array of UUID
    ) returns {
        message       : String;
        assignedCount : Integer;
    };

    // 6. Get Audit Log history for a segment
    function getSegmentAuditHistory(
        segmentId: UUID,
        page : Integer,
        limit : Integer
    ) returns {
        logs : many {
            action_type : String;
            username    : String;
            timestamp   : Timestamp;
            details     : String;
        };
        pagination : PaginationMeta;
    };

    // 7. Get segment details by code
    function getSegmentByCode(code: String) returns {
        id           : UUID;
        code         : String;
        name         : String;
        description  : String;
        type         : String;
        is_active    : Boolean;
        color        : String;
        notes        : String;
        filters      : array of {
            id             : UUID;
            filter_type_id : UUID;
            filter_type_name: String;
            operator       : String;
            value          : String;
            group_id       : String;
            logical_op     : String;
        };
        static_lead_ids : array of UUID;
        assigned_offers : array of {
            id    : UUID;
            title : String;
            code  : String;
        };
    };

    // 8. Export leads of a segment
    function exportSegment(code: String) returns {
        csvContent : String;
    };

    // 9. Fetch active filter types for the organization
    function getActiveFilterTypes() returns array of {
        id            : UUID;
        name          : String;
        label         : String;
        category      : String;
        operator_type : String;
    };
    // 10. Toggle segment filter status (enable/disable) for an organization
    action toggleSegmentFilter(
        orgFilterId : UUID,
        is_enabled : Boolean
    ) returns {
        message : String;
    };
}
