import React from "react";
import resourceTypeCollection from "./mixins/resourceTypeCollection.jsx";
import merge from "merge";

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
        return resource[props[propname]] || resource.body[props[propname]];
    } else if (typeof props[propname] === "function") {
        return props[propname](resource);
    }
}

function getOptionValue(resource, props) {
    return getAttr("value", resource, props);
}

function getOptionName(resource, props) {
    return getAttr("display", resource, props);
}

function ResourceSelectPure(props_arg) {
    const props = merge(true, default_props, props_arg);

    function handleChange(e) {
        props.onValueChange(e.target.value);
    }

    const options = props.resources.map(resource => {
        const value = getOptionValue(resource, props);
        const name = getOptionName(resource, props);
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
        <label className={props.labelClassName}>
            {props.label}
            <select
                onChange={handleChange}
                value={props.value}
                disabled={props.disabled}
                className={props.className}
            >
                {options}
            </select>
        </label>
    );
}

export default ResourceSelectPure;
