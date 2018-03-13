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
