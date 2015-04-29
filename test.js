var npmCheck = require('npm-check');
var npm = require('npm');


npmCheck({global: true})
.then(function(data){
	if (data.sealious.latest == data.sealious.installed)
		console.log("true")
	else 
		console.log("false")
});

