service AuthService {

    action login(email: String, password: String) returns {
        accessToken : String;
        user        : {
            id                 : UUID;
            name               : String;
            orgId              : UUID;
            orgCode            : String;
            orgName            : String;
            roleId             : UUID;
            role               : String;
            mustChangePassword : Boolean;
        };
    };

    action refresh() returns {
        accessToken : String;
        user        : {
            id                 : UUID;
            name               : String;
            orgId              : UUID;
            orgCode            : String;
            orgName            : String;
            roleId             : UUID;
            role               : String;
            mustChangePassword : Boolean;
        };
    };

    action setPassword(password: String, confirmPassword: String) returns {
        accessToken : String;
        user        : {
            id                 : UUID;
            name               : String;
            orgId              : UUID;
            orgCode            : String;
            orgName            : String;
            roleId             : UUID;
            role               : String;
            mustChangePassword : Boolean;
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
        password        : String,
        newPassword     : String,
        confirmPassword : String
    ) returns {
        message : String;
    };

}
