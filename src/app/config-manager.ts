import { getProperty, setProperty } from "dot-prop";
import merge from "deepmerge";
import type Config from "./config.js";

type ConfigObject = { [key: string]: any };

export default class ConfigManager {
	DEFAULT_CONFIG: ConfigObject;
	CUSTOM_CONFIG: ConfigObject;
	isLocked: boolean;
	constructor() {
		this.DEFAULT_CONFIG = {};
		this.CUSTOM_CONFIG = {};
		this.isLocked = false;
	}
	setDefault(key: string, value: any) {
		this._setGivenConfig(this.DEFAULT_CONFIG, key, value);
	}
	getDefaultConfig(key: string) {
		return getProperty(this.DEFAULT_CONFIG, key);
	}
	set(key: string, value: any) {
		this._setGivenConfig(this.CUSTOM_CONFIG, key, value);
	}
	_setGivenConfig(config: ConfigObject, key: string, value: any) {
		this._warnIfLocked();
		setProperty(config, key, value);
	}
	_warnIfLocked() {
		if (this.isLocked) {
			console.warn(
				"Warning: " +
					"you shouldn't change config after ConfigManager was locked"
			);
		}
	}
	setRoot(params: ConfigObject) {
		this._warnIfLocked();
		this.CUSTOM_CONFIG = merge(this.CUSTOM_CONFIG, params);
	}
	get<Key extends keyof Config>(key: Key): Config[Key] {
		return getProperty(
			merge(this.DEFAULT_CONFIG, this.CUSTOM_CONFIG),
			key
		) as Config[Key];
	}
	lock() {
		this.isLocked = true;
	}
}
