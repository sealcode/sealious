const CalculatedFieldType = require("./calculated-field-type.js");

const CalculatedField = function(App, field_name, type_declaration, type_params){
	this.app = App;
	this.name = field_name,
	this.type = new CalculatedFieldType(App, type_declaration);
	this.params = type_params;
};

CalculatedField.prototype.get_value = function(context, item, db_document){
	return this.type.get_value(context, this.params, item, db_document);
};

module.exports = CalculatedField;
