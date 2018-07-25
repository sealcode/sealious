const assert = require("assert");
const locreq = require("locreq")(__dirname);
const {
	Hookable,
	EventMatcher,
	CollectionEventMatcher,
	ResourceEventMatcher,
} = require("./hookable");
const { assert_throws_async } = locreq("test_utils");

describe("hookable", () => {
	function createHook(App, handler) {
		App.addHook(
			{
				when: "pre",
				subject_path: /collections.movies/,
				action: "create",
			},
			handler
		);
	}
	function createAnotherHook(App, handler) {
		App.addHook(
			{
				when: "post",
				subject_path: /collections.movies/,
				action: "create",
			},
			handler
		);
	}

	function getResult(App, data) {
		return App.emit(
			{
				when: "pre",
				subject_path: "collections.movies",
				action: "create",
			},
			data
		);
	}

	async function assertErrorThrownOnAppAddHook(event_description, callback) {
		await assert_throws_async(
			() => {
				const App = new Hookable();
				App.addHook(event_description, callback);
			},
			error => assert.deepEqual(error.code, "ERR_ASSERTION")
		);
	}

	async function assertErrorThrownOnAppEmit(event_description) {
		await assert_throws_async(
			async () => {
				const App = new Hookable();
				await App.emit(event_description, 0);
			},
			error => assert.deepEqual(error.code, "ERR_ASSERTION")
		);
	}

	it("properly passess value from handler to handler (happy path)", async () => {
		const App = new Hookable();
		createHook(App, (event, number) => number + 2);
		createHook(App, (event, number) => number * 2);
		const result = await getResult(App, 1);
		assert.equal(result, 6);
	});

	it("returns proper value if one of the handlers in the middle doesn't return anything", async () => {
		const App = new Hookable();
		createHook(App, (event, number) => number + 2);
		createHook(App, () => {
			return undefined;
		});
		createHook(App, (event, number) => number * 10);
		const result = await getResult(App, 1);
		assert.equal(result, 30);
	});

	it("returns back given data if handler doesn't return anything", async () => {
		const App = new Hookable();
		createHook(App, () => {});
		const result = await getResult(App, 1);
		assert.equal(result, 1);
	});

	it("doesn't trigger hooks that refer to another event", async () => {
		const App = new Hookable();
		createHook(App, (event, number) => number * 2);
		createAnotherHook(App, (event, number) => number * 100);
		const result = await getResult(App, 1);
		assert.equal(result, 2);
	});

	it("properly reacts to async handlers", async () => {
		const App = new Hookable();
		const sleep = ms =>
			new Promise(resolve => {
				setTimeout(() => {
					resolve();
				}, ms);
			});

		createHook(App, async (event, number) => {
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
				when: "pre",
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			}),
			(event, number) => number + 50
		);
		const result = await App.emit(
			{
				when: "pre",
				subject_path: "collections.movies",
				action: "create",
			},
			50
		);
		assert.equal(result, 100);
	});

	it("should work properly when given an instance of EventMatcher ", async () => {
		const App = new Hookable();
		App.addHook(
			new EventMatcher({
				when: "pre",
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			}),
			(event, number) => number + 50
		);
		const result = await App.emit(
			{
				when: "pre",
				subject_path: "collections.movies",
				action: "create",
			},
			50
		);
		assert.equal(result, 100);
	});

	it("should work properly when given an instance of CollectionEventMatcher", async () => {
		const App = new Hookable();
		const _collection_event_matcher = new CollectionEventMatcher({
			when: "pre",
			collection_name: "shows",
			action: ["create"],
		});
		assert.deepEqual(_collection_event_matcher.collection_name, "shows");
		App.addHook(_collection_event_matcher, (event, number) => number + 51);
		const result = await App.emit(
			{
				when: "pre",
				subject_path: "collections.shows",
				action: "create",
			},
			50
		);
		assert.equal(result, 101);
	});

	it("should work properly when given an instance of ResourceEventMatcher", async () => {
		const App = new Hookable();
		const _resource_event_matcher = new ResourceEventMatcher({
			when: "pre",
			collection_name: "series",
			action: ["create"],
		});
		assert.deepEqual(_resource_event_matcher.collection_name, "series");
		App.addHook(_resource_event_matcher, (event, number) => number + 52);
		const result = await App.emit(
			{
				when: "pre",
				subject_path: "collections.series.id",
				action: "create",
			},
			50
		);
		assert.equal(result, 102);
	});

	it("should take care of `App.addHook` params validation", async () => {
		// `callback` is not a function
		await assertErrorThrownOnAppAddHook(
			{
				when: "pre",
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			},
			2
		);
		// `when` is not a string
		await assertErrorThrownOnAppAddHook(
			{
				when: 222,
				subject_path: /collections.movies/,
				action: ["create", "edit"],
			},
			() => {}
		);
		// `action` is not a string/array
		await assertErrorThrownOnAppAddHook(
			{
				when: "pre",
				subject_path: /collections.movies/,
				action: {},
			},
			() => {}
		);
		// `subject_path` is not a regexp
		await assertErrorThrownOnAppAddHook(
			{
				when: "pre",
				subject_path: [""],
				action: "create",
			},
			() => {}
		);
	});

	it("should take care of `App.emit` params validation", async () => {
		// `when` is not a string
		await assertErrorThrownOnAppEmit({
			when: [],
			subject_path: "collections.events",
			action: "create",
		});
		// `subject_path` is not a string
		await assertErrorThrownOnAppEmit({
			when: "before",
			subject_path: 222,
			action: "create",
		});
		// `action` is not a string
		await assertErrorThrownOnAppEmit({
			when: "before",
			subject_path: "collections.events",
			action: {},
		});
		// `when` is not an object
		await assertErrorThrownOnAppEmit({
			when: "before",
			subject_path: "collections.events",
			action: "create",
			metadata: 2,
		});
	});

	it("should take care of `*EventMatcher` collection_name validation", async () => {
		// collection_name must be a string
		await assert_throws_async(
			() => {
				new CollectionEventMatcher({
					when: "before",
					collection_name: 222,
					action: "create",
				});
			},
			error => assert.deepEqual(error.code, "ERR_ASSERTION")
		);
		// collection_name must be a string
		await assert_throws_async(
			() => {
				new ResourceEventMatcher({
					when: "before",
					collection_name: [],
					action: "create",
				});
			},
			error => assert.deepEqual(error.code, "ERR_ASSERTION")
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
