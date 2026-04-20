using {
    cuid,
    managed
} from '@sap/cds/common';

namespace crm;

type TrailType        : String enum {
    Free;
    Premium;
}

type Gender           : String enum {
    Male;
    Female;
    Other;
}

type LeadStatus       : String enum {
    New;
    Contacted;
    Qualified;
    Lost;
}

type ImportType       : String enum {
    Manual;
    Import;
}

type LeadActivityType : String enum {
    Call;
    SMS;
    Email;
    In_Person;
    Other;
}

type LeadPriority     : String enum {
    Urgent;
    High;
    Medium;
    Low;
}


entity Modules : cuid, managed {
    name    : String not null;
    default : Boolean not null;
}

entity Permissions : cuid, managed {
    name : String not null;
}

entity ModulePermissions : cuid, managed {
    module     : Association to Modules not null;
    permission : Association to Permissions not null;
}

entity Roles : cuid, managed {
    name        : String not null;
    default     : Boolean not null;

    permissions : Composition of many RoleModulePermissions
                      on permissions.role = $self;
}

entity RoleModulePermissions : cuid, managed {
    role              : Association to Roles not null;
    module_permission : Association to ModulePermissions not null;
    access            : Boolean not null;
}

entity Organization : cuid, managed {
    name                  : String not null;
    code                  : String not null;
    is_active             : Boolean not null;
    email                 : String;
    phone                 : String;
    address               : String;
    state                 : Association to State;
    country               : Association to Country;
    start_date            : Date;
    end_date              : Date;
    trial                 : TrailType;
    is_super_organization : Boolean not null;

    roles                 : Composition of many OrganizationRoles
                                on roles.organization = $self;
    users                 : Composition of many User
                                on users.organization = $self;
    rmpOverrides          : Composition of many OrganizationRoleModulePermissions
                                on rmpOverrides.organization = $self;
    modules               : Composition of many OrganizationModules
                                on modules.organization = $self;
}

entity OrganizationRoles : cuid, managed {
    organization : Association to Organization not null;
    role         : Association to Roles not null;
}

entity OrganizationModules : cuid, managed {
    organization : Association to Organization not null;
    module       : Association to Modules not null;
}

entity OrganizationRoleModulePermissions : cuid, managed {
    organization     : Association to Organization not null;
    organizationRole : Association to OrganizationRoles not null;
    rmp              : Association to RoleModulePermissions not null;
    access           : Boolean not null;
}

entity User : cuid, managed {
    name                 : String not null;
    email                : String not null;
    phone                : String not null;
    password             : String not null;
    gender               : Gender not null;
    dob                  : Date not null;
    organization         : Association to Organization not null;
    role                 : Association to OrganizationRoles not null;
    reporting_manager    : Association to User;
    state                : Association to State not null;
    country              : Association to Country not null;
    is_active            : Boolean not null;
    must_change_password : Boolean;
}

entity PasswordResetToken : cuid, managed {
    user       : Association to User not null;
    token      : String(5000) not null;
    expires_at : Timestamp not null;
    is_used    : Boolean not null;
}

entity Leads : cuid, managed {
    organization : Association to Organization not null;
    name         : String not null;
    gender       : Gender not null;
    code         : String not null;
    dob          : Date;
    phone        : String;
    email        : String;
    status       : LeadStatus not null;
    priority     : LeadPriority;
    source       : String;
    import_type  : ImportType;
    assigned_to  : Association to User;
    address      : String;
    state        : Association to State;
    country      : Association to Country;

    activities   : Composition of many LeadActivity
                       on activities.lead = $self;
}

entity LeadActivity : cuid, managed {
    lead                : Association to Leads not null;
    type                : LeadActivityType;
    free_text           : String;
    notes               : String(5000);
    call_status         : String;
    next_follow_up_date : Date;
}

entity Offer : cuid, managed {
    organization : Association to Organization;
    title        : String not null;
    code         : String not null;
    description  : String(5000);
    valid_from   : Date;
    valid_to     : Date;
    is_global    : Boolean not null;

    assignments  : Composition of many OfferAssignment
                       on assignments.offer = $self;
}

entity OfferAssignment : cuid, managed {
    offer : Association to Offer not null;
    user  : Association to User not null;
}

entity Country : cuid, managed {
    name      : String not null;
    isocode   : String;
    phonecode : String;
}

entity State : cuid, managed {
    name      : String not null;
    statecode : String;
    country   : Association to Country not null;
}

entity Settings : cuid {
    maintenance_mode : Boolean not null;
}
