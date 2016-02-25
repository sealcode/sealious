var Sealious = require("sealious");
var Promise = require("bluebird");

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
		})
		describe('FieldType.Html - utils', function() {
		})
	}
};
