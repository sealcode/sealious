### field_type.html
Field type html offers saving values which are HTML source codes with specifying tags and attributes. In declaration developer should indicate which tags and attributes have to be kept and removed. In the case not indicated elements developer must set default decision. All tags and attributes which won't be desirable will be kept or removed from received HTML source code through default decisions. 

#### What is the difference relative to field type text?
In the case field type text we receive object with two fields after sent value. The first field `original` stores original string typed through user whereas second field `safe` stores escaped value from special characters (every characters with an UTF-8 code above 127). Field type html stores only one safe string - HTML source code. The parameters make it possible to protect against XSS attacks.

#### Predefined parameters
Field type html has predefined parameters. 

```js
new Sealious.ChipTypes.ResourceType({
	name: "article",
	fields: [{
		name: "code",
		type: "html"
	}]
});
```

If you don't defined parameters, field type html will use predefined parameters those as you can see below:

```js
{
	tags: {
		default_decision: "remove",
		keep: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
			'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
			'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
		],
		remove: ['script', 'input', 'form', 'noscript']
	},
	attributes: {
		default_decision: "remove",
		keep: ['href', 'name', 'target'],
		remove: ['src']
	}
}
```

#### Merging parameters
Field type html also include `merge_params` function which task is merge your defined parameters with default predefined parameters in the case not defined some arrays of tags and attributes or incorrect `default_decision` through developer. In the case of typos in property name field type html uses predefined values. For example when you don't defined attributes property then your tags property will be merge with predefined attributes property.

```js
new Sealious.ChipTypes.ResourceType({
	name: "article",
	fields: [{
		name: "code",
		type: "html",
		params: {
			"attributes": {
				"default_decision": "keep",
				"keep": [],
				"remove": ["href", "src"]
			}
		}
	}]
});
```

The above declaration will generate the following parameters to use:

```js
params: {
	tags: {
		default_decision: "remove",
		keep: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
			'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
			'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
		],
		remove: ['script', 'input', 'form', 'noscript']
	},
	attributes: {
		default_decision: "keep",
		keep: [],
		remove: ["href", "src"]
	}
}
```

#### Own parameters
In order to define own parameters you must declare two properties `tags` and `attributes`. In each of them you must define three values: `default_decision` variable also `keep` and `remove` arrays. Don't be afraid all values are saved to the database in a intact form. In the case change parameters hitherto saved values will be return in updated form.

##### `default_decision`
The purpose of the `default_decision` is indicate whether the value is to be removed or kept some currently considered element (tag or attribute). `default_decision` will use when the element there isn't in any array or is located in both arrays. Acceptable values: `keep` and `remove`. In the case of typos in property name (the same applies to arrays
) or value will be allocated default predefined value i.e. `remove`. 

##### `keep` array
The `keep` array determines which tags or attributes you want to keep. In the case defined just empty array `keep: []` and set `default_decision: "remove"`, no tags or attributes will not be kept.

##### `remove` array
The `remove` array determines which tags or attributes you want to remove. In the case defined empty arrays `remove: []` and set `default_decision: "keep"`, no tags or attributes will not be removed.


#### Examples

This declaration permits all tags which aren't `script` tag and retains only `id` or `class` attributes.


```js
new Sealious.ChipTypes.ResourceType({
	name: "article",
	fields: [{
		name: "code",
		type: "html",
		params: {
			"tags": {
				"default_decision": "keep",
				"keep": [],
				"remove": ['script']
			},
			"attributes": {
				"default_decision": "remove",
				"keep": ["id", "class"],
				"remove": ["href", "src"]
			}
		}
	}]
});
```
