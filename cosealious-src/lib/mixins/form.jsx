import React from "react";
import Promise from "bluebird";

function form(fields, onSubmit, component, default_values, clear_on_submit) {
	if (!default_values) default_values = {};
	class FormComponent extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				body: this.getInitialBody(),
				submitting: false,
			};
		}
		getInitialBody() {
			return Object.values(fields).reduce((acc, field) => {
				acc[field] = default_values[field] || "";
				return acc;
			}, {});
		}
		getChangeFieldFn(field_name) {
			const self = this;
			return function(event) {
				let new_value = "";
				if (event.target && event.target.type === "file") {
					//here we asynchronously append a base64 representation of the image so we can display it before upload
					const file = event.target.files[0];
					const reader = new FileReader();

					reader.addEventListener(
						"load",
						function() {
							file.base64 = reader.result;
							self.setState({
								[field_name]: file,
							});
						},
						false
					);

					if (file) {
						reader.readAsDataURL(file);
					}
					new_value = event.target.files[0];
				} else if (event.target && event.target.type === "checkbox") {
					new_value = event.target.checked;
				} else if (event.target && event.target.type !== "checkbox") {
					new_value = event.target.value;
				} else {
					new_value = event;
				}
				const current_body = self.state.body;
				current_body[field_name] = new_value;
				self.setState({
					body: current_body,
				});
			};
		}
		render() {
			const self = this;
			const props = { ...this.state.body };
			props._handlers = {};
			for (const i in fields) {
				props._handlers[fields[i]] = this.getChangeFieldFn(fields[i]);
			}
			props.onSubmit = function(e) {
				e.preventDefault();
				self.setState({ submitting: true });
				return Promise.method(onSubmit)(self.state.body)
					.then(function() {
						if (clear_on_submit) {
							self.setState({
								body: self.getInitialBody(),
							});
						}
					})
					.finally(() => self.setState({ submitting: false }));
			};
			props._submitting = self.state.submitting;
			return React.createElement(component, props);
		}
	}
	return FormComponent;
}

module.exports = form;
