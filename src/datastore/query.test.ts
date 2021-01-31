import Query, { And, Not, Or, QueryStage } from "./query";
import * as assert from "assert";
import QueryStep, {
	SimpleLookupBody,
	SimpleLookup,
	Lookup,
	LookupBody,
	SimpleLookupBodyInput,
} from "./query-step";
import DenyAll from "./deny-all";

describe("Query", () => {
	describe("Query general", () => {
		it("Creates correct query from custom pipeline", () => {
			const pipeline: QueryStage[] = [
				{ $match: { title: { $ne: "The Joy of PHP" }, edition: 1 } },
				{
					$lookup: {
						from: "authors",
						localField: "author",
						foreignField: "_id",
						as: "author_item",
					},
				},
				{
					$unwind: "$author_item",
				},
				{ $match: { "author_item.name": { $regex: "some_regex" } } },
				{
					$lookup: {
						from: "states",
						localField: "author.state",
						foreignField: "_id",
						as: "state_item",
					},
				},
				{ $unwind: "$state_item" },
				{
					$match: {
						$or: [
							{ "author_item.age": { $le: 30 } },
							{ edition: { $gt: 3 } },
						],
						"state_item.abbrevation": { $eq: "PL" },
					},
				},
			];

			const query = Query.fromCustomPipeline(pipeline, true);

			const authors_hash = Lookup.hashBody({
				...pipeline[1].$lookup,
				unwind: false,
			} as LookupBody);

			const states_hash = Lookup.hashBody({
				...pipeline[4].$lookup,
				unwind: false,
			} as SimpleLookupBody);

			const expected_pipeline = [
				{ $match: { title: { $ne: "The Joy of PHP" } } },
				{ $match: { edition: 1 } },
				{
					$lookup: {
						from: "authors",
						localField: "author",
						foreignField: "_id",
						as: authors_hash,
					},
				},
				{
					$unwind: "$" + authors_hash,
				},
				{
					$match: {
						[`${authors_hash}.name`]: {
							$regex: "some_regex",
						},
					},
				},
				{
					$lookup: {
						from: "states",
						localField: "author.state",
						foreignField: "_id",
						as: states_hash,
					},
				},
				{ $unwind: "$" + states_hash },
				{
					$match: {
						$or: [
							{ [`${authors_hash}.age`]: { $le: 30 } },
							{ edition: { $gt: 3 } },
						],
					},
				},
				{ $match: { [`${states_hash}.abbrevation`]: { $eq: "PL" } } },
			];

			assert.deepStrictEqual(query.toPipeline(), expected_pipeline);
		});
	});
	describe("Query.Or", () => {
		it("Returns correct pipeline stages for simple case", () => {
			const queries = [];

			const M1 = {
				title: { $ne: "The Joy of PHP" },
			};
			queries.push(Query.fromSingleMatch(M1));

			let query = new Query();
			const L2: SimpleLookupBody = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
				as: "author", //included for type safety during typescript migration
			};
			const L2_id = query.lookup(L2);
			const M3 = {
				[`${L2_id}.last_name`]: { $in: ["Scott", "Dostoyevsky"] },
			};
			query.match(M3);
			queries.push(query);

			const or = new Or(...queries);

			const expected_pipeline = [
				{
					$lookup: {
						from: L2.from,
						localField: L2.localField,
						foreignField: L2.foreignField,
						as: L2_id,
					},
				},
				{ $unwind: `$${L2_id}` },
				{ $match: { $or: [M1, M3] } },
			];
			assert.deepStrictEqual(or.toPipeline(), expected_pipeline);
		});

		it("Returns correct pipeline stages when And query is provided", () => {
			let queries = [];
			let subquery = new Query();

			const L1: SimpleLookupBodyInput = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
			};
			const L1_id = subquery.lookup(L1);
			const M2 = {
				[`${L1_id}.last_name`]: { $in: ["Christie", "Rowling"] },
			};
			subquery.match(M2);
			queries.push(subquery);

			const M3 = {
				title: { $ne: "The Joy of PHP" },
			};
			queries.push(Query.fromSingleMatch(M3));
			const and_1 = new And(...queries);

			queries = [];
			subquery = new Query();
			const L4: SimpleLookupBodyInput = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
			};
			const L4_id = subquery.lookup(L4);
			const M4 = {
				[`${L4_id}.middle_name`]: { $in: ["Brown", "Black"] },
			};
			subquery.match(M4);
			queries.push(subquery);

			subquery = new Query();

			subquery.lookup(L4);
			const L5: SimpleLookupBodyInput = {
				from: "publisher",
				localField: `${L4_id}.publisher`,
				foreignField: "publisher_id",
				unwind: true,
			};
			const L5_id = subquery.lookup(L5);

			const M6 = {
				$or: [
					{ [`${L4_id}.first_name`]: "Ann" },
					{ [`${L5_id}.income`]: { $gt: 1000 } },
				],
			};
			subquery.match(M6);

			const M7 = {
				price: { $lte: 100 },
			};
			subquery.match(M7);
			queries.push(subquery);
			const and_2 = new And(...queries);

			const query = new Or(and_1, and_2);

			const expected_pipeline = makeQueryFromStageBodies([
				L1,
				L4,
				L5,
				{
					$or: [{ $and: [M3, M2] }, { $and: [M7, M4, M6] }],
				},
			]).toPipeline();
			assert.deepStrictEqual(expected_pipeline, query.toPipeline());
		});
	});

	describe("QueryTypes.Not", () => {
		it("Correctly converts or to nor and vice versa", () => {
			const query = new Or(
				Query.fromSingleMatch({ pages: { $gt: 200 } }),
				Query.fromSingleMatch({ title: { $eq: "The Joy of PHP" } })
			);
			let negated_query = new Not(query);

			const expected_pipeline: any = query.toPipeline();
			expected_pipeline[0].$match.$nor = expected_pipeline[0].$match.$or;
			delete expected_pipeline[0].$match.$or;

			assert.deepStrictEqual(
				negated_query.toPipeline(),
				expected_pipeline
			);
			assertQueryEqualsDoubleNegatedQuery(query, negated_query);
		});

		it("Correctly converts query with lookup", () => {
			const query = new Query();
			const L1: SimpleLookupBody = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				as: "author", //added during typescript migration for type safety
			};
			const L1_id = query.lookup(L1);
			query.match({
				[`${L1_id}.last_name`]: { $in: ["Christie", "Rowling"] },
			});

			let negated_query = new Not(query);
			const expected_pipeline: any = query.toPipeline();
			expected_pipeline[1].$match = {
				[`${L1_id}.last_name`]: {
					$not: expected_pipeline[1].$match[`${L1_id}.last_name`],
				},
			};

			assert.deepStrictEqual(
				negated_query.toPipeline(),
				expected_pipeline
			);
			assertQueryEqualsDoubleNegatedQuery(query, negated_query);
		});

		it("Correctly converts query with complex stages", () => {
			const query = new Query();
			const stage = {
				$and: [
					{ pages: { $gt: 200 } },
					{ title: { $in: ["Clean Code", "The Joy of JS"] } },
					{ printed: { $not: { $gte: 10000 } } },
				],
			};
			query.match(stage);

			let negated_query = new Not(query);
			const expected_pipeline: any[] = [
				{
					$match: {
						$or: [
							{ pages: { $not: stage.$and[0].pages } },
							{ title: { $not: stage.$and[1].title } },
							{ printed: stage.$and[2].printed?.$not },
						],
					},
				},
			];
			assert.deepStrictEqual(
				negated_query.toPipeline(),
				expected_pipeline
			);

			expected_pipeline[0].$match = {
				$nor: expected_pipeline[0].$match.$or,
			};
			const double_negated_query = new Not(negated_query);
			assert.deepStrictEqual(
				double_negated_query.toPipeline(),
				expected_pipeline
			);
		});

		function assertQueryEqualsDoubleNegatedQuery(
			query: Query,
			negated_query: Query
		) {
			const double_negated_query = new Not(negated_query);
			assert.deepStrictEqual(
				double_negated_query.toPipeline(),
				query.toPipeline()
			);
		}
	});

	describe("QueryTypes.And", () => {
		it("Returns pipeline stages in correct order for simple case", () => {
			const queries = [];
			let query = new Query();

			const L1 = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
			};
			const L1_id = query.lookup(L1);
			const M2 = {
				[`${L1_id}.last_name`]: { $in: ["Christie", "Rowling"] },
			};
			query.match(M2);
			queries.push(query);

			const M3 = {
				title: { $ne: "The Joy of PHP" },
			};
			queries.push(Query.fromSingleMatch(M3));

			const and = new And(...queries);
			const stageBodies = [M3, L1, M2];
			assertStagesAreCorrectlyOrdered(stageBodies, and.toPipeline());
			assert.deepStrictEqual(makeSteps(stageBodies), and.dump());
		});

		function assertStagesAreCorrectlyOrdered(
			expectedRawPipeline: any[],
			actualPipeline: any[]
		) {
			const query = makeQueryFromStageBodies(expectedRawPipeline);
			assert.deepStrictEqual(actualPipeline, query.toPipeline());
		}

		function makeSteps(stageBodies: any[]) {
			return stageBodies.reduce((acc, stageBody) => {
				if (stageBody instanceof Or) {
					return acc.concat(stageBody.dump());
				}
				if ((stageBody as SimpleLookupBody).from) {
					return acc.concat(
						new SimpleLookup(stageBody as SimpleLookupBody)
					);
				}
				return acc.concat(Query.fromSingleMatch(stageBody).dump());
			}, []);
		}

		it("Returns pipeline stages in correct order for complex case", () => {
			const queries = [];
			let query = new Query();

			const L1 = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
			};
			const L1_id = query.lookup(L1);

			const L2 = {
				from: "publisher",
				localField: `${L1_id}.publisher`,
				foreignField: "publisher_id",
				unwind: true,
			};
			const L2_id = query.lookup(L2);

			const M3_4 = {
				[`${L2_id}.city`]: { $in: ["A", "B"] },
				$or: [
					{ [`${L1_id}.first_name`]: "Ann" },
					{ [`${L2_id}.income`]: { $gt: 1000 } },
				],
			};
			query.match(M3_4);
			queries.push(query);

			query = new Query();
			const M5 = {
				title: { $ne: "The Joy of PHP" },
			};
			query.match(M5);
			queries.push(query);

			let subquery1 = new Query();
			const O6_L1 = {
				from: "libraries",
				localField: "first_library",
				foreignField: "library_id",
			};
			const O6_L1_id = subquery1.lookup(O6_L1);

			const O6_M1 = {
				[`${O6_L1_id}.street`]: { $in: ["A street", "B street"] },
				[`${O6_L1_id}.open_at_night`]: { $eq: true },
			};
			subquery1.match(O6_M1);

			const O6_M2 = {
				books_count: { $lte: 30 },
			};
			let subquery2 = Query.fromSingleMatch(O6_M2);
			const O6 = new Or(subquery1, subquery2);
			queries.push(O6);

			const O7_M1 = {
				title: {
					$in: ["PHP - Python Has Power", "The Good Parts of JS"],
				},
			};
			const O7_M2 = O6_M2;
			const O7 = new Or(
				Query.fromSingleMatch(O7_M1),
				Query.fromSingleMatch(O7_M2)
			);
			queries.push(O7);

			query = new Query();
			const L8 = {
				from: "cover_types",
				localField: "cover",
				foreignField: "cover_type_id",
				unwind: true,
			};
			const L8_id = query.lookup(L8);

			const M9 = {
				[`${L8_id}.name`]: { $ne: "hard" },
			};
			query.match(M9);
			queries.push(query);

			query = new Query();
			// check if hashing is order insensitive
			const L10 = {
				localField: "cover",
				from: "cover_types",
				foreignField: "cover_type_id",
				unwind: true,
			};
			const L10_id = query.lookup(L10);
			const M11 = {
				[`${L10_id}.name`]: { $ne: "no_cover" },
			};
			query.match(M11);
			queries.push(query);

			const stageBodies = [M5, O7, L8, M9, M11, O6, L1, L2, M3_4];
			let and = new And(...queries);
			assertStagesAreCorrectlyOrdered(stageBodies, and.toPipeline());
			assert.deepEqual(makeSteps(stageBodies), and.dump());
		});
		it("Returns deny all pipeline when provided DenyAll", () => {
			const queries: Query[] = [];
			let query = new Query();

			const L1 = {
				from: "authors",
				localField: "author",
				foreignField: "_id",
				unwind: true,
				as: "author", //added during typescript migration for type safety
			};
			const L1_id = query.lookup(L1);
			const M2 = {
				[`${L1_id}.last_name`]: { $in: ["Christie", "Rowling"] },
			};
			query.match(M2);
			queries.push(query);

			const deny_all_query = new DenyAll();
			queries.push(deny_all_query);

			const M3 = {
				title: { $ne: "The Joy of PHP" },
			};
			queries.push(Query.fromSingleMatch(M3));

			const and = new And(...queries);
			assert.deepEqual(and.toPipeline(), deny_all_query.toPipeline());
			assert.deepEqual(and.dump(), deny_all_query.dump());
		});
	});
});

function makeQueryFromStageBodies(stageBodies: any[]) {
	const query = new Query();
	for (let i = 0; i < stageBodies.length; ++i) {
		const stage = stageBodies[i];
		if (stage instanceof Query) {
			query.steps.push(...stage.dump());
		} else if (stage.from) {
			query.lookup(stage);
		} else {
			for (let step of Object.keys(stage)) {
				query.match({ [step]: stage[step] });
			}
		}
	}
	return query;
}

function hashLookup({ $lookup }: { $lookup: SimpleLookupBody }) {
	const { as, ...lookup_without_as } = $lookup;
	return QueryStep.hashBody(lookup_without_as);
}
