var Sealious = require("sealious");
var Promise = require("bluebird");

var FieldFileType = new Sealious.ChipTypes.FieldType({
	name: "file",
	handles_large_data: true,
	is_proper_value: function(accept, reject, context, params, value){
		if (value === undefined) {
			return undefined;
		}
		if ((value instanceof Sealious.File) || (value.filename !== undefined && value.data instanceof Buffer)) {
			accept();
		} else {
			var type;
			if (value instanceof Array) {
				type = "<Array>. If you want to upload multiple files, use array field types.";
			} else {
				type = typeof data;
			}
			reject("Wrong file data format. Should be Sealious.File, but received " + type);
		}
	},
	encode: function(context, params, value_in_code){
		// it doesn't check what the value_in_code really is
		if (value_in_code) {
			return Sealious.FileManager.save_file(value_in_code);
		} else {
			return null;
		}
	},
	decode: function(context, params, value_in_database){
		if (value_in_database) {
			return Promise.resolve(new Sealious.File.Reference(value_in_database.id, value_in_database.filename));
		} else {
			if (params.no_file_value) {
				return params.no_file_value;
			} else {
				return undefined;
			}
		}
	}
});