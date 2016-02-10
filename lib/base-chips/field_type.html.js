var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");

var field_type_html = new Sealious.ChipTypes.FieldType({
	name: "html",
	get_description: function(context, params) {
		return "HTML source code";
	},
	is_proper_value: function(accept, reject, context, params, new_value) {
		if (new_value instanceof Object) {
			reject('Typed text is not HTML source.')
		} else {
			if (params === undefined || params.tags === undefined) {
			accept();
			} else {
				// to do check, did you use tags or attributes which are not allowed
				if (params.restrict) {
					reject("Used not allowed tags or attributes. You've defined tags: " + params.tags + "and attributes: " + params.attributes);
				} else {
					accept();
				}
			}
		}
	},
	encode: function(context, params, value_in_code) {
		var tags, attributes, cleaned;
		var default_params = {
			tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
				'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
			],
			attributes: {
				a: ['href', 'name', 'target'],
				img: ['src']
			}
		}
		if (params !== undefined && params.tags !== undefined) tags = params.tags
		else tags = default_params.tags

		if (params !== undefined && params.attributes !== undefined) attributes = params.attributes
		else attributes = default_params.attributes
			
		cleaned = sanitizeHtml(value_in_code, {
			allowedTags: tags,
			allowedAttributes: attributes
		});
		return Promise.resolve(cleaned)
	}
});
