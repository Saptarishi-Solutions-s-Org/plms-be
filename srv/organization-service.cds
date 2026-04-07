using {crm as db} from '../db/schema';

type OrgRole {
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
        modules      : many String;
        roles        : many OrgRole;
        permissions  : many OrgPermission;
    };

    action   updateOrganization(id: UUID,
                                name: String,
                                is_active: Boolean,
                                email: String,
                                phone: String,
                                address: String) returns {
        message : String;
    };
}
