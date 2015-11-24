var Sealious = require('../main.js');
var Promise = require("bluebird");
var crypto = require("crypto");

var field_type_password = new Sealious.ChipTypes.FieldType({
	name: "password",
	get_description: function(context, params) {
		return "Hash passwords with md5 algorithm";
	},
	is_proper_value: function(accept, reject, context, params, new_value) {

	},
	encode: function(context, params, value_in_code) {
		var algorithm = params.algorithm || "md5";
		var hashing = crypto.createHash(algorithm);
		hashing.update(value_in_code);
		var hashed_password = hashing.digest("hex");
		return hashed_password;
	}
})
