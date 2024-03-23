import Query from "./query.js";

export default class DenyAll extends Query {
	constructor() {
		super();
		super.match({ _id: { $eq: -1 } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
		return "";
	}
	match() {
		throw new Error("The query is not mutable!");
	}
}
