import type Koa from "koa";
import Router from "@koa/router";
import Emittery from "emittery";
import type { ActionName } from "../action.js";
import type { App } from "../app/app.js";
import Public from "../app/policy-types/public.js";
import type Context from "../context.js";
import parseBody from "../http/parse-body.js";
import { BadContext, NotFound } from "../response/errors.js";
import type CalculatedField from "./calculated-field.js";
import CollectionItem, { type ItemMetadata } from "./collection-item.js";
import CollectionItemBody from "./collection-item-body.js";
import type Field from "./field.js";
import type {
	FieldsetEncoded,
	FieldsetInput,
	FieldsetOutput,
} from "./fieldset.js";
import ItemList, { type SortParams } from "./item-list.js";
import type Policy from "./policy.js";
import type SpecialFilter from "./special-filter.js";
import type { CollectionProperties } from "../schemas/generator.js";

export type CollectionEvent =
	| "before:create"
	| "after:create"
	| "before:remove"
	| "after:remove"
	| "before:edit"
	| "after:edit";

export type CollectionCallback = ([context, item, event]: [
	Context,
	CollectionItem,
	CollectionEvent,
]) => Promise<void>;

export type CollectionValidationResult = { error: string; fields: string[] }[];

export type CollectionOutput<T extends Collection> = FieldsetOutput<
	T["fields"]
>;

export type CollectionInput<T extends Collection> = FieldsetInput<T["fields"]>;

export type CollectionEncoded<T extends Collection> = FieldsetEncoded<
	T["fields"]
>;

export type Fieldnames<T extends Collection> = keyof T["fields"] & string;

/** Creates a collection. All collections are automatically served via
 * the REST API, with permissions set by the Policies */
export default abstract class Collection {
	abstract fields: Record<string, Field<any>>;
	private emitter = new Emittery();

	/** the name of the collection, will be used as part of the URI in
	 * the REST API */
	name: string;

	/** policies for this collection. Who can do what */
	policies: Partial<{ [a in ActionName]: Policy }> = {};

	/** The policy to use when deciding on an action not specified in
	 * `policies` */
	defaultPolicy: Policy = new Public();

	/** The app this collection is tied to */
	app: App;

	/** Whether or not should be visible in docs */
	internal = false;

	named_filters: Record<string, SpecialFilter> = {};

	calculated_fields: Record<string, CalculatedField<unknown>> = {};

	/** initializes the fields @internal */
	async initFieldDetails(): Promise<void> {
		const promises = [];
		for (const [field_name, field] of Object.entries(this.fields)) {
			field.setCollection(this);
			promises.push(field.init(this.app, this));
			field.setName(field_name);
		}
		await Promise.all(promises);
	}

	async suCreate(data: CollectionInput<this>): Promise<CollectionItem<this>> {
		return this.create(new this.app.SuperContext(), data);
	}

	/* the "unsafe" flavor of CRUD functions are meant for cases where you want
	to just get the errror message and parse it - for example, when you want to
	get a nice error that can be used to display errors in a form */
	async suCreateUnsafe(
		data: Record<string, unknown>
	): Promise<CollectionItem<this>> {
		return this.createUnsafe(new this.app.SuperContext(), data);
	}

	async create(
		context: Context,
		data: CollectionInput<this>
	): Promise<CollectionItem<this>> {
		return this.make(data).save(context);
	}

	/* the "unsafe" flavor of CRUD functions are meant for cases where you want
	to just get the errror message and parse it - for example, when you want to
	get a nice error that can be used to display errors in a form */
	async createUnsafe(
		context: Context,
		data: Record<string, unknown>
	): Promise<CollectionItem<this>> {
		return this.make(data as Partial<CollectionInput<this>>).save(context);
	}

	/** Makes a new item object that can be saved later */
	make(input?: Partial<CollectionInput<this>>): CollectionItem<this> {
		return new CollectionItem<this>(
			this,
			new CollectionItemBody(this, input, {}, {})
		);
	}

	async suGetByID(id: string): Promise<CollectionItem<this>> {
		return this.getByID(new this.app.SuperContext(), id);
	}

	async getByID(
		context: Context,
		id: string,
		give_descriptive_errors = false
	): Promise<CollectionItem<this>> {
		const policy = this.getPolicy("show");
		if (!(await policy.isItemSensitive(context))) {
			const checkResult = await policy.check(context);
			if (!checkResult?.allowed) {
				throw new BadContext(checkResult?.reason as string);
			}
		}
		const restrictedListResult = (await context.app.Datastore.aggregate(
			this.name,
			[
				{ $match: { id } },
				...(await policy.getRestrictingQuery(context)).toPipeline(),
			]
		)) as Record<string, unknown>[];

		if (!restrictedListResult.length) {
			if (!give_descriptive_errors) {
				throw new NotFound(`${this.name}: id ${id} not found`);
			}

			const unrestrictedListResult =
				(await context.app.Datastore.aggregate(this.name, [
					{ $match: { id } },
				])) as Record<string, unknown>[];

			if (!unrestrictedListResult.length) {
				throw new NotFound(`${this.name}: id ${id} not found`);
			}

			const checkResult = await policy.checkerFunction(
				context,
				async () =>
					new CollectionItem(
						this,
						new CollectionItemBody(
							this,
							{},
							{},
							unrestrictedListResult[0] as unknown as FieldsetEncoded<
								this["fields"]
							>
						),
						unrestrictedListResult[0]!._metadata as ItemMetadata,
						id
					)
			);
			throw new BadContext(checkResult?.reason as string);
		}

		const ret = new CollectionItem(
			this,
			new CollectionItemBody(
				this,
				{},
				{},
				restrictedListResult[0] as unknown as FieldsetEncoded<
					this["fields"]
				>
			),
			restrictedListResult[0]!._metadata as ItemMetadata,
			id
		);
		await ret.decode(context);
		return ret;
	}

	async suRemoveByID(
		id: string,
		wait_for_after_events = true
	): Promise<void> {
		await this.removeByID(
			new this.app.SuperContext(),
			id,
			wait_for_after_events
		);
	}

	async removeByID(
		context: Context,
		id: string,
		wait_for_after_events = true
	): Promise<void> {
		const item =
			this.emitter.listenerCount("before:remove") ||
			this.emitter.listenerCount("after:remove")
				? await this.getByID(context, id)
				: null;
		if (this.emitter.listenerCount("before:remove")) {
			void this.emit("before:remove", [context, item]);
		}
		const result = await this.getPolicy("delete").check(context, () =>
			this.getByID(context, id)
		);
		if (!result?.allowed) {
			throw new BadContext(result?.reason as string);
		}
		await context.app.Datastore.remove(this.name, { id: id }, true);
		if (this.emitter.listenerCount("after:remove")) {
			const promise = this.emit("after:remove", [context, item]);
			if (wait_for_after_events) {
				await promise;
			} else {
				void promise;
			}
		}
	}

	/** Get a policy for given action, an inherited policy, or the default
	 * policy, if no policy is specified for this action */
	getPolicy(action: ActionName): Policy {
		const policy = this.policies[action];
		if (policy !== undefined) {
			return policy;
		}

		// show and list are actions that can use each others' policies.
		if (action === "show" && this.policies["list"]) {
			return this.policies["list"];
		} else if (action === "list" && this.policies["show"]) {
			return this.policies["show"];
		}
		return this.defaultPolicy;
	}

	/** Initialize all the fields and filters
	 * @internal
	 */
	async init(app: App, collection_name: string): Promise<void> {
		this.name = collection_name;
		this.app = app;
		await this.initFieldDetails();
		for (const filter of Object.values(this.named_filters)) {
			filter.init(app);
		}
	}

	/** Whether or not any of the fields' behavior depends on the
	 * current values of themselves or other fields
	 *
	 * @param action_name
	 * the action for which to check @internal
	 */
	isOldValueSensitive(action_name: ActionName): boolean {
		for (const field_name in this.fields) {
			if (!this.fields[field_name]) {
				throw new Error("field name is missing");
			}

			if (this.fields[field_name]!.isOldValueSensitive(action_name)) {
				return true;
			}
		}
		return false;
	}

	/** Return a named filter from the collection
	 * @param filter_name the name of the filter
	 */
	getNamedFilter(filter_name: string): SpecialFilter {
		const filter = this.named_filters[filter_name];
		if (filter) {
			return filter;
		} else {
			throw new Error("filer is missing");
		}
	}

	suList(): ItemList<this> {
		return this.list(new this.app.SuperContext());
	}

	list(context: Context): ItemList<this> {
		return new ItemList<this>(this, context);
	}

	createFromDB(document: Record<string, unknown>): CollectionItem<this> {
		const id = document?.id;
		delete document.id;
		delete document._id;

		return new CollectionItem<this>(
			this,
			new CollectionItemBody(
				this,
				{},
				{},
				document as unknown as FieldsetEncoded<this["fields"]>
			),
			document._metadata as ItemMetadata,
			id as string
		);
	}

	on(
		event_name: CollectionEvent,
		cb: CollectionCallback
	): Emittery.UnsubscribeFn {
		return this.emitter.on(event_name, cb);
	}

	getRequiredFields(): Field<unknown>[] {
		return Object.values(this.fields).filter((field) => field.required);
	}

	setPolicy(action: ActionName, policy: Policy): this {
		this.policies[action] = policy;
		return this;
	}

	getRouter(): Router {
		const router = new Router();

		router.get(["/feed"], async (ctx) => {
			ctx.type = "text/xml";
			ctx.body = await this.getFeed(ctx);
		});

		router.get(["/", "/@:filter1", "/@:filter1/@:filter2"], async (ctx) => {
			const list = this.list(ctx.$context).setParams(ctx.query);
			for (const key of ["filter1", "filter2"]) {
				if (ctx.params[key]) {
					list.namedFilter(ctx.params[key]!);
				}
			}
			ctx.body = (
				await list.fetch({ is_http_api_request: true })
			).serialize();
		});

		router.post("/", parseBody(), async (ctx) => {
			const item = this.make();
			item.setMultiple(ctx.request.body);
			await item.save(ctx.$context, true);
			await item.decode(ctx.$context, {}, true);
			ctx.body = item.serializeBody();
			ctx.status = 201;
		});

		router.get("/:id", async (ctx) => {
			const id = ctx.params.id;
			if (!id) {
				throw new Error("id is missing");
			}

			const [ret] = await this.list(ctx.$context)
				.ids([id])
				.safeFormat(ctx.query.format)
				.fetch();
			const format = ctx.query.format;

			if (!ret) {
				throw new Error("ret is missing");
			}

			await ret.safeLoadAttachments(
				ctx.$context,
				ctx.query.attachments,
				typeof format == "object" && format ? format : {}
			);
			ctx.body = ret.serialize();
		});

		router.patch("/:id", parseBody(), async (ctx) => {
			const id = ctx.params.id;
			if (!id) {
				throw new Error("id is missing");
			}
			const item = await this.getByID(ctx.$context, id);
			item.setMultiple(ctx.request.body);
			await item.save(ctx.$context);
			await item.decode(ctx.$context);
			ctx.body = item.serialize();
		});

		router.put("/:id", parseBody(), async (ctx) => {
			const id = ctx.params.id;
			if (!id) {
				throw new Error("id is missing");
			}
			const item = await this.getByID(ctx.$context, id);
			item.replace(ctx.request.body);
			await item.save(ctx.$context);
			await item.decode(ctx.$context);
			ctx.body = item.serialize();
		});

		router.delete("/:id", async (ctx) => {
			const id = ctx.params.id;
			if (!id) {
				throw new Error("id is missing");
			}
			await (await this.getByID(ctx.$context, id)).remove(ctx.$context);
			ctx.status = 204; // "No content"
		});

		return router;
	}

	clearListeners() {
		this.emitter.clearListeners();
	}

	emit(event_name: string, event_data?: any): Promise<void> {
		return this.emitter.emitSerial(event_name, event_data);
	}

	async validate(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		context: Context,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		new_body: CollectionItemBody<any>,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		old_body: CollectionItemBody<any>,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		action: "create" | "edit"
	): Promise<CollectionValidationResult> {
		// empty function, meant to be overwritten in order to implement custom validation logic
		return [];
	}

	static getFieldnames<C extends Collection>(
		collection: C
	): Array<keyof FieldsetInput<C["fields"]> & string> {
		return Object.keys(collection.fields) as Array<
			keyof FieldsetInput<C["fields"]> & string
		>;
	}

	async upsert<
		C extends Collection,
		IdentityField extends keyof CollectionInput<C>,
	>(
		context: Context,
		identify_by: IdentityField,
		entries: ({ [key in IdentityField]: unknown } & CollectionInput<C>)[]
	): Promise<void> {
		await Promise.all(
			entries.map(async (entry) => {
				const collection = context.app.collections[this.name];
				if (!collection) {
					throw new Error("collection is missing");
				}

				const {
					items: [item],
				} = await collection
					.list(context)
					.filter({ [identify_by]: entry[identify_by] })
					.paginate({ items: 1 })
					.fetch();
				if (item) {
					let has_changes = false;
					for (const key of Object.keys(
						entry
					) as (keyof typeof entry)[]) {
						if (entry[key] != item.get(key as string)) {
							has_changes = true;
						} else {
							delete entry[key];
						}
					}
					if (has_changes) {
						item.setMultiple(entry);
						await item.save(context);
					}
				} else {
					return collection.create(context, entry);
				}
			})
		);
	}

	hasFeed(): boolean {
		return Object.keys(this.fields).includes("title");
	}

	// how many items to include
	async getFeedSize(_ctx: Koa.Context): Promise<number> {
		return 50;
	}

	async getFeedSortOrder(_ctx: Koa.Context): Promise<SortParams<this>> {
		return {
			"_metadata.modified_at": "desc" as const,
		} as SortParams<this>;
	}

	async getFeedItems(ctx: Koa.Context): Promise<CollectionItem<this>[]> {
		const { items } = await this.list(ctx.$context)
			.sort(await this.getFeedSortOrder(ctx))
			.paginate({ items: await this.getFeedSize(ctx) })
			.fetch();
		return items;
	}

	mapFieldsToFeed(): FieldEntryMapping<this> {
		return {
			title: async (_, item) => {
				return (
					item.get("title" as unknown as Fieldnames<this>) ||
					"Unknown title"
				);
			},
			link: async (ctx, item) => {
				return [
					{
						href: `${ctx.$app.manifest.base_url}/api/v1/collections/${this.name}/${item.id}`,
					},
				];
			},
			author: async (_, item) => {
				return [
					item.get("author" as unknown as Fieldnames<this>) ||
						"Unknown author",
				];
			},
			id: async (ctx, item) => {
				return (
					`${ctx.$app.manifest.base_url}/api/v1/colections/${this.name}/${item.id}` ||
					"Unknown id"
				);
			},
			content: async (_, item) => {
				return (
					item.get("content" as unknown as Fieldnames<this>) ||
					"Unknown content"
				);
			},
			published: async (_, item) => {
				const fields_to_try = [
					"published",
					"publishedDate",
					"publishDate",
					"publish_date",
					"published_date",
					"date",
				];
				for (const field_name of fields_to_try) {
					const field = this.fields[field_name];

					if (
						field &&
						["date", "datetime"].includes(field.typeName)
					) {
						const value = item.get(
							field_name as unknown as Fieldnames<this>
						);
						if (value) {
							return new Date(value);
						}
					}
				}
				return new Date(item._metadata.created_at);
			},
			updated: async (_, item) => {
				const fields_to_try = [
					"modified",
					"modifiedDate",
					"modified_date",
					"last_modified",
					"lastModifiedDate",
					"last_modified_date",
				];
				for (const field_name of fields_to_try) {
					const field = this.fields[field_name];
					if (
						field &&
						["date", "datetime"].includes(field.typeName)
					) {
						const value = item.get(
							field_name as unknown as Fieldnames<this>
						);
						if (value) {
							return new Date(value);
						}
					}
				}
				return new Date(item._metadata.created_at);
			},
		};
	}

	async getFeedTitle(ctx: Koa.Context) {
		return `${ctx.$app.manifest.name} / ${this.name}`;
	}

	async getFeedItemData(
		ctx: Koa.Context,
		item: CollectionItem<this>
	): Promise<FeedEntryShape> {
		const mapping = this.mapFieldsToFeed();
		return Object.fromEntries(
			await Promise.all(
				Object.entries(mapping).map(async ([key, value]) => {
					if (typeof value == "function") {
						return [key, await value(ctx, item)];
					} else {
						return [key, value];
					}
				})
			)
		);
	}

	async getFeed(ctx: Koa.Context): Promise<string> {
		const items = await this.getFeedItems(ctx);
		const latest_item_timestamp = items
			.map((e) => e._metadata.modified_at)
			.sort()
			.reverse()[0];
		const last_update = latest_item_timestamp
			? new Date(latest_item_timestamp)
			: new Date();
		return /* HTML */ `<?xml version="1.0" encoding="utf-8"?>

			<feed xmlns="http://www.w3.org/2005/Atom">
				<title>${await this.getFeedTitle(ctx)}</title>
				<link
					href="${ctx.$app.manifest
						.base_url}/api/v1/collections/${this.name}/feed"
					rel="self"
				/>
				<id
					>${ctx.$app.manifest.base_url}/api/v1/collections/${this
						.name}/feed</id
				>
				<link href="${ctx.$app.manifest.base_url}" />
				<updated>${last_update.toISOString()}</updated>

				${(
					await Promise.all(
						items.map(async (item) => {
							const data = await this.getFeedItemData(ctx, item);
							return /* HTML */ `<entry>
								<title>${data.title}</title>
								${data.link
									.map(
										({ rel, type, href }) =>
											/* HTML */ `<link
												${rel ? `rel="${rel}"` : ""}
												${type ? `type="${type}"` : ""}
												href="${href}"
											/>`
									)
									.join("\n")}
								<id>${data.id}</id>
								<published
									>${data.published.toISOString()}</published
								>
								<updated>${data.updated.toISOString()}</updated>
								<content type="xhtml">
									<div xmlns="http://www.w3.org/1999/xhtml">
										${data.content
											.replaceAll("&", "&amp;")
											.replaceAll("<", "&lt;")}
									</div>
								</content>
								${data.author
									.map(
										(author) =>
											/* HTML */ `<author>
												<name>${author}</name>
											</author>`
									)
									.join("\n")}
							</entry>`;
						})
					)
				).join("\n")}
			</feed>`;
	}

	static async getOpenApiSubfieldsSchema(
		context: Context,
		fields: Record<string, Field<unknown>>
	): Promise<CollectionProperties> {
		const collectionSchema: CollectionProperties = {
			type: "object",
			properties: {},
			required: [],
		};
		for (const [field_name, field] of Object.entries(fields)) {
			collectionSchema.properties[field_name] =
				// eslint-disable-next-line no-await-in-loop
				await field.getOpenApiSchema(context);
			if (field.required) collectionSchema.required?.push(field_name);
		}
		if (!collectionSchema.required?.length)
			delete collectionSchema.required;
		return collectionSchema;
	}

	async getOpenApiSchema(context: Context): Promise<CollectionProperties> {
		return Collection.getOpenApiSubfieldsSchema(context, this.fields);
	}
}

export type FieldToFeedMappingEntry<C extends Collection, T> =
	| T
	| ((context: Koa.Context, item: CollectionItem<C>) => Promise<T>);

export type FeedEntryShape = {
	title: string;
	link: { rel?: string; type?: string; href: string }[];

	author: string[];
	category?: string[];
	id: string;
	content: string;
	published: Date;
	updated: Date;
};

export type FieldEntryMapping<C extends Collection> = {
	[Property in keyof FeedEntryShape]: FieldToFeedMappingEntry<
		C,
		FeedEntryShape[Property]
	>;
};
