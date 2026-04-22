service LeadService {

    function getLeadsWithStats() returns {
        leads : many {
            ID             : String;
            code           : String;
            name           : String;
            gender         : String;
            phone          : String;
            email          : String;
            status         : String;
            priority       : String;
            source         : String;
            address        : String;
            postal_code    : String;
            state          : String;  
            country        : String; 
            assigned_to : String;
            createdAt      : DateTime;
        };

        stats : {
            total  : Integer;
            new   : Integer;
            qualified : Integer;
            contacted    : Integer;
        };
    };

}