function File(creation_context, filename, data){
	console.log("creating FIle:", arguments);
	this.filename = filename;
	this.data = data;
}

File.prototype = new function(){
	this.data_structure = "file";
}

module.exports = File;