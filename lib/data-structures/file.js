function File(creation_context, filename, data, id, mime){
	console.log("constructing File with mime:", mime);
	this.filename = filename;
	this.data = data;
	this.id = id || null;
	this.mime = mime || false;
}

File.from_id = function(context, file_id){
	return Sealious.Dispatcher.files.find(context, {id: file_id})
	.then(function(file_array){
		return Promise.resolve(file_array[0]);
	});	
}

File.from_db_entry = function(db_document, upload_path){
	console.log("from_db_entry:", db_document, db_document.mime)
	return new File(db_document.creation_context, db_document.original_name, db_document.data, db_document.id, db_document.mime_type);
}

File.prototype = new function(){
	this.data_structure = "file";
}

File.Reference = function(id, filename){
	this.id = id;
	this.filename = filename;
}

module.exports = File;

