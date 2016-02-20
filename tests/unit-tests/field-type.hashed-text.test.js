var Sealious = require("sealious");
var crypto = require('crypto');

var assert_no_error = require("../util/assert-no-error.js");

module.exports = {
	test_start: function(){
		var field_type_hashed_text = Sealious.ChipManager.get_chip("field_type", "hashed-text");
		describe("FieldType.HashedText", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_hashed_text.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});

			it("accepts given password ('pas1sw24rd1')", function(done){
				var result = field_type_hashed_text.is_proper_value(new Sealious.Context(), {}, "pas1sw24rd1");
				assert_no_error(result, done);
			});

			it("accepts given password ('pas1sw24rd1')", function(done){
				var result = field_type_hashed_text.is_proper_value(new Sealious.Context(), {digits: 3}, "pas1sw24rd1");
				assert_no_error(result, done);
			});

			it("accepts given password ('PAs1sW24rD1')", function(done){
				var result = field_type_hashed_text.is_proper_value(new Sealious.Context(), {capitals: 3}, "PAs1sW24rD1");
				assert_no_error(result, done);
			});

			it("accepts given password ('PaSw0rd23')", function(done){
				var result = field_type_hashed_text.is_proper_value(new Sealious.Context(), {capitals: 2, digits: 3}, "PaSw0rd23");
				assert_no_error(result, done);
			});

			it("resolved with a hash (algorithm: 'md5', salt: '')", function(done){
				field_type_hashed_text.encode(new Sealious.Context(), {}, "test")
				.then(function(result){
					crypto.pbkdf2("test", "", 4096, 64, "md5", function(err, key){
						if (err) done(new Error(err));

						key.toString('hex') === result ? done() : done(new Error("Wrong hash"))
					});
				})
				.catch(function(error){
					done(new Error(error))
				})
			})
		})
	}
}
