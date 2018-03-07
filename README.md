[![Sealious Logo](https://cldup.com/ggbys1XotB.png)](http://sealious.github.io/)

# Sealious

Sealious is a declarative node.js framework

## Configuring your app

Every Sealious application has an `App.ConfigManager` interface through which you can configure settings available throughout all the various components of your application. It comes with some sane defaults. 

### Changing the app settings

To run the app with specific settings, use an argument to `app.run` method:

```
const myApp = new Sealious.App();
myApp.run({http: {port: 8070}});
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


