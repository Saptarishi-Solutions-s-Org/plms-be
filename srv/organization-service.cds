service OrganizationService {

    function getOrganizations()                  returns many {
        id     : UUID;
        name   : String;
        code   : String;
        status : Boolean;
    };

    function getOrganizationByCode(code: String) returns {
        org         : {
            id     : UUID;
            name   : String;
            code   : String;
            email  : String;
            phone  : String;
            status : Boolean;
        };

        users       : many {
            id    : UUID;
            name  : String;
            email : String;
        };

        roles       : many {
            id   : UUID;
            name : String;
        };

        modules     : many {
            id   : UUID;
            name : String;
        };

        permissions : many {
            role       : String;
            module     : String;
            permission : String;
        };
    };

    action   createOrganization(name: String,
                                email: String,
                                phone: String,
                                address: String,
                                state: UUID,
                                country: UUID,
                                trial: String)   returns {
        id   : UUID;
        name : String;
        code : String;
    };

    action   updateOrganization(id: UUID,
                                name: String,
                                email: String,
                                phone: String,
                                address: String,
                                state: UUID,
                                country: UUID,
                                trial: String,
                                status: Boolean);

}
