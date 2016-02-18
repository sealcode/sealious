### field_type.html
Field type html offers saving values which are HTML source codes with specifying tags and attributes. All tags and attributes which won't be desirable will be removed from received HTML source code.

#### What is the difference relative to field type text?
In the case field type text we receive object with two fields after sent value. The first field `original` stores original string typed through user whereas second field `safe` stores escaped value from special characters (every characters with an UTF-8 code above 127). Field type html stores only one safe string - HTML source code. The parameters make it possible to protect against XSS attacks.

#### `get_description` function
Returns description about field type html.
```
> HTML source code
```

#### `is_proper_value` function
The purpose of the `is_proper_value` function is test whether received value isn't object. In other words in the case receive a value which is an instance of the object will be rejected.

#### `encode` function
The purpose of the `encode` function is return value without tags and attributes which wasn't defined. If you are define own parameters then `encode` function will use your parameters, in the case of no defined parameters `encode` function will use predefined parameters. If sent value has includes unacceptable tags or attributes it these parameters will be ignored while saving value.

#### Predefined parameters
Field type html has predefined parameters. These parameters are uses when you don't defined own parameters.

```js
tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
	'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
	'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
],
attributes: {
	a: ['href', 'name', 'target'],
	img: ['src']
}
```

#### Own parameters
You can define own parameters (tags and attributes) as you can see on the example below. This declaration permits the following tags: `a`, `p`, `h1`, `h2`, `h3`, `button`. For `a` and `button` tags defined are the attributes `id`, `href` and `title`.

```js
new Sealious.ChipTypes.ResourceType({
	name: "article",
	fields: [{
		name: "code",
		type: "html",
		params: {
			tags: ['a', 'p', 'h1', 'h2', 'h3', 'button'],
			attributes: {
				a: ['id', 'href'],
				button: ['title']
			}
		}
	}]
});
```


#### Examples
to do