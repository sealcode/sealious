var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");
var htmlparser = require('htmlparser2');

var utils = {
	check_fragment: function(array_keep, array_remove, default_decision, element) {
		if (array_keep.has(element) === false && array_remove.has(element) === false || array_keep.has(element) === true && array_remove.has(element) === true) {
			return default_decision;
		} else if (array_keep.has(element) === true && array_remove.has(element) === false) {
			return "keep";
		} else if (array_keep.has(element) === false && array_remove.has(element) === true) {
			return "remove";
		}
	},
	create_sets_from_params: function(params) {
		var params_sets = { tags: {}, attributes: {} }
		params_sets.tags.keep = new Set(params.tags.keep);
		params_sets.tags.remove = new Set(params.tags.remove);
		params_sets.attributes.keep = new Set(params.attributes.keep);
		params_sets.attributes.remove = new Set(params.attributes.remove);
		return params_sets;
	}
}

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
		var output = "";
		var sanitized = sanitizeHtml(value_in_database, {
			allowedTags: false,
			allowedAttributes: false
		});
		var default_decision_tags = params.tags.default_decision;
		var default_decision_attributes = params.attributes.default_decision;
		var params = utils.create_sets_from_params(params);

		var parser = new htmlparser.Parser({
			onopentag: function(name, attribs) {
				var decision = utils.check_fragment(params.tags.keep, params.tags.remove, default_decision_tags, name);
				if (decision !== "remove") {
					output += "<" + name + " ";
					for (key in attribs) {
						if (utils.check_fragment(params.attributes.keep, params.attributes.remove, default_decision_attributes, key) === "keep") {
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
				var decision = utils.check_fragment(params.tags.keep, params.tags.remove, default_decision_tags, tagname);
				if (decision !== "remove") output += "</" + tagname + ">";
			}
		})
		parser.write(sanitized);
		parser.end();
		return Promise.resolve(output)
	}

});

module.exports = utils;
