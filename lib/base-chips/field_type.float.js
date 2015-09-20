var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_float = new Sealious.ChipTypes.FieldType("float");

field_type_float.prototype.isProperValue = function(context, number) {
	var test = parseFloat(number);
	if (test === null || test === NaN || isNaN(number) === true) {
		return new Sealious.Errors.ValidationError("Value `" + number + "` is not a float number format.");
	} else {
		return true;
	}
}

field_type_float.prototype.encode = function(number) {
	return new Promise(function(resolve, reject) {
		resolve(parseFloat(number));
	})
}