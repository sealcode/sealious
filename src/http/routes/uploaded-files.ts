import Router from "@koa/router";
const uploaded_files = new Router();
uploaded_files.get("/:bucket/:filename", async (ctx) => {
	const filenameParams = ctx.params.filename;
	if (!filenameParams) {
		throw Error("filename param is missing");
	}
	const file = await ctx.$app.fileManager.fromToken(
		ctx.$app.fileManager.encodeToken(
			ctx.params.bucket == "persistent",
			filenameParams,
			filenameParams
		)
	);
	ctx.body = file.getStream();
	ctx.type = file.mimetype;

	// removing this as it only created trouble and you can declare download
	// target in html <a> element, anyway

	// ctx.set(
	// 	"Content-Disposition",
	// 	`attachment; filename*=utf-8''="${encodeURIComponent(file.filename)}"`
	// );
});

export default uploaded_files;
