const CalculatedFieldType = function(App, declaration) {
	this.App = App;
	if (typeof declaration === "string") {
		return App.ChipManager.get_chip("calculated_field_type", declaration);
	}

	this.declaration = declaration;

	this.name = declaration.name;
};

CalculatedFieldType.type_name = "calculated_field_type";

CalculatedFieldType.pure = {
	get_value: function(declaration, context, params, item, db_document) {
		return Promise.resolve(
			declaration.calculate(context, params, item, db_document)
		);
		// cache not needed so far
		/*
		if(cached_value !== undefined){
			return Promise.resolve(cached_value);
		} else {
			return Promise.resolve(declaration.calculate(context, params, item, db_document));
		}
		*/
	},
};

// for brevity
const pure = CalculatedFieldType.pure;

CalculatedFieldType.prototype = {
	get_value: function(context, params, item, raw_db_entry) {
		return pure.get_value(
			this.declaration,
			context,
			params,
			item,
			raw_db_entry
		);
	},
};

module.exports = CalculatedFieldType;
