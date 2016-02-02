var Sealious = require("../main.js");
var Promise = require("bluebird");
var htmlToText = require("html-to-text");
var isHtml = require("is-html");

var field_type_text = new Sealious.ChipTypes.FieldType({
	name: "text",
	get_description: function(context, params){
		return "Text with a maximum length " + params.max_length
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		if (params === undefined || params.max_length === undefined) {
			accept()
		} else {
			if (new_value.length <= params.max_length) {
				accept()
			} else {
				reject("Text '" + new_value + "' has exceeded max length of " + params.max_length + " chars.");
			}
		}
	},
	encode: function(context, params, value_in_code){
		if (typeof value_in_code === 'string' && isHtml(value_in_code)) {
			var stripped;
			if (params === undefined || params.chars_in_line === undefined || params.chars_in_line === 0) {
				stripped = htmlToText.fromString(value_in_code)
			} else {
				stripped = htmlToText.fromString(value_in_code, {
					wordwrap: params.chars_in_line
				})
			}
			return Promise.resolve(stripped);
		} else {
			if (value_in_code instanceof Object) {
				return Promise.resolve(JSON.stringify(value_in_code));
			} else if (value_in_code === null) {
				return Promise.resolve(null);
			} else {
				return Promise.resolve(value_in_code.toString());
			}
		}
	}
});