[![Sealious Logo](https://cldup.com/ggbys1XotB.png)](http://sealious.github.io/)

# Sealious

Sealious is a declarative node.js framework

## The App class

This is the class that holds all the logic and configuration of your, well, app ;)

The basic constructor is: 

```js
const newApp = new Sealious.App(config, manifest)
```

`config` and `manifest` both influence how the app will be set up.

### `config`

`config` is considered secret, and contains information on the infrastructure, as well as SMTP passwords and the like.

It's best to be kept in a separate json/yml file, and imported with 

```js
const config = require("./config.json")
```

in your app.

The default config is: 

```json
{
  "core": {
    "environment": "dev"
  },
  "logger": {
    "level": "info",
    "color": true,
    "file": null,
    "dirname": ".",
    "to_json": false,
    "rotation": ".yyyy-MM-Tdd"
  },
  "www-server": {
    "port": 8080,
    "api-base": "/api/v1",
    "session-cookie-name": "sealious-session",
    "anonymous-cookie-name": "sealious-anon",
    "max-payload-bytes": 10485760
  },
  "datastore_mongo": {
    "embedded": false,
    "host": "localhost",
    "port": 27017,
    "db_name": "sealious"
  }
}
```

### `manifest`

`manifest` is public, and can be safely `require`d by a front-end script. It contains information on branding and version of your app. It must include the following fields:

* `name` (string) - the name of your app
* `logo` (string) - path to an image with the logo of your app
* `version` (string) - the version of your app 
* `colors.primary` (string) - the primary color of your brand
* `default_language` (string) - the default language for your app. Email templates use this
* `admin_email` (string) - the email address of the admin. It might be publicly revealed within the app. Used to create the initial admin account. Whenever the app starts and there's no user with that email, a registration intent is created, causing an email to be sent to this address.

You can also include your own fields/values, so they can be easily shared across different modules on both back-end and front-end. 

## Configuring your app

Every Sealious application has an `App.ConfigManager` interface through which you can configure settings available throughout all the various components of your application. It comes with some sane defaults. 

### Changing the app settings

To run the app with specific settings, use an argument to `app.run` method:

```
const myApp = new Sealious.App();
myApp.run({http: {port: 8070}}, manifest);
```

Alternatively, you can use the `ConfigManager.set` method - which is especially useful when you want to use the dot notation to change just a single value:

```
const myApp = new Sealious.App();
myApp.ConfigManager.set("http.port", 8070);
```

### Default values

If you're creating your own Sealious module and want to make it globally configurable, use the `.setDefault` to set the default value for your setting.

NOTE: Sometimes it's better to just parametrize your module so it can be used multiple times with different configuration. ConfigManager is only useful for app-wide configurations.

```
app.setDefault("my-module", {port: 8080});
```

You can also use dot notation when setting single field values:

```
app.setDefault("my-module.port", 8080);
```


## Sending emails

This synopsis is self-explanatory:

```js
const message = await TestApp.EmailTemplates.Simple(TestApp, {
	to: "test@example.com",
	subject: "Congratulations!",
	text: "Enlarge your 'seal' with herbal supplements",
});
await message.send(TestApp);
```

To send emails via smtp, set the following config: 

```js
email: {
	from_name: "Sealious app",
	from_address: "sealious@example.com",
},
```

## Filtering resources

When reading a list of resources in a collection, you can use *filtering* to limit the list to resources that match certain criteria.

Let's say you have a Users collection with an additional "age" field. Now, to get all the users with age set to `42`, you can call:

```
app.run_action(context, ["collections", "users"], "show", {
	filter: { age: 42 },
});
```

or, via http:

```
GET /api/v1/collections/users?filter[age]=42
```

Some field-types support advanced filters. `int`, for example, lets you define a range of numbers like so:

```
app.run_action(context, ["collections", "users"], "show", {
	filter: { age: { ">": 50 } },
});
```

Or, via HTTP: 

```
GET /api/v1/collections/users?filter[age][>]=50
```

The above requests would return only those users with age set to above 50.

You can specify multiple filtering parameters:

```
app.run_action(context, ["collections", "users"], "show", {
	filter: { age: { ">": 50 }, country: "Poland" },
});
```

```
GET /api/v1/collections/users?filter[age][>]=50&filter[country]=Poland
```

### Implementation

Each field can implement its own filtering logic, by the means of the `filter_to_query` method. It's goal is to transform user input (like `{">": 52}`) into a Mongo `$match` operator (like `{$gt: 52}`). It should be an `async` function.
