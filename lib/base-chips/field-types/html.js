const sanitizeHtml = require("sanitize-html");

module.exports = {
	name: "html",
	extends: "text",
	encode: function(context, params, value){
		return {
			original: value,
			safe: sanitizeHtml(value, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([ "img", "h1", "h2" ])
			}),
		};
	},
	format: function(context, decoded_value, format){
		switch(format){
			case "unsafe":
				return decoded_value.original;
			case "orginal":
				return decoded_value.original;
			default:
				return decoded_value.safe;
		}
	}
};


