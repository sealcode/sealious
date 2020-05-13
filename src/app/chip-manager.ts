import * as Errors from "../response/errors";
import App from "./app";
import Field, { FieldDefinition } from "../chip-types/field";
import AccessStrategy from "../chip-types/access-strategy";
import Collection from "../chip-types/collection";

export type ChipTypeName =
	| "access_strategy_type"
	| "field_type"
	| "collection"
	| "channel";

const chip_type_start_order = [
	"access_strategy_type",
	"field_type",
	"collection",
	"channel",
] as ChipTypeName[];

export default class ChipManager {
	app: App;
	chips: { [key in ChipTypeName]: { [chip_name: string]: any } } = {
		access_strategy_type: {},
		channel: {},
		field_type: {},
		collection: {},
	};
	constructor(app: App) {
		this.app = app;
	}

	async startChips() {
		const promises = [];

		let promise;

		for (const i in chip_type_start_order) {
			const type = chip_type_start_order[i];
			for (const name in this.chips[type]) {
				const chip = this.chips[type][name];
				try {
					if (chip.start) {
						promise = chip.start();
						promises.push(promise);
					}
				} catch (error) {
					this.app.Logger.error(`\t couldnt start ${name}`);
					return Promise.reject(error);
				}
			}
		}
		return Promise.all(promises);
	}

	addChip(chip_type: ChipTypeName, name: string, chip: any) {
		if (this.chips[chip_type] === undefined) {
			this.chips[chip_type] = [];
		}
		if (this.chips[chip_type][name])
			throw Error(`Chip '${chip_type}.${name}' already exists!`);
		this.chips[chip_type][name] = chip;
	}

	getAllCollections() {
		const names = [];
		for (const collection in this.chips.collection) {
			names.push(collection);
		}
		return names;
	}

	getChip(type: ChipTypeName, name: string) {
		try {
			const ret = this.chips[type][name];
			if (ret === undefined) {
				throw new Error(
					`Chip of type ${type} and name ${name} has not yet been registered`
				);
			}
			return ret;
		} catch (e) {
			throw new Errors.ValidationError(
				`ChipManager was asked to return a chip of type "${type}" and name "${name}", but it was not found`,
				{ short_message: "chip_not_found" }
			);
		}
	}

	getChipAmountByType(type: ChipTypeName) {
		if (this.chips[type]) {
			return Object.keys(this.chips[type]).length;
		} else {
			return 0;
		}
	}

	getChipsByType(type: ChipTypeName) {
		return this.chips[type];
	}

	getFieldType(
		name: string
	): { new (definition: FieldDefinition): Field<any, any, any, any> } {
		return this.chips.field_type[name];
	}

	getAccessStrategy(name: string): typeof AccessStrategy {
		return this.chips.access_strategy_type[name];
	}

	getCollection(name: string): Collection {
		return this.chips.collection[name];
	}
}
