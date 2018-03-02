"use strict";
function assert_error_type (promise, error_type, done) {
	promise.then(function(){
		done(new Error("But it didn't throw any error at all!"));
	}).catch(function(error){
		console.log(error);
		if (error.type === error_type){
			done();
		} else {
			console.error(error);
			done(new Error(`But it threw an error of wrong type: should be: '${error_type}', was: '${error.type}'`));
		}
	});
}

module.exports = assert_error_type;
