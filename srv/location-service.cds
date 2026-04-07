service LocationService {

    function getCountries()                      returns many {
        id   : UUID;
        name : String;
    };

    function getStatesByCountry(countryId: UUID) returns many {
        id   : UUID;
        name : String;
    };

}
