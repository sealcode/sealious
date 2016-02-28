var Subject = require("../../lib/subject/subject.js");

module.exports = {
	test_start: function(){
		describe("Sealious.Subject", function(){
			describe(".get_subject", function(){
				it("Properly traverses subject tree", function(done){

					var me = new Subject();
					me.get_child_subject = function(key){
						return null;
					}

					var my_dad = new Subject();
					my_dad.get_child_subject = function(key){
						if (key == "son"){
							return me;
						}
					}

					var my_granddad = new Subject();
					my_granddad.get_child_subject = function(key){
						if (key == "son"){
							return my_dad;
						}
					}

					my_granddad.get_subject(["son", "son"])
					.then(function(result){
						if (result === me){
							done();
						} else {
							done(new Error("It didn't navigate to a proper subject"));
						}
					})

				})
			})
		})
	}
}
