const Sealious = require("./lib/main.js");
const locreq = require("locreq")(__dirname);

before(() => {
	global.TestApp = new Sealious.App(
		{
			upload_path: "/tmp",
			datastore_mongo: { host: "db", password: "sealious-test" },
			app: { version: "0.0.0-test" },
			logger: { level: "emerg" },
		},
		{
			name: "testing app",
			logo: locreq.resolve("assets/logo.png"),
			version: "0.0.0-test",
		}
	);
	global.Sealious = Sealious;
	return TestApp.start().catch(error => {
		console.error(error);
		process.exit(1);
	});
});

after(async () => {
	await TestApp.stop();
});
