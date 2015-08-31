var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_boolean = new Sealious.ChipTypes.FieldType("boolean");

field_type_boolean.prototype.isProperValue = function(context, value) {
    if(typeof value == "boolean"){
    	return true;
    }else if(value==1 || value==0){
    	return true;
    }else if(typeof value=="string" && (value.toLowerCase()=="true" || value.toLowerCase()=="false")){
    	return true;
    }else{
    	return false
    }
}

field_type_boolean.prototype.encode = function(value) {
	if(typeof value == "boolean"){
		return value;
	}else if(value==1){
		return true;
	}else if(value==0){
		return false;
	}else if(typeof value=="string"){
		if(value.toLowerCase()=="true"){
			return true;
		}else if(value.toLowerCase()=="false"){
			return false
		}
	}
}
