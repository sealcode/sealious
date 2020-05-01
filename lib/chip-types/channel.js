const channel = function (app, declaration) {
	this.name = declaration.name;
	this.longid = `channel.${declaration.name}`;
};

channel.type_name = "channel";

module.exports = channel;
