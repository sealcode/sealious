var Sealious = require("sealious");

module.exports = new Sealious.FieldType({
	name: "reference",
	is_subject: true,
	is_proper_value: function(accept, reject, context, params, new_value){
		//if id or object (...)
	}
})
