const Sealious = require("sealious");

const FileHash = function(file_id){
	this.name = "FileHash";
	this.file_id = file_id;
};

FileHash.prototype = Object.create(Sealious.Subject.prototype);

FileHash.prototype.get_child_subject = function(file_name){
	return new SingleFileSubject(this.file_id, file_name);
};

const SingleFileSubject = function(file_id, file_name){
	this.name = "SingleFile";
	this.file_id = file_id;
	this.file_name = file_name;
};

SingleFileSubject.prototype = Object.create(Sealious.Subject.prototype);

SingleFileSubject.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
	case "show":
		return Sealious.FileManager.find(context, {id: this.file_id})
			.then(function(results){
				return results[0];
			});
	default:
		throw new Sealious.Errors.DeveloperError(`Unknown action for '${this.resource_type.name}' resource: '${action_name}'`);
	}
};



module.exports = FileHash;
