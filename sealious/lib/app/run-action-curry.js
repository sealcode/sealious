"use strict";
const locreq = require("locreq")(__dirname);

const ActionResultCache = new WeakMap();

function hash_call(subject_path, action_name, params){
	const to_map = [subject_path, action_name, params];
	return to_map.map(e=>JSON.stringify(e)).reduce((a, b) => a + b);
}

function get_event_name(stage, subject_path, action_name){
	return `${stage  }:${  subject_path.join(".")  }:${  action_name}`;
}

function run_action_curry(app){
	return function run_action(context, subject_path, action_name, params){

		if(!ActionResultCache.has(context)){
			ActionResultCache.set(context, new Map());
		}

		const hash = hash_call(subject_path, action_name, params);

		context.total = context.total + 1 || 1;

		if(ActionResultCache.get(context).has(hash)){
			context.from_cache = context.from_cache + 1 || 1;
			return ActionResultCache.get(context).get(hash);
		}else{
			let subject = null;
			const promise = app.RootSubject.get_subject(subject_path)
			.then(function(_subject){
				subject = _subject;
				const event_name = get_event_name("pre", subject_path, action_name);
				return app.emit(event_name, subject_path, params);
			})
			.then(function(new_params){
				if(new_params[0] !== undefined){
					params = new_params[0];
				}
				return subject.perform_action(context, action_name, params);
			}).then(function(response){
				const event_name = get_event_name("post", subject_path, action_name);
				return app.emit(event_name, subject_path, params, response)
				.then(function(){
					return response;
				});
			});

			if(action_name === "show"){
				ActionResultCache.get(context).set(hash, promise);
			}
			if(action_name !== "show"){
				ActionResultCache.delete(context);
			}

			return promise;
		}
	};
}


module.exports = run_action_curry;
