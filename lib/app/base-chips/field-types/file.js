"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const File = locreq("lib/data-structures/file.js");
const rp = require("request-promise");
const url = require("url");

module.exports = function(app){
	return {
		name: "file",
		handles_large_data: true,
		is_proper_value: function(context, params, value){
			if (value === undefined){
				return undefined;
			}
			if (typeof value == "string"){
				return rp({url: value, encoding: null})
				.then(function(){
					return Promise.resolve();
				}).catch(function(){
					return Promise.reject(`There was a problem while getting the file: '${  value  }'. Is the URL correct?`);
				});
			}
			if (value === null
				|| value === ""
				|| (value instanceof File)
				|| (value.filename !== undefined && value.data instanceof Buffer)
			){
				return Promise.resolve();
			} else {
				let type;
				if (value instanceof Array){
					type = "<Array>. If you want to upload multiple files, use array field types.";
				} else {
					type = typeof data;
				}
				return Promise.reject(`Wrong file data format. Should be Sealious.File, but received ${type}`);
			}
		},
		encode: function(context, params, value_in_code){
			if(typeof value_in_code === "string"){
				return rp({url: value_in_code, encoding: null})
				.then(function(file_buffer){
					const filename = url.parse(value_in_code).pathname.split("/").pop();
					const file = new File(context, filename, file_buffer);
					return app.FileManager.save_file(file);
				});
			}
			if (value_in_code){
				return app.FileManager.save_file(value_in_code);
			} else {
				return null;
			}
		},
		decode: function(context, params, value_in_database){
			if (value_in_database){
				return Promise.resolve(new File.Reference(value_in_database.id, value_in_database.filename));
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
};
