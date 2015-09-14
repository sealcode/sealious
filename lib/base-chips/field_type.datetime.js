var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_datetime = new Sealious.ChipTypes.FieldType({
    name: "datetime",
    is_proper_value: function(accept, reject, context, datetime) {
        if (isNaN(datetime) === true || parseInt(datetime) === NaN) {
            reject("Value `" + datetime + "`" + " is not datetime format. Only timestamps are accepted.");
        } else {
            accept();
        }
    },
    encode: function(datetime) {
        var parsed_datetime = parseInt(datetime);
        return parsed_datetime;
    }
});

