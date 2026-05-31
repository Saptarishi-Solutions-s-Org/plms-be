service OrganizationAdminService {

    function getAllUsers() returns {
        users: array of {
            id         : UUID;
            name       : String;
            email      : String;
            phone      : String;
            role_name  : String;
            is_active  : Boolean;
        };
        stats: {
            total_users    : Integer;
            active_users   : Integer;
            inactive_users : Integer;
        };
    };

    action createOrgUser(
        name       : String,
        email      : String,
        phone      : String,
        gender     : String,
        dob        : Date,
        state      : UUID,
        country    : UUID,
        city       : String,
        roleName   : String,
        reportingManager : UUID 
    ) returns {
        message       : String;
        userId        : UUID;
        tempPassword  : String;
    };

    function getAllManagers() returns array of {
        id   : UUID;
        name : String;
    };

    function getAllExecutives() returns array of {
        id  : UUID ;
        name : String;
    }
}