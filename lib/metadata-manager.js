var Promise = require("bluebird");

var MetadataManager = new function(){

	var that = this;

	this.get_value = function(key, dispatcher){
		return new Promise(function(resolve, reject){
			dispatcher.datastore.find("meta", { "key": key }, {}).then(function(response){
				if(response.length==0){
					resolve(undefined);
				}else{
					resolve(response[0].value);
				}
			});			
		})
	}
	
	this.has_key = function(key, dispatcher){
		return new Promise(function(resolve, reject){
			dispatcher.datastore.find("meta", { key: key }, {}).then(function(response){
				if(response.length===0){
					resolve(false);
				}else{
					resolve(true);
				}
			});			
		});
	}

	this.set_value = function(key, value, dispatcher){
		return new Promise(function(resolve, reject){
			that.has_key(key, dispatcher).then(function(has){
				function actual_set(){
					dispatcher.datastore.update("meta", { key: key }, {key:key, value: value}).then(function(response){
						if(response.length==0){
							resolve(false);
						}else{
							resolve(true);
						}
					});					
				}
				if(!has){
					dispatcher.datastore.insert("meta", {key: key, value: value}, {}).then(function(data){
						actual_set();
					})
				}else{
					actual_set();
				}
			})			
		})
	}

	this.increment_variable = function(key, dispatcher){
		return new Promise(function(resolve, reject){
			that.get_value(key, dispatcher).then(function(data){
				if(isNaN(data)){
					var new_id=0;
				}else{
					var new_id = data+1;						
				}
				that.set_value(key, new_id, dispatcher).then(function(dataL){
					resolve(new_id);
				});
			});			
		})
	}
}

module.exports = MetadataManager;