type QueryStage = {
	$or: {};
	$nor: {};
	$and: {};
	$lookup: {};
	$match: {};
	[key: string]: any;
};

export default QueryStage;
