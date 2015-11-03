var clone = require("clone");

var SubjectPath = function(subject_path){

	this.elements = [];
	this.subject_type_instance = null;

	this.init(subject_path);
}

SubjectPath.prototype = new function(){

	this.init = function(subject_path){
		this._load_path_elements(subject_path);
		this._get_subject_type_instance();
	}

	this._load_path_elements = function(subject_path){
		if(subject_path instanceof SubjectPath){
			this._fromSubject(subject_path);
		}else if(typeof subject_path == "string"){
			this._fromString(subject_path);
		}else if(subject_path instanceof Array){
			this._fromArray(subject_path);
		}
	}

	this._from_string = function(description_string){
		this.elements = description_string.split(".");
	}

	this._from_array = function(description_array){
		this.elements = clone(description_array);
	}

	this._from_subject = function(subject){
		this.elements = clone(subject.elements);
	}

	this.clone = function(){
		var cloned_elements = clone(this.elements);
		return new SubjectPath(cloned_elements);
	}

	this.tail = function(){
		return new SubjectPath(this.elements.slice(1))
	}
}

module.exports = SubjectPath;