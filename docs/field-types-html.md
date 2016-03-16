### field_type.html

The `html` field type offers saving strings with HTML content and can be configured to remove certain tags and attributes.

How is it different from field_type_text?

field_type_text makes strings html-safe by escaping all characters that are part of html syntax (e.g. changes `<` to `&lt;`). field_type_html makes strings html-safe by removing scripts and filtering attribute values that look like XSS attacks, while keeping the html syntax intact.

#### Usage

##### Params synopsis

```jsig

type Decision: "remove" | "keep"

params: {
	tags?: {
		default_decision?: Decision,
		keep?: Array<String>,
		remove?: Array<String>,
	},
	attributes?: {
		default_decision?: Decision,
		keep?: Array<String>,
		remove?: Array<String>,
	}
}
```

The `keep`/`remove` arrays are lists of whitelisted/blacklisted names of elements/attributes.

When an elements tag name is:

* in `tags.keep` and not in `tags.remove` - it will be **kept**
* in `tags.keep` *and* in `tags.remove` - the **`default_decision` applies**
* not in `tags.keep` and *in* `tags.remove` - it will be **removed**
* in neither `tags.keep` nor `tags.remove` - the **`default_decision` applies**

When the element is "removed", it's opening and closing tags will be deleted. It's text content will remain untouched. It's children elements will be processed according to the same rules.

Analogous rules apply to `attributes`, but when the decision for the attribute's name is `remove`, it will simply be removed from the output.

#### Default params

The params provided to a field constructor are merged with default values:

```json
{
	tags: {
		default_decision: "remove",
		keep: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', "blockquote", "p", "a", "ul", "ol", "nl", "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div", "table", "thead", "caption", "tbody", "tr", "th", "td", "pre"	],
		remove: ["script", "input", "form", "noscript"]
	},
	attributes: {
		default_decision: "remove",
		keep: ["href", "name", "target"],
		remove: ["src"]
	}
}
```

So providing an `html` field constructor with these params:

```json
{
	tags: {
		keep: ["p"]
	}
}
```

Actually becomes:

```json
{
	tags: {
		default_decision: "remove",
		keep: ["p"],
		remove: ["script", "input", "form", "noscript"]
	},
	attributes: {
		default_decision: "remove",
		keep: ["href", "name", "target"],
		remove: ["src"]
	}
}
```

#### Example usage

```js
var article = new Sealious.ChipTypes.ResourceType({
	name: "article",
	fields: [{
		name: "body",
		type: "html",
		params: {
			tags: {
				default_decision: "keep",
				remove: ["script"]
			},
			attributes: {
				default_decision: "keep",
				remove: []
			}
		}
	}]
});
```

The above describes a resource with a field named `body`. When a user enters a value: 

```html
<p>
Hello,
</p>
<script>
alert("world!");
</script>
```

it will be turned into:

```html
<p>
Hello,
</p>
alert("world!");
```
