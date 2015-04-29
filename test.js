var npmCheck = require('npm-check');
var npm = require('npm');

/*
npmCheck()
.then(function(data){
	console.log(data);
});
*/

npm.commands.outdated(function(data){
	console.log(data);
})