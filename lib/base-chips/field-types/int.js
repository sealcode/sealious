"use strict";
module.exports = {
	name: "int",
	get_description: function(){
		return "An integer number.";
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		if (new_value === null || isNaN(new_value) === true || new_value % 1 !== 0){
			reject(`Value '${new_value}' is not a int number format.`);
		} else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		const parsed_int = parseInt(value_in_code);
		return parsed_int;
	},
};
