type QueryStage = Partial<{
	$not: QueryStage;
	$match: any;
	$lookup: any;
	$search: any;
	$unwind: string;
	$nor: any;
	$or: QueryStage[];
	$and: QueryStage[];
	$skip: number;
	$limit: number;
	$sort: { [field_name: string]: 1 | -1 };
	$group: {
		_id: string;
		[other: string]: any;
	};
}>;

export default QueryStage;
