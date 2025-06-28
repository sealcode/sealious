import Collection, { type Fieldnames } from "./collection.js";
import type Context from "../context.js";
import {
	DeveloperError,
	BadContext,
	ValidationError,
	FieldsError,
} from "../response/errors.js";
import { nanoid } from "nanoid";
import type { AttachmentOptions } from "./item-list.js";
import type { PolicyDecision } from "./policy.js";
import isEmpty from "../utils/is-empty.js";
import type { Fieldset, FieldsetInput, FieldsetOutput } from "./fieldset.js";
import CollectionItemBody from "./collection-item-body.js";
import type { ItemListResult } from "./item-list-result.js";

export type ItemMetadata = {
	modified_at: number;
	created_at: number;
	created_by: string | null;
};

export type SerializedItem = ReturnType<CollectionItem["serialize"]>;
export type SerializedItemBody = ReturnType<CollectionItem["serializeBody"]>;

export default class CollectionItem<T extends Collection = any> {
	id: string;

	fields_with_attachments: string[] = [];
	attachments: Record<string, CollectionItem>;
	private attachments_loaded = false;
	private save_mode: "update" | "insert" = "insert";
	public original_body: CollectionItemBody;
	public has_been_replaced = false;
	public parent_list: ItemListResult<T> | null;

	constructor(
		public collection: T,
		public body: CollectionItemBody,
		public _metadata: ItemMetadata = {
			modified_at: Date.now(),
			created_at: Date.now(),
			created_by: null,
		},
		id?: string,
		attachments?: Record<string, CollectionItem>
	) {
		collection.app.Logger.debug3("ITEM", "Creating an item from fieldset", {
			body,
		});
		this.id = nanoid();
		if (id) {
			this.id = id;
			this.save_mode = "update";
		}
		if (attachments) {
			this.attachments_loaded = true;
		}
		this.original_body = body.copy();
		this.attachments = attachments || {};
	}

	/** Checks whether or not it is allowed to save the given item to the DB using given context */
	private async canSave(context: Context): Promise<PolicyDecision> {
		const action = this.save_mode === "insert" ? "create" : "edit";
		return this.collection
			.getPolicy(action)
			.check(context, async () => this);
	}

	private async canDelete(context: Context): Promise<PolicyDecision> {
		return this.collection
			.getPolicy("delete")
			.check(context, async () => this);
	}

	private async throwIfInvalid(
		action: "create" | "edit",
		context: Context,
		replace_mode: boolean //if true, meaning that if a field has no value, it should be deleted
	) {
		context.app.Logger.debug3("ITEM", "Saving item/about to validate");
		const { valid, errors } = await this.body.validate(
			context,
			this.original_body,
			replace_mode
		);
		await this.gatherDefaultValues(context);
		context.app.Logger.debug3("ITEM", "Saving item/validation result", {
			valid,
			errors,
		});
		if (!valid) {
			throw new FieldsError(this.collection, errors);
		}
		const collection_validation_errors = await this.collection.validate(
			context,
			this.body,
			this.original_body,
			action
		);
		if (collection_validation_errors.length > 0) {
			const field_messages = {} as Record<string, string[]>;
			const other_messages = [] as string[];
			for (const collection_validation_error of collection_validation_errors) {
				if ((collection_validation_error.fields || []).length == 0) {
					other_messages.push(collection_validation_error.error);
				} else {
					for (const field of collection_validation_error.fields ||
						[]) {
						if (!field_messages[field]) {
							field_messages[field] = [];
						}
						field_messages[field]!.push(
							collection_validation_error.error
						);
					}
				}
			}
			throw new FieldsError(
				this.collection,
				Object.fromEntries(
					Object.entries(field_messages).map(([field, value]) => [
						field,
						{ message: value.join(" | ") },
					])
				),
				other_messages
			);
		}
	}

	/** Save the item to the database */
	async save(context: Context, is_http_api_request = false) {
		context.app.Logger.debug2("ITEM", "Saving item", this.body);
		const can_save = await this.canSave(context);
		if (can_save === null) {
			throw new DeveloperError("Policy didn't give a verdict");
		}
		if (!can_save?.allowed) {
			throw new BadContext(can_save.reason);
		}
		if (this.save_mode === "insert") {
			this._metadata = {
				created_at: Date.now(),
				modified_at: Date.now(),
				created_by: context.user_id,
			};
			await this.collection.emit("before:create", [context, this]);
			await this.throwIfInvalid("create", context, true);
			const encoded = await this.body.encode(context, {});
			context.app.Logger.debug3("ITEM", "creating a new item", {
				metadata: this._metadata,
			});
			await context.app.Datastore.insert(this.collection.name, {
				id: this.id,
				...encoded,
				_metadata: this._metadata,
			});
			await this.decode(context, {}, is_http_api_request);
			this.save_mode = "update";
			await this.collection.emit("after:create", [context, this]);
		} else {
			// save mode is "edit"
			this._metadata.modified_at = Date.now();
			context.app.Logger.debug3("ITEM", "updating an existing item", {
				metadata: this._metadata,
			});
			await this.collection.emit("before:edit", [context, this]);
			await this.throwIfInvalid("edit", context, this.has_been_replaced);
			await this.original_body.decode(context);
			const encoded = await this.body.encode(
				context,
				this.original_body.decoded,
				true
			);
			await context.app.Datastore.update(
				this.collection.name,
				{ id: this.id },
				{
					$set: { ...encoded, _metadata: this._metadata },
				}
			);
			await this.decode(context, {}, is_http_api_request);
			await this.collection.emit("after:edit", [context, this]);
		}
		this.body.clearChangedFields();
		this.original_body = this.body;
		this.body = this.body.copy();
		await this.decode(context, {}, is_http_api_request);
		return this;
	}

	async gatherDefaultValues(context: Context) {
		context.app.Logger.debug2("ITEM", "Gathering default values");
		const promises = [];
		for (const field_name of Collection.getFieldnames(this.collection)) {
			const fieldName = this.collection.fields[field_name];

			if (!fieldName) {
				throw new Error(`field is missing: "${field_name}"`);
			}

			if (
				isEmpty(this.body.getInput(field_name)) &&
				isEmpty(this.body.getEncoded(field_name)) &&
				fieldName.hasDefaultValue()
			) {
				context.app.Logger.debug3(
					"ITEM",
					`Gathering default values/${field_name}`
				);
				promises.push(
					fieldName.getDefaultValue(context).then((value) => {
						this.set(field_name, value);
					})
				);
			}
		}
		await Promise.all(promises);
	}

	/** sets a value */
	set<FieldName extends Fieldnames<T>>(
		field_name: FieldName,
		field_value: FieldsetInput<T["fields"]>[FieldName],
		blessed_symbol?: symbol
	): CollectionItem<T> {
		this.body.set(field_name, field_value, blessed_symbol);
		return this;
	}

	setMultiple(values: Partial<FieldsetInput<T["fields"]>>): this {
		for (const [field_name, value] of Object.entries(values)) {
			this.set(field_name as Fieldnames<T>, value as any);
		}
		return this;
	}

	replace(values: Partial<FieldsetInput<T["fields"]>>) {
		this.body = CollectionItemBody.empty<T>(this.collection);
		this.setMultiple(values);
		this.has_been_replaced = true;
	}

	get<FieldName extends Fieldnames<T>>(
		field_name: FieldName,
		include_raw = false
	): FieldsetOutput<T["fields"]>[FieldName] {
		if (include_raw) {
			if (this.body.raw_input[field_name]) {
				return this.body.raw_input[field_name] as FieldsetOutput<
					T["fields"]
				>[FieldName];
			}
		}
		return this.body.getDecoded(field_name) as FieldsetOutput<
			T["fields"]
		>[FieldName];
	}

	/**
	 * if has decoded value it return this otherwise it decode it in first place
	 * @param field_name name of field we want to get decoded
	 * @param context
	 */
	async getDecoded<FieldName extends Fieldnames<T>>(
		field_name: FieldName,
		context: Context
	): Promise<unknown> {
		if (this.body.raw_input[field_name]) {
			await this.body.encode(context);
			await this.body.decode(context);
			return this.body.decoded[field_name];
		}

		if (this.body.encoded[field_name]) {
			await this.body.decode(context);
			return this.body.decoded[field_name];
		}
	}

	async getDecodedBody(
		context: Context,
		format: Parameters<Fieldset<T["fields"]>["decode"]>[1]
	) {
		if (!this.body.is_decoded) {
			await this.body.decode(context, format);
		}
		return this.body.decoded;
	}

	async remove(context: Context) {
		context.app.Logger.debug("ITEM", "remove", this.collection.name);
		if (this.save_mode === "insert") {
			throw new Error("This item does not yet exist in the database");
		}
		const decision = await this.canDelete(context);
		if (!decision?.allowed) {
			throw new BadContext(decision?.reason || "Not allowed");
		}
		await this.collection.emit("before:remove", [context, this]);
		await context.app.Datastore.remove(
			this.collection.name,
			{ id: this.id },
			true
		);
		await this.collection.emit("after:remove", [context, this]);
	}

	async delete(context: Context) {
		return this.remove(context);
	}

	serialize(): {
		items: any[];
		attachments: Record<string, any>;
		fields_with_attachments: string[];
	} {
		if (!this.body.is_decoded) {
			throw new Error("First decode the item");
		}
		return {
			items: [this.serializeBody()],
			attachments: Object.fromEntries(
				Object.values(this.attachments).map((item) => [
					item.id,
					item.serializeBody(),
				])
			),
			fields_with_attachments: this.fields_with_attachments,
		};
	}

	async decode(
		context: Context,
		format: { [field_name: string]: any } = {},
		is_http_api_request = false
	): Promise<CollectionItem<T>> {
		await this.body.decode(context, format, is_http_api_request);
		return this;
	}

	serializeBody(): { id: string } & FieldsetOutput<T["fields"]> {
		return { id: this.id, ...this.body.decoded } as {
			id: string;
		} & FieldsetOutput<T["fields"]>;
	}

	async safeLoadAttachments(
		context: Context,
		attachment_options: unknown,
		format: Parameters<Fieldset<T["fields"]>["decode"]>[1]
	) {
		if (attachment_options === undefined) {
			attachment_options = {};
		}
		if (typeof attachment_options != "object") {
			throw new ValidationError(
				`Expected attachment params to be an object, got ${JSON.stringify(
					attachment_options
				)}`
			);
		}
		for (const key in attachment_options) {
			if (!(key in this.collection.fields)) {
				throw new ValidationError(
					`Unknown field name in attachments param: ${key}`
				);
			}
		}
		return this.loadAttachments(
			context,
			attachment_options as AttachmentOptions<T>,
			format
		);
	}

	async loadAttachments(
		context: Context,
		attachment_options: AttachmentOptions<T> = {},
		format: Parameters<Fieldset<T["fields"]>["decode"]>[1]
	): Promise<this> {
		// TODO: This function is kinda like a duplicate of `fetchAttachments` from ItemList?
		if (this.attachments_loaded) {
			throw new Error("Attachments already loaded");
		}
		this.attachments = {};
		const promises = [];
		for (const field_name of Object.keys(attachment_options)) {
			const field = this.collection.fields[field_name];
			if (!field) {
				throw new Error(
					`Unknown field: ${field_name} in ${this.collection.name}`
				);
			}
			const promise = field
				.getAttachments(
					context,
					[
						this.get(
							field.name as Fieldnames<typeof this.collection>
						),
					],
					attachment_options[field.name as keyof T["fields"]],
					(format || {})[field.name] || null
				)
				.then((attachmentsList) => {
					this.fields_with_attachments.push(field.name);
					this.attachments = {
						...this.attachments,
						...attachmentsList.flattenWithAttachments(),
					};
				});
			promises.push(promise);
		}
		await Promise.all(promises);
		this.attachments_loaded = true;
		return this;
	}

	static fromSerialized<T extends Collection>(
		collection: T,
		data: { id: string; _metadata: ItemMetadata },
		attachments: { [id: string]: any }
	): CollectionItem<T> {
		const fieldset = CollectionItemBody.fromDecoded<T>(
			collection,
			data as Partial<FieldsetOutput<T["fields"]>>
		);
		return new CollectionItem<T>(
			collection,
			fieldset,
			data._metadata,
			(data as { id: string }).id,
			attachments
		);
	}

	fetchAs(context: Context): Promise<CollectionItem<T>> {
		return this.collection.getByID(context, this.id);
	}

	getAttachmentIDs<FieldName extends keyof T["fields"]>(
		field_name: FieldName
	): string[] {
		const value = this.body.getDecoded(field_name) as string | string[];
		return (
			this.collection.fields[field_name as string]?.getAttachmentIDs(
				value
			) || []
		);
	}

	getAttachments<FieldName extends keyof T["fields"]>(
		field_name: FieldName
	): CollectionItem[] {
		if (
			!this.fields_with_attachments.includes(field_name as string) &&
			!this.parent_list?.fields_with_attachments.includes(
				field_name as string
			)
		) {
			throw new Error("No attachments loaded for this field");
		}
		if (!this.body.decoded) {
			throw new Error("Decode first!");
		}

		const ids = this.getAttachmentIDs(field_name);
		let attachments_source: Record<string, CollectionItem>;
		if (this.parent_list) {
			attachments_source = this.parent_list.attachments;
		} else if (this.attachments_loaded) {
			attachments_source = this.attachments;
		} else {
			throw new Error("Attachments list could not be reached");
		}
		return ids
			.map((id) => attachments_source[id])
			.filter((e) => !!e) as CollectionItem<any>[];
	}

	setParentList(list: ItemListResult<T>) {
		this.parent_list = list;
	}

	getBlessing<FieldName extends keyof T["fields"]>(
		field_name: FieldName
	): symbol | null {
		return this.body.getBlessing(field_name);
	}

	async summarizeChanges(
		context: Context
	): Promise<Record<keyof T["fields"], { was: unknown; is: unknown }>> {
		if (!this.original_body.is_decoded) {
			await this.original_body.decode(context);
		}
		const changed_keys = this.body.changed_fields;
		const result = {} as Record<
			keyof T["fields"],
			{ was: unknown; is: unknown }
		>;
		for (const changed_key of changed_keys as Set<keyof T["fields"]>) {
			const was = this.original_body.getDecoded(changed_key);
			const is = this.body.getInput(changed_key as string);
			if (was != is) {
				result[changed_key] = {
					was,
					is,
				};
			}
		}
		return result;
	}
}
