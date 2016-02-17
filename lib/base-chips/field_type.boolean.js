var Sealious = require("sealious");
var Promise = require("bluebird");

var field_type_boolean = new Sealious.ChipTypes.FieldType({
	name: "boolean",
	get_description: function(context, params){
		return "Boolean value. True or false. Can be a string: \"true\" or \"false\".";
	},
	is_proper_value: function(accept, reject, context, params, value){
		if (typeof value === "boolean") {
			accept();
		} else if (value.toString() === "1" || value.toString() === "0") {
			accept();
		} else if (typeof value === "string" && (value.toLowerCase() === "true" || value.toLowerCase() === "false")) {
			accept();
		} else {
			reject(`Value '${value}' is not boolean format.`);
		}
	},
	encode: function(context, params, value){
		if (typeof value === "boolean") {
			return value;
		} else if (value.toString() === "1") {
			return true;
		} else if (value.toString() === "0") {
			return false;
		} else if (typeof value === "string") {
			if (value.toLowerCase() === "true") {
				return true;
			} else if (value.toLowerCase() === "false") {
				return false
			}
		}
	}
});
