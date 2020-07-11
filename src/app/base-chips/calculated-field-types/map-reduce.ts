import {
	App,
	Collection,
	CalculatedField,
	Item,
	SubjectPathEquiv,
	ActionName,
	Context,
} from "../../../main";

type ParamGetter<T> = (context: Context, item: Item) => Promise<T> | T;

type ParamOrGetter<T> = T | ParamGetter<T>;

type MapReduceParams<ReturnType, IntermediateValue = any> = {
	source: {
		subject_path: ParamOrGetter<SubjectPathEquiv>;
		action_name: ParamOrGetter<ActionName>;
		params: ParamOrGetter<any>;
	};
	map: (items: Item[]) => IntermediateValue[];
	reduce: [(intermediate: IntermediateValue[]) => ReturnType, any];
};

export default class MapReduce<
	ReturnType,
	IntermediateValue
> extends CalculatedField<ReturnType> {
	name = "map-reduce";
	params: MapReduceParams<ReturnType, IntermediateValue>;
	constructor(
		app: App,
		collection: Collection,
		params: MapReduceParams<ReturnType, IntermediateValue>
	) {
		super(app, collection);
		this.params = params;
	}
	async calculate(context: Context, item: Item) {
		const action_arguments = [
			context,
			this.params.source.subject_path,
			this.params.source.action_name,
			this.params.source.params,
		].map(function (element) {
			if (element instanceof Function) {
				return element(context, item);
			} else {
				return element;
			}
		});
		const fulfilled_params = Promise.all(action_arguments);

		return (await this.app.runAction.apply(App, fulfilled_params))
			.map(this.params.map)
			.reduce(this.params.reduce[0], this.params.reduce[1]);
	}
}
