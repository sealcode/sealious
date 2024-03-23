import Router from "@koa/router";
import File from "../../data-structures/file.js";
const uploaded_files = new Router();
uploaded_files.get("/:id/:filename", async (ctx) => {
	const file = await File.fromID(ctx.$app, ctx.params.id);
	ctx.body = file.getStream();
	// removing this as it only created trouble and you can declare download
	// target in html <a> element, anyway

	// ctx.set(
	// 	"Content-Disposition",
	// 	`attachment; filename*=utf-8''="${encodeURIComponent(file.filename)}"`
	// );
});

export default uploaded_files;
