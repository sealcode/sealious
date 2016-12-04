"use strict";

const locreq = require("locreq")(__dirname);

const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");
const FieldType = locreq("lib/chip-types/field-type.js");
const CalculatedFieldType = locreq("lib/chip-types/calculated-field-type");
const Collection = locreq("lib/chip-types/collection.js");

const BaseChips = new Map();

BaseChips.set(AccessStrategyType, [
	"and",
	"logged_in",
	"noone",
	"not",
	"or",
	"owner",
	"public",
	"super",
	"themselves",
	"same-anon",
]);

BaseChips.set(FieldType, [
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
	"session-id",
	"html",
	"shortid",
]);

BaseChips.set(CalculatedFieldType, ["map-reduce", "aggregate"]);

BaseChips.set(Collection, ["users", "sessions", "anonymous-sessions"]);

const BaseChipDirs = new Map();
BaseChipDirs.set(AccessStrategyType, "access-strategy-types");
BaseChipDirs.set(FieldType, "field-types");
BaseChipDirs.set(CalculatedFieldType, "calculated-field-types");
BaseChipDirs.set(Collection, "collections");

function load_base_chips(app){

	BaseChips.forEach(function(names, constructor){
		for(const i in names){
			const chip_name = names[i];
			let declaration = locreq(
				`lib/app/base-chips/${  BaseChipDirs.get(constructor)  }/${  chip_name  }.js`
			);
			if(declaration instanceof Function){
				declaration = declaration(app);
			}
			app.createChip(constructor, declaration);
		}
	});
}

module.exports = load_base_chips;
