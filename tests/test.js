var Sealious = require("../lib/main.js"); //Sealious
var assert = require("assert");

Sealious.init();

// Creating resource always fails
var always_fails = new Sealious.ChipTypes.FieldType("always_fails");	
always_fails.prototype.isProperValue = function(value_in_code){
	return new Promise(function(resolve, reject){
		reject();
	})
}
var always_fails_resource = new Sealious.ChipTypes.ResourceType("always_fails_resource");	
always_fails_resource.add_fields([
	{name: "#fail", type: "always_fails"},
	]);


//Creating resource never fails
var never_fails = new Sealious.ChipTypes.FieldType("never_fails");
never_fails.prototype.isProperValue = function(value_in_code){
	return new Promise(function(resolve,reject){
		resolve();
	})
}
var never_fails_resource = new Sealious.ChipTypes.ResourceType("never_fails_resource");
never_fails_resource.add_fields([
	{name: "#success", type: "never_fails"},
	])



describe("Sealious", function(){
	Sealious.start().then(function(){

	    it('should not create a new resource', function(done){
			Sealious.Dispatcher.resources.create({}, "always_fails_resource", { "#fail": "tak" })
			.then(function(){
				done(new Error("It didn't throw an error!"));
			}).catch(function(error){
				done();
			});
	 	});
	 	it('should create a new resource', function(done){
			Sealious.Dispatcher.resources.create({}, "never_fails_resource", { "#success": "tak" })
			.then(function(result){
				done();
			}).catch(function(error){
				done(error);
			});
	 	});
	 	it('should get data about the resource', function(done){
			Sealious.Dispatcher.resources.create({}, "never_fails_resource", { "#success": "tak" })
			.then(function(result){
				Sealious.Dispatcher.resources.get_by_id({}, result.id)
				.then(function(resource){
					done();	
				}).catch(function(error){
					done(new Error(error));
				})
			}).catch(function(error){
				done(new Error("It threw an error!"));
			});
	 	});
	 	it('should delete the resource', function(done){
			Sealious.Dispatcher.resources.create({}, "never_fails_resource", { "#success": "tak" })
			.then(function(result){
				Sealious.Dispatcher.resources.delete({}, "never_fails_resource", result.id)
				.then(function(resource){
					done();	
				}).catch(function(error){
					done(new Error(error));
				})
			}).catch(function(error){
				done(new Error("It threw an error!"));
			});
	 	});
	 	it('should update the resource', function(done){
			Sealious.Dispatcher.resources.create({}, "never_fails_resource", { "#success": "tak" })
			.then(function(result){
				Sealious.Dispatcher.resources.update_resource({}, "never_fails_resource", result.id, {"#success" : "tak2"})
				.then(function(resource){
					done();	
				}).catch(function(error){
					done(new Error(error));
				})
			}).catch(function(error){
				done(error);
			});
	 	});
	 	it('should list resources by type', function(done){
			Sealious.Dispatcher.resources.list_by_type({}, "never_fails_resource")
			.then(function(result){
				done();
			}).catch(function(error){
				done(new Error("It threw an error!"));
			});
	 	});
	 	it('should get resource type signature (schema)', function(done){
			Sealious.Dispatcher.resources.get_resource_type_signature({}, "never_fails_resource")
			.then(function(result){
				done();
			}).catch(function(error){
				done(new Error("It threw an error!"));
			});
	 	});


	 	run(); //!!important	
	})
})
