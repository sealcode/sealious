export class FieldTypeDescription {
	summary: string;
	raw_params: any;
	extra_info: any;
	constructor(summary: string, raw_params: any, extra_info: any) {
		this.summary = summary;
		this.raw_params = raw_params;
		this.extra_info = extra_info || {};
	}
}
