using {crm as db} from '../db/schema';

type OrgRole {
    id   : UUID;
    name : String;
}

type OrgModule {
    id   : UUID;
    name : String;
}

type OrgPermission {
    role       : String;
    module     : String;
    permission : String;
    access     : Boolean;
}

type OrgResponse {
    id        : UUID;
    name      : String;
    code      : String;
    is_active : Boolean;
    email     : String;
    phone     : String;
    address   : String;
}

type OrgUser {
    id    : UUID;
    name  : String;
    email : String;
}

service OrganizationService {

    action   createOrganization(name: String,
                                email: String,
                                phone: String,
                                is_active: Boolean,
                                address: String,
                                state: UUID,
                                country: UUID,
                                start_date: Date,
                                end_date: Date,
                                trial: String)   returns {
        message : String;
        code    : String;
    };

    function getOrganizations()                  returns many OrgResponse;

    function getOrganizationByCode(code: String) returns {
        organization : OrgResponse;
        users        : many OrgUser;
        modules      : many OrgModule;
        roles        : many OrgRole;
        allModules   : many OrgModule;
        allRoles     : many OrgRole;
        permissions  : many OrgPermission;
        segmentFilters : many {
            id            : UUID;
            name          : String;
            label         : String;
            category      : String;
            operator_type : String;
            is_enabled    : Boolean;
        };
    };

    action   updateOrganization(id: UUID,
                                name: String,
                                is_active: Boolean,
                                email: String,
                                phone: String,
                                address: String,
                                state: UUID,
                                country: UUID,
                                trial: String) returns {
        message : String;
    };

    action   createUser(name: String,
                        email: String,
                        phone: String,
                        gender: String,
                        is_active: Boolean,
                        dob: Date,
                        state: UUID,
                        country: UUID,
                        organizationId: UUID)    returns {
        message : String;
    };

    action   updateUser(id: UUID,
                        name: String,
                        phone: String,
                        is_active: Boolean,
                        state: UUID,
                        country: UUID)           returns {
        message : String;
    };

    function getAdminUsers(organizationId: UUID) returns many {
        id        : UUID;
        name      : String;
        email     : String;
        phone     : String;
        gender    : String;
        dob       : Date;
        state     : String;
        country   : String;
        is_active : Boolean;
    };

}
