const Sealious = require("sealious");
const Promise = require("bluebird");

module.exports = {
	name: "file",
	handles_large_data: true,
	is_proper_value: function(accept, reject, context, params, value){
		if (value === undefined){
			return undefined;
		}
		if (value === null
			|| value === ""
			|| (value instanceof Sealious.File)
			|| (value.filename !== undefined && value.data instanceof Buffer)
		){
			accept();
		} else {
			let type;
			if (value instanceof Array){
				type = "<Array>. If you want to upload multiple files, use array field types.";
			} else {
				type = typeof data;
			}
			reject(`Wrong file data format. Should be Sealious.File, but received ${type}`);
		}
	},
	encode: function(context, params, value_in_code){
		// it doesn't check what the value_in_code really is
		if (value_in_code){
			return Sealious.FileManager.save_file(value_in_code);
		} else {
			return null;
		}
	},
	decode: function(context, params, value_in_database){
		if (value_in_database){
			return Promise.resolve(new Sealious.File.Reference(value_in_database.id, value_in_database.filename));
		} else if (params.no_file_value){
			return params.no_file_value;
		} else {
			return undefined;
		}
	},
	format: function(context, params, decoded_value, format){
		if (format === "url"){
			return `/api/v1/uploaded-files/${decoded_value.id}/${decoded_value.filename}`;
		} else if (format === "url-with-filename"){
			if (decoded_value === undefined){
				return {
					url: params.no_file_value || "",
					filename: null,
					empty: true,
				};
			} else {
				return {
					url: `/api/v1/uploaded-files/${decoded_value.id}/${decoded_value.filename}`,
					filename: decoded_value.filename,
					empty: false,
				};
			}
		} else {
			return decoded_value;
		}
	},
};
