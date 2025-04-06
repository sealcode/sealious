import type { App, Context } from "../main.js";

// open api schema interfaces

export interface CollectionProperties {
	type: string; // object
	properties: Record<string, unknown>;
	required?: string[];
}

interface AppInfo {
	title: string;
	version: string;
	contact: { email: string };
}

interface SecuritySchema {
	type: string;
	in: string;
	name?: string;
}

interface OpenApiSchema {
	openapi: string; // version
	info: AppInfo;
	paths: unknown; // endpoints
	components: {
		schemas: Record<string, CollectionProperties>;
		securitySchemes: Record<string, SecuritySchema>;
	};
}

// const OPEN_API_VERSION = "3.1.1" // current version
const OPEN_API_VERSION = "3.0.3"; // for https://editor.swagger.io/

// open api generator

export default class Generator {
	app: App;
	context: Context;

	constructor(app: App) {
		this.app = app;
		// not sure if it's ok with super context
		this.context = new this.app.SuperContext();
	}

	generateAppInfo(): AppInfo {
		return {
			title: this.app.manifest.name,
			version: this.app.manifest.version,
			contact: { email: this.app.manifest.admin_email },
		};
	}

	generateSecuritySchema(): Record<string, SecuritySchema> {
		return {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: this.app.ConfigManager.get("www-server")[
					"session-cookie-name"
				],
			},
		};
	}

	async generateSchema(): Promise<OpenApiSchema> {
		// https://swagger.io/specification/
		const generatedSchema: OpenApiSchema = {
			openapi: OPEN_API_VERSION,
			info: this.generateAppInfo(),
			paths: {}, // TODO for later
			components: {
				schemas: {}, // object collections
				securitySchemes: this.generateSecuritySchema(),
			},
			// also prob should be extendable with config
		};

		// collection schemas
		for (const [name, collection] of Object.entries(this.app.collections)) {
			if (collection.internal) continue;
			generatedSchema.components.schemas[name] =
				// eslint-disable-next-line no-await-in-loop
				await collection.getOpenApiSchema(this.context);
		}

		return generatedSchema;
	}

	// TODO
	// * paths/endpoints
	// * + query_params
	// * + policies
	// * custom endpoints
	// * swagger/redoc js/css
}
