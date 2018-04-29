const Promise = require("bluebird");
const PatternEmitter = require("pattern-emitter-promise").EventEmitter;
PatternEmitter.setPromiseLibrary(Promise);

class EventManager {
	constructor(app) {
		app.ee = PatternEmitter();
		app.on = app.ee.on.bind(app.ee);
		app.off = app.ee.off.bind(app.ee);
		app.emit = app.ee.emit.bind(app.ee);
		app.removeAllListeners = app.ee.removeAllListeners.bind(app.ee);
		this.app = app;
	}
	// TODO: this function is a symptom of leaking abstraction
	// we need to abstract logic of intentions that base on secret tokens
	subscribeToIntentionCreate(collection_name, template_name) {
		this.subscribeTo(
			collection_name,
			"create",
			"post",
			async (path, params, intent) => {
				const token = (await this.app.run_action(
					new this.app.Sealious.SuperContext(),
					["collections", collection_name, intent.id],
					"show"
				)).body.token;
				const message = await this.app.MailTemplates[template_name](
					this.app,
					{
						email_address: intent.body.email,
						token,
					}
				);
				return message.send(this.app);
			}
		);
	}
	subscribeTo(collection_pattern, action_name, when, callback) {
		this.app.on(
			new RegExp(
				`${when}:collections\.${collection_pattern}:${action_name}`
			),
			callback
		);
	}
}

module.exports = EventManager;
