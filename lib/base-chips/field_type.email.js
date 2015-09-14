var Sealious = require("../main.js");

var Promise = require("bluebird");

var field_type_email = new Sealious.ChipTypes.FieldType({
	name: "email",
	is_proper_value: function(accept, reject, context, value){
		var address = value;

		var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

		if(!regex.test(address)){
			reject(address + " is not valid e-mail address.");
		} else {
			accept();
		}
	}
})