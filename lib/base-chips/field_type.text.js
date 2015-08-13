var Sealious = require("../main.js");
var Promise = require("bluebird");
var sanitizeHtml = require("sanitize-html");

var field_type_text = Sealious.ChipTypes.FieldType("text");

field_type_text.prototype.isProperValue = function(value){
	if(this.params==undefined || this.params.max_length===undefined){
		return true;
	}else{
		if(value.length<=this.params.max_length){
			return true;
		}else{
			return Sealious.Errors.ValidationError("Text '" + value + "' has exceeded max length of " + this.params.max_length + " chars.");
		}
	}
}

field_type_text.prototype.encode = function(value_in_code){
	return new Promise(function(resolve, reject){
		if(this.params && this.params.strip_html === true){
			var stripped = sanitizeHtml(value_in_code.toString(), {
				allowedTags: []	
			})
			resolve(stripped);
		}else{
			if(value_in_code instanceof Object){
				resolve(JSON.stringify(value_in_code));
			}else if(value_in_code==null){
				resolve("");
			}else{
				resolve(value_in_code.toString());
			}
		}		
	}.bind(this))
}