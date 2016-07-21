const Promise = require("bluebird");
const crypto = require("crypto");

module.exports = {
	name: "hashed-text",
	extends: "text",
	get_description: function(context, params){
		let message = "Hash text with chosen algorithm (default md5)";
		if (params && Object.keys(params).length > 0){
			message += " with ";

			if (params.digits) {
				message += `required digits: ${params.digits} `;
			}

			if (params.capitals) {
				message += `required capitals: ${params.capitals} `
			}
		}

		return message;
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		const pattern_array = [];
		if (typeof params === "object"){
			if (params.digits){
				pattern_array.push(new RegExp("(.*[0-9]+.*){" + params.digits + "}"));
			}
			if (params.capitals){
				pattern_array.push(new RegExp("(.*[A-Z]+.*){" + params.capitals + "}"));
			}

			const isAccepted = pattern_array.map(n => n.test(new_value)).reduce((a,b) => a && b, true);

			if (isAccepted){
				accept();
			}
			else {
				const digits = params.digits || "0";
				const capitals = params.capitals || "0";
				reject(`It didn't fulfill the requirements: required digits - ${digits} , required capitals ${capitals}`);
			}
		}
		else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		let salt = "", algorithm = "md5";

		if (params){
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
					resolve(key.toString("hex"));
				}
			});
		});
	},
	decode: function(context, params, value_in_db){
		if (params && params.hide_hash){
			return null;
		} else {
			return value_in_db;
		}
	}
};
