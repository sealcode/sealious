var Sealious = require('../main.js');
var Promise = require("bluebird");
var crypto = require("crypto");

var field_type_hashed_text = new Sealious.ChipTypes.FieldType({
	name: "hashed-text",
	extends: "text",
	get_description: function(context, params){
		return "Hash passwords with chosen algorithm (default md5)";
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		accept();
	},
	encode: function(context, params, value_in_code){
		var algorithm;
		try {
			algorithm = params.algorithm;
		}
		catch (e) {
			algorithm = "md5";
		}

		var hashing = crypto.createHash(algorithm);
		hashing.update(value_in_code);
		var hashed_password = hashing.digest("hex");
		return hashed_password;
	}
})
