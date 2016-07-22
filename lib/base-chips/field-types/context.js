const Context = require.main.require("lib/context.js");

module.exports ={
	name: "context",
	is_proper_value: function(accept, reject, context, params, value){
		if (value instanceof Context){
			accept();
		} else {
			reject("Provided value is not an instance of Sealious.Context");
		}
	}
};
