service OrganizationAdminService {

    function getAllUsers() returns {
        users: array of {
            id         : UUID;
            name       : String;
            email      : String;
            phone      : String;
            role_name  : String;
            reporting_manager_id   : UUID;
            reporting_manager_name : String;
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

    action updateOrgUser(
        id               : UUID,
        name             : String,
        email            : String,
        phone            : String,
        gender           : String,
        dob              : Date,
        country          : UUID,
        state            : UUID,
        city             : String,
        roleName         : String,
        reportingManager : UUID,
        is_active        : Boolean
    ) returns {
        message : String;
    };

    function getPermissions() returns {
        roles: array of {
            id   : UUID;
            name : String;
        };
        permissions: array of {
            role       : String;
            module     : String;
            permission : String;
            access     : Boolean;
        };
    };

    function getAllManagers() returns array of {
        id   : UUID;
        name : String;
    };

    function getAllExecutives() returns array of {
        id  : UUID ;
        name : String;
    };

    function getExecutivesForManager(managerId: UUID) returns array of {
        id    : UUID;
        name  : String;
        email : String;
        phone : String;
    };

    function getManagersForReassign(excludeManagerId: UUID) returns array of {
        id    : UUID;
        name  : String;
        email : String;
        phone : String;
    };

    action deactivateExecutive(
        executiveId       : UUID,
        targetExecutiveId : UUID
    ) returns {
        message               : String;
        executiveName         : String;
        targetExecutiveName   : String;
        leadsReassigned       : Integer;
    };

    action deactivateManager(
        managerId       : UUID,
        targetManagerId : UUID
    ) returns {
        message             : String;
        managerName         : String;
        targetManagerName   : String;
        executivesReassigned : Integer;
    };

    // Generic activate action for any user (manager/executive)
    action activateUser(
        userId : UUID
    ) returns {
        message : String;
    };
}
