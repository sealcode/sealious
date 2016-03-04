var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");
var htmlparser = require('htmlparser2');
var merge = require('merge');

var utils = {
	is_allowed: function(set_keep, set_remove, default_decision, element){
		if (default_decision === "keep"){
			default_decision = true;	
		} else {
			default_decision = false;			
		}

		if (!set_keep.has(element) && !set_remove.has(element) || set_keep.has(element) && set_remove.has(element)){
			return default_decision;	
		} else if (set_keep.has(element) && !set_remove.has(element)){
			return true;	
		} else if (!set_keep.has(element) && set_remove.has(element)){
			return false;	
		}
	},
	create_sets_from_params: function(params){
		var params_sets = { tags: {}, attributes: {} }
		if (params.tags !== undefined) {
			params_sets.tags.keep = new Set(params.tags.keep);
			params_sets.tags.remove = new Set(params.tags.remove);
		}
		if (params.attributes !== undefined) {
			params_sets.attributes.keep = new Set(params.attributes.keep);
			params_sets.attributes.remove = new Set(params.attributes.remove);
		}
		return params_sets;
	},
	parse: function(input, sets, default_decision_tags, default_decision_attributes){
		var output = "";
		var parser = new htmlparser.Parser({
			onopentag: function(name, attribs){
				var keep = utils.is_allowed(sets.tags.keep, sets.tags.remove, default_decision_tags, name);
				if (keep) {
					output += "<" + name + " ";
					for (var key in attribs) {
						if (utils.is_allowed(sets.attributes.keep, sets.attributes.remove, default_decision_attributes, key)) {
							output += key + "='" + attribs[key] + "' ";
						}
					}
					output = output.slice(0, -1) + ">";
				}
			},
			ontext: function(text){
				output += text;
			},
			onclosetag: function(tagname){
				var decision = utils.is_allowed(sets.tags.keep, sets.tags.remove, default_decision_tags, tagname);
				if (decision !== false){
					output += "</" + tagname + ">";	
				} 
			}
		})
		parser.write(input);
		parser.end();
		return output;
	},
	default_values: {
		tags: {
			default_decision: "remove",
			keep: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
				'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
				'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
			],
			remove: ['script', 'input', 'form', 'noscript']
		},
		attributes: {
			default_decision: "remove",
			keep: ['href', 'name', 'target'],
			remove: ['src']
		}
	},
	merge_params: function(params){
		if (params !== undefined && params.tags !== undefined) {
			var t = params.tags;
			if (t.default_decision !== "keep" && t.default_decision !== "remove" || t.default_decision === undefined){
				params.tags.default_decision = "remove";	
			}
		}
		if (params !== undefined && params.attributes !== undefined) {
			var a = params.attributes;
			if (a.default_decision !== "keep" && a.default_decision !== "remove" || a.default_decision === undefined){
				params.attributes.default_decision = "remove";
			}
		}
		var merged_params = merge.recursive(true, utils.default_values, params);
		return merged_params;
	}
}

var field_type_html = new Sealious.ChipTypes.FieldType({
	name: "html",
	get_description: function(context, params){
		return "HTML source code";
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		if (new_value instanceof Object){
			reject('Typed text is not HTML source.');	
		} else {
			accept();
		}
	},
	decode: function(context, params, value_in_database){
		var merged_params = utils.merge_params(params)

		return Promise.resolve(utils.parse(
			sanitizeHtml(value_in_database, { allowedTags: false, allowedAttributes: false }),
			utils.create_sets_from_params(merged_params),
			merged_params.tags.default_decision,
			merged_params.attributes.default_decision));
	}
});

module.exports = utils;
