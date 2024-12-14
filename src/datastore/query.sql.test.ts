import assert from "assert";
import { Queries } from "../main.js";
import { Query } from "./query-base.js";

describe("SQL Query", () => {
	it("Properly maps where condition for equal sign", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $eq: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id = $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for not equal sign", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $ne: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id != $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for greater than", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $gt: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id > $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for greater than or equal to", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $gte: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id >= $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for less than", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $lt: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id < $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for less than or equal to", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $lte: 5 },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id <= $1)",
			join: [],
			parameters: [5],
		});
	});
	it("Properly maps where condition for string equality", () => {
		const preparedStatement = Query.fromSingleMatch({
			testcolumn: { $eq: "Test" },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(testcolumn = $1)",
			join: [],
			parameters: ["Test"],
		});
	});
	it("Properly maps where condition for string inequality", () => {
		const preparedStatement = Query.fromSingleMatch({
			testcolumn: { $ne: "Test" },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(testcolumn != $1)",
			join: [],
			parameters: ["Test"],
		});
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
		const preparedStatement = query.toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: `(${lookup_id}.id IN ($1, $2, $3, $4))`,
			join: [`RefrenceTable ON currenttable.id = ${lookup_id}.id`],
			parameters: [1, 5, 6, 7],
		});
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
		const preparedStatement = query.toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: `(${lookup_id}.differentfields = $1)`,
			join: [`RefrenceTable ON currenttable.id = ${lookup_id}.id`],
			parameters: ["Test"],
		});
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
		const preparedStatement = query.toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: `(${lookup_id_first}.differentfields = $1)`,
			join: [
				`RefrenceTableFirst ON currenttable.id = ${lookup_id_first}.firstid`,
				`RefrenceTableSecond ON currenttable.id = ${lookup_id_second}.secondid`,
			],
			parameters: [`${lookup_id_second}.differentfields`],
		});
	});
	it("Properly maps where condition for IN clause with multiple values", () => {
		const preparedStatement = Query.fromSingleMatch({
			id: { $in: [5, 6] },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(id IN ($1, $2))",
			join: [],
			parameters: [5, 6],
		});
	});
	it("Properly maps where condition for IN clause with string values", () => {
		const preparedStatement = Query.fromSingleMatch({
			testcolumn: { $in: ["Test 1", "Test 2"] },
		}).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(testcolumn IN ($1, $2))",
			join: [],
			parameters: ["Test 1", "Test 2"],
		});
	});
	it("Properly maps AND condition", () => {
		const preparedStatement = new Queries.And(
			Query.fromSingleMatch({ id: { $lte: 5 } }),
			Query.fromSingleMatch({ id: { $gt: 1 } })
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "((id <= $1) AND (id > $2))",
			join: [],
			parameters: [5, 1],
		});
	});
	it("Properly maps OR condition", () => {
		const preparedStatement = new Queries.Or(
			Query.fromSingleMatch({ id: { $lte: 5 } }),
			Query.fromSingleMatch({ id: { $gt: 1 } })
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "((id <= $1) OR (id > $2))",
			join: [],
			parameters: [5, 1],
		});
	});
	it("Properly maps NOT condition with AND", () => {
		const preparedStatement = new Queries.Not(
			new Queries.And(
				Query.fromSingleMatch({ id: { $lte: 5 } }),
				Query.fromSingleMatch({ id: { $gt: 1 } })
			)
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(NOT ((id <= $1) AND (id > $2)))",
			join: [],
			parameters: [5, 1],
		});
	});
	it("Properly maps NOT condition with OR", () => {
		const preparedStatement = new Queries.Not(
			new Queries.Or(
				Query.fromSingleMatch({ id: { $lte: 5 } }),
				Query.fromSingleMatch({ id: { $gt: 1 } })
			)
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "(NOT ((id <= $1) OR (id > $2)))",
			join: [],
			parameters: [5, 1],
		});
	});
	it("Properly maps AND conditions with nested NOTs", () => {
		const preparedStatement = new Queries.And(
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 5 } })),
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 1 } }))
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "((NOT (id = $1)) AND (NOT (id = $2)))",
			join: [],
			parameters: [5, 1],
		});
	});
	it("Properly maps OR conditions with nested NOTs", () => {
		const preparedStatement = new Queries.Or(
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 5 } })),
			new Queries.Not(Query.fromSingleMatch({ id: { $eq: 1 } }))
		).toPreparedStatement();
		assert.deepEqual(preparedStatement, {
			where: "((NOT (id = $1)) OR (NOT (id = $2)))",
			join: [],
			parameters: [5, 1],
		});
	});
});
