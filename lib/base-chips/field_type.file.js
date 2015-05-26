var Promise = require("bluebird");

var FieldFileType = new Sealious.ChipTypes.FieldType("file");

FieldFileType.prototype.handles_large_data = true;

FieldFileType.prototype.isProperValue = function(value){
	if((value instanceof Sealious.File) || (value.filename!==undefined && value.data instanceof Buffer)){
		return Promise.resolve();
	}else{
		var type;
		if(value instanceof Array){
			type = "<Array>. If you want to upload multiple files, use array field types.";
		}else{
			type = typeof data;
		}
		return Promise.reject("Wrong file data format. Shoudl be <Buffer>, but received " + type);
	}
}

FieldFileType.prototype.encode = function(value_in_code){
	return Sealious.Dispatcher.files.save_file(value_in_code);
}


FieldFileType.prototype.decode = function(context, value_in_database){
	return Promise.resolve(new Sealious.File.Reference(value_in_database.id, value_in_database.filename));
}

FieldFileType.prototype.decode.uses_context = true;