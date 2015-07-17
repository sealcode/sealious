var Sealious = require("../main.js");
var Promise = require("bluebird");

var number_test = /^[0-9]/

var IDStartsWithDigit = new Sealious.ChipTypes.AccessStrategy({
	name: "id_starts_with_digit",
	checker_function: function(context, item){
		return new Promise(function(resolve, reject){
			if(number_test.test(item.id)){
				resolve("id ok!");				
			}else{
				reject("bad id");
			}
		});
	},
	item_sensitive: true,
});