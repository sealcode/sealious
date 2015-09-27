var Sealious = require("../main.js");
var Promise = require("bluebird");
var merge = require("merge");

var Chip = require("./chip.js");

var FieldTypeDescription = require("../data-structures/field-type-description.js");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */

function FieldType (declaration) {
	Chip.call(this, true, "field_type", declaration.name);

	this.old_value_sensitive_methods = declaration.old_value_sensitive_methods || false;

	this.process_declaration(declaration);
}

FieldType.prototype = new function(){

	this.process_declaration = function(declaration){
		this.declaration = declaration;
		this.name = declaration.name;

		if (declaration.extends) {
			this.parent_field_type = Sealious.ChipManager.get_chip("field_type", declaration.extends);
		} else {
			this.parent_field_type = null;
		}

		// var method_names = ["is_proper_value", "valudate_declaration", "encode", "decode", ""];

		// method_names.forEach(function(method_name){
		// 	if(declaration[method_name]){
		// 		this[method_name] = declaration[method_name];
		// 	}else{
		// 		this[method_name] = this["_"+method_name];
		// 	}
		// });
	}

	this.is_old_value_sensitive = function(method_name){
		if (method_name == undefined) {
			if (typeof this.old_value_sensitive_methods == "boolean") {
				return this.old_value_sensitive_methods;
			} else {
				for (var i in this.old_value_sensitive_methods) {
					if (this.old_value_sensitive_methods[i]) {
						return true;
					}
				}
				return false;
			}
		} else {
			if (typeof this.old_value_sensitive_methods == "boolean") {
				return this.old_value_sensitive_methods;
			} else {
				return this.old_value_sensitive_methods[method_name];
			}
		}
	}


	this.get_method = function(method_name){
		var ret;
		if (this.declaration[method_name]) {
			ret = this.declaration[method_name];
		} else {
			ret = this["_" + method_name].bind(this);
		}
		return Promise.method(ret);
	}

	/**
	 * Whether a given value can be stored in this field type instance
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	//to be decorated
	this._is_proper_value = function(accept){
		accept();
	}

	//to be decorated
	this.is_proper_declaration = function(declaration){
		return true;
	}

	//to be decorated
	this._encode = function(context, params, value_in_code){
		return value_in_code;
	}

	//to be decorated
	this._get_description = function(){
		return new FieldTypeDescription(this.name);
	}

	this._encode.uses_context = false;

	//to be decorated
	this._decode = function(context, param, value_in_database){
		return value_in_database;
	}

	this._decode.uses_context = false;

	this.is_proper_value = function(context, params, new_value, old_value){
		var self = this;
		var validate_in_parent;
		if (this.declaration.extends) {
			validate_in_parent = this.parent_field_type.is_proper_value(context, params, new_value, old_value);
		} else {
			validate_in_parent = Promise.resolve();
		}
		return validate_in_parent.then(function(){
			return new Promise(function(resolve, reject){
				var new_reject = function(error_message){
					reject(new Sealious.Errors.ValidationError(error_message));
				}
				self.get_method("is_proper_value")(resolve, new_reject, context, params, new_value, old_value);
			});
		});
	}

	/**
	 * If a field-type has defined .decode method, use it. Otherwise use it's parent's or the default one
	 **/
	this.decode = function(context, params, value_in_database){
		if (this.declaration.extends && this.declaration.decode == undefined) {
			return this.parent_field_type.decode(context, params, value_in_database);
		} else {
			return this.get_method("decode")(context, params, value_in_database);
		}
	}

	/**
	 * If a field-type has defined .decode method, use it. Otherwise use it's parent's or the default one
	 **/
	this.encode = function(context, params, value_in_code){
		if (this.declaration.extends && this.declaration.encode == undefined) {
			return this.parent_field_type.encode(context, params, value_in_code);
		} else {
			return this.get_method("encode")(context, params, value_in_code);
		}
	}

	this.get_description = function(params){
		if (this.declaration.extends && this.declaration.get_description == undefined) {
			return this.parent_field_type.get_description(params)
		} else {
			return this.get_method("get_description")(params)
				.then(function(description){
					if (typeof description == "string") {
						return Promise.resolve(new FieldTypeDescription(description));
					} else {
						return Promise.resolve(description);
					}
				});
		}
	}
}

FieldType.test_init = function(){
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
		}
	})

	new Sealious.ChipTypes.FieldType({
		name: "hesitant_daughter",
		extends: "rejecting_father"
	})
}

FieldType.test_start = function(){
	describe("FieldType", function(){
		var test_field_type = Sealious.ChipManager.get_chip("field_type", "test_field_type");

		var but_it_didnt = new Error("But it didn't");

		describe("default methods", function(){
			describe("when not overwritten", function(){
				it("should use default .is_proper_value", function(done){
					var return_value = test_field_type.is_proper_value("any_value")
						.then(function(){
							done();
						}).catch(function(error){
							done(new Error("But it rejected."));
						})
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
								done(new Error("But it returnet something else"));
							}
						}).catch(function(error){
							console.error(error);
							done(new Error("but it threw an error"));
						})
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
						}).catch(function(error){
							console.error(error);
							done(new Error("but it threw an error"));
						})
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
						}).catch(function(){
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

		});

		//sprawdzanie get_description
	});
}

FieldType.type_name = "field_type";


module.exports = FieldType;