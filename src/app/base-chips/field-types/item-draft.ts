import type Collection from "../../../chip-types/collection.js";
import Field, { type ValidationResult } from "../../../chip-types/field.js";
import type {
	FieldsetInput,
	FieldsetOutput,
} from "../../../chip-types/fieldset.js";
import type Context from "../../../context.js";
import { FieldsError } from "../../../response/errors.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import type { App } from "../../app.js";

export class ItemDraftObject<C extends Collection> {
	constructor(
		public target_collection: C,
		public input: FieldsetInput<C["fields"]>
	) {}

	async decode(
		context: Context,
		is_for_http: boolean
	): Promise<Partial<FieldsetOutput<C["fields"]>>> {
		const item = this.target_collection.make();
		item.setMultiple(this.input);
		return await item.getDecodedBody(context, {}, is_for_http);
	}

	async finalize(context: Context) {
		return this.target_collection.create(context, this.input);
	}
}

export class ItemDraft<
	C extends Collection,
	InputType extends FieldsetInput<C["fields"]> = FieldsetInput<C["fields"]>,
> extends Field<ItemDraftObject<C>, InputType> {
	typeName = "item-draft";
	target_collection: C;

	open_api_type: OpenApiTypes = OpenApiTypes.BOOL;

	constructor(public target_collection_name: string) {
		super();
	}

	async init(app: App): Promise<void> {
		app.on("started", () => {
			this.target_collection = app.collections[
				this.target_collection_name
			] as C;
		});
	}

	async hasIndex(): Promise<boolean> {
		return true;
	}

	async getMatchQueryValue(context: Context, filter: "" | null | InputType) {
		if (filter === "") {
			return { $exists: false };
		} else if (filter === null) {
			return { $in: [true, false] };
		} else {
			return this.encode(context, filter);
		}
	}

	protected async isProperValue(
		context: Context,
		new_value: InputType,
		_old_value: InputType,
		_new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		const item = this.target_collection.make();
		item.setMultiple(new_value);
		try {
			await item.throwIfInvalid("create", context, true);
		} catch (e) {
			if (e instanceof FieldsError) {
				return {
					valid: false,
					reason: JSON.stringify(e.field_messages),
				};
			}
			return { valid: false, reason: e.toString() };
		}

		return {
			valid: true,
		};
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" BOOLEAN`];
	}

	async decode(
		context: Context,
		storage_value: ItemDraftObject<C>,
		old_value: any,
		format_params: any,
		is_http_api_request?: boolean
	): Promise<ItemDraftObject<C> | null> {
		const draft = new ItemDraftObject(
			this.target_collection,
			storage_value as any
		);
		if (is_http_api_request) {
			return draft.decode(context, is_http_api_request) as any;
		}
		return draft;
	}
}
