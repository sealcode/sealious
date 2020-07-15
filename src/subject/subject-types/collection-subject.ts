import Bluebird from "bluebird";
import shortid from "shortid";
import SingleItemResponse from "../../../common_lib/response/single-item-response";
import Collection from "../../chip-types/collection";
import * as Errors from "../../response/errors";
import assignAttachments from "../attachments/attachment-assigner";
import Subject from "../subject";
import Context from "../../context";
import SingleResource from "./single-resource-subject";
import { ResourceCreated } from "../../../common_lib/response/responses";
import {
	LooseObject,
	AttachmentParams,
	AssignAttachmentsResult,
} from "../types";
import Item from "../../../common_lib/response/item";
import CollectionResponse from "../../../common_lib/response/collection-response";
import {
	CreateActionName,
	ShowActionName,
	DeleteActionName,
} from "../../action";

export type OutputOptions = {
	page: number;
	items: number;
	skip: number;
	amount: number;
	sort: { [field_name: string]: -1 | 1 };
};

//
//
//
//
//   !!! many of these methods should be moved to the collection
//   !!! class, this should be a lightweight controller
//
//
//
//

export default class CollectionSubject extends Subject {
	collection: Collection;
	named_filters: Array<string>;
	ids: Array<string>;

	getName() {
		return "Collection";
	}
	constructor(
		collection: Collection,
		named_filters: Array<string> = [],
		ids: Array<string> = []
	) {
		super(collection.app);
		this.collection = collection;
		this.named_filters = named_filters;
		this.ids = ids;
	}

	async performAction(
		context: Context,
		action_name: CreateActionName | ShowActionName | DeleteActionName,
		params: Item
	) {
		switch (action_name) {
			case "create":
				return this.createResource(context, params);
			case "show":
				return this.listResources(context, params);
			case "delete":
				return this.delete();
			default:
				throw new Errors.DeveloperError(
					`Unknown action for '${this.collection.name}' collection: '${action_name}'`
				);
		}
	}

	createResource(context: Context, body: Item) {
		return this.__createResource(context, body);
	}

	delete() {
		throw new Errors.NotFound("Cannot delete a collection.");
	}

	async getChildSubject(path_element: string | Array<string>) {
		if (path_element[0] === "@") {
			return new CollectionSubject(this.collection, [
				...this.named_filters,
				path_element.slice(1) as string,
			]);
		} else if (path_element instanceof Array) {
			const ids = path_element;
			return new CollectionSubject(this.collection, [], ids);
		}
		const resource_id = path_element;
		return new SingleResource(this.app, this.collection, resource_id);
	}

	async listResources(context: Context, params: LooseObject) {
		const result = await this.__listResources(context, params);

		if (params.attachments && typeof params.attachments === "object") {
			Object.assign(
				result,
				await assignAttachments(
					this.app,
					context,
					params as AttachmentParams,
					this.collection,
					result.items
				)
			);
		}
		await this.__excludeItemsNotPassingCheck(
			context,
			this.collection,
			result
		);
		return new CollectionResponse(result);
	}

	async __listResources(context: Context, params: LooseObject) {
		if (params === undefined || params === null) {
			params = {};
		}

		if (params.calculate === "false" || params.calculate === false) {
			params.calculate = false;
		} else if (typeof params.calculate !== "object") {
			params.calculate = true;
		}

		await this.collection.checkIfActionIsAllowed(context, "show");
		const aggregation_stages = await this.collection.getAggregationStages(
			context,
			"show",
			params,
			this.ids,
			this.named_filters
		);

		const output_options = getOutputOptions(params);

		const documents = await this.app.Datastore.aggregate(
			this.collection.name,
			aggregation_stages,
			{},
			output_options
		);

		const decoded_items: Item[] = [];

		for (let document of documents) {
			let item = await this.collection.getResourceRepresentation(
				context,
				document,
				params.format,
				params.calculate
			);
			decoded_items.push(item);
		}

		return {
			items: decoded_items,
			attachments: {},
			fieldsWithAttachments: {},
		};
	}

	async __createResource(context: Context, body: Item) {
		await this.collection.checkIfActionIsAllowed(context, "create", body);
		await this.collection.validateFieldValues(context, true, body);
		const encoded_body = await this.collection.encodeFieldValues(
			context,
			body
		);

		const newID = shortid();
		const resource_data = {
			_metadata: {
				collection: this.collection.name,
				created_context: context.toDBEntry(),
				last_modified_context: context.toDBEntry(),
			},
			sealious_id: newID,
			...encoded_body,
		};
		const database_entry = await this.app.Datastore.insert(
			this.collection.name,
			resource_data,
			{}
		);
		const representation = await this.collection.getResourceRepresentation(
			context,
			database_entry,
			null
		);
		return new ResourceCreated(representation);
	}

	async __excludeItemsNotPassingCheck(
		context: Context,
		collection: Collection,
		result: AssignAttachmentsResult
	) {
		const policy = collection.getPolicy("show");
		const is_item_sensitive = await policy.isItemSensitive();
		if (!is_item_sensitive) {
			return;
		}
		if (!result.items) {
			result.items = [];
		}
		result.items = await Bluebird.filter(result.items, async (item) => {
			try {
				await policy.check(
					context,
					new SingleItemResponse({
						item,
						attachments: result.attachments,
						fieldsWithAttachments: result.fieldsWithAttachments,
					})
				);
				return true;
			} catch (e) {
				console.error(e);
				return false;
			}
		});
	}
}

const sealious_to_mongo_sort_param = {
	desc: -1,
	descending: -1,
	asc: 1,
	ascending: 1,
};

const getOutputOptions = function (params: {
	[x: string]: any;
	pagination?: any;
	skip?: number;
	amount?: number;
	count?: number;
	sort?: { [field_name: string]: keyof typeof sealious_to_mongo_sort_param };
}) {
	const output_options: Partial<OutputOptions> = {};

	if (params.pagination) {
		const default_pagination_params: Partial<OutputOptions> = {
			page: 1,
			items: 10,
			skip: 0,
			amount: 0,
		};
		const full_pagination_params = Object.assign(
			{},
			default_pagination_params,
			params.pagination
		);

		const must_be_int: Array<keyof OutputOptions> = ["items", "page"];
		for (let attribute_name of must_be_int) {
			if (isNaN(parseInt(full_pagination_params[attribute_name], 10))) {
				full_pagination_params[attribute_name] =
					default_pagination_params[attribute_name];
			} else {
				full_pagination_params[attribute_name] = parseInt(
					full_pagination_params[attribute_name]
				);
			}
		}

		output_options.skip =
			(full_pagination_params.page - 1) * full_pagination_params.items;
		output_options.amount =
			parseInt(full_pagination_params.items, 10) +
			(parseInt(full_pagination_params.forward_buffer, 10) || 0);
	} else {
		if (params.skip) {
			output_options.skip = params.skip;
		}
		if (params.amount) {
			output_options.amount = params.count;
		}
	}

	if (params.sort) {
		const full_sort_params: { [field_name: string]: -1 | 1 } = {};
		for (const field_name in params.sort) {
			const mongo_sort_param =
				sealious_to_mongo_sort_param[params.sort[field_name]];
			if (!mongo_sort_param) {
				const available_sort_keys = Object.keys(
					sealious_to_mongo_sort_param
				).join(", ");
				throw new Errors.BadSubjectAction(
					`Unknown sort key: ${params.sort[field_name]}. Available sort keys are: ${available_sort_keys}.`
				);
			}
			full_sort_params[field_name] = mongo_sort_param as -1 | 1;
		}
		output_options.sort = full_sort_params;
	}

	return output_options;
};
