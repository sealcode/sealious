/*
var fs = require("fs");
var path = require("path");

fs.readdirSync(__dirname).forEach(function(filename){
	if(filename[0]!="_"){
		require("./" + filename);
	}
})

*/
require("./access_strategy_type.noone.js");
require("./access_strategy_type.public.js");
require("./access_strategy_type.just_owner.js");
require("./field_type.date.js");
require("./field_type.datetime.js");
require("./field_type.boolean.js");
require("./field_type.email.js");
require("./field_type.int.js");
require("./field_type.float.js");
require("./field_type.text.js");
require("./field_type.hashed-text.js")
require("./field_type.color.js");
require("./field_type.file.js");
require("./field_type.single_reference.js");
require("./resource_type.user.js");
