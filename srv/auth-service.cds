service AuthService {

    action login(email: String, password: String) returns {
        token : String;
        user  : {
            id      : UUID;
            name    : String;
            orgId   : UUID;
            orgCode : String;
            orgName : String;
            roleId  : UUID;
            role    : String;
        };
    };

}
