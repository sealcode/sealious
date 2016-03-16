var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");
var utils = require('./field_type.html-assets/utils.js');

var field_type_html = new Sealious.ChipTypes.FieldType({
	name: "html",
	get_description: function(context, params) {
		return "HTML source code";
	},
	is_proper_value: function(accept, reject, context, params, new_value) {
		if (new_value instanceof Object) {
			reject('Typed text is not HTML source.');
		} else {
			accept();
		}
	},
	decode: function(context, params, value_in_database) {
		var merged_params = utils.merge_params(params);

		return Promise.resolve(utils.parse(
			sanitizeHtml(value_in_database, { allowedTags: false, allowedAttributes: false }),
			utils.create_sets_from_params(merged_params),
			merged_params.tags.default_decision,
			merged_params.attributes.default_decision,
			merged_params.tag_content.default_decision));
	}
});

module.exports = utils;
