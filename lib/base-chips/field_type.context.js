var Sealious = require("sealious");

field_type_context = new Sealious.FieldType({
	name: "context",
	is_proper_value: function(accept, reject, context, params, value){
		if(value instanceof Sealious.Context){
			accept();
		}else{
			reject("Provided value is not an instance of Sealious.Context");
		}
	}
});

module.exports = field_type_context;
