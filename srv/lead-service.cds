//srv
service LeadService {

    // GET leads + dashboard stats
    function getLeadsWithStats() returns {
        leads : many {
            uuid       : String;   
            leadId     : String;  
            name       : String;
            gender     : String;
            email      : String;
            phone      : String;
            status     : String;
            priority   : String;
            leadSource : String;
            city       : String;
            postalCode : String;
            stateId    : String;
            countryId  : String;
            state      : String;
            country    : String;
            assignedTo : String;
            notes      : String;
        };
        stats : {
            total     : Integer;
            new       : Integer;
            contacted : Integer;
            qualified : Integer;
        };
    };
    //GET executive users for dropdown
    function getExecutiveUsers() returns many {
        id   : String;
        name : String;
    };

    // CREATE lead
    action createLead(
        name       : String,
        gender     : String,
        email      : String,
        phone      : String,
        city       : String,
        stateId    : String,
        countryId  : String,
        postalCode : String,
        leadSource : String,
        status     : String,
        assignedTo : String,
        priority   : String,
        notes      : String
    ) returns {
        message : String;
        leadId  : String;
    };

    // UPDATE lead
    action updateLead(
        id         : String,
        name       : String,
        gender     : String,
        email      : String,
        phone      : String,
        city       : String,
        stateId    : String,
        countryId  : String,
        postalCode : String,
        leadSource : String,
        status     : String,
        assignedTo : String,
        priority   : String,
        notes      : String
    ) returns {
        message : String;
    };

}
