const Color = require("color");

module.exports = {
	name: "color",
	is_proper_value: function(accept, reject, context, params, new_value){
		try {
			if (typeof (new_value) === "string"){
				Color(new_value.toLowerCase());
			} else {
				Color(new_value);
			}
			accept();
		} catch (e){
			reject(`Value '${new_value}' could not be parsed as a color.`);
		}
	},
	encode: function(context, params, value_in_code){
		var color = Color(value_in_code);
		return color.hexString();
	}
};
