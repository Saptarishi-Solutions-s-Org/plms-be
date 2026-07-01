type PaginationMeta {
    page       : Integer;
    limit      : Integer;
    total      : Integer;
    totalPages : Integer;
}

service LeadService {

    function getLeadsWithStats(page: Integer,
                               limit: Integer,
                               search: String,
                               status: String,
                               priority: String,
                               leadSource: String,
                               assignedTo: String) returns {
        leads : many {
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
        stats : {
            total     : Integer;
            new       : Integer;
            contacted : Integer;
            qualified : Integer;
        };
        pagination : PaginationMeta;
    };
    
    function getExecutiveUsers() returns many {
        id   : String;
        name : String;
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
                        priority: String,
                        notes: String) returns {
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
                        notes: String) returns {
        message : String;
    };

    action   exportLeads()             returns many {
        leadCode   : String;
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
        priority   : String;
        assignedTo : String;
        notes      : String;
    };

    action   importLeads(rows: many {
        name       : String;
        gender     : String;
        email      : String;
        phone      : String;
        city       : String;
        state    : String;
        country  : String;
        postalCode : String;
        leadSource : String;
        status     : String;
        assignedTo : String;
        priority   : String;
        notes      : String;
    })                                 returns {
        imported   : Integer;
        failed     : Integer;
    };

    function getLeadDetail(leadCode: String) returns {
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
        offers : many {
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

}
