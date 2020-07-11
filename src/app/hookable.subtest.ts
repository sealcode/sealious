import assert from "assert";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import { EventMatcher, Collection, Resource } from "./event-matchers";
import { EventDescription, Hookable } from "./hookable";
import Context from "../context";
import { App } from "../main";

type Handler = (event: EventDescription, data: any) => any;

const metadata = (app: App | Hookable) => ({
	context: new Context(app as App),
	params: {},
});

describe("hookable", () => {
	function createHook(App: Hookable, handler: Handler) {
		App.addHook(
			new EventMatcher({
				when: "before",
				subject_path: /collections.movies/,
				action: "create",
			}),
			handler
		);
	}
	function createAnotherHook(App: Hookable, handler: Handler) {
		App.addHook(
			new EventMatcher({
				when: "after",
				subject_path: /collections.movies/,
				action: "create",
			}),
			handler
		);
	}

	function getResult(app: Hookable, data: any) {
		return app.emitHook(
			{
				when: "before",
				subject_path: "collections.movies",
				action: "create",
				metadata: metadata(app as App),
			},
			data
		);
	}

	async function assertErrorThrownOnAppEmit(
		event_description: EventDescription
	) {
		await assertThrowsAsync(
			async () => {
				const App = new Hookable();
				await App.emitHook(event_description, 0);
			},
			(error) => assert.deepEqual(error.code, "ERR_ASSERTION")
		);
	}

	it("properly passess value from handler to handler (happy path)", async () => {
		const App = new Hookable();
		createHook(App, async (_, number) => number + 2);
		createHook(App, async (_, number) => number * 2);
		const result = await getResult(App, 1);
		assert.equal(result, 6);
	});

	it("returns proper value if one of the handlers in the middle doesn't return anything", async () => {
		const App = new Hookable();
		createHook(App, (_, number) => number + 2);
		createHook(App, async () => {
			return undefined;
		});
		createHook(App, async (_, number) => number * 10);
		const result = await getResult(App, 1);
		assert.equal(result, 30);
	});

	it("returns back given data if handler doesn't return anything", async () => {
		const App = new Hookable();
		createHook(App, async () => {});
		const result = await getResult(App, 1);
		assert.equal(result, 1);
	});

	it("doesn't trigger hooks that refer to another event", async () => {
		const App = new Hookable();
		createHook(App, async (_, number) => number * 2);
		createAnotherHook(App, async (_, number) => number * 100);
		const result = await getResult(App, 1);
		assert.equal(result, 2);
	});

	it("properly reacts to async handlers", async () => {
		const App = new Hookable();
		const sleep = (ms: number) =>
			new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, ms);
			});

		createHook(App, async (_, number) => {
			await sleep(10);
			return number * 128;
		});
		const result = await getResult(App, 2);
		assert.equal(result, 256);
	});

	it("should fire the handler if emitted action is included in action array", async () => {
		const App = new Hookable();
		App.addHook(
			new EventMatcher({
				when: "before",
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			}),
			(_, number) => number + 50
		);
		const result = await App.emitHook(
			{
				when: "before",
				subject_path: "collections.movies",
				action: "create",
				metadata: metadata(App),
			},
			50
		);
		assert.equal(result, 100);
	});

	it("should work properly when given an instance of EventMatcher ", async () => {
		const App = new Hookable();
		App.addHook(
			new EventMatcher({
				when: "before",
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			}),
			(_, number) => number + 50
		);
		const result = await App.emitHook(
			{
				when: "before",
				subject_path: "collections.movies",
				action: "create",
				metadata: metadata(App),
			},
			50
		);
		assert.equal(result, 100);
	});

	it("should work properly when given an instance of CollectionEventMatcher", async () => {
		const App = new Hookable();
		const _collection_event_matcher = new Collection({
			when: "before",
			collection_name: "shows",
			action: ["create"],
		});
		assert.deepEqual(_collection_event_matcher.collection_name, "shows");
		App.addHook(_collection_event_matcher, (_, number) => number + 51);
		const result = await App.emitHook(
			{
				when: "before",
				subject_path: "collections.shows",
				action: "create",
				metadata: metadata(App),
			},
			50
		);
		assert.equal(result, 101);
	});

	it("should work properly when given an instance of ResourceEventMatcher", async () => {
		const App = new Hookable();
		const _resource_event_matcher = new Resource({
			when: "before",
			collection_name: "series",
			action: ["create"],
		});
		assert.deepEqual(_resource_event_matcher.collection_name, "series");
		App.addHook(_resource_event_matcher, (_, number) => number + 52);
		const result = await App.emitHook(
			{
				when: "before",
				subject_path: "collections.series.id",
				action: "create",
				metadata: metadata(App),
			},
			50
		);
		assert.equal(result, 102);
	});

	it("should take care of `App.emit` params validation", async () => {
		// `when` is not a string
		await assertErrorThrownOnAppEmit({
			//@ts-ignore
			when: [],
			subject_path: "collections.events",
			action: "create",
		});
		// `subject_path` is not a string
		await assertErrorThrownOnAppEmit({
			when: "before",
			//@ts-ignore
			subject_path: 222,
			action: "create",
		});
		// `action` is not a string
		await assertErrorThrownOnAppEmit({
			when: "before",
			subject_path: "collections.events",
			//@ts-ignore
			action: {},
		});
		// `metadata` is not an object
		await assertErrorThrownOnAppEmit({
			when: "before",
			subject_path: "collections.events",
			action: "create",
			//@ts-ignore
			metadata: 2,
		});
	});

	it("should take care of `*EventMatcher` collection_name validation", async () => {
		// collection_name must be a string
		await assertThrowsAsync(
			async () => {
				new Collection({
					when: "before",
					//@ts-ignore
					collection_name: 222,
					action: "create",
				});
			},
			(error: { code: any }) =>
				assert.deepEqual(error.code, "ERR_ASSERTION")
		);
		// collection_name must be a string
		await assertThrowsAsync(
			async () => {
				new Resource({
					when: "before",
					//@ts-ignore
					collection_name: [],
					action: "create",
				});
			},
			(error: { code: any }) =>
				assert.deepEqual(error.code, "ERR_ASSERTION")
		);
	});

	it("allows to check if EventMatcher responds to given action", async () => {
		const matcher = new EventMatcher({
			when: "before",
			subject_path: /.*/,
			action: ["create", "edit"],
		});

		assert(matcher.containsAction("create"));
		assert(!matcher.containsAction("show"));

		const anotherMatcher = new EventMatcher({
			when: "before",
			subject_path: /.*/,
			action: "create",
		});

		assert(anotherMatcher.containsAction("create"));
		assert(!anotherMatcher.containsAction("show"));
	});
});
