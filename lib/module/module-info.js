var fs = require("fs");

function ModuleInfo(path){
	this.readInfo(path);
}

ModuleInfo.prototype = new function(){
	var required_fields = ["prometheus-module-id"];
	var field_map = {
		"prometheus-module-id": "id",
		"prometheus-required-chips": "requires",
		"prometheus-defined-chips": "defines"
	}

	this.readInfo = function(path){
		var json_string = fs.readFileSync(path+"/package.json");
		var package_info = JSON.parse(json_string);
		for(var i in required_fields){
			if(!(required_fields[i] in package_info)){
				throw new Error("Missing field `"+required_fields[i] + "` in " + path);
			}
		}
		for(var field_name in field_map){
			this[field_map[field_name]] = package_info[field_name] || [];
		}
	}
}

module.exports = ModuleInfo;