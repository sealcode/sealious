const React = require("react");
const EventEmitter = require("event-emitter");

class KeyValueStore {
	constructor(initial_values) {
		this.ee = new EventEmitter();
		this.values = initial_values || {};
		this.on = (event, callback) => this.ee.on(event, callback);
		this.off = (event_name, listener) => this.ee.off(event_name, listener);
	}

	set(key, value) {
		const key_elements = key.split(".").reverse();
		let current_pointer = this.values;
		while (key_elements.length > 1) {
			let current_key = key_elements.pop();
			if (current_pointer[current_key] === undefined) {
				current_pointer[current_key] = {};
			}
			current_pointer = current_pointer[current_key];
		}
		current_pointer[key_elements.pop()] = value;
		this.ee.emit("change", this.values);
	}

	get(key) {
		return this.values[key];
	}

	replaceStore(values) {
		this.values = values;
		this.ee.emit("change", this.values);
	}

	getStore() {
		return this.values;
	}
}

module.exports = KeyValueStore;
