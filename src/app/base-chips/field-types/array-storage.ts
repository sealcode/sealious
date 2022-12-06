import {
	hasFieldOfType,
	is,
	Predicate,
	predicates,
} from "@sealcode/ts-predicates";
import { Field, Context } from "../../../main";

export abstract class ArrayStorage<
	T extends string | number | Record<string, unknown>
> extends Field {
	typeName = "enum-multiple";

	constructor(public value_predicate: Predicate) {
		super();
	}

	async encode(_: Context, value: T[]) {
		return value;
	}

	async getMatchQuery(
		context: Context,
		filter:
			| T
			| {
					exact: T[]; // in order, no other extra elements
			  }
			| {
					all: T[]; // out of order, may contain other elements
			  }
			| {
					any: T[]; // includes at least one of those elements
			  }
	) {
		const value_path = await this.getValuePath();
		if (!is(filter, predicates.object)) {
			return { [value_path]: filter };
		} else if (
			hasFieldOfType(
				filter,
				"exact",
				predicates.array(this.value_predicate)
			)
		) {
			return { [value_path]: filter.exact };
		} else if (
			hasFieldOfType(
				filter,
				"all",
				predicates.array(this.value_predicate)
			)
		) {
			if (filter.all.length == 0) {
				return {};
			} else {
				return { [value_path]: { $all: filter.all } };
			}
		} else if (
			hasFieldOfType(
				filter,
				"any",
				predicates.array(this.value_predicate)
			)
		) {
			return {
				$or: filter.any.map((value) => ({ [value_path]: value })),
			};
		}
	}
}
