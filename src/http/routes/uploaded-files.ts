import Router from "@koa/router";
import File from "../../data-structures/file";
const uploaded_files = new Router();
uploaded_files.get("/:id/:filename", async (ctx) => {
	const file = await File.fromID(ctx.$app, ctx.params.id);
	ctx.body = file.getStream();
	ctx.set("Content-Disposition", `attachment; filename="${file.filename}"`);
});

export default uploaded_files;
