var fs = require("fs");
var path = require("path");

fs.readdirSync(__dirname).forEach(function(filename){
	if(filename[0]!="_"){
		require("./" + filename);
	}
})