import type { FieldValue } from "./field-value.js";

export class MoneyValue implements FieldValue {
	constructor(private readonly value: number) {}

	toNumber(): number {
		return this.value;
	}

	toString(): string {
		return this.value.toFixed(2);
	}

	getRestAPIValue(): number {
		return this.toNumber();
	}
}
