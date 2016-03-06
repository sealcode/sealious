var Sealious = require("sealious");

function SuperContext (regular_context) {

	if (regular_context === undefined){
		regular_context = new Sealious.Context();
	}

	var ret = Object.create(regular_context);

	Object.defineProperty(ret, "is_super", {value: true});

	return ret;
}

module.exports = SuperContext;
