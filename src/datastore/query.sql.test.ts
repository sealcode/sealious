import assert from "assert";
import { Queries } from "../main.js";
import { Query } from "./query-base.js";

// This file is sql tests template for Query class. We might want to create a new method instead of using `toPipeline` which
// currently works only for mongo so just keep in mind you can edit this code if these tests are not compatible with selected abstraction

describe.skip("SQL Query", () => {
	it("Properly maps where condition for equal sign", () => {
		const pipeline = Query.fromSingleMatch({ id: { $eq: 5 } }).toPipeline();
		assert.equal(pipeline, "WHERE id = 5");
	});
	it("Properly maps where condition for not equal sign", () => {
		const pipeline = Query.fromSingleMatch({ id: { $ne: 5 } }).toPipeline();
		assert.equal(pipeline, "WHERE id != 5");
	});
	it("Properly maps where condition for greater than", () => {
		const pipeline = Query.fromSingleMatch({ id: { $gt: 5 } }).toPipeline();
		assert.equal(pipeline, "WHERE id>5");
	});
	it("Properly maps where condition for greater than or equal to", () => {
		const pipeline = Query.fromSingleMatch({
			id: { $gte: 5 },
		}).toPipeline();
		assert.equal(pipeline, "WHERE id >= 5");
	});
	it("Properly maps where condition for less than", () => {
		const pipeline = Query.fromSingleMatch({ id: { $lt: 5 } }).toPipeline();
		assert.equal(pipeline, "WHERE id < 5");
	});
	it("Properly maps where condition for less than or equal to", () => {
		const pipeline = Query.fromSingleMatch({
			id: { $lte: 5 },
		}).toPipeline();
		assert.equal(pipeline, "WHERE id <= 5");
	});
	it("Properly maps where condition for string equality", () => {
		const pipeline = Query.fromSingleMatch({
			testcolumn: { $eq: "Test" },
		}).toPipeline();
		assert.equal(pipeline, "WHERE testcolumn = 'Test'");
	});
	it("Properly maps where condition for string inequality", () => {
		const pipeline = Query.fromSingleMatch({
			testcolumn: { $ne: "Test" },
		}).toPipeline();
		assert.equal(pipeline, "WHERE testcolumn != 'Test'");
	});
	// currenttable. is used because we always need a refrence to table we are fetching FROM.
	// so when implementing we need to remember to put FROM ${TableName} AS currenttable
	it("Properly handles lookup method by creating left join", () => {
		const query = new Query();
		const lookup_id = query.lookup({
			from: "RefrenceTable",
			localField: "id",
			foreignField: "id",
		});
		query.match({
			[`${lookup_id}.id`]: {
				$in: [1, 5, 6, 7],
			},
		});
		const pipeline = query.toPipeline();
		assert.equal(
			pipeline,
			`LEFT JOIN RefrenceTable ON currenttable.id = ${lookup_id}.id WHERE ${lookup_id}.id IN (1, 5, 6, 7)`
		);
	});
	it("Properly handles lookup method by creating left join and where condition to field from refenced table", () => {
		const query = new Query();
		const lookup_id = query.lookup({
			from: "RefrenceTable",
			localField: "id",
			foreignField: "id",
		});
		query.match({
			[`${lookup_id}.differentfields`]: {
				$eq: "Test",
			},
		});
		const pipeline = query.toPipeline();
		assert.equal(
			pipeline,
			`LEFT JOIN RefrenceTable ON currenttable.id = ${lookup_id}.id WHERE ${lookup_id}.differentfields = 'Test'`
		);
	});
	it("Properly handles lookup method by creating multiple left joins", () => {
		const query = new Query();
		const lookup_id_first = query.lookup({
			from: "RefrenceTableFirst",
			localField: "id",
			foreignField: "firstid",
		});
		const lookup_id_second = query.lookup({
			from: "RefrenceTableSecond",
			localField: "id",
			foreignField: "secondid",
		});
		query.match({
			[`${lookup_id_first}.differentfields`]: {
				$eq: `${lookup_id_second}.differentfields`,
			},
		});
		const pipeline = query.toPipeline();
		assert.equal(
			pipeline,
			`LEFT JOIN RefrenceTableFirst ON currenttable.id = ${lookup_id_first}.firstid LEFT JOIN RefrenceTableSecond ON currenttable.id = ${lookup_id_second}.secondid WHERE ${lookup_id_first}.differentfields = ${lookup_id_second}.differentfields`
		);
	});
	it("Properly maps where condition for IN clause with multiple values", () => {
		const pipeline = Query.fromSingleMatch({
			id: { $in: [5, 6] },
		}).toPipeline();
		assert.equal(pipeline, "WHERE id IN (5, 6)");
	});
	it("Properly maps where condition for IN clause with string values", () => {
		const pipeline = Query.fromSingleMatch({
			testcolumn: { $in: ["Test 1", "Test 2"] },
		}).toPipeline();
		assert.equal(pipeline, "WHERE testcolumn IN ('Test 1', 'Test 2')");
	});
	it("Properly maps AND condition", () => {
		const pipeline = new Queries.And(
			Query.fromSingleMatch({ id: { $lte: 5 } }),
			Query.fromSingleMatch({ id: { $gt: 1 } })
		).toPipeline();
		assert.equal(pipeline, "WHERE (id <= 5 AND id > 1)");
	});
	it("Properly maps OR condition", () => {
		const pipeline = new Queries.Or(
			Query.fromSingleMatch({ id: { $lte: 5 } }),
			Query.fromSingleMatch({ id: { $gt: 1 } })
		).toPipeline();
		assert.equal(pipeline, "WHERE (id <= 5 OR id > 1)");
	});
	it("Properly maps NOT condition with AND", () => {
		const pipeline = new Queries.Not(
			new Queries.And(
				Query.fromSingleMatch({ id: { $lte: 5 } }),
				Query.fromSingleMatch({ id: { $gt: 1 } })
			)
		).toPipeline();
		assert.equal(pipeline, "WHERE (NOT (id <= 5 AND id > 1))");
	});
	it("Properly maps NOT condition with OR", () => {
		const pipeline = new Queries.Not(
			new Queries.Or(
				Query.fromSingleMatch({ id: { $lte: 5 } }),
				Query.fromSingleMatch({ id: { $gt: 1 } })
			)
		).toPipeline();
		assert.equal(pipeline, "WHERE (NOT (id <= 5 OR id > 1))");
	});
	it("Properly maps AND conditions with nested NOTs", () => {
		const pipeline = new Queries.And(
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 5 } })),
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 1 } }))
		).toPipeline();
		assert.equal(pipeline, "WHERE ((NOT id = 5) AND (NOT id = 1))");
	});
	it("Properly maps OR conditions with nested NOTs", () => {
		const pipeline = new Queries.Or(
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 5 } })),
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 1 } }))
		).toPipeline();
		assert.equal(pipeline, "WHERE ((NOT id = 5) OR (NOT id = 1))");
	});
});
