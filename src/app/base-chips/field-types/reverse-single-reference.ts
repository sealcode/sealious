import * as assert from "assert";
import { Field, Context, App, EventMatchers } from "../../../main";
import { QueryStage } from "../../../datastore/query";
import ReferenceToCollection from "../../../subject/attachments/reference-to-collection";
import { CollectionResponse } from "../../../../common_lib/response/responses";

export default class ReverseSingleReference extends Field<never, string[]> {
	getTypeName = () => "reverse-single-refernce";
	get_referencing_field: () => Field;

	async isProperValue(context: Context, _: any) {
		return context.is_super
			? Field.valid()
			: Field.invalid("This is a read-only field");
	}

	setParams(params: { referencing_field: () => Field }) {
		this.get_referencing_field = params.referencing_field;
	}

	getReferencingCollection() {
		return this.get_referencing_field().collection;
	}

	getCacheKey() {
		return `${this.collection.name}___${
			this.name
		}-reverse-single-reference(${this.getReferencingCollection().name},${
			this.get_referencing_field.name
		}).last_update`;
	}

	async init(app: App) {
		app.on("started", async () => {
			const response = await app.runAction(
				new app.SuperContext(),
				["collections", this.collection.name],
				"show",
				{
					sort: {
						"_metadata.last_modified_context.timestamp": "desc",
					},
					pagination: { items: 1 },
				}
			);

			if (response.empty) {
				return;
			}

			const last_modified_resource_in_reference_collection =
				response.items[0];

			if (last_modified_resource_in_reference_collection) {
				const last_modified_resource_timestamp =
					last_modified_resource_in_reference_collection._metadata
						.last_modified_context.timestamp;
				const last_field_cache_update =
					(await app.Metadata.get(this.getCacheKey())) || 0;
				if (
					last_modified_resource_timestamp > last_field_cache_update
				) {
					await this.updateCache();
					await app.Metadata.set(this.getCacheKey(), Date.now());
				}
			}
		});

		app.addHook(
			new EventMatchers.CollectionMatcher({
				when: "after",
				collection_name: this.getReferencingCollection().name,
				action: "create",
			}),
			async (_, resource) => {
				const referenced_id =
					resource[this.get_referencing_field().name];
				await this.updateCache([referenced_id]);
			}
		);

		app.addHook(
			new EventMatchers.Resource({
				when: "after",
				collection_name: this.getReferencingCollection().name,
				action: "delete",
			}),
			async (emitted_event) => {
				const deleted_id = emitted_event.subject_path.split(".")[2];
				const affected = await app.Datastore.find(
					this.collection.name,
					{
						[this.name]: deleted_id,
					}
				);
				const affected_ids = affected.map(
					(document: { sealious_id: string }) => document.sealious_id
				);
				await this.updateCache(affected_ids);
			}
		);

		app.addHook(
			new EventMatchers.Resource({
				when: "after",
				collection_name: this.getReferencingCollection().name,
				action: "edit",
			}),
			async ({ metadata, subject_path }) => {
				if (
					!metadata.params.hasOwnProperty(
						this.get_referencing_field().name
					)
				)
					return;
				const edited_id = subject_path.split(".")[2];
				const no_longer_referenced = await app.Datastore.find(
					this.collection.name,
					{
						[this.name]: edited_id,
					}
				);
				const affected_ids = no_longer_referenced.map(
					(document: { sealious_id: string }) => document.sealious_id
				);
				if (metadata.params[this.get_referencing_field().name]) {
					affected_ids.push(
						metadata.params[this.get_referencing_field().name]
					);
				}
				await this.updateCache(affected_ids);
			}
		);
	}

	async updateCache(resource_ids?: string[]) {
		let pipeline: QueryStage[];
		if (resource_ids) {
			assert.ok(Array.isArray(resource_ids));
			pipeline = [
				{
					$match: {
						[this.get_referencing_field().name]: {
							$in: resource_ids,
						},
					},
				},
			];
		} else {
			pipeline = [];
		}
		pipeline.push({
			$group: {
				_id: `$${this.get_referencing_field().name}`,
				referenced_by: { $push: "$sealious_id" },
			},
		});
		const to_update = await this.app.Datastore.aggregate(
			this.getReferencingCollection().name,
			pipeline
		);
		if (resource_ids) {
			for (let resource_id of resource_ids) {
				if (
					to_update.filter(
						(e: { _id: string }) => e._id === resource_id
					).length === 0
				) {
					to_update.push({ _id: resource_id, referenced_by: [] });
				}
			}
		}
		for (let entry of to_update) {
			await this.app.Datastore.update(
				this.collection.name,
				{ sealious_id: entry._id },
				{ $set: { [this.name]: entry.referenced_by } }
			);
		}
	}

	getAttachmentLoader(
		context: Context,
		_: boolean,
		attachment_params: ConstructorParameters<
			typeof ReferenceToCollection
		>[2]
	) {
		return new ReferenceToCollection(context, this.name, {
			...attachment_params,
			collection_name: this.getReferencingCollection().name,
		});
	}

	async filterToQuery(context: Context, field_filter: any) {
		if (typeof field_filter !== "object") {
			return {
				$eq: field_filter,
			};
		}
		const { items } = (await this.app.runAction(
			context,
			["collections", this.getReferencingCollection().name],
			"show",
			{ filter: field_filter }
		)) as CollectionResponse;
		return {
			$in: items.map((resource) => resource.id),
		};
	}
}
