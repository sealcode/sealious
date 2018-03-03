const dotProp = require("dot-prop");
const merge = require("merge");

module.exports = class ConfigManager {
	constructor() {
		this.DEFAULT_CONFIG = {};
		this.CUSTOM_CONFIG = {};
		this.isLocked = false;
	}
	setDefault(key, value) {
		this._setGivenConfig(this.DEFAULT_CONFIG, key, value);
	}
	getDefaultConfig(key) {
		return dotProp.get(this.DEFAULT_CONFIG, key);
	}
	set(key, value) {
		this._setGivenConfig(this.CUSTOM_CONFIG, key, value);
	}
	_setGivenConfig(config, key, value) {
		this._warnIfLocked();
		dotProp.set(config, key, value);
	}
	_warnIfLocked() {
		if (this.isLocked) {
			console.warn(
				"Warning: " +
					"you shouldn't change config after ConfigManager was locked"
			);
		}
	}
	setRoot(params) {
		this._warnIfLocked();
		merge.recursive(this.CUSTOM_CONFIG, params);
	}
	get(key) {
		return dotProp.get(
			merge.recursive(true, this.DEFAULT_CONFIG, this.CUSTOM_CONFIG),
			key
		);
	}
	lock() {
		this.isLocked = true;
	}
};
