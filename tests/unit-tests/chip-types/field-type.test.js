"use strict";
const locreq = require("locreq")(__dirname);
const FieldType = locreq("lib/chip-types/field-type.js");
const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Context = locreq("lib/context.js");
const assert_no_error = require("../../util/assert-no-error.js");
const assert = require("assert");

new FieldType({
	name: "test_field_type"
});

new FieldType({
	name: "rejecting_father",
	is_proper_value: function(accept, reject){
		reject("Rejected by the father");
	},
	encode: function(){
		return "from_father";
	},
	decode: function(){
		return "from_father";
	},
	get_description: function(){
		return "from_father";
	}
});

new FieldType({
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
});

new FieldType({
	name: "hesitant_daughter",
	extends: "rejecting_father"
});

describe("FieldType", function(){
	const test_field_type = ChipManager.get_chip("field_type", "test_field_type");
	const but_it_didnt = new Error("But it didn't");

	describe("default methods", function(){
		describe("when not overwritten", function(){
			it("should use default .is_proper_value", function(done){
				const result = test_field_type.is_proper_value("any_value");
				assert_no_error(result, done);
			});
			// it("should use default .is_proper_declaration", function(){
			// 	var return_value = test_field_type.is_proper_declaration({});
			// 	assert.strictEqual(typeof return_value, "boolean");
			// 	assert.strictEqual(return_value, true);
			// });
			it("should use default .encode", function(done){
				test_field_type.encode(new Context(), {}, "dogfood")
				.then(function(encoded){
					assert.strictEqual(encoded, "dogfood");
					done();
				}).catch(done);
			});
			it("should use default .decode", function(){
				const decoded = test_field_type.decode(new Context(), {}, "dogfood")
				assert.strictEqual(decoded, "dogfood");
			});
			it("should use default .get_description", function(){
				const description = test_field_type.get_description()
				assert.strictEqual(description.summary, "test_field_type");
			});
		});
		describe("when overwritten", function(){
			const rejecting_father = ChipManager.get_chip("field_type", "rejecting_father");

			it("should use the custom .is_proper_value method", function(done){
				rejecting_father.is_proper_value("any_value")
				.then(function(){
					done(new Error("But it didn't (should have been rejected in this case, but wasn't)"));
				}).catch(function(error){
					done();
				});
			});
			it("should use the custom .encode method", function(done){
				rejecting_father.encode(new Context(), {}, "anything")
				.then(function(encoded_value){
					assert.strictEqual(encoded_value, "from_father");
					done();
				}).catch(done);
			});
			it("should use the custom .decode method", function(done){
				rejecting_father.decode("anything")
				.then(function(decoded_value){
					assert.strictEqual(decoded_value, "from_father");
					done();
				}).catch(done);
			});
			it("should use the custom .get_description method", function(done){
				rejecting_father.get_description()
				.then(function(description){
					assert.strictEqual(description, "from_father");
					done();
				}).catch(done);
			});
		});
	});

	describe("inheritance", function(){
		const accepting_son = ChipManager.get_chip("field_type", "accepting_son");
		const hesitant_daughter = ChipManager.get_chip("field_type", "hesitant_daughter");

		// it("should inherit is_proper_value", function(done){
		// 	accepting_son.is_proper_value(new Context(), {}, "any")
		// 	.then(function(){
		// 		done(new Error("accepting_son accepted the value, which should have been rejected by his rejecting_father"));
		// 	}).catch(function(error){
		// 		assert.strictEqual(error.message, "Rejected by the father");
		// 		done();
		// 	})
		// });
		it("should use parent's is_proper_value when not having its own", function(done){
			hesitant_daughter.is_proper_value(new Context(), {}, "any")
			.then(function(){
				done(new Error("But it accepted value, which should have been rejected by rejecting_father"));
			}).catch(function(error){
				assert.strictEqual(error.message, "Rejected by the father");
				done();
			});
		});
		it("should use child's .encode method when a child has it's own encode method", function(done){
			accepting_son.encode(new Context(), {}, "anything")
			.then(function(encoded_value){
				assert.strictEqual(encoded_value, "from_son");
				done();
			}).catch(done);
		});
		it("should use parent's .encode method when a child does not have it's own", function(done){
			hesitant_daughter.encode(new Context(), {}, "anything")
			.then(function(encoded_value){
				assert.strictEqual(encoded_value, "from_father");
				done();
			}).catch(done);
		});
		it("should use child's .decode method when a child has it's own decode method", function(done){
			accepting_son.decode("anything")
			.then(function(decoded_value){
				assert.strictEqual(decoded_value, "from_son");
				done();
			}).catch(done);
		});
		it("should use parent's .decode method when a child does not have it's own", function(done){
			hesitant_daughter.decode("anything")
			.then(function(decoded_value){
				assert.strictEqual(decoded_value, "from_father");
				done();
			}).catch(done);
		});
		it("should use child's .get_description method when a child has it's own .get_description method", function(done){
			accepting_son.get_description()
			.then(function(description){
				assert.strictEqual(description, "from_son");
				done();
			}).catch(done);
		});
		it("should use parent's .get_description method when a child does not have it's own", function(done){
			hesitant_daughter.get_description()
			.then(function(description){
				assert.strictEqual(description, "from_father");
				done();
			}).catch(done);
		});
	});
});
