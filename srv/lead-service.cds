service LeadService {

    function getLeadsWithStats()       returns {
        leads : many {
            uuid           : String;
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
            notes          : String;
        };
        stats : {
            total     : Integer;
            new       : Integer;
            contacted : Integer;
            qualified : Integer;
        };
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

    function getLeadDetail(id: String) returns {
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
