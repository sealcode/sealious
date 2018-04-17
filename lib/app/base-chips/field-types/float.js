"use strict";
module.exports = {
	name: "float",
	get_description: function() {
		return "Float number.";
	},
	is_proper_value: function(context, params, number) {
		const test = parseFloat(number);
		if (test === null || isNaN(test) || isNaN(number) === true) {
			return Promise.reject(
				`Value '${number}'  is not a float number format.`
			);
		} else {
			return Promise.resolve();
		}
	},
	encode: function(context, params, value_in_code) {
		const parsed_float = parseFloat(value_in_code);
		return parsed_float;
	},
};
