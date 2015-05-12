var path = require("path");

var Sealious = require("sealious");


Sealious.init("local");

var Promise = require("bluebird");

var always_fails = new Sealious.ChipTypes.FieldType("always_fails");	

always_fails.prototype.isProperValue = function(value_in_code){
	return new Promise(function(resolve, reject){
		resolve();
	})
}

var always_fails_resource = new Sealious.ChipTypes.ResourceType("always_fails_resource");	

always_fails_resource.add_fields([
	{name: "#fail", type: "always_fails"},
	])

/*
describe('Create resource', function() {
	Sealious.start().then(function(){
		console.log("ON START");
		context('that should only return false', function(){
			it('should throw an error', function(done){
				Sealious.Dispatcher.resources.create("always_fails_resource", { "#fail": "tak" })
				.then(function(){
					done(new Error("It didn't throw an error!"));
				}).catch(function(error){
					done();
				});
			});
		});
	});
});
*/

var assert = require("assert")
describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      Sealious.start().then(function(){
	      assert.equal(-1, [1,2,3].indexOf(5));
	      assert.equal(-1, [1,2,3].indexOf(0));
      });
    })
  })
})

// always_fails should always fail
