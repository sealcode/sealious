"use strict";
module.exports = {
	name: "color",
	is_proper_value: function(context, params, new_value) {
		const Color = require("color"); //putting it here not to slow down `new Sealious.app()`
		try {
			if (typeof new_value === "string") {
				Color(new_value.toLowerCase());
			} else {
				Color(new_value);
			}
			return Promise.resolve();
		} catch (e) {
			return Promise.reject(
				`Value '${new_value}' could not be parsed as a color.`
			);
		}
	},
	encode: function(context, params, value_in_code) {
		const Color = require("color"); //putting it here not to slow down `new Sealious.app()`
		const color = Color(value_in_code);
		return color.hexString();
	},
};
