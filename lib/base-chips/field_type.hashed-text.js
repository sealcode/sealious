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
		if (params === undefined)
			accept();
		else if (params.numbers !== undefined){
			var pattern = new RegExp("(.*[0-9]+.*){" + params.numbers + "}");
			pattern.test(new_value) ? accept() : reject("Doesn't match");
		}
		else if (params.capitals !== undefined){
			var pattern = new RegExp("(.*[A-Z]+.*){" + params.capitals + "}");
			pattern.test(new_value) ? accept() : reject();
		}
		else if (params.number !== undefined && params.capitals !== undefine){
			var pattern1 = new RegExp("(.*[0-9]+.*){" + params.numbers + "}");
			var pattern2 = new RegExp("(.*[A-Z]+.*){" + params.capitals + "}");
			if (pattern1.test(new_value) && pattern2.test(new_value)) 
				accept();
			else
				reject("Doesn't match")
		}
	},
	encode: function(context, params, value_in_code){
		var salt, algorithm;

		if (params !== undefined) {
			salt = params.salt || "";
			algorithm = params.algorithm || "md5";
		}

		return new Promise(function(resolve, reject) {
			crypto.pbkdf2(value_in_code, salt, 4096, 64, algorithm, function(err, key){
				if (err) 
					reject(err)
				resolve(key.toString('hex'));
			});
		})
	}
})
