var Sealious = require("sealious");
var fs = require('fs');

module.exports = {
	test_init: function() {},
	test_start: function() {
		var field_type_html = Sealious.ChipManager.get_chip("field_type", "html");
		var naugthyStrings;

		describe('FieldType.Html', function() {
			before(function(done) {
				naugthyStrings = require('blns');
				done();
			})
			it('testing array of naugthy strings against XSS attacks', function(done) {
				describe("FieldType.Html", function() {
					naugthyStrings.forEach(function(string) {
						it('should check if is_proper_value works correctly - given naugthy string: ' + string.substr(0, 20) + "﹍", function(done) {
							field_type_html.is_proper_value(new Sealious.Context(), {}, string)
								.then(function() {
									done();
								})
								.catch(function(error) {
									done(new Error(error));
								})
						});
					});
				});
				done();
			})
		})
	}
};
