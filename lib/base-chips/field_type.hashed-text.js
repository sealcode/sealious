var Sealious = require('../main.js');
var Promise = require("bluebird");
var crypto = require("crypto");

var field_type_hashed_text = new Sealious.ChipTypes.FieldType({
	name: "hashed-text",
	extends: "text",
	get_description: function(context, params){
		return "Hash text with chosen algorithm (default md5)";
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		var pattern_array = [];
		if (params instanceof Object){
			if (params.digit)
				pattern_array.push(new RegExp("(.*[0-9]+.*){" + params.capitals + "}"));
			if (params.capitals)
				pattern_array.push(new RegExp("(.*[A-Z]+.*){" + params.capitals + "}"));

			var isAccepted = pattern_array.map(n => n.test(new_value)).reduce( (a,b) => a&&b, true);

			isAccepted ? accept() : reject("It didn't fulfill the requirements");
		}
		else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		var salt, algorithm;

		if (params) {
			salt = params.salt || "" ;
			algorithm = params.algorithm || "";
		}

		console.log("salt", salt);
		console.log("algorithm", algorithm)

		return new Promise(function(resolve, reject){
			try {
				crypto.pbkdf2(value_in_code, salt, 4096, 64, algorithm, function(err, key){
					if (err) 
						reject(err)
					
					resolve(key.toString('hex'));
				});
			} catch (e) {
				console.log(e);
			}
		})
	}
})