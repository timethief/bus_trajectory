// Style settings

function drawButtons() {
	var sel = "";
	for(i = -1; i < 24; i++) {
		var str = "";
		if(i == -1) sel += '<div id="sel-1" class="name">Hour</div>';
		else if(i < 5) continue;
		else sel += '<div onclick="updateAll(this);" id="sel'+ i +'" class="default">'+ i +':00</div>';
	}
	document.getElementById("selection").innerHTML = sel;
	for(i = 5; i < 24; i++) {
		document.getElementById("sel" + i).style.borderLeft = "1px solid gray";
	}
}
function enableButtons() {
	for(i = 5; i < 24; i++) {
		document.getElementById("sel" + i).className = "default";
	}
}
function setLayout() {
	var headerHeight = 88;
	var wrapperItem = document.getElementById("map");
	var windowHeight = window.innerHeight;
	wrapperItem.style.height = (windowHeight - headerHeight) + 'px';
}
function completeLoad() {
	document.getElementById("title-text").innerHTML = 'How On Time Are LA Buses?';
}

// Working with HTML Table

var obj;
var mapStyles;
function getFile() {
	setLayout();
	$.getJSON('map-styles-silver.json',function(data) {
		mapStyles = data;
	});
	$.getJSON('data.json',function(data) {
		obj = data;
		partitionData();
	});
}
function callInitializeFunctions() {
	initMap();
	setTimeout(drawButtons,100);
	completeLoad();
}
var selectedValue = -1;
var timeOut;
function updateAll(item) {
	clearTimeout(timeOut);
	for(i = 5; i < 24; i++) {
		if(item.id == "sel" + i) {
			selectedValue = i;
		}
	}
	for(i = 5; i < 24; i++) {
		if(item.id == "sel" + i) document.getElementById("sel" + i).className = "selected";
		else document.getElementById("sel" + i).className = "default";
	}
	if(selectedValue > -1) {
		timeOut = setTimeout(function () {
			drawMarkers(startNo[selectedValue],startNo[selectedValue+1],map);
		},10);
	}
}

// Working with data partitioning

var startNo = [0,0,0,0,0];
function partitionData() {
	for(i = 0; i < obj.items.length; i++) {
		if(startNo.length == parseInt(obj.items[i].hour)) {
			startNo[startNo.length] = i;
		}

		// Put data into heatmap data array
		var weight = obj.items[i].avg;
		if(weight < 0) weight = 0;
		else if(weight > 10) weight = 10;
		heatmapData[heatmapData.length] = {
			location: new google.maps.LatLng(obj.items[i].lat, obj.items[i].lon), 
			weight: weight
		};
	}
	startNo[startNo.length] = obj.items.length;
	callInitializeFunctions();
}

// Working with Maps

var map;
var heatmapData = [];
var heatmap;
function initMap() {
	var mapOptions = {
		center: new google.maps.LatLng(34.0522,-118.2437),
		zoom: 12,
		minZoom: 11,
		maxZoom: 13,
		styles: mapStyles
	};
	map = new google.maps.Map(document.getElementById("map"), mapOptions);
}
function drawMarkers(s,e) {
	console.log('s='+s+' e='+e);
	if(heatmap !== undefined) heatmap.setMap(null);
	if(s !== undefined && e !== undefined) {
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: heatmapData.slice(s,e)
		});
		heatmap.setMap(map);
	}
}

// Progress Bar Control

function startProgress(str) {
	document.getElementById("title-text").innerHTML = str;
	document.getElementById("indicator").style.display = "block";
	document.getElementById("text-ind").style.opacity = 1.0;
	setProgress(0);
}

function setProgress(val) {
	var width = window.innerWidth * val;
	document.getElementById("indicator").style.width = width + 'px';
}

function endProgress() {
	completeLoad();
	var width = window.innerWidth;
	setProgress(1);
	setTimeout(function () {
		document.getElementById("indicator").style.opacity = 0.0;
		document.getElementById("text-ind").style.opacity = 0.0;
	}, 100);
	setTimeout(function () {
		setProgress(0);
		document.getElementById("indicator").style.display = "none";
		document.getElementById("indicator").style.opacity = 1.0;
	}, 600);
}
