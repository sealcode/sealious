var Sealious = require("sealious");
var Promise = require("bluebird");

var is_number = /^[0-9]/;

var IDStartsWithDigit = new Sealious.ChipTypes.AccessStrategy({
	name: "id_starts_with_digit",
	checker_function: function(context, item){
		return new Promise(function(resolve, reject){
			if (is_number.test(item.id)) {
				resolve("id ok!");
			} else {
				reject("bad id");
			}
		});
	},
	item_sensitive: true,
});