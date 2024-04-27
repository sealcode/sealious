import Router from "@koa/router";
const uploaded_files = new Router();
uploaded_files.get("/:bucket/:filename", async (ctx) => {
	const file = await ctx.$app.FileManager.fromToken(
		ctx.$app.FileManager.encodeToken(
			ctx.params.bucket == "persistent",
			ctx.params.filename,
			ctx.params.filename
		)
	);
	ctx.body = file.getStream();
	// removing this as it only created trouble and you can declare download
	// target in html <a> element, anyway

	// ctx.set(
	// 	"Content-Disposition",
	// 	`attachment; filename*=utf-8''="${encodeURIComponent(file.filename)}"`
	// );
});

export default uploaded_files;
