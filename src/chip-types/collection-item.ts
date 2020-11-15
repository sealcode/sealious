import Collection from "./collection";
import Context from "../context";
import {
	DeveloperError,
	BadContext,
	ValidationError,
} from "../response/errors";
import shortid from "shortid";
import { AttachmentOptions } from "./item-list";
import CollectionItemBody, { ItemFields } from "./collection-item-body";
import { PolicyDecision } from "./policy";

type ItemMetadata = {
	modified_at: Number;
	created_at: Number;
};

export type SerializedItem = ReturnType<CollectionItem["serialize"]>;
export type SerializedItemBody = ReturnType<CollectionItem["serializeBody"]>;

/** CollectionItem */
export class CollectionItem<T extends Collection = any> {
	id: string;

	fields_with_attachments: string[] = [];
	attachments: Record<string, CollectionItem<T>>;
	private attachments_loaded = false;
	private save_mode: "update" | "insert" = "insert";
	public original_body: CollectionItemBody;

	constructor(
		public collection: T,
		public body: CollectionItemBody,
		public _metadata: ItemMetadata = {
			modified_at: Date.now(),
			created_at: Date.now(),
		},
		id?: string,
		attachments?: Record<string, CollectionItem<T>>
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
	private async canSave(context: Context) {
		const action = this.save_mode === "insert" ? "create" : "edit";
		return this.collection.getPolicy(action).check(context);
	}

	private async canDelete(context: Context): Promise<PolicyDecision> {
		return this.collection
			.getPolicy("delete")
			.check(context, async () => this);
	}

	private async throwIfInvalid(context: Context) {
		context.app.Logger.debug3("ITEM", "Saving item/about to validate");
		const { valid, errors } = await this.body.validate(
			context,
			this.original_body
		);
		await this.gatherDefaultValues(context);
		context.app.Logger.debug3("ITEM", "Saving item/validation result", {
			valid,
			errors,
		});
		if (!valid) {
			throw new ValidationError("Invalid values!", errors);
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
			};
			await this.collection.emit("before:create", [context, this]);
			await this.throwIfInvalid(context);
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
			await this.collection.emit("after:create", [context, this]);
		} else {
			this._metadata.modified_at = Date.now();
			context.app.Logger.debug3("ITEM", "updating an existing item", {
				metadata: this._metadata,
			});
			await this.collection.emit("before:edit", [context, this]);
			await this.throwIfInvalid(context);
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
				!this.body.getInput(field_name) &&
				!this.body.getEncoded(field_name) &&
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
	set<FieldName extends keyof ItemFields<T>>(
		field_name: FieldName,
		field_value: ItemFields<T>[FieldName]
	): CollectionItem<T> {
		this.body.set(field_name, field_value);
		return this;
	}

	setMultiple(values: Partial<ItemFields<T>>) {
		for (const field_name in values) {
			this.set(field_name, values[field_name]);
		}
	}

	replace(values: Partial<ItemFields<T>>) {
		this.body = CollectionItemBody.empty<T>(this.collection);
		this.setMultiple(values);
	}

	get<FieldName extends keyof ItemFields<T>>(field_name: FieldName): any {
		if (this.fields_with_attachments.includes(field_name as string)) {
			return this.attachments[this.body.getDecoded(field_name) as string];
		}
		return this.body.getDecoded(field_name);
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
		context.app.Logger.debug("ITEM", "remove", this.id);
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

	async loadAttachments(
		context: Context,
		attachment_options: AttachmentOptions = {}
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
						[this.get(field.name)],
						attachment_options[field.name]
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
}
