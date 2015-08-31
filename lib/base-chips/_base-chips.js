

/*
var fs = require("fs");
var path = require("path");

fs.readdirSync(__dirname).forEach(function(filename){
	if(filename[0]!="_"){
		require("./" + filename);
	}
})

*/

require("./datastore.mongo.js");
require("./access_strategy.id_starts_with_digit.js");
require("./access_strategy.noone.js");
require("./access_strategy.public.js");
require("./field_type.date.js");
require("./field_type.datetime.js");
require("./field_type.email.js");
require("./field_type.file.js");
require("./field_type.float.js");
require("./field_type.int.js");
require("./field_type.reference.js");
require("./field_type.text.js");
require("./field_type.boolean.js");
require("./resource_type.user.js");
