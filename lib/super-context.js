"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");

function SuperContext(regular_context) {
	if (regular_context === undefined) {
		regular_context = new Context();
	}

	const ret = Object.create(regular_context);

	Object.defineProperty(ret, "is_super", { value: true });

	ret.original_context = regular_context;

	while (ret.original_context.original_context) {
		ret.original_context = ret.original_context.original_context;
	}

	return ret;
}

module.exports = SuperContext;
