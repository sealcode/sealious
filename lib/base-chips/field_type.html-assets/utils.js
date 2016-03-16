var htmlparser = require('htmlparser2');
var merge = require('merge');

var utils = {
	is_allowed: function(set_keep, set_remove, default_decision, element) {
		if (default_decision === "keep") default_decision = true;
		else default_decision = false;

		if (!set_keep.has(element) && !set_remove.has(element) || set_keep.has(element) && set_remove.has(element)) {
			return default_decision;
		} else if (set_keep.has(element) && !set_remove.has(element)) {
			return true;
		} else if (!set_keep.has(element) && set_remove.has(element)) {
			return false;
		}
	},
	create_sets_from_params: function(params) {
		var params_sets = { tags: {}, attributes: {}, tag_content: {} }
		if (params.tags !== undefined) {
			params_sets.tags.keep = new Set(params.tags.keep);
			params_sets.tags.remove = new Set(params.tags.remove);
		}
		if (params.attributes !== undefined) {
			params_sets.attributes.keep = new Set(params.attributes.keep);
			params_sets.attributes.remove = new Set(params.attributes.remove);
		}
		if (params.tag_content !== undefined) {
			params_sets.tag_content.keep = new Set(params.tag_content.keep);
			params_sets.tag_content.remove = new Set(params.tag_content.remove);
		}
		return params_sets;
	},
	parse: function(input, sets, default_decision_tags, default_decision_attributes, default_decision_tag_content) {
		var output = "";
		var tags_stack = [];
		console.log(input)
		var parser = new htmlparser.Parser({
			onopentagname: function(name) {
				tags_stack.push(name);
			},
			onopentag: function(name, attribs) {
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

			ontext: function(text) {
				var store_content = true;
				for (var i = tags_stack.length - 1; i >= 0; i--) {
					if (utils.is_allowed(sets.tag_content.keep, sets.tag_content.remove, default_decision_tag_content, i) !== true) {
						store_content = false;
						break;
					}
				};
				if (store_content) output += text;
				
			},

			onclosetag: function(tagname) {
				tags_stack.pop();
				var decision = utils.is_allowed(sets.tags.keep, sets.tags.remove, default_decision_tags, tagname);
				if (decision !== false) output += "</" + tagname + ">";
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
	merge_params: function(params) {
		for (key in ['tags', 'attributes', 'tag_content']) {
			if (params !== undefined && params[key] !== undefined) {
				var a = params[key];
				if (a.default_decision !== "keep" && a.default_decision !== "remove" || a.default_decision === undefined) {
					params[key]['default_decision'] = "remove";
				}
			}
		}
		var merged_params = merge.recursive(true, utils.default_values, params);
		return merged_params;
	}
}

module.exports = utils;
