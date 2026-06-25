service AuthService {

    action login(email: String, password: String) returns {
        accessToken : String;
        user        : {
            id          : UUID;
            name        : String;
            orgId       : UUID;
            orgCode     : String;
            orgName     : String;
            roleId      : UUID;
            role        : String;
        };
    };

    action refresh() returns {
        accessToken : String;
        user        : {
            id          : UUID;
            name        : String;
            orgId       : UUID;
            orgCode     : String;
            orgName     : String;
            roleId      : UUID;
            role        : String;
        };
    };

    action logout() returns {
        message : String;
    };

    action forgotPassword(email: String) returns {
        message : String;
    };

    action resetPassword(
        token           : String,
        newPassword     : String,
        confirmPassword : String
    ) returns {
        message : String;
    };

}
