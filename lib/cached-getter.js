var Promise = require("bluebird");

function CachedGetter (getter_fn) {
	var cached_value;
	var already_loaded = false;
	return function(){
		if (already_loaded){
			return Promise.resolve(cached_value);
		} else {
			return Promise.method(getter_fn)()
			.then(function(value){
				cached_value = value;
				already_loaded = true;
				return value;
			})
		}
	}
}

module.exports = CachedGetter;