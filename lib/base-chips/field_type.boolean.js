var Sealious = require("sealious");
var Promise = require("bluebird");

module.exports = {
	name: "boolean",
	get_description: function(context, params){
		return "Boolean value. True or false. Can be a string: \"true\" or \"false\".";
	},
	is_proper_value: function(context, params, value){
		return new Promise(function(resolve, reject) {
			if (typeof value === "boolean") {
				resolve();
			} else if (value.toString() === "1" || value.toString() === "0") {
				resolve();
			} else if (typeof value === "string" && (value.toLowerCase() === "true" || value.toLowerCase() === "false")) {
				resolve();
			} else {
				reject(`Value '${value}' is not boolean format.`);
			}
		});
	},
	encode: function(context, params, value){
		if (typeof value === "boolean") {
			return value;
		} else if (value.toString() === "1") {
			return true;
		} else if (value.toString() === "0") {
			return false;
		} else if (typeof value === "string") {
			if (value.toLowerCase() === "true") {
				return true;
			} else if (value.toLowerCase() === "false") {
				return false
			}
		}
	},
	filter_to_query: function(context, params, filter){
		if (filter === "" || filter === null){
			return {$in: [true, false]}
		} else {
			return this.encode(context, params, filter);
		}
	}
};
