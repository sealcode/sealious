var Sealious = require("../main.js");
var Promise = require("bluebird");
var merge = require("merge");

var Chip = require("./chip.js");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
 
function FieldType(declaration){
	console.log(arguments);
	Chip.call(this, true, "field_type", declaration.name);

	this.process_declaration(declaration);
}

FieldType.prototype =  new function(){

	this.process_declaration = function(declaration){
		this.declaration = declaration;
		this.name = declaration.name;
		if(declaration.extends){
			this.parent_field_type = Sealious.ChipManager.get_chip("field_type", declaration.extends);		
		}else{
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

	this.get_method = function(method_name){
		var ret;
		if(this.declaration[method_name]){
			ret = this.declaration[method_name];
		}else{
			ret = this["_"+method_name];
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
	this._encode = function(value_in_code){
		return value_in_code;
	}

	this._encode.uses_context = false;

	//to be decorated
	this._decode = function(value_in_database, formatting_options){
		return value_in_database;
	}
	
	this._decode.uses_context = false;

	this.is_proper_value = function(context, params, new_value, old_value){
		var self = this;
		var validate_in_parent;
		if(this.declaration.extends){
			validate_in_parent = this.parent_field_type.is_proper_value(context, new_value, old_value);
		}else{
			validate_in_parent = Promise.resolve();
		}
		return validate_in_parent.then(function(){
			return new Promise(function(resolve, reject){
				self.get_method("is_proper_value")(resolve, reject, context, new_value, old_value);
			});
		});
	}

	this.decode = function(value_in_database, params, formatting_options){
		if(this.declaration.extends){
			return this.parent_field_type.decode(value_in_database, params, formatting_options);
		}else{
			return this.get_method("decode")(value_in_database, params, formatting_options);
		}
	}

	this.encode = function(value_in_code, params){
		if(this.declaration.extends){
			return this.parent_field_type.encode(value_in_code, params);
		}else{
			return this.get_method("encode")(value_in_code, params);
		}
	}
}

FieldType.test_init = function(){
	var test_field_type = new Sealious.ChipTypes.FieldType({
		name: "test_field_type"
	});
}

FieldType.test_start = function(){
	describe("FieldType", function(){
		var test_field_type = Sealious.ChipManager.get_chip("field_type", "test_field_type");

		var but_it_didnt = new Error("But it didn't");

		describe("default .is_proper_value", function(){
			it("should return a Promise that always resolves", function(done){
				var return_value = test_field_type.is_proper_value("any_value")
				.then(function(){
					done();
				}).catch(function(error){
					done("But it rejected.");
				})
			});
		})

		describe("default .is_proper_declaration", function(){
			it("should return true", function(done){
				var return_value = test_field_type.is_proper_declaration({});
				if(typeof return_value!="boolean" || return_value!=true){
					done(but_it_didnt);
				}else{
					done();
				}
			})
		});

		describe("default .encode", function(){
			it("should resolve what it's been fed", function(done){
				var what_its_been_fed = "dogfood";
				test_field_type.encode(what_its_been_fed)
				.then(function(encoded){
					if(encoded==what_its_been_fed){
						done();
					}else{
						done("But it returnet something else");
					}
				}).catch(function(error){
					console.error(error);
					done("but it threw an error");
				})
			});
		});

		describe("default .decode", function(){
			it("should resolve with what it's been fed", function(done){
				var what_its_been_fed = "dogfood";
				test_field_type.decode(what_its_been_fed)
				.then(function(decoded){
					if(decoded==what_its_been_fed){
						done();
					}else{
						done("But it returnet something else");
					}
				}).catch(function(error){
					console.error(error);
					done("but it threw an error");
				})
			});
		});
	});
}

FieldType.type_name = "field_type";


module.exports = FieldType;