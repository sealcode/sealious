"use strict";
const locreq = require("locreq")(__dirname);
const Sealious = {};

module.exports = Sealious;

Sealious.Errors = require("./response/error.js");
Sealious.Error = Sealious.Errors.Error;
Sealious.Responses = require("./response/responses.js");
Sealious.Response = require("./response/response.js");
Sealious.SubjectPath = require("./data-structures/subject-path.js");
Sealious.Subject = require("./subject/subject.js");

Sealious.VirtualFile = require("./data-structures/virtual-file.js");

Sealious.Context = require("./context.js");
Sealious.SuperContext = require("./super-context.js");
Sealious.File = require("./data-structures/file.js");
Sealious.OverwriteResponse = require("./data-structures/overwrite-response.js");

Sealious.ChipTypes = {
	AccessStrategyType: require("./chip-types/access-strategy-type.js"),
	AccessStrategy: require("./chip-types/access-strategy.js"),
	Channel: require("./chip-types/channel.js"),
	Datastore: require("./chip-types/datastore.js"),
	FieldType: require("./chip-types/field-type.js"),
	Collection: require("./chip-types/collection.js"),
	CalculatedFieldType: locreq("lib/chip-types/calculated-field-type.js"),
};

// prefix Sealious.ChipTypes[chip_type_name] to Sealious[chip_type_name]
for (const chip_type_name in Sealious.ChipTypes) {
	Sealious[chip_type_name] = Sealious.ChipTypes[chip_type_name];
}

Sealious.App = locreq("lib/app/app.js");
