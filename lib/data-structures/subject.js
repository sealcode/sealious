var SubjectDescription = function(description){

	this.elements = [];

	if(description instanceOf SubjectDescription){
		return description;
	}else if(typeof description == "string"){
		this._fromString(description);
	}else if(description instanceOf Array){
		this._fromArray(description);
	}
}

SubjectDescription.prototype = new function(){
	this._fromString = function(description_string){
		this.elements = description_string.split(".");
	}

	this._fromArray = function(description_array){
		this.elements = description_array;
	}
}

return SubjectDescription;