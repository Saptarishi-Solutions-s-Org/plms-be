service AuthService {

    action login(email: String, password: String) returns {
        token : String;
        user  : {
            id      : UUID;
            name    : String;
            orgId   : UUID;
            orgCode : String;
            roleId  : UUID;
        };
    };
}
