var Sealious = require("sealious");

function SuperContext(regular_context){
	Sealious.Context.apply(this, regular_context._get_constructor_arguments());
}


SuperContext.prototype = Object.create(Sealious.Context.prototype);
SuperContext.prototype.constructor = SuperContext;

module.exports = SuperContext;
