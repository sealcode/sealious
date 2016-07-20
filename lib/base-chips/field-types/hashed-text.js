var Sealious = require('sealious');
var Promise = require("bluebird");
var crypto = require("crypto");

module.exports = {
	name: "hashed-text",
	extends: "text",
	get_description: function(context, params){
		let message = "Hash text with chosen algorithm (default md5)";
		if (params && Object.keys(params).length > 0) {
			message += " with ";

			if (params.digits) {
				message += "required digits: " + params.digits + " ";
			}

			if (params.capitals) {
				message += "required capitals: " + params.capitals + " ";
			}
		}

		return message;
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		const pattern_array = [];
		if (params instanceof Object){
			if (params.required_digits){
				pattern_array.push(new RegExp("(.*[0-9]+.*){" + params.required_digits + "}"));
			}
			if (params.required_capitals){
				pattern_array.push(new RegExp("(.*[A-Z]+.*){" + params.required_capitals + "}"));
			}

			const isAccepted = pattern_array.map(n => n.test(new_value)).reduce( (a,b) => a && b, true);

			if (isAccepted) {
				accept();
			}
			else {
				const digits = params.required_digits || "0";
				const capitals = params.required_capitals || "0";
				reject(`It didn't fulfill the requirements: required digits - ${digits} , required capitals ${capitals}`);
			}
		}
		else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		let salt = "", algorithm = "md5";

		if (params) {
			if (params.salt){
				salt = params.salt;
			}
			else if (params.algorithm){
				algorithm = params.algorithm;
			}
		}

		return new Promise(function(resolve, reject){
			crypto.pbkdf2(value_in_code, salt, 4096, 64, algorithm, function(err, key){
				if (err){
					reject(err);
				} else {
					resolve(key.toString('hex'))
				}
			});
		});
	},
	decode: function(context, params, value_in_db){
		if (params && params.hide_hash){
			return null;
		} else {
			return value_in_db
		}
	}
};
