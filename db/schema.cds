using {
    cuid,
    managed
} from '@sap/cds/common';

namespace crm;

type TrailType  : String enum {
    FREE;
    PREMIUM;
    TEMP;
}

type Gender     : String enum {
    Male;
    Female;
    Other;
}

type LeadStatus : String enum {
    New;
    Contacted;
    Qualified;
    Lost;
}

type ImportType : String enum {
    Manual;
    Import;
}

entity Modules : cuid, managed {
    name : String;
}

entity Permissions : cuid, managed {
    name : String;
}

entity ModulePermissions : cuid, managed {
    module     : Association to Modules;
    permission : Association to Permissions;
}

entity Roles : cuid, managed {
    name    : String;
    default : Boolean;
}

entity RoleModulePermissions : cuid, managed {
    role              : Association to Roles;
    module_permission : Association to ModulePermissions;
    access            : Boolean;
}

entity Organization : managed {
    key id         : Integer  @cds.autoIncrement  @cds.persistence.skip: 'insert';
        name       : String;
        code       : String   @assert.unique;
        is_active  : Boolean;
        email      : String;
        phone      : String;
        address    : String;
        state      : Association to States;
        country    : Association to Countries;
        start_date : Date;
        end_date   : Date;
        trail      : TrailType;
}

entity OrganizationRoles : cuid, managed {
    organization : Association to Organization;
    role         : Association to Roles;
}

entity OrganizationRoleModulePermissions : cuid, managed {
    organization : Association to Organization;
    rmp          : Association to RoleModulePermissions;
    access       : Boolean;
}

entity Users : cuid, managed {
    name              : String;
    email             : String;
    phone             : String;
    gender            : Gender;
    dob               : Date;
    organization      : Association to Organization;
    role              : Association to Roles;
    reporting_manager : Association to Users;
    state             : Association to States;
    country           : Association to Countries;
    is_active         : Boolean;
}

entity PasswordResetToken : cuid, managed {
    user       : Association to Users;
    token      : LargeString;
    expires_at : Timestamp;
    is_used    : Boolean;
}

entity Leads : cuid, managed {
    organization : Association to Organization;
    name         : String;
    gender       : Gender;
    dob          : Date;
    phone        : String;
    email        : String;
    status       : LeadStatus;
    source       : String;
    import_type  : ImportType;
    assigned_to  : Association to Users;
    address      : String;
    state        : Association to States;
    country      : Association to Countries;
}

entity LeadActivity : cuid, managed {
    lead                : Association to Leads;
    type                : String;
    notes               : LargeString;
    call_status         : String;
    next_follow_up_date : Date;
}

entity Offer : cuid, managed {
    organization : Association to Organization;
    title        : String;
    description  : LargeString;
    valid_from   : Date;
    valid_to     : Date;
    is_global    : Boolean;
}

entity OfferAssignment : cuid {
    offer : Association to Offer;
    user  : Association to Users;
}

entity Countries : cuid, managed {
    name      : String;
    isocode   : String;
    phonecode : String;
}

entity States : cuid, managed {
    name      : String;
    statecode : String;
    country   : Association to Countries;
}
