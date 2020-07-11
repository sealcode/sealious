import Bluebird from "bluebird";
import Collection from "../../../chip-types/collection";
import { Field, Context } from "../../../main";
import { CollectionResponse } from "../../../../common_lib/response/responses";
import ReferenceToCollection from "../../../subject/attachments/reference-to-collection";

export default class SingleReference extends Field<string> {
	getTypeName = () => "single-reference";
	hasIndex = () => true;
	get_target_collection: () => Collection;
	filter: any;

	setParams(params: { target_collection: () => Collection; filter?: any }) {
		this.get_target_collection = params.target_collection;
		this.filter = params.filter;
	}

	async isProperValue(context: Context, input: string) {
		const filter = this.filter || {};
		if (input === "") {
			return Field.valid();
		}

		let stages = await this.get_target_collection().getAggregationStages(
			context,
			"show",
			{ filter }
		);
		stages = [{ $match: { sealious_id: input } }, ...stages];
		const results = await this.app.Datastore.aggregate(
			this.get_target_collection().name,
			stages
		);

		return results.length > 0
			? Field.valid()
			: Field.invalid(
					`Nie masz dostępu do danego zasobu z kolekcji ${
						this.get_target_collection().name
					} lub on nie istnieje.`
			  );
	}

	async filterToQuery(context: Context, filter: any) {
		// treating filter as a query here
		if (typeof filter !== "object") {
			return {
				$eq: filter,
			};
		}
		const { items } = (await this.app.runAction(
			context,
			["collections", this.get_target_collection().name],
			"show",
			{
				filter,
			}
		)) as CollectionResponse;
		return { $in: items.map((resource) => resource.id) };
	}
	async getAggregationStages(
		context: Context,
		query: Parameters<Field["getAggregationStages"]>[1]
	) {
		let filter: { [field_name: string]: any } = {};
		const temp_field_name = `${
			this.get_target_collection().name
		}-lookup${Math.floor(Math.random() * Math.pow(10, 7))}`;
		const request_filter = query.filter && query.filter[this.name];
		if (!request_filter || Object.keys(request_filter).length === 0)
			return [];
		if (typeof request_filter === "string") {
			return [
				{ $match: { [await this.getValuePath()]: request_filter } },
			];
		}
		if (request_filter instanceof Array) {
			let _in = request_filter;
			if (request_filter[0] instanceof Array) _in = request_filter[0];
			return [
				{
					$match: {
						[await this.getValuePath()]: { $in: _in },
					},
				},
			];
		}
		for (let field_name in request_filter) {
			let field = this.get_target_collection().fields[field_name];
			if (!field)
				return Promise.reject(
					"Unknown field in filter for '" +
						this.get_target_collection().name +
						"': " +
						field_name
				);
			filter[field_name] = field.filterToQuery(
				context,
				request_filter[field_name]
			);
		}
		filter = await Bluebird.props(filter);

		const ret = [
			{
				$lookup: {
					from: this.get_target_collection().name,
					let: { referenced_id: `$${await this.getValuePath()}` },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$sealious_id", "$$referenced_id"],
								},
							},
						},
						{ $match: filter },
						{ $count: "count" },
					],
					as: temp_field_name,
				},
			},
			{ $match: { [`${temp_field_name}.count`]: { $gt: 0 } } },
		];

		return ret;
	}

	getAttachmentLoader(context: any, _: any, params: any) {
		return new ReferenceToCollection(context, this.name, {
			...params,
			collection_name: this.get_target_collection().name,
		});
	}
}
