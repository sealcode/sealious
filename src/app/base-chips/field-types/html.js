"use strict";

module.exports = {
	name: "html",
	extends: "text",
	encode: function(context, params, value) {
		const sanitizeHtml = require("sanitize-html"); //putting it here not to slow down `new Sealious.app()`
		return {
			original: value,
			safe: sanitizeHtml(value, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([
					"img",
					"h1",
					"h2",
				]),
			}),
		};
	},
	format: function(context, params, decoded_value, format) {
		let ret;
		if (decoded_value === undefined) return undefined;
		switch (format) {
			case "unsafe":
				ret = decoded_value.original;
				break;
			case "original":
				ret = decoded_value.original;
				break;
			default:
				ret = decoded_value && decoded_value.safe;
				break;
		}
		return ret;
	},
};
