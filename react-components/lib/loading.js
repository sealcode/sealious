var React = require("react");

var Loading = function(props){
	var delay = 65;
	var boxes_amnt = Math.floor(Math.random()*4) + 4;
	//var boxes_amnt = 6;
	var boxes  = [];
	for(var i=0; i<boxes_amnt; i++){
		boxes.push(
			<div className={"loading-box " + props.boxClass} style={{animationDelay: delay * i + "ms"}}/>
		);
		boxes.push(
			<div className="loading-shadow"/>
		);
	}
	let loading = null;
	if(props.text){
		loading = <div className="loading-text">
			{props.text}
		</div>;
	}
	return (
		<div className="loading-container">
			<div>
				{boxes}
			</div>
			{loading}
		</div>
	);
}


/*

*/

module.exports = Loading;
