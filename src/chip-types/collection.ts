import Emittery from "emittery";
import { ActionName } from "../action";
import Public from "../app/policy-types/public";
import Context from "../context";
import Field from "./field";
import Policy from "./policy";
import { CollectionItem } from "./collection-item";
import CollectionItemBody, { ItemFields } from "./collection-item-body";
import App from "../app/app";
import { BadContext, NotFound } from "../response/errors";
import SpecialFilter from "./special-filter";
import CalculatedField from "./calculated-field";
import ItemList from "./item-list";
import { EventDescription } from "../app/delegate-listener";

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
export default abstract class Collection extends Emittery {
	fields: { [fieldName: string]: Field };

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
	calculated_fields: Record<string, CalculatedField<any>> = {};

	/** initializes the fields @internal */
	async initFieldDetails() {
		const promises = [];
		for (const [field_name, field] of Object.entries(this.fields)) {
			field.setCollection(this);
			field.setName(field_name);
			promises.push(field.init(this.app));
		}
		return Promise.all(promises);
	}

	async suCreate(data: ItemFields<this>): Promise<CollectionItem<this>> {
		return this.create(new this.app.SuperContext(), data);
	}

	async create(
		context: Context,
		data: ItemFields<this>
	): Promise<CollectionItem<this>> {
		return this.make(data).save(context);
	}

	/** Makes a new item object that can be saved later */
	make(input?: ItemFields<this>) {
		return new CollectionItem<this>(
			this,
			new CollectionItemBody(this, input, {}, {})
		);
	}

	async suGetByID(id: string) {
		return this.getByID(new this.app.SuperContext(), id);
	}

	async getByID(context: Context, id: string) {
		const policy = this.getPolicy("show");
		if (!policy.isItemSensitive()) {
			const result = await policy.check(context);
			if (!result?.allowed) {
				throw new BadContext(result?.reason as string);
			}
		}
		const results = await context.app.Datastore.find(this.name, { id });
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

	async suRemoveByID(id: string) {
		return this.removeByID(new this.app.SuperContext(), id);
	}

	async removeByID(context: Context, id: string) {
		const result = await this.getPolicy("delete").check(context, () =>
			this.getByID(context, id)
		);
		if (!result?.allowed) {
			throw new BadContext(result?.reason as string);
		}
		await context.app.Datastore.remove(this.name, { id: id }, true);
	}

	/** Get a policy for given action, or the default policy, if no
	 * policy is specified for this action */
	getPolicy(action: ActionName) {
		return this.policies[action] || this.defaultPolicy;
	}

	/** Initialize all the fields
	 * @internal
	 */
	async init(app: App, collection_name: string) {
		this.name = collection_name;
		this.app = app;
		await this.initFieldDetails();
	}

	/** Whether or not any of the fields' behavior depends on the
	 * current values of themselves or other fields
	 *
	 * @param action_name
	 * the action for which to check @internal
	 */
	isOldValueSensitive(action_name: ActionName) {
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
	getNamedFilter(filter_name: string) {
		return this.named_filters[filter_name];
	}

	suList() {
		return this.list(new this.app.SuperContext());
	}

	list(context: Context): ItemList<this> {
		return new ItemList<this>(this, context);
	}

	createFromDB(document: any) {
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

	// @ts-ignore
	on(event_name: CollectionEvent, cb: CollectionCallback) {
		super.on(event_name, cb);
	}

	getRequiredFields(): Field[] {
		return Object.values(this.fields).filter((field) => field.required);
	}
}
