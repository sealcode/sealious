type QueryStage = Partial<{
	$not: QueryStage;
	$match: any;
	$lookup: any;
	$search: any;
	$unwind: any;
	$nor: any;
	$or: QueryStage[];
	$and: QueryStage[];
	$group: {
		_id: string;
		[other: string]: any;
	};
}>;

export default QueryStage;
