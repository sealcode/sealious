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
		var salt = "salt",
			algorithm = "md5";

		return new Promise(function(resolve, reject) {
			crypto.pbkdf2(value_in_code, salt, 4096, 64, algorithm, function(err, key){
				resolve(key.toString('hex'));
			});
		})
	}
})
