"use strict";
function assert_no_error (promise, done) {
	promise.then(function(){
		done();
	}).catch(function(error){
		console.error(error.data);
		done(error);
	});
}

module.exports = assert_no_error;
