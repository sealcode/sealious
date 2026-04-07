import type { FieldValue } from "./field-value.js";

export class CoordsValue implements FieldValue {
	constructor(private readonly coordinates: [number, number]) {}

	toTuple(): [number, number] {
		return [...this.coordinates] as [number, number];
	}

	toObject(): { lat: number; lon: number } {
		const [lat, lon] = this.coordinates;
		return { lat, lon };
	}

	toString(): string {
		const [lat, lon] = this.coordinates;
		return `${lat},${lon}`;
	}

	getRestAPIValue(): [number, number] {
		return this.toTuple();
	}
}
