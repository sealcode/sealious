var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_float = new Sealious.ChipTypes.FieldType({
	name: "float",
	get_description: function(context, params) {
		return "Float number."
	},
	is_proper_value: function(accept, reject, context, number) {
		var test = parseFloat(number);
		if (test === null || test === NaN || isNaN(number) === true) {
			reject("Value `" + number + "` is not a float number format.");
		} else {
			accept();
		}
	},
	encode: function(number) {
		var parsed_float = parseFloat(number);
		return parsed_float;
	}
});