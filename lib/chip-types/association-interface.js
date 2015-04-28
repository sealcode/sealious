/**
 * An interface for module developers that makes it easy to create a new association.
 * @alias AssociationInterface
 * @class
 * @static
 */
var AssociationInterface = new function(){ 
	/**
	 * Creates an association with given options
	 * @alias AssociationInterface.create
	 * @param  {object} options
	 */
	this.create = function(options){
		var from_type_name = options.left_type;
		var to_type_name = options.right_type;
		var bidirectional = options.bidirectional || false;
		var from_field_name = options.name_ltr;
		var to_field_name = options.name_rtl;

		ResourceTypeManager.enforce_correct_type_name(from_type_name);
		ResourceTypeManager.enforce_correct_type_name(to_type_name);
		var from_type = ResourceTypeManager.getByName(from_type_name);
		var to_type = ResourceTypeManager.getByName(to_type_name);
		
		var from_field_options = {
			type: "association",
			required: options.left_required || false
		};

		var field_type_arguments = {
			from_type_name: from_type_name,
			to_type_name: to_type_name
		}

		var from_field =  new ResourceTypeField(from_field_name, from_field_options, field_type_arguments);

		from_type.addField(from_field);

	}	
}

module.exports = AssociationInterface;