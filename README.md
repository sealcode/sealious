[![Sealious Logo](./src/assets/logo.png)](http://sealious.github.io/)

# Sealious

Sealious is a declarative node.js framework. It creates a full-featured REST-ful API (with user and session management) based on a declarative description of the database schema and policies.

You can use it to create a full-featured REST API and ORM with minimal amount of code.

## Example

Instal sealious with `npm install --save sealious`. Then, in your index.ts:

```
lang=typescript
import { resolve } from "path";
import Sealious, { App, Collection, FieldTypes, Policies } from "sealious";
const locreq = _locreq(__dirname);

const app = new (class extends App {
	config = {
		datastore_mongo: {
			host: "localhost",
			port: 20723,
			db_name: "sealious-playground",
		},
		upload_path: locreq.resolve("uploaded_files"), // this resolves to an `uploaded_files` directory within the root of your project. Uploaded files (images etc) will be stored here
		email: {
			from_address: "sealious-playground@example.com", // emails from this app (login confirmation etc) will be sent from this address
			from_name: "Sealious playground app", // email from this app will be signed with this name
		},
		"www-server": {
			port: 8080, //listen on this port
		},
	};
	manifest = {
		name: "My ToDo list", // name of your application
		logo: resolve(__dirname, "../assets/logo.png"), // a string - absolute path to the application logo
		version: "0.0.1", // version - any string you want
		default_language: "en", // currently supported - "en" and partially "pl"
		base_url: "localhost:8080", // specify the domain and port for the app, as it's seen from outside world. Useful when app is behind a reverse proxy
		admin_email: "admin@example.com", // when the app is run for the first time, an admin account will be created for this email and an activation message will be sent
		colors: {
			primary: "#5294a1", // the main color of the brand of your app
		},
	};
	collections = {
		// this is the heart of a Sealious application - the collections
		...App.BaseCollections, // sealious comes with a set of build-in collections (users, sessions, etc). They have to be included like so OR they can be modified from standard behavior
		tasks: new (class extends Collection {
			// here we create a new collection called "tasks"
			fields = {
				// it has two fields: "title" and "done"
				title: new FieldTypes.Text(), // "title" is a text field
				done: new FieldTypes.Boolean(), // "done" is a boolean field
			};
			defaultPolicy = new Policies.Public(); // all actions are public. That means that anyone, even users that are not logged in, can create, view, edit and delete all tasks stored within this app. This is probably not desired in production, but useful when creating an MVP. Policies are another crucial strenght of Sealious, so read on about them from resources linked below to learn how to limit who can do what
		})(),
	};
})();

app.start();
```

Assuming you have the mongo database running, that's it! The above script creates a fully functional REST API with field validation, error messages, etc. Try sending as POST message to `http://localhost:8080/api/v1/collections/tasks` to see the API in action.

You can learn more about the endpoints created by Sealious for each collection [here](https://hub.sealcode.org/source/sealious/browse/dev/endpoints.remarkup).

## Technical docs

For technical reference, see [sealious.sealcode.org/docs](https://sealious.sealcode.org/docs)
