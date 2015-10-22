var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		var resource_type_datetime = new Sealious.ChipTypes.ResourceType({
			name: "datetime_resource",
			fields: [
				{name: "test", type: "datetime", required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Datetime", function(){
			it("should validate the datetime field successfully", function(done) {
				ResourceManager.create(new Sealious.Context(), "datetime_resource", {test: 1})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
		})
			it("should not validate the datetime field successfully (given string)", function(done) {
				ResourceManager.create(new Sealious.Context(), "datetime_resource", {test: "silly sealy"})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			});
			it("should not validate the datetime field successfully (given float)", function(done) {
				ResourceManager.create(new Sealious.Context(), "datetime_resource", {test: 1.2})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			});
			it("should not validate the datetime field successfully (no value)", function(done) {
				ResourceManager.create(new Sealious.Context(), "datetime_resource", {})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			});
		});
	}
};