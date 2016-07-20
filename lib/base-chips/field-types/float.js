var Sealious = require("sealious");
var Promise = require("bluebird");

var field_type_float = new Sealious.ChipTypes.FieldType({
	name: "float",
	get_description: function(context, params){
		return "Float number."
	},
	is_proper_value: function(accept, reject, context, params, number){
		var test = parseFloat(number);
		if (test === null || isNaN(test) || isNaN(number) === true) {
			reject("Value `" + number + "` is not a float number format.");
		} else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		var parsed_float = parseFloat(value_in_code);
		return parsed_float;
	}
});
