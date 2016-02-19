var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");
var stripTags = require('strip-tags');
var removeAttrs = require("remove-attributes");

var field_type_html = new Sealious.ChipTypes.FieldType({
	name: "html",
	get_description: function(context, params) {
		return "HTML source code";
	},
	is_proper_value: function(accept, reject, context, params, new_value) {
		if (new_value instanceof Object) {
			reject('Typed text is not HTML source.')
		} else {
			accept();
		}
	},
	encode: function(context, params, value_in_code) {
		return Promise.resolve(value_in_code)
	},
	decode: function(context, params, value_in_database) {
		var cleaned;

		if (params.forbidden_mode === true && params.forbidden_mode !== undefined) {
			cleaned = stripTags(value_in_database, params.forbidden_tags)
			return Promise.resolve(cleaned)

		} else {
			var allowed_tags, allowed_attributes;
			var default_params = {
				allowed_tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
					'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
					'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
				],
				allowed_attributes: {
					a: ['href', 'name', 'target'],
					img: ['src']
				}
			}
			if (params !== undefined && params.allowed_tags !== undefined) allowed_tags = params.allowed_tags
			else allowed_tags = default_params.allowed_tags

			if (params !== undefined && params.allowed_attributes !== undefined) allowed_attributes = params.allowed_attributes
			else allowed_attributes = default_params.allowed_attributes

			cleaned = sanitizeHtml(value_in_database, {
				allowedTags: allowed_tags,
				allowedAttributes: allowed_attributes
			});
			return Promise.resolve(cleaned)
		}

	}
});
