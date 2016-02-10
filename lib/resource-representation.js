var Sealious = require("sealious");

function ResourceRepresentation(resource_type, db_document){
	this.resource_type = resource_type || Sealious.ChipManager.get_chip("resource_type", db_document.type);

	this.created_context = db_document.created_context;
	this.last_modified_context = db_document.last_modified_context;
	this.id = db_document.sealious_id;

	this.body = {};

	for(var field_name in resource_type.fields){
		Object.defineProperty(this, {
			enumerable: true,
			get: function(){
				return resource_type.fields[field_name].decode_value(db_document.body[field_name])
			}
		})
	}
}

module.exports = ResourceRepresentation;
