"use strict";

const locreq = require("locreq")(__dirname);

const fs = require("fs");
const path = require("path");

const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");
const FieldType = locreq("lib/chip-types/field-type.js");

const access_strategy_types = ["and", "logged_in", "noone", "not", "or", "owner", "public", "super", "themselves"];
const field_types = [
	"boolean",
	"color",
	"context",
	"date",
	"datetime",
	"email",
	"file",
	"float",
	"int",
	"single_reference",
	"text",
	"hashed-text",
	"username",
	"html",
];

for(const i in access_strategy_types){
	const type_name = access_strategy_types[i];
	const declaration = require("./access-strategy-types/" + type_name);
	new AccessStrategyType(declaration);
}

for(const i in field_types){
	const type_name = field_types[i];
	const declaration = require("./field-types/" + type_name);
	new FieldType(declaration);
}


require("./collection.users.js");
