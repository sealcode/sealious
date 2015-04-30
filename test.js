var npmCheck = require('npm-check');
var http = require('http');
var pkg = require('./package.json');
var request = require('request')

request("http://registry.npmjs.org/sealious/latest", function(error, response, body){
	var sealious = JSON.parse(body);
	if (pkg.version == sealious.version) console.log("true");
	else console.log("false");
})




/*
http.get("http://registry.npmjs.org/sealious/latest", function(res) {
	res.on('data', function (chunk) {
    	var string = chunk.toString();
    	var json = JSON.parse(string);
    	console.log(json);
  	});
})


/*
npmCheck({global: true})
.then(function(data){
	if (data.sealious.latest == data.sealious.installed)
		console.log("true")
	else 
		console.log("false")
});
*/
 	