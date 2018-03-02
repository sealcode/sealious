"use strict";
function assert_no_error (promise, done) {
	promise.then(function(){
		done(new Error("It didn't reject!"));
	}).catch(function(error){
		done();
	});
}

module.exports = assert_no_error;
