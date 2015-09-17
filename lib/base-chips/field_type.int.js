var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_int = new Sealious.ChipTypes.FieldType({
    name: "int",
    get_description: function(context, params){
        return "An integer number."
    },
    is_proper_value: function(accept, reject, context, params, new_value){
        console.log("int is_proper_value:", arguments);
        var test = parseInt(new_value);
        if(test === null || test === NaN || isNaN(new_value) === true){
            reject("Value `" + new_value + "` is not a int number format.");
        }else{
            accept();
        }
    },
    encode: function(context, params, value_in_code){
        var parsed_int = parseInt(value_in_code);
        return parsed_int;
    }
});
