import CollectionItem from "./collection-item";
import type Collection from "./collection";
import { Context, Query } from "../main";
import {
	BadContext,
	NotFound,
	BadSubjectAction,
	ValidationError,
} from "../response/errors";
import type QueryStage from "../datastore/query-stage";
import sealious_to_mongo_sort_param from "../utils/mongo-sorts";
import type { FieldNames, ItemFields } from "./collection-item-body";

type FilterT<T extends Collection> = Partial<ItemFields<T>>;

type PaginationParams = {
	page: number;
	items: number;
	forward_buffer: number;
};

type SortParams<T extends Collection> = Partial<
	{
		[key in keyof T["fields"]]: keyof typeof sealious_to_mongo_sort_param;
	} & {
		"_metadata.created_at": keyof typeof sealious_to_mongo_sort_param;
		"_metadata.modified_at": keyof typeof sealious_to_mongo_sort_param;
	}
>;

type FormatParam<T extends Collection> = Partial<{
	[key in keyof T["fields"]]: any;
}>;

type AllInOneParams<T extends Collection> = {
	search: Parameters<ItemList<T>["search"]>[0];
	sort: Parameters<ItemList<T>["sort"]>[0];
	filter: Parameters<ItemList<T>["filter"]>[0];
	pagination: Parameters<ItemList<T>["paginate"]>[0];
	attachments: Parameters<ItemList<T>["attach"]>[0];
	format: Parameters<ItemList<T>["format"]>[0];
};

/** Which fields to fetch attachments for. Can be nested, as one
 * resource can point to another one and that one can also have
 * attachments
 */
export type AttachmentOptions<T extends Collection> = Partial<{
	[key in keyof ItemFields<T>]: any;
}>;

export default class ItemList<T extends Collection> {
	public fields_with_attachments_fetched: string[] = [];
	private _attachments_options: AttachmentOptions<T> = {};
	private _filter: FilterT<T>;
	private _format: FormatParam<T>;
	private _ids: string[];
	private _search: string;
	private _sort: SortParams<T>;
	private context: Context;
	private collection: Collection;
	private aggregation_stages: QueryStage[] = [];
	private await_before_fetch: Promise<any>[] = [];
	private is_paginated = false;
	private is_sorted = false;
	private pagination: Partial<PaginationParams> = {};

	constructor(collection: T, context: Context) {
		this.context = context;
		this.collection = collection;
		this.await_before_fetch = [
			this.collection
				.getPolicy("list")
				.getRestrictingQuery(context)
				.then((query) => {
					const pipeline = query.toPipeline();
					return pipeline;
				})
				.then((stages) => this.aggregation_stages.push(...stages)),
		];
	}

	filter(filter?: FilterT<T>): ItemList<T> {
		if (this._filter) {
			throw new Error("Filter already set");
		}
		if (!filter) {
			return this;
		}
		this._filter = filter;
		for (const [field_name, filter_value] of Object.entries(filter)) {
			this.context.app.Logger.debug3(
				"ITEM",
				"Setting filter for field:",
				{ [field_name]: filter_value }
			);
			if (!this.collection.fields[field_name]) {
				throw new Error(
					`Unknown field: '${field_name}' in '${this.collection.name}' collection`
				);
			}
			const promise = this.collection.fields[field_name]
				.getAggregationStages(this.context, filter_value)
				.then((stages) => {
					this.aggregation_stages.push(...stages);
					this.context.app.Logger.debug3(
						"ITEM",
						"Adding aggregation stage for field",
						{ [field_name]: stages }
					);
				});
			this.await_before_fetch.push(promise);
		}
		return this;
	}

	validateFormatParam(format: unknown): FormatParam<T> {
		if (format === undefined) {
			return {};
		}
		if (typeof format !== "object") {
			throw new ValidationError("Format should be a proper object");
		}
		for (const key in format) {
			if (!(key in this.collection.fields)) {
				throw new ValidationError(
					`Invalid field name in filter: ${key}`
				);
			}
		}
		return format as FormatParam<T>;
	}

	// this method should only be used when dealing with user input. Otherwise use the `format` method, as it's type safe and any issues shoyuld arise during the build process
	safeFormat(format: unknown): this {
		this.validateFormatParam(format);
		return this.format(format as FormatParam<T>);
	}

	format(format?: FormatParam<T>): this {
		if (this._format) {
			throw new Error("Already formatted!");
		}
		if (format) {
			this._format = format;
		}
		return this;
	}

	paginate(pagination_params?: Partial<PaginationParams>): ItemList<T> {
		if (!pagination_params) {
			return this;
		}
		this.pagination = pagination_params;
		this.is_paginated = true;
		return this;
	}

	search(term?: string): ItemList<T> {
		if (!term) {
			return this;
		}
		if (this._search) {
			throw new Error("Search term already set");
		}
		this.aggregation_stages.push({
			$match: {
				$text: {
					$search: term.toString(),
					$caseSensitive: false,
					$diacriticSensitive: false,
				},
			},
		});
		return this;
	}

	ids(ids: string[]): ItemList<T> {
		if (this._ids) {
			throw new Error("ids already filtered");
		}
		this.aggregation_stages.push(
			...Query.fromSingleMatch({
				id: { $in: ids },
			}).toPipeline()
		);
		return this;
	}

	namedFilter(filter_name: string): ItemList<T> {
		this.await_before_fetch.push(
			this.collection.named_filters[filter_name]
				.getFilteringQuery()
				.then((query) => {
					this.aggregation_stages.push(...query.toPipeline());
				})
		);
		return this;
	}

	attach(attachment_options?: AttachmentOptions<T>): ItemList<T> {
		if (attachment_options === undefined || !attachment_options) {
			return this;
		}
		this.context.app.Logger.debug3(
			"ITEM LIST",
			"Attaching fields:",
			attachment_options
		);
		//can be called multiple times
		for (const [field_name] of Object.entries(attachment_options)) {
			if (!this.collection.fields[field_name]) {
				field_name;
				throw new NotFound(
					`Given field ${field_name} is not declared in collection!`
				);
			}

			this.fields_with_attachments_fetched.push(
				field_name as unknown as FieldNames<T>
			);
		}
		this._attachments_options = attachment_options;
		return this;
	}

	private async fetchAttachments(items: CollectionItem<T>[]) {
		const promises: Promise<any>[] = [];
		let attachments: { [id: string]: CollectionItem<T> } = {};
		for (const field_name of this.fields_with_attachments_fetched) {
			const collection = this.collection;
			this.context.app.Logger.debug2(
				"ATTACH",
				`Loading attachments for ${field_name}`
			);

			promises.push(
				collection.fields[field_name]
					.getAttachments(
						this.context,
						items.map((item) => item.get(field_name) as unknown),
						this._attachments_options[field_name as FieldNames<T>]
					)
					.then((attachmentsList) => {
						attachments = {
							...attachments,
							...attachmentsList.flattenWithAttachments(),
						};
						this.context.app.Logger.debug3(
							"ATTACH",
							`Fetched attachments for ${field_name}:`,
							attachmentsList
						);
					})
			);
		}
		await Promise.all(promises);
		return attachments;
	}

	/**
	 * execute crated database request
	 */
	async fetch(): Promise<ItemListResult<T>> {
		const result = await this.collection
			.getPolicy("show")
			.check(this.context);
		if (result !== null && !result.allowed) {
			throw new BadContext(result.reason);
		}
		const aggregation_stages = await this.getAggregationStages();
		const documents = await this.context.app.Datastore.aggregate(
			this.collection.name,
			aggregation_stages,
			{}
		);
		const item_promises: Promise<CollectionItem<T>>[] = [];
		for (const document of documents) {
			const item = this.collection.createFromDB(document);
			item_promises.push(
				item.decode(this.context, this._format) as Promise<
					CollectionItem<T>
				>
			);
		}
		const items = await Promise.all(item_promises);
		const attachments = await this.fetchAttachments(items);
		return new ItemListResult(
			items,
			this.fields_with_attachments_fetched,
			attachments
		);
	}

	public async getAggregationStages() {
		await Promise.all(this.await_before_fetch);
		this.await_before_fetch = [];
		return [
			...this.aggregation_stages,
			...this.getSortingStages(),
			...this.getPaginationStages(),
		];
	}

	public sort(sort_params?: SortParams<T>) {
		if (!sort_params) {
			return this;
		}
		this.is_sorted = true;
		this._sort = sort_params;
		return this;
	}

	public setParams(params: Partial<AllInOneParams<T>>) {
		return this.filter(params.filter)
			.paginate(params.pagination)
			.sort(params?.sort)
			.search(params?.search)
			.attach(params?.attachments)
			.format(params?.format);
	}

	private getSortingStages() {
		if (!this.is_sorted) {
			return [];
		}
		const $sort: { [field_name: string]: -1 | 1 } = {};
		for (const [field_name, sort_value] of Object.entries(this._sort)) {
			if (sort_value === undefined) {
				continue;
			}
			const mongo_sort_param = sealious_to_mongo_sort_param[sort_value];
			if (!mongo_sort_param) {
				const available_sort_keys = Object.keys(
					sealious_to_mongo_sort_param
				).join(", ");
				throw new BadSubjectAction(
					`Unknown sort key: ${JSON.stringify(
						this._sort[field_name]
					)}. Available sort keys are: ${available_sort_keys}.`
				);
			}
			$sort[field_name] = mongo_sort_param as -1 | 1;
		}
		return [{ $sort }];
	}

	private getPaginationStages(): QueryStage[] {
		if (!this.is_paginated) {
			return [];
		}
		const full_pagination_params: PaginationParams = {
			page: 1,
			items: 10,
			forward_buffer: 0,
			...this.pagination,
		};
		const $skip =
			(full_pagination_params.page - 1) * full_pagination_params.items;
		const $limit =
			full_pagination_params.items +
				full_pagination_params.forward_buffer || 0;
		// prettier-ignore
		return [ {$skip}, {$limit} ];
	}
}

export class ItemListResult<T extends Collection> {
	constructor(
		public items: CollectionItem<T>[],
		public fields_with_attachments: string[],
		public attachments: { [id: string]: CollectionItem } = {}
	) {
		items.forEach((item) => item.setParentList(this));
	}

	// this generator method makes the instance of this class iterable with for..of
	*[Symbol.iterator](): Iterator<CollectionItem<T>> {
		for (const item of this.items) {
			yield item;
		}
	}

	get empty(): boolean {
		return this.items.length === 0;
	}

	serialize() {
		return {
			items: this.items.map((item) => item.serializeBody()),
			attachments: Object.fromEntries(
				Object.entries(this.attachments).map(([id, item]) => [
					id,
					item.serializeBody(),
				])
			),
			fields_with_attachments: this.fields_with_attachments,
		};
	}

	static fromSerialized<T extends Collection>(
		collection: T,
		serialized: {
			items: any[];
			attachments: { [id: string]: any };
			fields_with_attachments: string[];
		}
	) {
		return new ItemListResult<T>(
			serialized.items.map((item_data) =>
				CollectionItem.fromSerialized(
					collection,
					item_data,
					serialized.attachments
				)
			),
			serialized.fields_with_attachments,
			serialized.attachments
		);
	}

	flattenWithAttachments() {
		return {
			...this.attachments,
			...Object.fromEntries(this.items.map((item) => [item.id, item])),
		};
	}
}
