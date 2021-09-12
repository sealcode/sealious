import Router from "@koa/router";
import Emittery from "emittery";
import { ActionName } from "../action";
import App from "../app/app";
import { EventDescription } from "../app/delegate-listener";
import Public from "../app/policy-types/public";
import Context from "../context";
import parseBody from "../http/parse-body";
import { BadContext, NotFound } from "../response/errors";
import CalculatedField from "./calculated-field";
import CollectionItem from "./collection-item";
import CollectionItemBody, { ItemFields } from "./collection-item-body";
import Field from "./field";
import ItemList from "./item-list";
import Policy from "./policy";
import SpecialFilter from "./special-filter";

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
	EventDescription
]) => Promise<void>;

/** Creates a collection. All collections are automatically served via
 * the REST API, with permissions set by the Policies */
export default abstract class Collection {
	abstract fields: { [fieldName: string]: Field };
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

	named_filters: Record<string, SpecialFilter> = {};

	calculated_fields: Record<string, CalculatedField<unknown>> = {};

	/** initializes the fields @internal */
	async initFieldDetails(): Promise<void> {
		const promises = [];
		for (const [field_name, field] of Object.entries(this.fields)) {
			field.setCollection(this);
			field.setName(field_name);
			promises.push(field.init(this.app));
		}
		await Promise.all(promises);
	}

	async suCreate(data: ItemFields<this>): Promise<CollectionItem<this>> {
		return this.create(new this.app.SuperContext(), data);
	}

	async create(
		context: Context,
		data: Partial<ItemFields<this>>
	): Promise<CollectionItem<this>> {
		return this.make(data).save(context);
	}

	/** Makes a new item object that can be saved later */
	make(input?: Partial<ItemFields<this>>): CollectionItem<this> {
		return new CollectionItem<this>(
			this,
			new CollectionItemBody(this, input, {}, {})
		);
	}

	async suGetByID(id: string): Promise<CollectionItem<this>> {
		return this.getByID(new this.app.SuperContext(), id);
	}

	async getByID(context: Context, id: string): Promise<CollectionItem<this>> {
		const policy = this.getPolicy("show");
		if (!(await policy.isItemSensitive(context))) {
			const result = await policy.check(context);
			if (!result?.allowed) {
				throw new BadContext(result?.reason as string);
			}
		}
		const results = (await context.app.Datastore.aggregate(this.name, [
			{ $match: { id } },
			...(await policy.getRestrictingQuery(context)).toPipeline(),
		])) as ItemFields<this>[];
		if (!results.length) {
			throw new NotFound(`${this.name}: id ${id} not found`);
		}
		const ret = new CollectionItem(
			this,
			new CollectionItemBody(this, {}, {}, results[0]),
			results[0]._metadata,
			id
		);
		await ret.decode(context);
		return ret;
	}

	async suRemoveByID(id: string): Promise<void> {
		await this.removeByID(new this.app.SuperContext(), id);
	}

	async removeByID(context: Context, id: string): Promise<void> {
		const result = await this.getPolicy("delete").check(context, () =>
			this.getByID(context, id)
		);
		if (!result?.allowed) {
			throw new BadContext(result?.reason as string);
		}
		await context.app.Datastore.remove(this.name, { id: id }, true);
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
			if (this.fields[field_name].isOldValueSensitive(action_name)) {
				return true;
			}
		}
		return false;
	}

	/** Return a named filter from the collection
	 * @param filter_name the name of the filter
	 */
	getNamedFilter(filter_name: string): SpecialFilter {
		return this.named_filters[filter_name];
	}

	suList(): ItemList<this> {
		return this.list(new this.app.SuperContext());
	}

	list(context: Context): ItemList<this> {
		return new ItemList<this>(this, context);
	}

	createFromDB(document: ItemFields<this>): CollectionItem<this> {
		const id = document?.id;
		delete document.id;
		delete document._id;
		return new CollectionItem<this>(
			this,
			new CollectionItemBody(this, {}, {}, document),
			document._metadata,
			id
		);
	}

	on(
		event_name: CollectionEvent,
		cb: CollectionCallback
	): Emittery.UnsubscribeFn {
		return this.emitter.on(event_name, cb);
	}

	getRequiredFields(): Field[] {
		return Object.values(this.fields).filter((field) => field.required);
	}

	setPolicy(action: ActionName, policy: Policy): this {
		this.policies[action] = policy;
		return this;
	}

	getRouter(): Router {
		const router = new Router();

		router.get(["/", "/@:filter1", "/@:filter1/@:filter2"], async (ctx) => {
			const list = this.list(ctx.$context).setParams(ctx.query);
			for (const key of ["filter1", "filter2"]) {
				if (ctx.params[key]) {
					list.namedFilter(ctx.params[key]);
				}
			}
			ctx.body = (await list.fetch()).serialize();
		});

		router.post("/", parseBody(), async (ctx) => {
			const item = this.make();
			item.setMultiple(ctx.request.body);
			await item.save(ctx.$context);
			await item.decode(ctx.$context);
			ctx.body = item.serializeBody();
			ctx.status = 201;
		});

		router.get("/:id", async (ctx) => {
			const [ret] = await this.list(ctx.$context)
				.ids([ctx.params.id])
				.safeFormat(ctx.query.format)
				.fetch();
			await ret.safeLoadAttachments(ctx.$context, ctx.query.attachments);
			ctx.body = ret.serialize();
		});

		router.patch("/:id", parseBody(), async (ctx) => {
			const item = await this.getByID(ctx.$context, ctx.params.id);
			item.setMultiple(ctx.request.body);
			await item.save(ctx.$context);
			await item.decode(ctx.$context);
			ctx.body = item.serialize();
		});

		router.put("/:id", parseBody(), async (ctx) => {
			const item = await this.getByID(ctx.$context, ctx.params.id);
			item.replace(ctx.request.body);
			await item.save(ctx.$context);
			await item.decode(ctx.$context);
			ctx.body = item.serialize();
		});

		router.delete("/:id", async (ctx) => {
			await (await this.getByID(ctx.$context, ctx.params.id)).remove(
				ctx.$context
			);
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
}
