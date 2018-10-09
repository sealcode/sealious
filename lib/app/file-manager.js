"use strict";
const locreq = require("locreq")(__dirname);
const { promisify } = require("util");
const UUIDGenerator = require("shortid");
const path = require("path");
const fs = require("fs");

const File = locreq("lib/data-structures/file.js");

function FileManager(datastore, logger, upload_path) {
	this.datastore = datastore;
	this.logger = logger;
	this.upload_path = upload_path;

	if (!fs.existsSync(this.upload_path)) {
		fs.mkdirSync(this.upload_path);
	}
}

FileManager.pure = {
	save_file: function(datastore, upload_path, file) {
		const newID = UUIDGenerator();
		const upload_path_with_sealious_name = `${upload_path}/${newID}`;
		return promisify(fs.writeFile)(
			upload_path_with_sealious_name,
			file.data
		)
			.then(function() {
				const file_database_entry = {
					original_name: file.filename,
					creation_context: file.context,
					id: newID,
					mime_type: file.mime,
				};
				return datastore.insert("files", file_database_entry, {});
			})
			.then(function() {
				return {
					id: newID,
					filename: file.filename,
				};
			});
	},
	find: function(datastore, upload_path, context, query) {
		return datastore.find("files", query).then(function(documents) {
			const parsed_documents = documents.map(function(document) {
				const ret = File.from_db_entry(document);
				ret.path_on_hdd = path.resolve(upload_path, `./${ret.id}`);
				return ret;
			});
			return Promise.resolve(parsed_documents);
		});
	},
	get_by_id: function(datastore, upload_path, context, file_id) {
		return FileManager.pure
			.find(datastore, upload_path, context, { id: file_id })
			.then(function(file_array) {
				return Promise.resolve(file_array[0]);
			});
	},
};

FileManager.prototype = {
	save_file(file) {
		return FileManager.pure.save_file(
			this.datastore,
			this.upload_path,
			file
		);
	},
	find(context, query) {
		return FileManager.pure.find(
			this.datastore,
			this.upload_path,
			context,
			query
		);
	},
};

module.exports = FileManager;
