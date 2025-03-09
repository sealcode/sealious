import type { ComplexLookupBody, SimpleLookupBody } from "./query-step.js";

export type MatchBody = Partial<{
	$not: MatchBody;
	$search: any;
	$nor: MatchBody[];
	$or: MatchBody[];
	$and: MatchBody[];
	[field: string]: unknown;
}>;

export type QueryStage = Partial<{
	$match: MatchBody;
	$lookup: SimpleLookupBody | ComplexLookupBody;
	$unwind: string;
	$skip: number;
	$limit: number;
	$sort: { [field_name: string]: 1 | -1 };
	$group: {
		_id: string;
		[other: string]: any;
	};
	$count: string;
	$unset: string;
}>;
