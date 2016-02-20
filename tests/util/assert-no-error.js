function assert_no_error = function(promise, done){
	promise.then(function(){
		done();
	}).catch(function(error){
		done(error);			
	})
}
