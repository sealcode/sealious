import { App } from "../../main";

export default (app: App) => {
	app.HTTPServer.custom_raw_route({
		method: ["GET"],
		path: "/api/v1/logo",
		handler: { file: { path: app.manifest.logo } },
	});
};
