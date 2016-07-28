var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var path = require('path');
var fse = require("fs-extra");
var fs = require("fs");
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

const FileManager = function(upload_path = "./uploaded_files/") {
	this.upload_path = upload_path;
}

FileManager.prototype.name = "files";
FileManager.prototype.save_file = function(file) {
	const upload_path_abs = path.resolve(root_path(), "../" + this.upload_path);

	if (!fs.existsSync(upload_path_abs)) {
		fse.mkdirs(upload_path_abs, function(err){});
	}

	const newID = UUIDGenerator(10);

	const upload_path_with_sealious_name = upload_path_abs + "/" + newID;
	fs.writeFile(upload_path_with_sealious_name, file.data, function(err, data){
		if (err) {
			throw (err);
		}
	});

	const file_database_entry = {
		original_name: file.filename,
		creation_context: file.context,
		id: newID,
		mime_type: file.mime,
	}

	return Sealious.Datastore.insert("files", file_database_entry, {})
		.then(function(){
			return Promise.resolve({
				id: newID,
				filename: file.filename
			});
		})
}
FileManager.prototype.diff = function(dispatcher, file){

}
FileManager.prototype.get_list = function(dispatcher, owner){
	const query = {
		"body.owner": owner
	};
	Sealious.Logger.info("List for owner '" + owner + "' has been created");
	return this.find(dispatcher, query);
}
FileManager.prototype.find = function(context, query){
	return Sealious.Datastore.find("files", query)
		.then(function(documents){
			const parsed_documents = documents.map(function(document){
				const ret = Sealious.File.from_db_entry(document);
				ret.path_on_hdd = upload_path + ret.id;
				return ret;
			});
			return Promise.resolve(parsed_documents);
		})
}
FileManager.prototype.change_name = function(dispatcher, sealious_name, new_name){
	return Sealious.Datastore.update("files", {
		sealious_id: sealious_name
	}, {
		$set: {
			"body.original_name": new_name
		}
	});

}
FileManager.prototype.delete = function(dispatcher, query){

}
//wersjonowanie, historia dostępu, przetrzymywanie poprzednich wersji

module.exports = FileManager;
