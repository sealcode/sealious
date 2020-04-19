const locreq = require("locreq")(__dirname);
const mime = require("mime-types");

const Promise = require("bluebird");

function File(creation_context, filename, data, id, file_mime) {
	this.filename = filename;
	this.data = data;
	this.id = id || null;
	this.mime = file_mime || mime.lookup(filename);
}

File.from_db_entry = function (db_document) {
	return new File(
		db_document.creation_context,
		db_document.original_name,
		db_document.data,
		db_document.id,
		db_document.mime_type
	);
};

File.prototype.data_structure = "file";

File.Reference = function (id, filename) {
	this.id = id;
	this.filename = filename;
};

module.exports = File;
