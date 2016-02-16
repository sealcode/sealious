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

			var methods = ["is_proper_value", "encode"];
			methods.forEach(function(method_name) {
				it("shouldn't crash when trying to " + method_name + " a naugthy string", function(done) {
					var promises = naugthyStrings.map(function(string) {
						return field_type_html[method_name](new Sealious.Context(), {}, string)
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
				it("should check if encode works properly given '"+prop+"'", function(done) {
					field_type_html.encode(new Sealious.Context(), {}, prop)
						.then(function(encoded_value) {
							if (encoded_value === values[prop]) {
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


			it("should remove attributes that were not explicitly allowed (in params)", function(done) {
				field_type_html.encode(new Sealious.Context(), {
						tags: ['a', 'p', 'h2', 'h3'],
						attributes: {
							a: ['id']
						}
					}, "<a link='sth' id='fuzzelement1'>test</a>")
					.then(function(encoded_value) {
						if (encoded_value === "<a id=\"fuzzelement1\">test</a>") {
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
				field_type_html.encode(new Sealious.Context(), {
						tags: ['a', 'p', 'h2', 'h3']
					}, "<a>test</a><h4>not found</h4><h2>here is</h2>")
					.then(function(encoded_value) {
						if (encoded_value === "<a>test</a>not found<h2>here is</h2>") {
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
	}
};
