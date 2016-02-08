var Sealious = require("sealious");
var Promise = require("bluebird");
<<<<<<< HEAD
var sanitizeHtml = require("sanitize-html");
=======
var escape = require("escape-html");
>>>>>>> f04440e... Add object with original & safe fields in field type text

var field_type_text = new Sealious.ChipTypes.FieldType({
	name: "text",
	get_description: function(context, params) {
		return "Text with a maximum length " + params.max_length;
	},
<<<<<<< HEAD
	is_proper_value: function(accept, reject, context, params, new_value){
		if (params === undefined || (params.max_length === undefined && params.min_length === undefined)) {
			accept()
		} else {
			if (params.max_length !== undefined) {
				if (new_value.length <= params.max_length) {
					accept()
				} else {
					reject("Text '" + new_value + "' has exceeded max length of " + params.max_length + " chars.");
				}
			}
			else if (params.min_length !== undefined) {
				if (new_value.length >= params.min_length) {
					accept();
				} else {
					reject("Text '" + new_value + "' is too short, minimum length is " + params.max_length + " chars.");
				}
			}
			else if (params.min_length !== undefined && params.max_length !== undefined) {
				if (new_value.length >= params.min_length && new_value.length <= params.max_length) {
					accept();
				} else {
					reject("Text '" + new_value + "' length should be between " + params.min_length + " and " + params.max_length + ".");
				}

			}
		}
	},
	encode: function(context, params, value_in_code){
		if (params && params.strip_html === true) {
			var stripped = sanitizeHtml(value_in_code.toString(), {
				allowedTags: []
			})
			return Promise.resolve(stripped);
=======
	is_proper_value: function(accept, reject, context, params, new_value) {
		if (params === undefined || params.max_length === undefined) {
			accept();
		} else {
			if (new_value.length <= params.max_length) {
				accept();
			} else {
				reject("Text '" + new_value + "' has exceeded max length of " + params.max_length + " chars.");
			}
		}
	},
	encode: function(context, params, value_in_code) {
		if (typeof value_in_code === "string" && value_in_code !== null) {
			return Promise.resolve({
				"original": value_in_code,
				"safe": escape(value_in_code)
			});
>>>>>>> f04440e... Add object with original & safe fields in field type text
		} else {
			return Promise.resolve(null);
		}
	}
});
