import Query from "./query";

export default class DenyAll extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: false } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
		return "";
	}
	match() {
		throw new Error("The query is not mutable!");
	}
}
