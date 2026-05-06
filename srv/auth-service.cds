service AuthService {

    action login(email: String,
                 password: String) returns {
        success : Boolean;

        user    : {
            id      : UUID;
            name    : String;

            orgId   : UUID;
            orgCode : String;
            orgName : String;

            roleId  : UUID;
            role    : String;
        };
    };

    action refresh()               returns {
        success : Boolean;
    };

    action logout()                returns {
        success : Boolean;
    };

    action me()                    returns {
        user : {
            id          : UUID;

            name        : String;

            orgId       : UUID;

            orgCode     : String;

            orgName     : String;

            roleId      : UUID;

            role        : String;

            permissions : LargeString;

            isSuper     : Boolean;
        };
    };

}
