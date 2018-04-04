"use strict";

const Promise = require("bluebird");
const hash_item = value =>
	require("object-hash")(value, {
		algorithm: "md5",
		excludeKeys: key => key === "as",
	});

class Query {
	constructor() {
		this.stages = [];
	}
	lookup(body, unwind = true) {
		body.as = hash_item(body);
		this.stages.push({ $lookup: body, unwinds: unwind });
		return body.as;
	}
	match(body) {
		this.stages.push({ $match: body });
		return this;
	}
	dump() {
		return this.stages;
	}
	toPipeline() {
		return this.stages.reduce(
			(acc, stage) => this._pushToPipeline(acc, stage),
			[]
		);
	}
	_pushToPipeline(pipeline, stage) {
		if (!stage.$lookup) {
			pipeline.push(stage);
		} else {
			pipeline.push({ $lookup: stage.$lookup });
			if (stage.unwinds) {
				pipeline.push({ $unwind: "$" + stage.$lookup.as });
			}
		}
		return pipeline;
	}
	static fromSingleMatch(body) {
		const query = new Query();
		return query.match(body);
	}
	static fromCustomPipeline(stages) {
		const query = new Query();
		query.stages = stages;
		return query;
	}
}

Query.DenyAll = class extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: false } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
	}
	match() {
		throw new Error("The query is not mutable!");
	}
};

Query.AllowAll = class extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: true } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
	}
	match() {
		throw new Error("The query is not mutable!");
	}
};

Query.Or = class extends Query {
	constructor(...queries) {
		super();
		this.lookups = {};
		this.matches = [];
		for (let query of queries) {
			this.addQuery(query);
		}
	}
	addQuery(query) {
		let stages = query.dump();
		const combined_match = {};
		for (let stage of stages) {
			if (stage.$lookup) {
				this._lookup(stage);
			} else if (stage.$match) {
				Object.assign(combined_match, stage.$match);
			} else {
				throw new Error("Unsupported query: " + Object.keys(stage));
			}
		}
		if (Object.keys(combined_match).length) this.matches.push(combined_match);
	}
	_lookup(stage) {
		const id = stage.$lookup.as;
		this.lookups[id] = stage;
	}
	dump() {
		return Object.values(this.lookups).concat({
			$match: { $or: this.matches },
		});
	}
	toPipeline() {
		return Object.values(this.lookups)
			.reduce((acc, stage) => this._pushToPipeline(acc, stage), [])
			.concat({
				$match: { $or: this.matches },
			});
	}
	match(body) {
		return Query.fromCustomPipeline([{ $match: body }, ...this.toPipeline()]);
	}
};

Query.And = class extends Query {
	constructor(...queries) {
		super();
		this.stages = queries
			.map(query => query.stages)
			.reduce((acc, stages) => acc.concat(stages), []);
	}
};

Query.Not = class extends Query {
	constructor(query) {
		super();
		query.toPipeline().map(stage => {
			if (!stage.$match) {
				return stage;
			}
			for (let field_name in stage.$match) {
				this.match({ [field_name]: { $not: stage.$match[field_name] } });
			}
		});
	}
};

module.exports = Query;
