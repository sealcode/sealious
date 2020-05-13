export default interface Item {
	_metadata: {
		collection: string;
		collection_name: string;
		created_context: {};
	};
	calculated_fields: {};
	id: string;
	[field_name: string]: Array<string> | string | number | boolean | object;
}
