var Promise = require("bluebird");

field_type_int = new Sealious.ChipTypes.FieldType("int");

field_type_int.prototype.encode = function(value_in_code){
	return Promise.resolve(parseInt(value_in_code));	
}