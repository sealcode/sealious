var Sealious = require("sealious");

var assert_no_error = require("../util/assert-no-error.js");

module.exports = {
	test_init: function(){
		new Sealious.ChipTypes.FieldType({
			name: "test_field_type"
		});

		new Sealious.ChipTypes.FieldType({
			name: "rejecting_father",
			is_proper_value: function(accept, reject){
				reject("Rejected by the father");
			},
			encode: function(){
				return "from_father"
			},
			decode: function(){
				return "from_father"
			},
			get_description: function(){
				return "from_father"
			}
		})

		new Sealious.ChipTypes.FieldType({
			name: "accepting_son",
			extends: "rejecting_father",
			is_proper_value: function(accept){
				accept();
			},
			encode: function(){
				return "from_son";
			},
			decode: function(){
				return "from_son";
			},
			get_description: function(){
				return "from_son"
			}
		})

		new Sealious.ChipTypes.FieldType({
			name: "hesitant_daughter",
			extends: "rejecting_father"
		})
	},

	test_start: function(){
		describe("FieldType", function(){
			var test_field_type = Sealious.ChipManager.get_chip("field_type", "test_field_type");

			var but_it_didnt = new Error("But it didn't");

			describe("default methods", function(){
				describe("when not overwritten", function(){

					it("should use default .is_proper_value", function(done){
						var result = test_field_type.is_proper_value("any_value");
						assert_no_error(result, done);
					})

					it("should use default .is_proper_declaration", function(done){
						var return_value = test_field_type.is_proper_declaration({});
						if (typeof return_value != "boolean" || return_value != true) {
							done(but_it_didnt);
						} else {
							done();
						}
					});

					it("should use default .encode", function(done){
						var what_its_been_fed = "dogfood";
						test_field_type.encode(new Sealious.Context(), {}, what_its_been_fed)
						.then(function(encoded){
							if (encoded == what_its_been_fed) {
								done();
							} else {
								done(new Error("But it returned something else"));
							}
						}).catch(done)
					});

					it("should use default .decode", function(done){
						var what_its_been_fed = "dogfood";
						test_field_type.decode(new Sealious.Context(), {}, what_its_been_fed)
						.then(function(decoded){
							if (decoded == what_its_been_fed) {
								done();
							} else {
								done(new Error("But it returned something else"));
							}
						}).catch(done)
					});

					it("should use default .get_description", function(done){
						test_field_type.get_description()
						.then(function(description){
							if (description.summary == "test_field_type") {
								done();
							} else {
								done(new Error("But it didn't"));
							}
						});
					})
				})


				describe("when overwritten", function(){

					var rejecting_father = Sealious.ChipManager.get_chip("field_type", "rejecting_father");

					it("should use the custom .is_proper_value method", function(done){
						rejecting_father.is_proper_value("any_value")
						.then(function(){
							done(new Error("But it didn't (should have been rejected in this case, but wasn't)"));
						}).catch(function(error){
							done();
						});
					});

					it("should use the custom .encode method", function(done){
						rejecting_father.encode(new Sealious.Context(), {}, "anything")
						.then(function(encoded_value){
							if (encoded_value == "from_father") {
								done();
							} else {
								done(new Error("But it didn't"));
							}
						})
					});

					it("should use the custom .decode method", function(done){
						rejecting_father.decode("anything")
						.then(function(decoded_value){
							if (decoded_value == "from_father") {
								done();
							} else {
								done(new Error("But it didn't"));
							}
						})
					});

					it("should use the custom .get_description method", function(done){
						rejecting_father.get_description()
						.then(function(description){
							if (description.summary == "from_father") {
								done();
							} else {
								done(new Error("But it didn't"));
							}
						});
					});
				})
			})



			describe("inheritance", function(){

				var accepting_son = Sealious.ChipManager.get_chip("field_type", "accepting_son");
				var hesitant_daughter = Sealious.ChipManager.get_chip("field_type", "hesitant_daughter");

				it("should inherit is_proper_value", function(done){
					accepting_son.is_proper_value(new Sealious.Context(), {}, "any")
					.then(function(){
						done(new Error("accepting_son accepted the value, which should have been rejected by his rejecting_father"));
					}).catch(function(error){
						if (error.message == "Rejected by the father") {
							done();
						} else {
							done(new Error("But it didn't - it returned `" + error + "but should have returned \"Rejected by the father\""));
						}
					})
				});

				it("should use parent's is_proper_value when not having its own", function(done){
					hesitant_daughter.is_proper_value(new Sealious.Context(), {}, "any")
					.then(function(){
						done(new Error("But it accepted value, which should have been rejected by rejecting_father"));
					}).catch(function(error){
						if (error.message == "Rejected by the father") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					});
				});

				it("should use child's .encode method when a child has it's own encode method", function(done){
					accepting_son.encode(new Sealious.Context(), {}, "anything")
					.then(function(encoded_value){
						if (encoded_value == "from_son") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					});
				});

				it("should use parent's .encode method when a child does not have it's own", function(done){
					hesitant_daughter.encode(new Sealious.Context(), {}, "anything")
					.then(function(encoded_value){
						if (encoded_value == "from_father") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					})
				});

				it("should use child's .decode method when a child has it's own decode method", function(done){
					accepting_son.decode("anything")
					.then(function(decoded_value){
						if (decoded_value == "from_son") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					});
				});

				it("should use parent's .decode method when a child does not have it's own", function(done){
					hesitant_daughter.decode("anything")
					.then(function(decoded_value){
						if (decoded_value == "from_father") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					})
				});

				it("should use child's .get_description method when a child has it's own .get_description method", function(done){
					accepting_son.get_description()
					.then(function(description){
						if (description.summary == "from_son") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					});
				});

				it("should use parent's .get_description method when a child does not have it's own", function(done){
					hesitant_daughter.get_description()
					.then(function(description){
						if (description.summary == "from_father") {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					})
				});


			});


		});
	}
}

