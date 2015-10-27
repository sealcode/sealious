var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		var resource_type_text_without_max_length = new Sealious.ChipTypes.ResourceType({
			name: "text_resource_without_max_length",
			fields: [
				{name: "test", type: "text", required: true}
			]
		});

		var resource_type_text_with_max_length = new Sealious.ChipTypes.ResourceType({
			name: "text_resource_with_max_length",
			fields: [
				{name: "test", type: "text", params: {max_length: 9}, required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Text", function() {
			it("should validate the text field successfully (without max_length param, given string)", function(done) {
				ResourceManager.create(new Sealious.Context(), "text_resource_without_max_length", {test: "test string"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			});
			it("should validate the text field successfully (without max_length param, given integer)", function(done) {
				ResourceManager.create(new Sealious.Context(), "text_resource_without_max_length", {test: 123456789})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			});
			it("should validate the text field successfully (with max_length param, given string)", function(done) {
				ResourceManager.create(new Sealious.Context(), "text_resource_with_max_length", {test: "ok string"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			});
			it("should validate the text field successfully (with max_length param, given integer)", function(done) {
				ResourceManager.create(new Sealious.Context(), "text_resource_with_max_length", {test: 1})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			});
			it("should not validate the text field successfully (with max_length param)", function(done) {
				ResourceManager.create(new Sealious.Context(), "text_resource_with_max_length", {test: "too long string"})
				.then(function(ok){
					done(new Error("...but it did"));
				})
				.catch(function(error){
					if (error.type == "validation")
						done();
					else
						done(new Error(error));
				})
			})
		})
	}
};