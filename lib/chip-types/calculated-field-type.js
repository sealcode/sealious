const CalculatedFieldType = function(App, declaration){
	this.App = App;
	if(typeof declaration === "string"){
		return App.ChipManager.get_chip("calculated_field_type", declaration);
	}

	this.declaration = declaration;

	this.name = declaration.name;
};

CalculatedFieldType.type_name = "calculated_field_type";


CalculatedFieldType.pure = {
	get_value: function(declaration, context, params, item){
		// some caching strategy can be employed here in the future
		return Promise.resolve(declaration.calculate(context, params, item));
	}
};


// for brevity
const pure = CalculatedFieldType.pure;

CalculatedFieldType.prototype = {
	get_value: function(context, params, item){return pure.get_value(this.declaration, context, params, item);},
};

module.exports = CalculatedFieldType;
