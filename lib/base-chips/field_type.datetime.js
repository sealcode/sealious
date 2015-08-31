var Sealious = require("../main.js");

var Promise = require("bluebird");


var field_type_datetime = new Sealious.ChipTypes.FieldType("datetime");

field_type_datetime.prototype.isProperValue = function(context, datetime) {
    return new Promise(function(resolve, reject) {

        if (isNaN(datetime) === true || parseInt(datetime) === NaN) {
            reject("Value `" + datetime + "`" + " is not datetime format. Only timestamps are accepted.");
        } else {
            resolve();
        }
    })
}

field_type_datetime.prototype.encode = function(datetime) {
    return new Promise(function(resolve, reject) {
        var parsed_datetime = parseInt(datetime);
        resolve(parsed_datetime);
    })
}