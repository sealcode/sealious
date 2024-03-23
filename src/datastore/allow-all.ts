import Query from "./query.js";

export class AllowAll extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: true } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
		return "";
	}
	match() {
		throw new Error("The query is not mutable!");
	}
}
