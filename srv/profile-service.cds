service ProfileService {
    function getProfile() returns {
        id               : UUID;
        name             : String;
        email            : String;
        phone            : String;
        gender           : String;
        dob              : Date;
        city             : String;
        stateId          : UUID;
        state            : String;
        countryId        : UUID;
        country          : String;
        organizationId   : UUID;
        organization     : String;
        orgCode          : String;
        roleId           : UUID;
        role             : String;
        reportingManager : String;
        isActive         : Boolean;
    };

    action updateProfile(
        name    : String,
        phone   : String,
        gender  : String,
        dob     : Date,
        city    : String,
        state   : UUID,
        country : UUID
    ) returns {
        message : String;
    };

    action changePassword(
        currentPassword : String,
        newPassword     : String,
        confirmPassword : String
    ) returns {
        message : String;
    };
}
