import {
	hasFieldOfType,
	hasShape,
	is,
	Predicate,
	predicates,
} from "@sealcode/ts-predicates";
import type { ActionName } from "../../../action";
import { Field, Context, ValidationResult } from "../../../main";

export type ArrayStorageInput<ContentType extends any> =
	| ContentType[]
	| { remove: number }
	| { swap: [number, number] }
	| { insert: { value: ContentType; index?: number } };

export abstract class ArrayStorage<
	T extends string | number | Record<string, unknown>
> extends Field<ArrayStorageInput<T>> {
	constructor(public value_predicate: Predicate) {
		super();
	}

	isOldValueSensitive(_: ActionName): boolean {
		return true;
	}

	async isProperElement(
		context: Context,
		element: unknown,
		index: number
	): Promise<{ valid: boolean; reason: string }> {
		if (is(element, this.value_predicate)) {
			return { valid: true, reason: "Matches predicate" };
		} else {
			return { valid: false, reason: "Doesn't match predicate" };
		}
	}

	async isProperValue(
		context: Context,
		new_value: unknown,
		old_value: T[] | undefined,
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (
			is(new_value, predicates.object) &&
			(hasShape({ remove: predicates.number }, new_value) ||
				hasShape(
					{ swap: predicates.array(predicates.number) },
					new_value
				) ||
				hasShape({ insert: predicates.object }, new_value))
		) {
			if (old_value === undefined) {
				return {
					valid: false,
					reason: "The value is an array action description, but this array field does not yet have a value",
				};
			} else {
				if (
					hasFieldOfType(
						new_value,
						"swap",
						predicates.array(predicates.number)
					)
				) {
					if (new_value.swap.length != 2) {
						return {
							valid: false,
							reason: "swap action parameter should be a list of two numbers",
						};
					}
					if (
						new_value.swap.some(
							(index) => index >= old_value.length || index < 0
						)
					) {
						return {
							valid: false,
							reason: "swap action parameter out of range",
						};
					}
					return {
						valid: true,
						reason: "swap action parameters ok",
					};
				}

				if (hasFieldOfType(new_value, "insert", predicates.object)) {
					if (
						!hasShape(
							{
								value: this.value_predicate,
								index: predicates.maybe(predicates.number),
							},
							new_value.insert
						)
					) {
						return {
							valid: false,
							reason: "Wrong shape of the insert action",
						};
					}
					const validation_result = await this.isProperElement(
						context,
						new_value.insert.value,
						new_value.insert.index == undefined
							? old_value.length
							: new_value.insert.index
					);
					if (!validation_result.valid) {
						return {
							valid: false,
							reason: validation_result.reason,
						};
					}
				}

				return {
					valid: true,
					reason: "The value is an array action description",
				};
			}
		}
		if (!is(new_value, predicates.array(this.value_predicate))) {
			return {
				valid: false,
				reason: `${new_value} is not an array of objects`,
			};
		}
		const results = await Promise.all(
			new_value.map((value, index) =>
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
		return { valid: true, reason: `Proper form` };
	}

	async encode(
		_: Context,
		value: ArrayStorageInput<T>,
		old_value: T[]
	): Promise<T[]> {
		if (!Array.isArray(value)) {
			if (hasFieldOfType(value, "remove", predicates.number)) {
				old_value = old_value.filter((_, i) => {
					return i !== value.remove;
				});
			}
			if (
				hasFieldOfType(
					value,
					"swap",
					predicates.array(predicates.number)
				)
			) {
				const temp = old_value[value.swap[0]];
				old_value[value.swap[0]] = old_value[value.swap[1]];
				old_value[value.swap[1]] = temp;
			}
			if (
				hasFieldOfType(value, "insert", predicates.object) &&
				hasShape(
					{
						value: this.value_predicate,
						index: predicates.maybe(predicates.number),
					},
					value.insert
				)
			) {
				const n =
					value.insert.index === undefined
						? old_value.length
						: value.insert.index;
				old_value = [
					...old_value.slice(0, n),
					value.insert.value,
					...old_value.slice(n),
				];
			}
			return old_value;
		}
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
