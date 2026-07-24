using { plms.common.PaginationMeta } from './types/pagination';

service LeadService {

    function getLeadsWithStats(page: Integer,
                               limit: Integer,
                               search: String,
                               status: String,
                               priority: String,
                               leadSource: String,
                               assignedTo: String)   returns {
        leads      : many {
            uuid           : String;
            id             : String;
            leadCode       : String;
            name           : String;
            gender         : String;
            email          : String;
            phone          : String;
            status         : String;
            priority       : String;
            leadSource     : String;
            city           : String;
            postalCode     : String;
            state          : String;
            country        : String;
            assignedTo     : String;
            assignedToName : String;
            createdById    : String;
            createdByName  : String;
            createdAt      : Timestamp;
            notes          : String;
        };
        stats      : {
            total     : Integer;
            new       : Integer;
            contacted : Integer;
            qualified : Integer;
        };
        pagination : PaginationMeta;
    };

    function getAllOrganizationLeads(page: Integer,
                                     limit: Integer,
                                     search: String,
                                     status: String,
                                     priority: String,
                                     leadSource: String,
                                     assignedTo: String) returns {
        leads      : many {
            uuid           : String;
            id             : String;
            leadCode       : String;
            name           : String;
            gender         : String;
            email          : String;
            phone          : String;
            status         : String;
            priority       : String;
            leadSource     : String;
            city           : String;
            postalCode     : String;
            state          : String;
            country        : String;
            assignedTo     : String;
            assignedToName : String;
            createdById    : String;
            createdByName  : String;
            createdAt      : Timestamp;
            notes          : String;
        };
        stats      : {
            total     : Integer;
            new       : Integer;
            contacted : Integer;
            qualified : Integer;
        };
        pagination : PaginationMeta;
    };

    function getExecutiveUsers(page: Integer,
                               limit: Integer,
                               search: String,
                               status: String,
                               managerId: String) returns {
        users : many {
            id   : String;
            name : String;
        };
        pagination : PaginationMeta;
    };

    action   createLead(name: String,
                        gender: String,
                        email: String,
                        phone: String,
                        city: String,
                        state: String,
                        country: String,
                        postalCode: String,
                        leadSource: String,
                        status: String,
                        assignedTo: String,
                        managerId: String,
                        priority: String,
                        notes: String)               returns {
        message  : String;
        leadCode : String;
    };

    action   updateLead(id: String,
                        name: String,
                        gender: String,
                        email: String,
                        phone: String,
                        city: String,
                        state: String,
                        country: String,
                        postalCode: String,
                        leadSource: String,
                        status: String,
                        assignedTo: String,
                        priority: String,
                        notes: String)               returns {
        message : String;
    };

    action   bulkAssignLeads(leadIds: many String,
                             assignedTo: String)     returns {
        message       : String;
        assignedCount : Integer;
    };

    action   importLeads(rows: many {
        name       : String;
        gender     : String;
        email      : String;
        phone      : String;
        city       : String;
        state      : String;
        country    : String;
        postalCode : String;
        leadSource : String;
        status     : String;
        assignedTo : String;
        priority   : String;
        notes      : String;
    })                                               returns {
        imported   : Integer;
        failed     : Integer;
    };

    function getLeadDetail(id: String,
                           leadCode: String)         returns {
        lead       : {
            uuid             : String;
            leadCode         : String;
            name             : String;
            gender           : String;
            email            : String;
            phone            : String;
            city             : String;
            stateName        : String;
            countryName      : String;
            postalCode       : String;
            leadSource       : String;
            status           : String;
            priority         : String;
            notes            : String;
            assignedTo       : String;
            assignedToName   : String;
            importType       : String;
            createdAt        : String;
            createdById      : String;
            createdByName    : String;
            createdByRole    : String;
        };
        activities : many {
            id               : String;
            type             : String;
            notes            : String;
            freeText         : String;
            callStatus       : String;
            nextFollowUpDate : String;
            createdAt        : String;
            createdByName    : String;
            createdByRole    : String;
        };
        offers     : many {
            assignmentId   : String;
            assignedAt     : Timestamp;
            assignedByName : String;
            offerId        : String;
            title          : String;
            code           : String;
            description    : String;
            status         : String;
            validFrom      : Date;
            validTo        : Date;
        };
    };

    action addLeadActivity(
        leadId           : String,
        type             : String,
        notes            : String,
        freeText         : String,
        callStatus       : String,
        nextFollowUpDate : Date
    ) returns {
        message  : String;
        activity : {
            id               : String;
            type             : String;
            notes            : String;
            freeText         : String;
            callStatus       : String;
            nextFollowUpDate : String;
            createdAt        : String;
            createdByName    : String;
            createdByRole    : String;
        };
    };

    action updateLeadActivity(
        id               : String,
        notes            : String
    ) returns {
        message  : String;
        activity : {
            id               : String;
            notes            : String;
        };
    };
}
