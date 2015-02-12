#!/usr/bin/env node

var PrometheusCore = require("./lib/core.js");

var mode = "local";
var layer_name = null;

var index = 2;
var argument = process.argv[index];
if(argument.slice(0,2)=="--"){
	layer_name = argument.slice(2);
	mode="distributed";
	index++;
}
app_location = process.argv[index];


PrometheusCore.start(mode, layer_name, app_location);