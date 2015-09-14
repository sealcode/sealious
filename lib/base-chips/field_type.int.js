var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_int = new Sealious.ChipTypes.FieldType({
    name: "int",
    is_proper_value: function(accept, reject, context, number) {
        var test = parseInt(number);
        if (test === null || test === NaN || isNaN(number) === true) {
            reject("Value `" + number + "` is not a int number format.");
        } else {
            accept();
        }
    },
    encode: function(number) {
        var parsed_int = parseInt(number);
        return parsed_int;
    }
});
