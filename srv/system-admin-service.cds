service SystemAdminService {

    function getDashboard() returns {
        totalOrganizations : Integer;
        totalUsers         : Integer;
        totalPermissions   : Integer;

        usersPerOrg        : many {
            orgId : UUID;
            name  : String;
            count : Integer;
        };

        roles              : many {
            id   : UUID;
            name : String;
        };

        modules            : many {
            moduleId    : UUID;
            name        : String;
            permissions : many String;
        };
    };

}
