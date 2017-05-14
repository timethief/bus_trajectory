function setStyles() {
	document.getElementById("title-text").innerHTML = 'How On Time Are LA Buses?';
	var headerHeight = document.getElementById("header").offsetHeight;
	var wrapperItems = document.getElementsByClassName("wrapper");
	var windowWidth  = window.innerWidth;
	var windowHeight = window.innerHeight;
	for(i = 0; i < wrapperItems.length; i++) {
		wrapperItems[i].style.opacity = 1.0;
		wrapperItems[i].style.height = (windowHeight - headerHeight) + 'px';
	}
	var w1 = document.getElementById("w1");
	var w2 = document.getElementById("w2");
	var content = document.getElementById("content");
	var body = document.getElementById("mytbody");
	var headRowHeight = document.getElementById("head-row").offsetHeight;
	var paginHeight = 0; //document.getElementById("pagin-wrapper").offsetHeight;
	if(windowWidth < 766) {
		w1.style.width = windowWidth;
		w1.style.height = (windowHeight - headerHeight)/3 + 'px';
		content.style.height = ((windowHeight - headerHeight)/3 - paginHeight) + 'px';
		body.style.height = ((windowHeight - headerHeight)/3 - headRowHeight - paginHeight) + 'px';
		w2.style.width = windowWidth;
		w2.style.height = (windowHeight - headerHeight)/3*2 + 'px';
	}
	else {
		content.style.height = (windowHeight - headerHeight - paginHeight) + 'px';
		body.style.height = (windowHeight - headerHeight - headRowHeight - paginHeight) + 'px';
		w1.style.height = (windowHeight - headerHeight) + 'px';
		w2.style.height = (windowHeight - headerHeight) + 'px';
		if(window.innerWidth > 1500) {
			var w1Width = 450;
			w1.style.width = w1Width + 'px';
			w2.style.width = (windowWidth - w1Width) + 'px';
		}
		else {
			w1.style.width = '30%';
			w2.style.width = '70%';
		}
	}
	var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
	if(isSafari) {
		$("td:nth-child(1)").width($('#w1').width()*0.1);
		$("td:nth-child(2)").width($('#w1').width()*0.5);
		$("td:nth-child(3)").width($('#w1').width()*0.4);
	}
}

// Working with HTML Table

var obj;
var mapStyles;
function getFile(str) {
	$.getJSON(str, function(data) {
		obj = data;
		callInitializeFunctions();
	});
	$.getJSON('map-styles-silver.json',function(data) {
		mapStyles = data;
		callInitializeFunctions();
	});
}

var toLoad = 3;
function callInitializeFunctions() {
	toLoad--;
	if(toLoad != 0) return;
	generateTable();
	setStyles();
	initMap();
	drawMap();
	markerImageRed = {
	    url: 'marker-red.png',
	    // This marker is 20 pixels wide by 32 pixels high.
	    size: new google.maps.Size(20,53),
	    // The origin for this image is (0, 0).
	    origin: new google.maps.Point(0, 0),
	    // The anchor for this image is the base of the flagpole at (0, 32).
	    anchor: new google.maps.Point(10,51)
	};
	markerImageOrange = {
	    url: 'marker-orange.png',
	    // This marker is 20 pixels wide by 32 pixels high.
	    size: new google.maps.Size(20,53),
	    // The origin for this image is (0, 0).
	    origin: new google.maps.Point(0, 0),
	    // The anchor for this image is the base of the flagpole at (0, 32).
	    anchor: new google.maps.Point(10,51)
	};
}

function generateTable() {
	var str = '<table id="mytable">';
	str += '<thead id="head-row"><tr>'
		+ '<th></th>'
		+ '<th>Top 20 Most Delayed Bus Stops</th>'
		+ '<th>Delay (min)</th>'
		+ '</tr></thead>';
	str += '<tbody id="mytbody">';
	for(i = 0; i <  /*obj.items.length*/20; i++) {
		var temp = (obj.items[i].stop_name).toLowerCase();
		if(temp[4] == ' ') temp = temp.substring(5);
		str += '<tr onclick="showPosition(this)"'
			+ ' onmouseover="showSelectCircle(this)"'
			+ ' onmouseout="hideSelectCircle(this)"'
			+ ' id="row-' + i + '">'
			+ '<td>' + (i+1) + '</td>'
			+ '<td>' + temp + '</td>'
			+ '<td>' + (obj.items[i].avg).toFixed(2) + '</td>'
		+ '</tr>';
	}
	str += '</tbody></table>';
	document.getElementById("content").innerHTML = str;
}

// Working with Maps

var map;
var currentMarker;
var currentSelect;
var circles = [];
var hoverCircle;
var markerImageRed;
var markerImageOrange;

var thres1 = 10;
var thres2 = 20;

function initMap() {
	var mapOptions = {
		center: new google.maps.LatLng(34.0522,-118.2437),
		zoom: 11,
		styles: mapStyles
	};
	map = new google.maps.Map(document.getElementById("map"), mapOptions);
}

function drawMap() {
	document.getElementById("map").style.visibility = "visible";
	if(typeof circles[0] !== 'undefined') {
		for(i = 0; i < circles.length; i++) {
			circles[i].setMap(null);
		}
		circles = [];
	}
	for(i = 0; i < 20/*obj.items.length*/; i++) {
		addMarker(obj.items[i].lat, obj.items[i].lon, obj.items[i].avg, i);
	}
}

function addMarker(lat, lon, avg, ind) {
	var tmpPos = new google.maps.LatLng(lat,lon);

	var val = (avg*2-4) / obj.items[0].avg;
	if(val > 1) val = 1;
	val = val*val*val*val;

	var color = "#888";
	if(ind < thres1) color = "#f00";
	else if(ind < thres2) color = "#f80";
	// var color = "rgb(255,"+(12*ind)+",0)";

	circles[circles.length] = new google.maps.Circle({
		center: tmpPos,
		radius: val * 1400,
		strokeColor: color,
		strokeOpacity: 0.8,//val,
		strokeWeight: 1,
		fillColor: color,
		fillOpacity: 0.4 //val/2
	});
	circles[circles.length-1].addListener('click', function() {
		$('#row-' + ind).trigger('click');
	});
	circles[circles.length-1].addListener('mouseover', function() {
		$('#row-' + ind).css('background-color', '#ccc');
		// showSelectCircle(document.getElementById('row-' + ind));
	});
	circles[circles.length-1].addListener('mouseout', function() {
		$('#row-' + ind).css('background-color', '');
		// hideSelectCircle(document.getElementById('row-' + ind));
	});
	circles[circles.length-1].setMap(map);
}

function showPosition(row) {
	if(currentMarker !== undefined) currentMarker.setMap(null);
	var dataIndex = row.rowIndex - 1;
	var tmpPos = new google.maps.LatLng(obj.items[dataIndex].lat,obj.items[dataIndex].lon);
	if(dataIndex < thres1)
		currentMarker = new google.maps.Marker({ position: tmpPos, icon: markerImageRed });
	else 
		currentMarker = new google.maps.Marker({ position: tmpPos, icon: markerImageOrange });
	currentMarker.setMap(map);
	if(map.getZoom() >= 12) map.setCenter(tmpPos);

	if(currentSelect !== undefined) currentSelect.className = '';
	if(dataIndex < thres1) row.className = 'selected-red';
	else row.className = 'selected-orange';
	currentSelect = row;
}

function hideSelectCircle(row) {
	if(hoverCircle !== undefined) hoverCircle.setMap(null);
}

function showSelectCircle(row) {
	if(hoverCircle !== undefined) hoverCircle.setMap(null);
	var dataIndex = row.rowIndex - 1;
	var tmpPos = new google.maps.LatLng(obj.items[dataIndex].lat,obj.items[dataIndex].lon);
	hoverCircle = new google.maps.Circle({
		center: tmpPos,
		radius: circles[dataIndex].radius,
		strokeColor: '#000',
		strokeOpacity: 0.5,
		strokeWeight: 2,
		fillColor: '#fff',
		fillOpacity: 0.5,
		zIndex: 99999999
	});
	hoverCircle.setMap(map);
}