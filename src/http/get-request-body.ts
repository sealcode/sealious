import Context from "../context";
import File from "../data-structures/file";
import { App } from "../main";

const squares = {
	set: function (obj: any, key: string, value: any) {
		const keys = key.split(/[\]\[]{1,2}/g);
		if (keys.length > 1) {
			keys.splice(-1); //to remove the trailing empty string;
		}
		const last_key = keys[keys.length - 1];
		let current = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			const next_key = keys[i + 1];
			if (current[key] === undefined) {
				if (next_key === "") {
					current[key] = [];
				} else {
					current[key] = {};
				}
			}
			current = current[key];
		}
		if (last_key === "") {
			current.push(value);
		} else {
			current[last_key] = value;
		}
	},
};

export default async function getRequestBody(
	app: App,
	_: Context,
	request: any
) {
	const parsed_query: { [field: string]: any } = {};
	for (const i in request.query) {
		squares.set(parsed_query, i, request.query[i]);
	}
	for (const i in request.payload) {
		squares.set(parsed_query, i, request.payload[i]);
	}
	for (var i in request.payload) {
		if (
			// In case `request.payload[i]` is either null or undefined,
			// we can't access a `payload` property of it,
			// a TypeError will be thrown.
			request.payload[i] &&
			request.payload[i].payload
		) {
			let filename = request.payload[i].filename;
			var data = request.payload[i].payload;
			if (data instanceof Buffer) {
				const file = await File.fromData(app, data);
				file.filename = filename;
				parsed_query[i] = data instanceof Buffer ? file : data;
			} else {
				parsed_query[i] = data;
			}
		}
	}
	return parsed_query;
}
