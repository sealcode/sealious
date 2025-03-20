import type {
	Collection as MongoCollection,
	InsertOneResult,
	Document,
	UpdateResult,
	DeleteResult,
} from "mongodb";
import type { App } from "../main.js";
import type { QueryStage } from "./query-stage.js";
import type { OutputOptions } from "./datastore.js";

export default abstract class Datastore {
	constructor(public app: App) {
		this.app = app;
	}
	abstract start(): Promise<void>;
	abstract stop(): Promise<void>;

	abstract find(
		collection_name: string,
		query: Record<string, unknown>,
		options: Parameters<MongoCollection["find"]>[1],
		output_options: OutputOptions
	): Promise<Record<string, unknown>[]>;

	abstract aggregate(
		collection_name: string,
		pipeline: QueryStage[],
		_: unknown,
		output_options: OutputOptions
	): Promise<Record<string, unknown>[]>;

	abstract insert(
		collection_name: string,
		to_insert: Record<string, unknown>,
		options?: Parameters<MongoCollection["insertOne"]>[1]
	): Promise<InsertOneResult<Document>>;

	abstract update(
		collection_name: string,
		query: unknown,
		new_value: unknown
	): Promise<UpdateResult<Document>>;
	abstract remove(
		collection_name: string,
		query: unknown,
		just_one: boolean
	): Promise<DeleteResult>;
}
