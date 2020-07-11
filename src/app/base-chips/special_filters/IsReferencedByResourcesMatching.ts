import * as assert from "assert";
import { SpecialFilter, App, Query, Collection } from "../../../main";
import Field from "../../../chip-types/field";

type Params = {
	referencing_field: Field;
	field_to_check: Field;
	allowed_values: any[];
	nopass_reason: string;
};

export default class IsReferencedByResourcesMatching extends SpecialFilter {
	constructor(app: App, collection: () => Collection, public params: Params) {
		super(app, collection, params);
		const { allowed_values, nopass_reason } = params;
		assert.ok(params);
		assert.ok(Array.isArray(allowed_values));
		assert.ok(typeof nopass_reason === "string");
	}

	async getFilteringQuery() {
		const query = new Query();
		const lookup_id = query.lookup({
			from: this.getCollection().name,
			localField: "sealious_id",
			foreignField: this.params.referencing_field.name,
		});
		query.match({
			[`${lookup_id}.${this.params.field_to_check.name}`]: {
				$in: this.params.allowed_values,
			},
		});
		return query;
	}

	getNopassReason() {
		return this.params.nopass_reason;
	}
}
