"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");

function SuperContext (regular_context){

	if (regular_context === undefined){
		regular_context = new Context();
	}

	const ret = Object.create(regular_context);

	Object.defineProperty(ret, "is_super", {value: true});

	return ret;
}

module.exports = SuperContext;
