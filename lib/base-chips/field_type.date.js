var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_date = new Sealious.ChipTypes.FieldType({
	name: "date",
	get_description: function(context, params){
		return "Date standard ISO 8601 (YYYY-MM-DD)";
	},
	is_proper_value: function(accept, reject, context, params, date){
		var date_in_string = date.toString();

		var regex = /^([0-9]{4})-(0?[1-9]|1[0-2])-([0-2]?[0-9]|30|31)$/; //granulation_per_day

		if (regex.test(date_in_string) === false || Date.parse(date_in_string) === NaN) {
			reject("Value `" + date + "`" + " is not date calendar format. Expected value standard IS0 8601 (YYYY-MM-DD)");
		} else {
			accept();
		}
	}
});