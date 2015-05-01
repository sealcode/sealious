var npmCheck = require('npm-check');
var http = require('http');
var pkg = require('./package.json');
var request = require('request')

/*
request("http://registry.npmjs.org/sealious/latest", function(error, response, body){
	var sealious = JSON.parse(body);
	console.log(sealious.version)
	//if (pkg.version == sealious.version) console.log("true");
	//else console.log("false");
})


*/
http.get("http://registry.npmjs.org/sealious/latest", function(res) {
	res.setEncoding('utf8');
	var body = "";
	res.on('data', function (chunk) {
    	body += chunk.toString();
  	});
  	res.on('end', function(){
  		var json = JSON.parse(body);
  		console.log(json.version)
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
 	