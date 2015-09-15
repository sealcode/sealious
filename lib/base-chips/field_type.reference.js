var Sealious = require("../main.js");
var Promise = require("bluebird");
var clone = require("clone");

var field_type_reference = new Sealious.ChipTypes.FieldType({
    name: "reference",
    is_proper_declaration: function(declaration) {
        var required_declaration_fields = {
            "name": "string",
            "allowed_types": "array"
        };
        for (var attribute_name in required_declaration_fields) {
            if (declaration[attribute_name] === undefined) {
                throw new Sealious.Errors.DeveloperError("Missing `" + attribute_name + "` attribute in reference declaration.");
            }
        }
        for (var i in declaration.allowed_types) {
            var type_name = declaration.allowed_types[i];
            if (!Sealious.ChipManager.chip_exists("resource_type", type_name)) {
                throw new Sealious.Errors.DeveloperError("Unknown allowed type in declaration of reference: " + type_name);
            }
        }
    },
    is_proper_value: function(accept, reject, context, value) {
        if (typeof value == "object") {
            //validate object's values as values for new resource
            var type = value.type;
            if (type === undefined) {
                reject("Reference resource type undefined. `type` attribute should be set to one of these values: " + this.params.allowed_types.join(", ") + ".");
            } else if (this.params.allowed_types.indexOf(type) == -1) {
                reject("Incorrect reference resource type: `" + type + "`. Allowed resource types for this reference are:" + this.params.allowed_types.join(", ") + ".");
            } else {
                var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type);
                var access_strategy = resource_type_object.get_access_strategy();

                return access_strategy.check(context, value.type, value.data)
                    .then(function() {
                        return resource_type_object.validate_field_values(context, true, value.data);
                    })
            }
        } else {
            //value is uid. Check if it is proper
            var supposed_resource_id = value;
            return Sealious.Dispatcher.resources.get_by_id(context, supposed_resource_id)
                .then(function(resource) {
                    if (this.params.allowed_types.indexOf(resource.type) >= 0) {
                        accept(resource);
                    } else {
                        reject("Resource of id `" + supposed_resource_id + "` is not of allowed type. Allowed types are: [" + this.params.allowed_types.join(", ") + "]");
                    }
                }.bind(this))
                .catch(function(error) {
                    if (error.type == "not_found") {
                        reject(error.status_message);
                    } else {
                        reject(error);
                    }
                }.bind(this));
        }
    },
    encode: function(context, value_in_code) {
        //decide whether to create a new resource (if so, do create it). Resolve with id of referenced resource.
        if (value_in_code instanceof Object) {
            return Sealious.Dispatcher.resources.create(context, value_in_code.type, value_in_code.data).then(function(resource) {
                return Promise.resolve(resource.id);
            })
        } else {
            //assuming the provided id already exists
            return Promise.resolve(value_in_code);
        }
    },
    get_description: function(context, params){
        var params_copy = clone(params, false);
        params_copy.allowed_types = {};
        for (var i in params.allowed_types) {
            var type_name = params.allowed_types[i];
            var type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
            var type_schema = Sealious.ChipManager.get_chip("resource_type", type_name).get_signature();
            params_copy.allowed_types[type_name] = type_schema;
        }
        return params_copy;
    },
    decode: function(context, value_in_db) {
        if (value_in_db == undefined) {
            return Promise.resolve(undefined);
        } else {
            return Sealious.Dispatcher.resources.get_by_id(context, value_in_db);
        }
    }
});
