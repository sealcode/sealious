const Subject = require.main.require("lib/subject/subject.js");
const assert = require("assert");

describe("Sealious.Subject", function(){
	describe(".get_subject", function(){
		it("Properly traverses subject tree", function(done){

			const me = new Subject();
			me.get_child_subject = function(key){
				return null;
			}

			const my_dad = new Subject();
			my_dad.get_child_subject = function(key){
				if (key == "son"){
					return me;
				}
			}

			const my_granddad = new Subject();
			my_granddad.get_child_subject = function(key){
				if (key == "son"){
					return my_dad;
				}
			}

			my_granddad.get_subject(["son", "son"])
			.then(function(result){
				assert.strictEqual(result, me);
				done();
			});
		});
	});
});
