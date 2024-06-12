import {
	hasFieldOfType,
	is,
	Predicate,
	predicates,
} from "@sealcode/ts-predicates";
import type { ActionName } from "../../../action.js";
import { Field, Context, ValidationResult } from "../../../main.js";
import { Insert } from "./array-actions/insert.js";
import { Remove } from "./array-actions/remove.js";
import { Replace } from "./array-actions/replace.js";
import { Swap } from "./array-actions/swap.js";

export type ArrayStorageAction<ContentType> = (
	| { remove: number }
	| { swap: [number, number] }
	| {
			insert: { value?: ContentType; index?: number | string };
	  }
	| {}
) & { data?: ContentType[] };

export type ArrayStorageInput<ContentType> =
	| ContentType[]
	| ArrayStorageAction<ContentType>;

export abstract class ArrayStorage<
	T extends string | number | Record<string, unknown>
> extends Field<T[], ArrayStorageInput<T>> {
	constructor(public value_predicate: Predicate) {
		super();
	}

	abstract getEmptyElement(context: Context): Promise<T>;

	isOldValueSensitive(_: ActionName): boolean {
		return true;
	}

	async isProperElement(
		_context: Context,
		element: unknown,
		_index: number
	): Promise<{ valid: boolean; reason: string }> {
		if (is(element, this.value_predicate)) {
			return { valid: true, reason: "Matches predicate" };
		} else {
			return { valid: false, reason: "Doesn't match predicate" };
		}
	}

	async validateElements(context: Context, elements: unknown[]) {
		const results = await Promise.all(
			elements.map((value, index) =>
				this.isProperElement(context, value, index)
			)
		);
		if (results.some((result) => !result.valid)) {
			return {
				valid: false,
				reason: `Didn't pass validation: ${results
					.filter((result) => !result.valid)
					.map((result) => result.reason)
					.join(", ")}`,
			};
		}
		return { valid: true, reason: "elements valid" };
	}

	async isProperValue(
		context: Context,
		new_value: unknown,
		old_value: T[] | undefined,
		_new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (is(new_value, predicates.object) && !Array.isArray(new_value)) {
			if (old_value === undefined) {
				return {
					valid: false,
					reason: "The value is an array action description, but this array field does not yet have a value",
				};
			}
			let found_matching_action = false;
			for (const Action of [Remove, Swap, Insert, Replace]) {
				const action = new Action(
					this.value_predicate,
					this.isProperElement.bind(this)
				);
				const result = await action.validate(
					context,
					new_value,
					old_value || []
				);
				if (result.valid) {
					found_matching_action = true;
					break;
				}
			}
			if (!found_matching_action) {
				return {
					valid: false,
					reason: `No action matches the description: ${JSON.stringify(
						new_value
					)}`,
				};
			}
			if (hasFieldOfType(new_value, "data", predicates.any)) {
				if (!is(new_value.data, predicates.array(predicates.object))) {
					return {
						valid: false,
						reason: ".data should be an array of objects",
					};
				}
				const result = await this.validateElements(
					context,
					new_value.data
				);
				if (!result.valid) {
					return result;
				}
			}

			return {
				valid: true,
				reason: "The value is an array action description",
			};
		}
		if (!is(new_value, predicates.array(this.value_predicate))) {
			return {
				valid: false,
				reason: `${new_value} is not an array of objects`,
			};
		}
		const result = await this.validateElements(context, new_value);
		if (!result.valid) {
			return result;
		}
		return { valid: true, reason: `Proper form` };
	}

	async encode(
		context: Context,
		value: ArrayStorageInput<T> | null,
		old_value: T[]
	): Promise<T[]> {
		if (value === null) {
			return [];
		}
		if (!Array.isArray(value)) {
			const value_to_modify = value.data ? value.data : old_value;
			let result = value_to_modify;
			const empty_element = await this.getEmptyElement(context);
			for (const Action of [Remove, Swap, Insert, Replace]) {
				const action = new Action(
					this.value_predicate,
					this.isProperElement.bind(this)
				);
				const parsed_action = await action.parse(
					context,
					value,
					result,
					empty_element
				);
				if (parsed_action) {
					result = await action.run(
						context,
						parsed_action as any,
						result,
						empty_element
					);
				}
			}
			return result;
		}
		return value;
	}

	async getMatchQuery(
		_context: Context,
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
