var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var path = require('path');
var fse = require("fs-extra");
var fs = require("fs");
var ResourceRepresentation = require("../chip-types/resource-representation.js");
var Sealious = require("sealious");

/**
 * Manages files
 * @class
 */

var root_path = function(){
	var parent_tmp = module.parent;
	var parent = null;
	while (parent_tmp) {
		parent = parent_tmp;
		parent_tmp = parent_tmp.parent;
	}

	return parent.filename;
}


var FileManager = new function(upload_path){
	this.name = "files";

	if (!upload_path) {
		upload_path = "./uploaded_files/";
	}

	var upload_path_abs = path.resolve(root_path(), "../" + upload_path);

	this.save_file = function(file, upload_path){


		if (!fs.existsSync(upload_path_abs)) {
			fse.mkdirs(upload_path_abs, function(err){});
		}

		var newID = UUIDGenerator(10);


		var upload_path_with_sealious_name = upload_path_abs + "/" + newID;
		fs.writeFile(upload_path_with_sealious_name, file.data, function(err, data){
			if (err) {
				throw (err);
			}
		});

		var file_database_entry = {
			original_name: file.filename,
			creation_context: file.context,
			id: newID,
			mime_type: file.mime,
		}

		return Sealious.Dispatcher.datastore.insert("files", file_database_entry, {})
			.then(function(){
				return Promise.resolve({
					id: newID,
					filename: file.filename
				});
			})

	}

	this.diff = function(dispatcher, file){

	}

	this.get_list = function(dispatcher, owner){
		var query = {
			"body.owner": owner
		};
		Sealious.Logger.info("List for owner '" + owner + "' has been created");
		return this.find(dispatcher, query);
	}

	this.find = function(context, query){
		return Sealious.Dispatcher.datastore.find("files", query)
			.then(function(documents){
				var parsed_documents = documents.map(function(document){
					var ret = Sealious.File.from_db_entry(document);
					ret.path_on_hdd = upload_path + ret.id;
					return ret;
				});
				return Promise.resolve(parsed_documents);
			})
	}

	this.change_name = function(dispatcher, sealious_name, new_name){
		return dispatcher.datastore.update("files", {
			sealious_id: sealious_name
		}, {
			$set: {
				"body.original_name": new_name
			}
		});

	}

	this.delete = function(dispatcher, query){

	}
}


//wersjonowanie, historia dostępu, przetrzymywanie poprzednich wersji

module.exports = FileManager;