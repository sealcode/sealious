const PromiseIterateGenerator = function(generator, fn){
	const current = generator.next();
	if(current === null){
		return Promise.resolve();
	} else {
		return fn(current).then(function(){
			return PromiseIterateGenerator(generator, fn);
		});
	}
};

module.exports = PromiseIterateGenerator;
