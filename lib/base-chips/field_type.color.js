var Sealious = require("sealious");
var Promise = require("bluebird");
var Color = require("color");

var field_type_color = new Sealious.ChipTypes.FieldType({
	name: "color",
	is_proper_value: function(accept, reject, context, params, new_value){
		try{
			Color(new_value.toLowerCase());
		} catch(e){
			reject("Value `" + new_value + "` could not be parsed as a color.");
		}
		accept();
	},
	encode: function(context, params, value_in_code){
		var color = Color(value_in_code);
		return color.hexString();
	}
});
