export type HumanComparator =
	| ">"
	| "from"
	| "gt"
	| "gte"
	| ">="
	| "=>"
	| "<"
	| "to"
	| "lt"
	| "lte"
	| "<="
	| "=<"
	| "=";

export type DBComparator = "$gt" | "$gte" | "$lt" | "$lte" | "$eq";

const human_comparators_to_query: {
	[comparator in HumanComparator]: DBComparator;
} = {
	">": "$gt",
	from: "$gte",
	gt: "$gt",
	gte: "$gte",
	">=": "$gte",
	"=>": "$gte",
	"<": "$lt",
	to: "$lte",
	lt: "$lt",
	lte: "$lte",
	"<=": "$lte",
	"=<": "$lte",
	"=": "$eq",
};

export default function humanComparatorToQuery(
	comparator: HumanComparator
): DBComparator {
	return human_comparators_to_query[comparator];
}

export type ComparatorObject<T> = { [key in HumanComparator]: T };
