type ExtractParams<F> = F extends Field<infer T, any> ? T : never;
type ExtractInputType<F> = F extends Field<any, infer T> ? T : never;
type ExtractOutputType<F> = F extends Field<any, any, infer T> ? T : never;
type ExtractStorageType<F> = F extends Field<any, any, any, infer T>
	? T
	: never;
type ExtractFormatParams<F> = F extends Field<any, any, any, any, infer T>
	? T
	: never;

type RefreshCondition = {
	event_matcher: EventMatcher;
	resource_id_getter: (
		emitted_event: EventDescription,
		response: any
	) => Promise<string>;
};

type GetValue<T> = (
	context: Context,
	resource_id: string
) => Promise<ExtractInputType<T>>;

export default abstract class HybridField <T extends Field> extends Field<
	{
		base_field_type: { new (d: FieldDefinition): T };
		base_field_params: ExtractParams<T>;
		refresh_on: RefreshCondition[];
		get_value: GetValue<T>;
	},
	ExtractInputType<T>,
	ExtractOutputType<T>,
	ExtractStorageType<T>,
	ExtractFormatParams<T>
> 
