type DashboardPermissions {
    canUpdateRoles : Boolean;
}

type DashboardRole {
    orgRoleId : UUID;
    roleId    : UUID;
    name      : String;
}

type DashboardUsersPerOrg {
    orgId          : UUID;
    code           : String;
    name           : String;
    count          : Integer;
    adminOrgRoleId : UUID;
    adminRoleId    : UUID;
}

type DashboardPermissionDetail {
    access                      : Boolean;
    orgRoleModulePermissionId   : UUID;
    organizationId              : UUID;
    orgRoleId                   : UUID;
    roleId                      : UUID;
    rmpId                       : UUID;
    modulePermissionId          : UUID;
    moduleId                    : UUID;
    permissionId                : UUID;
    module                      : String;
    permission                  : String;
}

type DashboardAdminPermissionMatrix {
    organizationId   : UUID;
    organizationCode : String;
    organizationName : String;
    role             : String;
    orgRoleId        : UUID;
    roleId           : UUID;
    permissions      : many DashboardPermissionDetail;
}

type AdminPermissionUpdate {
    orgRoleModulePermissionId : UUID;
    access                    : Boolean;
}

type AffectedSessionUser {
    id             : UUID;
    sessionVersion : Integer;
}

service SystemAdminService {

    function getDashboard() returns {
        totalOrganizations : Integer;
        totalUsers         : Integer;
        totalPermissions   : Integer;
        permissions        : DashboardPermissions;

        usersPerOrg        : many DashboardUsersPerOrg;

        roles              : many DashboardRole;

        adminPermissionMatrix : many DashboardAdminPermissionMatrix;

        modules            : many {
            moduleId    : UUID;
            name        : String;
            permissions : many String;
        };
    };

    function getDefaultTemplates() returns {
        modules : many {
            id      : UUID;
            name    : String;
            default : Boolean;
        };
        roles   : many {
            id      : UUID;
            name    : String;
            default : Boolean;
        };
        rmp     : many {
            role    : String;
            module  : String;
            permission : String;
            access  : Boolean;
        };
        segmentFilters : many {
            id            : UUID;
            name          : String;
            label         : String;
            category      : String;
            operator_type : String;
            default       : Boolean;
        };
    };

    action updateOrganizationAdminPermissions(organizationId : UUID,
                                              orgRoleId      : UUID,
                                              permissions    : many AdminPermissionUpdate) returns {
        message              : String;
        updatedCount         : Integer;
        affectedSessionUsers : Integer;
        affectedUsers        : many AffectedSessionUser;
        revokedRefreshTokens : Integer;
    };

}
