var Sealious = require("sealious");
var Promise = require("bluebird");
var utils = require("../../lib/base-chips/field_type.html.js")
var naugthyStrings = require("blns");

module.exports = {
	test_init: function() {},
	test_start: function() {
		var field_type_html = Sealious.ChipManager.get_chip("field_type", "html");

		describe('FieldType.Html', function() {
			it("should return the description of the field type", function(done) {
				if (typeof field_type_html.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should reject when trying to validate a naugthy string which is not a string", function(done) {
				field_type_html.is_proper_value(new Sealious.Context(), {}, a = {})
					.then(function() {
						done(new Error("But it didn't throw an error"));
					})
					.catch(function(error) {
						if (error.type === "validation")
							done();
						else
							done(error);
					})
			})
			var methods = ["is_proper_value", "decode"];
			methods.forEach(function(method_name) {
				it("shouldn't crash when trying to " + method_name + " a naugthy string", function(done) {
					var promises = naugthyStrings.map(function(string) {
						return field_type_html[method_name](new Sealious.Context(), {
							tags: {
								default_decision: "remove",
								keep: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
									'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
									'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
								],
								remove: []
							},
							attributes: {
								default_decision: "remove",
								keep: ['href', 'name', 'target'],
								remove: ['src']
							}
						}, string)
					});
					Promise.all(promises)
						.then(function() {
							done();
						}).catch(function(error) {
							done(error);
						})
				});
			});
			var values = {
				"<a href='\x0Ejavascript:javascript:alert(1)' id='fuzzelement1'>test</a>": "<a>test</a>",
				"<h1>test<p>test2": "<h1>test<p>test2</p></h1>",
				"h1>test<p>test2": "h1&gt;test<p>test2</p>"
			}
			for (prop in values) {
				it("should check if decode works properly given '" + prop + "'", function(done) {
					field_type_html.decode(new Sealious.Context(), {
							tags: {
								default_decision: "remove",
								keep: ['a', 'h1', 'p'],
								remove: []
							},
							attributes: {
								default_decision: "remove",
								keep: [],
								remove: []
							}
						}, prop)
						.then(function(decoded_value) {
							if (decoded_value === values[prop]) {
								done();
							} else {
								done(new Error("It didn't parse the value correctly"));
							}
						})
						.catch(function(error) {
							done(new Error("It didn't parse the value correctly"));
						})
				});
			}
			it("should remove attributes that were not explicitly declarated (in params)", function(done) {
				field_type_html.decode(new Sealious.Context(), {
						tags: {
							default_decision: "remove",
							keep: ['a'],
							remove: []
						},
						attributes: {
							default_decision: "remove",
							keep: ['id'],
							remove: []
						}
					}, "<a link='sth' id='fuzzelement1'>test</a>")
					.then(function(decoded_value) {
						if (decoded_value === "<a id='fuzzelement1'>test</a>") {
							done();
						} else {
							done(new Error("It didn't parse the value correctly"));
						}
					})
					.catch(function(error) {
						done(new Error("It didn't parse the value correctly"));
					})
			});
			it("should strip tags that were not explicitly allowed (in params)", function(done) {
				field_type_html.decode(new Sealious.Context(), {
						tags: {
							default_decision: "remove",
							keep: ['a', 'p', 'h2', 'h3'],
							remove: []
						},
						attributes: {
							default_decision: "remove",
							keep: [],
							remove: []
						}
					}, "<a>test</a><h4>not found</h4><h2>here is</h2>")
					.then(function(decoded_value) {
						if (decoded_value === "<a>test</a>not found<h2>here is</h2>") {
							done();
						} else {
							done(new Error("It didn't parse the value correctly"));
						}
					})
					.catch(function(error) {
						done(new Error("It didn't parse the value correctly"));
					})
			});
			it("shouldn't strip tags that were not explicitly allowed (in params)", function(done) {
				field_type_html.decode(new Sealious.Context(), {
						tags: {
							default_decision: "keep",
							keep: ['a', 'p', 'h3'],
							remove: ['h4']
						},
						attributes: {
							default_decision: "remove",
							keep: [],
							remove: ['href']
						}
					}, "<a>test</a><h4>not found</h4><h2>here is</h2>")
					.then(function(decoded_value) {
						if (decoded_value === "<a>test</a>not found<h2>here is</h2>") {
							done();
						} else {
							done(new Error("It didn't parse the value correctly"));
						}
					})
					.catch(function(error) {
						done(new Error("It didn't parse the value correctly"));
					})
			});
			it("utils.is_allowed function should return correct decision", function(done) {
				var result = utils.is_allowed(new Set(['h1', 'h2']), new Set(['h1']), 'something', 'h1');
				if (result === true || result === false) {
					done()
				} else {
					done(new Error("The returned value isn't true (keep) or false (remove)"));
				}
			})
			it("utils.is_allowed function should return default_decision", function(done) {
				var result = utils.is_allowed(new Set(['h1', 'h2']), new Set(['h1']), 'keep', 'h3');
				if (result === true) {
					done()
				} else {
					done(new Error("The returned value wasn't default_decision (keep)"));
				}
			})
			it("utils.is_allowed function should return default_decision", function(done) {
				var result = utils.is_allowed(new Set(['h1', 'h2']), new Set(['h1']), 'keep', 'h1');
				if (result === true) {
					done()
				} else {
					done(new Error("The returned value wasn't default_decision (keep)"));
				}
			})
			it("utils.is_allowed function should return decision for defined element", function(done) {
				var result = utils.is_allowed(new Set(['h2', 'p', 'a']), new Set(['h1', 'h3']), 'keep', 'p');
				if (result === true) {
					done()
				} else {
					done(new Error("The returned value isn't true (keep)"));
				}
			})
			it("utils.is_allowed function should return decision for defined element", function(done) {
				var result = utils.is_allowed(new Set(['h2', 'a']), new Set(['p', 'h1', 'h3']), 'remove', 'p');
				if (result === false) {
					done()
				} else {
					done(new Error("The returned value isn't false (remove)"));
				}
			})
			it("utils.is_allowed function should return decision for defined element", function(done) {
				var result = utils.is_allowed(new Set(['h2', 'a']), new Set(['p', 'h1', 'h3']), 'keep', 'p');
				if (result === false) {
					done()
				} else {
					done(new Error("The returned value isn't true (keep)"));
				}
			})
			it('utils.create_sets_from_params function should return correctly object with sets', function(done) {
				var params = {
					tags: {
						default_decision: "keep",
						keep: ['a', 'p', 'h3'],
						remove: ['h4']
					},
					attributes: {
						default_decision: "remove",
						keep: [],
						remove: ['href']
					}
				}
				var is_correct = 0;
				var result = utils.create_sets_from_params(params);
				for (prop in result.tags) {
					if (result.tags.hasOwnProperty(prop) && result.tags[prop] instanceof Set && params.tags[prop] instanceof Array) {
						is_correct += 1;
					}
				}
				for (prop in result.attributes) {
					if (result.attributes.hasOwnProperty(prop) && result.attributes[prop] instanceof Set && params.attributes[prop] instanceof Array) {
						is_correct += 1;
					}
				}
				if (is_correct === 4) {
					done();
				} else {
					done(new Error("Some returned property isn't set"))
				}
			})
			it('utils.create_sets_from_params function should return correctly object with sets', function(done) {
				var result = utils.create_sets_from_params({ tags: { keep: ['h1', 'h2'], remove: [] } });
				if (result.attributes['keep'] === undefined) {
					done()
				} else {
					done(new Error('The returned object have non-existent property'))
				}
			})
			it('utils.create_sets_from_params function should return correctly object without sets', function(done) {
				var result = utils.create_sets_from_params({});
				if (Object.keys(result.tags).length === 0 && Object.keys(result.attributes).length === 0) {
					done();
				} else {
					done(new Error("The returned object haven't empty properties"))
				}
			})
			it('utils.default_values checks is object and have right objects', function(done) {
				var dv = utils.default_values;
				if (dv instanceof Object && dv.tags instanceof Object && dv.attributes instanceof Object) {
					done()
				} else {
					done(new Error("The default_values property isn't object"))
				}
			})
			it('utils.default_values checks is default_values have right properties', function(done) {
				var dv = utils.default_values;
				if (dv.tags.default_decision === "remove" && dv.attributes.default_decision === "remove") {
					done()
				} else {
					done(new Error("The default_values default decisions properties haven't 'remove' value"))
				}
			})
			it('utils.default_values checks is default_values have right properties', function(done) {
				var dv = utils.default_values;
				if (dv.tags.keep instanceof Array &&
					dv.tags.remove instanceof Array &&
					dv.attributes.keep instanceof Array &&
					dv.attributes.remove instanceof Array) {
					done();
				} else {
					done(new Error("The keep & remove properties aren't arrays"))
				}
			})
			it('utils.merge_params function should return merged params object', function(done) {
				var result = utils.merge_params({
					"attributes": {
						"default_decision": "remossve",
						"keep": ["style", "width"],
						"remove": []
					}
				});
				if (result.attributes['default_decision'] === "remove" || result.attributes['default_decision'] === "keep") {
					done();
				} else {
					done(new Error("The returned object have impermissible value for default_decision property: " + result.attributes['default_decision']))
				}
			})
			it('utils.merge_params function should return merged params object', function(done) {
				var result = utils.merge_params({
					"attributes": {
						"default_decision": "remove",
						"keep": ["style", "width"],
						"remove": []
					}
				});
				var t = result.tags;
				if (t['default_decision'] !== undefined && t['keep'] !== undefined && t['remove'] !== undefined) {
					done();
				} else {
					done(new Error("The returned object shouldn't have default values for tags"))
				}
			})
			it('utils.merge_params function should return merged params object', function(done) {
				var result = utils.merge_params({
					"tags": {
						"default_decision": "keep",
						"keep": [],
						"remove": ['script', 'noscript']
					}
				});
				var a = result.attributes;
				if (a['default_decision'] !== undefined && a['keep'] !== undefined && a['remove'] !== undefined) {
					done();
				} else {
					done(new Error("The returned object shouldn't have default values for attributes"))
				}
			})
			it('utils.merge_params function should return merged params object', function(done) {
				var result = utils.merge_params({ "tags": { "default_decision": "kee" } });
				var t = result.tags;
				if (t['default_decision'] !== undefined && t['default_decision'] === "remove") {
					done();
				} else {
					done(new Error("The returned object have impermissible value for tags.default_decision property"))
				}
			})
			it('utils.merge_params function should return merged params object', function(done) {
				var result = utils.merge_params({
					"tags": {
						"default_decision": "keep",
						"keep": [],
						"remove": ['script', 'noscript']
					}
				});
				var t = result.tags;
				if (t['keep'] !== undefined && t['keep'].length === 0) {
					done();
				} else {
					done(new Error("The returned object tags.keep array should be empty"))
				}
			})
		})
	}
};
