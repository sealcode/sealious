import React from "react";
import merge from "merge";
import Collection from "./collection";

const default_props = {
	displayAttr: "id",
	valueAttr: "id",
	noValueOptionName: "--",
	allowNoValue: false,
	onValueChange: value => alert(value),
	label: "Select resource:",
	disabled: false,
	value: "",
	resources: [],
	displayAttrIsSafe: false,
};

function getAttr(name, resource, props) {
	const propname = name + "Attr";
	if (typeof props[propname] === "string") {
		return resource[props[propname]];
	} else if (typeof props[propname] === "function") {
		return props[propname](resource);
	}
}

function ResourceDropdownPure(config) {
	const { collection, get_forced_query, query_store_class } = config;

	return Collection({ collection, get_forced_query, query_store_class }, _props => {

		const props = merge(true, default_props, _props, config);

		const options = props.resources.map(resource => {
			const value = getAttr("value", resource, props);
			const name = getAttr("display", resource, props);
			const key = resource.id;
			if (props.displayAttrIsSafe) {
				return (
					<option
						value={value}
						key={key}
						dangerouslySetInnerHTML={{ __html: name }}
					/>
				);
			} else {
				return (
					<option value={value} key={key}>
						{name}
					</option>
				);
			}
		});

		if (props.allowNoValue) {
			options.unshift(
				<option value="" key="empty">
					{props.noValueOptionName}
				</option>
			);
		}
		return (
			<React.Fragment>
				<label className={props.labelClassName}>{props.label}</label>
				<select
					onChange={e => props.onValueChange(e.target.value)}
					value={props.value}
					disabled={props.disabled}
					className={props.className}
				>
					{options}
				</select>
			</React.Fragment>
		);
	});
}

module.exports = ResourceDropdownPure;
