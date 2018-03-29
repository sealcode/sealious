"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Errors = locreq("lib/response/error.js");

const ChipManager = function(app) {
	this.app = app;
	this.chips = {};
};

ChipManager.chip_type_start_order = [
	"access_strategy_type",
	"field_type",
	"collection",
	"channel",
];

ChipManager.pure = {
	start_chips: function(app, chips) {
		const promises = [];
		const datastore = ChipManager.pure.get_datastore_chip(app, chips);

		app.Logger.info(`\u2713 Started ${datastore.name}`);

		let promise;

		for (const i in ChipManager.chip_type_start_order) {
			const type = ChipManager.chip_type_start_order[i];
			for (const name in chips[type]) {
				const chip = chips[type][name];
				try {
					if (chip.start) {
						promise = chip.start();
						promises.push(promise);
					}
				} catch (error) {
					app.Logger.error(`\t  " + "couldn't start "${name}"`);
					return Promise.reject(error);
				}
			}
		}
		return Promise.all(promises);
	},
	add_chip: function(chips, type, name, chip) {
		if (chips[type] === undefined) {
			chips[type] = [];
		}
		if (chips[type][name])
			throw Error(`Chip '${type}.${name}' already exists!`);
		chips[type][name] = chip;
	},
	get_all_collections: function(chips) {
		const names = [];
		for (const collection in chips.collection) {
			names.push(collection);
		}
		return names;
	},
	get_chip: function(chips, type, name) {
		try {
			const ret = chips[type][name];
			if (ret === undefined) {
				throw new Error(
					`Chip of type ${type} and name ${name} has not yet been registered`
				);
			}
			return ret;
		} catch (e) {
			throw new Errors.ValidationError(
				`ChipManager was asked to return a chip of type "${type}" and name "${name}", but it was not found`,
				{},
				{ short_message: "chip_not_found" }
			);
		}
	},
	get_chip_amount_by_type: function(chips, type) {
		if (chips[type]) {
			return Object.keys(chips[type]).length;
		} else {
			return 0;
		}
	},
	get_datastore_chip: function(app, chips) {
		return app.Datastore;
	},
	get_chips_by_type: function(chips, chip_type) {
		return chips[chip_type];
	},
};

ChipManager.prototype = {
	start_chips() {
		return ChipManager.pure.start_chips(this.app, this.chips);
	},
	add_chip(type, name, chip) {
		return ChipManager.pure.add_chip(this.chips, type, name, chip);
	},
	get_all_collections() {
		return ChipManager.pure.get_all_collections(this.chips);
	},
	get_chip(type, name) {
		return ChipManager.pure.get_chip(this.chips, type, name);
	},
	get_chip_amount_by_type(type) {
		return ChipManager.pure.get_chip_amount_by_type(this.chips, type);
	},
	get_datastore_chip() {
		return ChipManager.pure.get_datastore_chip(this.app, this.chips);
	},
	get_chips_by_type(chip_type) {
		return ChipManager.pure.get_chips_by_type(this.chips, chip_type);
	},
};

module.exports = ChipManager;
