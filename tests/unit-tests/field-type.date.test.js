var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		var resource_type_date = new Sealious.ChipTypes.ResourceType({
			name: "date_resource",
			fields: [
				{name: "test", type: "date", required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Date", function(){
			it("should validate the date field correctly", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "2015-10-20"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should throw an error because of wrong month", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "2015-13-20"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					done();
					
				})
			})
			it("should throw an error because of wrong day", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "2015-13-32"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					done();
				})
			})
			it("should throw an error because of wrong date (too many days in given month)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "2015-12-32"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong date format (wrong YYYY-MM-DD order)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "20-10-2015"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong date format (dots instead of dashes)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "20.10.2015"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong date format (slashes instead of dashes)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "20/10/2015"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong value (string)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: "silly sealy"})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong value (integer)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: 1})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of wrong value (boolean)", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {test: true})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of no value", function(done){
				ResourceManager.create(new Sealious.Context(), "date_resource", {})
				.then(function(ok){
					done(new Error("but it didn't"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
		})
	}
};