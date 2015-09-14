var Sealious = require("../main.js");
var Promise = require("bluebird");

var field_type_boolean = new Sealious.ChipTypes.FieldType({
	name: "boolean",
	is_proper_value: function(accept, reject, context, value){
		if(typeof value == "boolean"){
			accept();
		}else if(value==1 || value==0){
			accept();
		}else if(typeof value=="string" && (value.toLowerCase()=="true" || value.toLowerCase()=="false")){
			accept();
		}else{
			reject("Value `"+ value + "`" + " is not boolean format.");
		}

	},
	encode: function(value){
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
})