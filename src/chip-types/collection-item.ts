import type Collection from "./collection";
import type Context from "../context";
import {
	DeveloperError,
	BadContext,
	ValidationError,
	FieldsError,
} from "../response/errors";
import shortid from "shortid";
import type { AttachmentOptions, ItemListResult } from "./item-list";
import CollectionItemBody, {
	FieldNames,
	ItemFields,
	ItemFieldsOutput,
} from "./collection-item-body";
import type { PolicyDecision } from "./policy";
import isEmpty from "../utils/is-empty";

export type ItemMetadata = {
	modified_at: number;
	created_at: number;
	created_by: string | null;
};

export type SerializedItem = ReturnType<CollectionItem["serialize"]>;
export type SerializedItemBody = ReturnType<CollectionItem["serializeBody"]>;

/** CollectionItem */
export default class CollectionItem<T extends Collection = any> {
	id: string;

	fields_with_attachments: string[] = [];
	attachments: Record<string, CollectionItem<T>>;
	private attachments_loaded = false;
	private save_mode: "update" | "insert" = "insert";
	public original_body: CollectionItemBody;
	public has_been_replaced = false;
	private parent_list: ItemListResult<T> | null;

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
		collection.app.Logger.debug3("ITEM", "Creating an item from body", {
			body,
		});
		this.id = shortid();
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
						field_messages[field].push(
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
	async save(context: Context) {
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
			const encoded = await this.body.encode(context);
			context.app.Logger.debug3("ITEM", "creating a new item", {
				metadata: this._metadata,
			});
			await context.app.Datastore.insert(this.collection.name, {
				id: this.id,
				...encoded,
				_metadata: this._metadata,
			});
			await this.decode(context);
			this.save_mode = "update";
			await this.collection.emit("after:create", [context, this]);
		} else {
			this._metadata.modified_at = Date.now();
			context.app.Logger.debug3("ITEM", "updating an existing item", {
				metadata: this._metadata,
			});
			await this.collection.emit("before:edit", [context, this]);
			await this.throwIfInvalid("edit", context, this.has_been_replaced);
			const encoded = await this.body.encode(context);
			await context.app.Datastore.update(
				this.collection.name,
				{ id: this.id },
				{
					$set: { ...encoded, _metadata: this._metadata },
				}
			);
			await this.decode(context);
			await this.collection.emit("after:edit", [context, this]);
		}
		this.body.clearChangedFields();
		return this;
	}

	async gatherDefaultValues(context: Context) {
		context.app.Logger.debug2("ITEM", "Gathering default values");
		const promises = [];
		for (const field_name of Object.keys(this.collection.fields)) {
			if (
				isEmpty(this.body.getInput(field_name)) &&
				isEmpty(this.body.getEncoded(field_name)) &&
				this.collection.fields[field_name].hasDefaultValue()
			) {
				context.app.Logger.debug3(
					"ITEM",
					`Gathering default values/${field_name}`
				);
				promises.push(
					this.collection.fields[field_name]
						.getDefaultValue(context)
						.then((value) => {
							this.set(field_name, value);
						})
				);
			}
		}
		await Promise.all(promises);
	}

	/** sets a value */
	set<FieldName extends FieldNames<T>>(
		field_name: FieldName,
		field_value: ItemFields<T>[FieldName],
		blessed_symbol?: symbol
	): CollectionItem<T> {
		this.body.set(field_name, field_value, blessed_symbol);
		return this;
	}

	setMultiple(values: Partial<ItemFields<T>>): this {
		for (const [field_name, value] of Object.entries(values)) {
			this.set(field_name, value);
		}
		return this;
	}

	replace(values: Partial<ItemFields<T>>) {
		this.body = CollectionItemBody.empty<T>(this.collection);
		this.setMultiple(values);
		this.has_been_replaced = true;
	}

	get<FieldName extends FieldNames<T>>(
		field_name: FieldName,
		include_raw = false
	): ItemFieldsOutput<T>[FieldName] {
		if (include_raw) {
			if (this.body.raw_input[field_name]) {
				return this.body.raw_input[
					field_name
				] as ItemFieldsOutput<T>[FieldName];
			}
		}
		return this.body.getDecoded(
			field_name
		) as ItemFieldsOutput<T>[FieldName];
	}

	/**
	 * if has decoded value it return this otherwise it decode it in first place
	 * @param field_name name of field we want to get decoded
	 * @param context
	 */
	async getDecoded<FieldName extends FieldNames<T>>(
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
		format: Parameters<CollectionItemBody["decode"]>[1]
	) {
		if (!this.body.is_decoded) {
			await this.body.decode(context, format);
		}
		return this.body.decoded;
	}

	async remove(context: Context) {
		context.app.Logger.debug(
			"ITEM",
			"remove",
			this.collection.name,
			this.id
		);
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
		format: { [field_name: string]: any } = {}
	): Promise<CollectionItem<T>> {
		await this.body.decode(context, format);
		return this;
	}

	serializeBody(): { id: string } & ItemFields<T> {
		return { id: this.id, ...this.body.decoded } as {
			id: string;
		} & ItemFields<T>;
	}

	async safeLoadAttachments(context: Context, attachment_options: unknown) {
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
			attachment_options as AttachmentOptions<T>
		);
	}

	async loadAttachments(
		context: Context,
		attachment_options: AttachmentOptions<T> = {}
	): Promise<this> {
		// TODO: This function is kinda like a duplicate of `fetchAttachments` from ItemList?
		if (this.attachments_loaded) {
			throw new Error("Attachments already loaded");
		}
		this.attachments = {};
		const promises = [];
		for (const field of Object.values(this.collection.fields)) {
			promises.push(
				field
					.getAttachments(
						context,
						[this.get(field.name as FieldNames<T>)],
						attachment_options[field.name as FieldNames<T>]
					)
					.then((attachmentsList) => {
						if (!attachmentsList.empty) {
							this.fields_with_attachments.push(field.name);
						}
						this.attachments = {
							...this.attachments,
							...attachmentsList.flattenWithAttachments(),
						};
					})
			);
		}
		await Promise.all(promises);
		this.attachments_loaded = true;
		return this;
	}

	static fromSerialized<T extends Collection>(
		collection: T,
		data: { id: string; _metadata: ItemMetadata },
		attachments: { [id: string]: any }
	) {
		const body = CollectionItemBody.fromDecoded<T>(
			collection,
			data as Partial<ItemFields<T>>
		);
		return new CollectionItem<T>(
			collection,
			body,
			data._metadata,
			(data as { id: string }).id,
			attachments
		);
	}

	fetchAs(context: Context) {
		return this.collection.getByID(context, this.id);
	}

	getAttachments<FieldName extends FieldNames<T>>(
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

		const value = this.body.getDecoded(field_name) as string | string[];
		const ids = Array.isArray(value) ? value : [value];
		let attachments_source: Record<string, CollectionItem>;
		if (this.parent_list) {
			attachments_source = this.parent_list.attachments;
		} else if (this.attachments_loaded) {
			attachments_source = this.attachments;
		} else {
			throw new Error("Attachments list could not be reached");
		}
		return ids.map((id) => attachments_source[id]);
	}

	setParentList(list: ItemListResult<T>) {
		this.parent_list = list;
	}

	getBlessing<FieldName extends FieldNames<T>>(
		field_name: FieldName
	): symbol | null {
		return this.body.getBlessing(field_name);
	}
}
