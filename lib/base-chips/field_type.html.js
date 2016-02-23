var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");
var htmlparser = require('htmlparser2');

var utils = {
	is_allowed: function(array_keep, array_remove, default_decision, element) {
		if (!array_keep.has(element) && !array_remove.has(element) || array_keep.has(element) && array_remove.has(element)) {
			return default_decision;
		} else if (array_keep.has(element) && !array_remove.has(element)) {
			return true;
		} else if (!array_keep.has(element) && array_remove.has(element)) {
			return false;
		}
	},
	create_sets_from_params: function(params) {
		var params_sets = { tags: {}, attributes: {} }
		params_sets.tags.keep = new Set(params.tags.keep);
		params_sets.tags.remove = new Set(params.tags.remove);
		params_sets.attributes.keep = new Set(params.attributes.keep);
		params_sets.attributes.remove = new Set(params.attributes.remove);
		return params_sets;
	},
	start_parser: function(input, sets, default_decision_tags, default_decision_attributes) {
		var output = "";
		var parser = new htmlparser.Parser({
			onopentag: function(name, attribs) {
				var decision = utils.is_allowed(sets.tags.keep, sets.tags.remove, default_decision_tags, name);
				if (decision !== false) {
					output += "<" + name + " ";
					for (key in attribs) {
						if (utils.is_allowed(sets.attributes.keep, sets.attributes.remove, default_decision_attributes, key)) {
							output += key + "='" + attribs[key] + "' ";
						}
					}
					output = output.slice(0, -1) + ">";
				}
			},
			ontext: function(text) {
				output += text;
			},
			onclosetag: function(tagname) {
				var decision = utils.is_allowed(sets.tags.keep, sets.tags.remove, default_decision_tags, tagname);
				if (decision !== false) output += "</" + tagname + ">";
			}
		})
		parser.write(input);
		parser.end();
		return output;
	}
}

var field_type_html = new Sealious.ChipTypes.FieldType({
	name: "html",
	get_description: function(context, params) {
		return "HTML source code";
	},
	is_proper_value: function(accept, reject, context, params, new_value) {
		if (new_value instanceof Object) reject('Typed text is not HTML source.');
		else accept();
	},
	decode: function(context, params, value_in_database) {
		return Promise.resolve(utils.start_parser(
			sanitizeHtml(value_in_database, { allowedTags: false, allowedAttributes: false }),
			utils.create_sets_from_params(params),
			params.tags.default_decision,
			params.attributes.default_decision));
	}
});

module.exports = utils;
