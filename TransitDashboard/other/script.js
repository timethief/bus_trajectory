$(document).ready(function() {
	$('.ok-btn').click(function () {
		$('.detail-block').show();
		$('.help-block').hide();
		$('.help-btn').show();
	});
	$('.help-btn').click(function () {
		$('.detail-block').hide();
		$('.help-block').show();
		$('.help-btn').hide();
	});
	$('#level-1').click(function () {
		selectedRow.reset();
		enterGlobalMode();
	});

	$('.switch-btn').click(function() {
		if($(this).html() == 'Go to Map') {
			$(this).html('Go to Summary');
		}
		else {
			$(this).html('Go to Map');
		}
		$('#level-1').toggle();
		$('.help-btn-container').toggle();
		$('#map-wrapper').toggle();
		$('#detail').toggle();
	});

	$('[aria-labelledby="sort-method-btn"] li').click(function() {
		curSortMethod = $(this).attr("value");
		if(curSortMethod == "alpha") {
			setDropdownToAscDesc();
		}
		else {
			setDropdownToBestWorst();
		}
		$("#sort-method-btn .dropdown-text").html($(this).html());
		showTable();
	});
	$('[aria-labelledby="sort-order-btn"] li').click(function() {
		curSortReverse = ($(this).attr("value") == "1");
		$("#sort-order-btn .dropdown-text").html($(this).html());
		showTable();
	});
});

function ele(str) {
	return document.getElementById(str);
}

var wasLarge;
function setStyles() {
	if(wasLarge === undefined) wasLarge = ($(window).width() >= 992);
	var isLarge = ($(window).width() >= 992);
	var isLargeChanged = (wasLarge != isLarge);

	ele("title-text").innerHTML = 'How On Time Are LA Buses?';
	var headerHeight = ele("header").offsetHeight;
	var wrapperItems = document.getElementsByClassName("wrapper");
	var windowHeight = 600;
	if(window.innerHeight > 600) var windowHeight = window.innerHeight;
	for(i = 0; i < wrapperItems.length; i++) {
		wrapperItems[i].style.opacity = 1.0;
		wrapperItems[i].style.height = (windowHeight - headerHeight) + 'px';
	}

	var listTitleHeight = ele("list-title").offsetHeight;
	var detBarHeight = ele("detail-bar").offsetHeight;
	var w1 = ele("w1");
	var w2 = ele("w2");
	var sub = ele("subwrapper");
	var wmap = ele("map-wrapper");
	var wdet = ele("detail");
	var body = ele("mytbody");

	var content = ele("content");
	var headRowHeight = ele("head-row").offsetHeight;

	w1.style.display = 'block';
	wdet.style.display = 'block';
	content.style.height = (windowHeight - headerHeight - listTitleHeight) + 'px';
	body.style.height = (windowHeight - headerHeight - headRowHeight - listTitleHeight) + 'px';
	sub.style.height = (windowHeight - headerHeight - detBarHeight) + 'px';

	wmap.style.height = sub.style.height;
	wdet.style.height = sub.style.height;

	if(!isLarge) {
		$('#level-2').css('visibility','hidden');
		$('#level-3').css('visibility','hidden');
	}
	
	if(isLargeChanged) {
		if(isLarge) {	// screen from small to big
			$('#level-1').show();
			$('#map-wrapper').show();
			$('.help-btn-container').show();
		}
		else {
			$('#level-1').hide();
			$('#map-wrapper').hide();
			$('#detail').show();
		}
		wasLarge = isLarge;
	}

	var isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
	if(isSafari) {
		$("td:nth-child(1)").width($('#w1').width()*0.1);
		$("td:nth-child(2)").width($('#w1').width()*0.5);
		$("td:nth-child(3)").width($('#w1').width()*0.4);
	}
}

// Working with HTML Table

var toLoad = 9;
function checkLoaded() {
	toLoad--;
	if(toLoad == 0) {
		showTable();
		initMarkers();
		initMap();
		setupMap();
		initMarkers();
	}
}

var descriptions;
var mapStyles;
var tables = {"alpha": [], "delay": [], rel: []};
var trajectoryData;
var indexData;
var detailData;
function getFiles() {
	$.getJSON('data/routes.json', function(data) {
		descriptions = data;
		checkLoaded();
	});

	$.getJSON('data/map-styles-silver.json',function(data) {
		mapStyles = data;
		checkLoaded();
	});

	loadData('data/sort-by-alpha.csv', function(data) {
		tables["alpha"][0] = toTable(data, true, false);
		tables["alpha"][1] = toTable(data, true, true);
		checkLoaded();
	});

	loadData('data/sort-by-delay.csv', function(data) {
		tables["delay"][0] = toTable(data, true, false);
		tables["delay"][1] = toTable(data, true, true);
		checkLoaded();
	});

	loadData('data/sort-by-rel.csv', function(data) {
		tables["rel"][0] = toTable(data, true, false);
		tables["rel"][1] = toTable(data, true, true);
		checkLoaded();
	});

	loadData('data/trajectory.csv', function(data) {
		trajectoryData = data;
		checkLoaded();
	}, true);

	loadData('data/detail-data.csv', function(data) {
		detailData = data;
		checkLoaded();
	}, true);
	loadData('data/trajectory-index.csv', function(data) {
		indexData = data;
		checkLoaded();
	}, true);
}

function loadData(dir, callback, doConvert) {
	if(doConvert === undefined) doConvert = true;
	$.ajax({
		type: 'GET',
		url: dir,
		dataType: "text",
		success: function(raw) {
			if(doConvert)
				callback(toObject(raw));
			else
				callback(raw);
		}
	});
}

function toObject(csvString) {
	var csvArray	= [];
	var csvRows		= csvString.match(/[^\r\n]+/g);
	var csvHeaders	= csvRows.shift().split(',');

	for(var rowIndex = 0; rowIndex < csvRows.length; rowIndex++) {
		var rowArray	= csvRows[rowIndex].split(',');
		var rowObject	= csvArray[rowIndex] = {};
		
		for(var propIndex = 0; propIndex < rowArray.length; propIndex++) {
			var propValue = rowArray[propIndex].replace(/^"|"$/g,'');
			var propLabel = csvHeaders[propIndex].replace(/^"|"$/g,'');
			rowObject[propLabel] = propValue;
		}
	}

	return csvArray;
}

function toArray(csvString, s, e) {
	var csvArray	= [];
	var csvRows		= csvString.match(/[^\r\n]+/g);
	csvRows.shift();

	for(var rowIndex = s; rowIndex < e; rowIndex++) {
		var rowArray	= csvRows[rowIndex].split(',');
		var parsed = [];
		for(colIndex = 0; colIndex < rowArray.length; colIndex++) {
			parsed[colIndex] = parseFloat(rowArray[colIndex]);
		}
		csvArray.push(parsed);
	}

	return csvArray;
}

function toTable(data) {
	toTable(data, false);
}

function toTable(data, hasIndex, reverse) {
	var html = '';
	html += '<thead id="head-row"><tr>';
	if(hasIndex) {
		html += '<th>Rank</th>';
	}
	for(var item in data[0]) {
		html += '<th>' + item + '</th>';
	}
	html += '</tr></thead>';
	html += '<tbody id="mytbody">';
	var ind = 1;
	for(var row in data) {
		html += '<tr onclick="clickRow(this)"'
			+ ' onmouseover="hoverRow(this)"'
			+ ' onmouseout="hideHoverRow()">';
		if(hasIndex) {
			html += '<td>' + ind + '</td>';
		}
		var count = 0;
		for(var item in data[0]) {
			var len = data.length;
			if(!reverse) {
				if(count != 0) html += '<td>' + data[row][item] + '</td>';
				else html += '<td>Route ' + data[row][item] + '</td>';
			}
			else {
				if(count != 0) html += '<td>' + data[len-1-row][item] + '</td>';
				else html += '<td>Route ' + data[len-1-row][item] + '</td>';
			}
			count++;
		}
		html += '</tr>';
		ind += 1;
	}
	html += '</tbody>';
	return html;
}

var curSortMethod = 'delay';
var curSortReverse = false;

function showTable() {
	if(curSortReverse)
		$("#content").html(tables[curSortMethod][1]);
	else
		$("#content").html(tables[curSortMethod][0]);
	selectedRow.reset();
	setStyles();
}

function setDropdownToAscDesc() {
	$("li[value='0'] a").html("Ascending");
	$("li[value='1'] a").html("Descending");
	if(curSortReverse) {
		$(".dropdown-text").html("Descending");
	}
	else {
		$(".dropdown-text").html("Ascending");
	}
}

function setDropdownToBestWorst() {
	$("li[value='0'] a").html("From Worst to Best");
	$("li[value='1'] a").html("From Best to Worst");
	if(curSortReverse) {
		$(".dropdown-text").html("From Best to Worst");
	}
	else {
		$(".dropdown-text").html("From Worst to Best");
	}
}

// Working with Maps

var map;
var currentMarker;
var currentSelect;
var circles = [];
var hoverCircle;
var markerImage;

var thres1 = 10;
var thres2 = 20;

function initMap() {
	var mapOptions = {
		center: new google.maps.LatLng(34.0522,-118.2437),
		zoom: 11,
		styles: mapStyles
	};
	map = new google.maps.Map(ele("map"), mapOptions);
	document.getElementById("map").style.visibility = "visible";
}

var mapObj = [];
var globalMode = true;

function enterGlobalMode() {
	selectedRow.reset();
	for(var i = 0; i < mapObj.length; i++) {
		mapObj[i]['trajectory'].setMap(map);
	}
	globalMode = true;
}

function quitGlobalMode() {
	for(var i = 0; i < mapObj.length; i++) {
		if(i != selectedRow.getTripIndex())
			mapObj[i]['trajectory'].setMap(null);
	}
	globalMode = false;
}

function setupMap() {
	for(var i = 0; i < indexData.length; i++) {
		var s = indexData[i]["start_ix"];
		var e = indexData[i]["end_ix"];

		var newObj = {};

		var circles = [];
		for(var j = s; j < e; j++) {
			var curr = trajectoryData[j];
			circles.push(addMarker(curr["lat"],
				curr["lon"], 
				'(' + curr["stop_sequence"] + ') ' + curr["stop_name"]));
		}
		newObj['circles'] = circles;

		var newPath = [];
		for(var j = s; j < e; j++) {
			newPath[j-s] = new google.maps.LatLng(trajectoryData[j]["lat"], trajectoryData[j]["lon"]);
		}
		var newTrajectory = new google.maps.Polyline({
			path: newPath,
			strokeColor: "#000",
			strokeOpacity: 0.5,
			strokeWeight: 5
		});
		// newTrajectory.addListener('mouseover', function() {
		// 	var trs = document.querySelectorAll('tr');
		// 	for(var k = 0; k < trs.length; k++) {
		// 		var targetCell = trs[k].cells[1].innerHTML;
		// 		console.log(targetCell);
		// 		if( parseInt(targetCell.substr(targetCell.indexOf(' '))) 
		// 			== parseInt(indexData[i]["route_id"]) ) {
		// 			$(trs[k]).trigger('mouseover');
		// 			break;
		// 		}
		// 	}
		// });
		// newTrajectory.addListener('mouseout', function() {
		// 	var trs = document.querySelectorAll('tr');
		// 	for(var k = 0; k < trs.length; k++) {
		// 		var targetCell = trs[k].cells[1].innerHTML;
		// 		if( parseInt(targetCell.substr(targetCell.indexOf(' '))) 
		// 			== parseInt(indexData[i]["route_id"]) ) {
		// 			$(trs[k]).trigger('mouseout');
		// 			break;
		// 		}
		// 	}
		// });
		newTrajectory.setMap(map);
		newObj['trajectory'] = newTrajectory;

		mapObj.push(newObj);
	}
}

function initMarkers() {
	markerImage = {
	    url: 'images/tiny-dot.png',
	    size: new google.maps.Size(30,30),
	    origin: new google.maps.Point(0, 0),
	    anchor: new google.maps.Point(5, 5)
	};
}

function addMarker(lat, lon, name) {
	var tmpPos = new google.maps.LatLng(lat,lon);

	var newCircle = new google.maps.Marker({ position: tmpPos, icon: markerImage, opacity: 0.0 });

	newCircle.addListener('mouseover', function(e) {
		$('#level-3').html(name);
		if($(window).width() >= 992) {
			$('#level-3').css('visibility','visible');
		}
		newCircle.setOptions({ opacity: 1.0 });
	});
	newCircle.addListener('mouseout', function(e) {
		$('#level-3').css('visibility','hidden');
		newCircle.setOptions({ opacity: 0.0 });
	});
	
	return newCircle;
}

var selectedRow = function() {
	var currMapContent;
	var selected;
	var id;
	var tripIndex;

	var pub = {};

	pub.selectRowInList = function(target) {
		id = parseInt(target.cells[1].innerHTML
			.substr(target.cells[1].innerHTML.indexOf(' ')));
		this.reset();
		selected = target;
		$(selected).addClass('selected');
		
		var start_end = indexData.find(function(element) {
			return element["route_id"] == id;
		});
		if(start_end === undefined) {
			// map not available
		}
		else {
			tripIndex = indexData.indexOf(indexData.find(function(element) {
				return element["route_id"] == id;
			}));
			mapObj[tripIndex]["trajectory"].setOptions({strokeOpacity: 1.0, strokeColor: "#307bbb"});
			mapObj[tripIndex]["trajectory"].setMap(map);

			var circles = mapObj[tripIndex]["circles"];
			for(var i = 0; i < circles.length; i++) {
				circles[i].setMap(map);
			}
		}

		var index = detailData.indexOf(detailData.find(function(element) {
			return element["route_id"] == id;
		}));

		$('#edit-1-route-id').html(id);
		var descriptionIndex = descriptions["items"].find(function(element) {
			return element["id"] == id;
		});
		if(descriptionIndex !== undefined)
			$('#edit-2-des').html(descriptionIndex['display_name']
				.substr(descriptionIndex['display_name'].indexOf(' ')));
		else {
			$('#edit-2-des').html("(description not found)");
		}
		$('#edit-3-del').html(detailData[index]['delay']);
		$('#edit-4-rank').html(detailData[index]['delay-rank']);
		$('#edit-5-rec').html(detailData[index]['rec-day']);
		$('#edit-6-trip').html(detailData[index]['trip-day']);

		$('#edit-7-pie').html(detailData[index]['rel'] + '%');
		$("#edit-class").attr('class', 'c100 small');
		$('#edit-class').addClass('p' + detailData[index]['rel']);

		$('#edit-8-val1').html(detailData[index]['rel']);
		$('#edit-9-val2').html(100-detailData[index]['rel']);


		$('#level-2').html('Route ' + id);
		if($(window).width() >= 992) {
			$('#level-2').css('visibility','visible');
			$('#level-3').css('visibility','hidden');
		}
	}

	pub.getId = function() {
		return id;
	}

	pub.getTripIndex = function() {
		return tripIndex;
	}

	pub.getSelected = function() {
		return selected;
	}

	pub.reset = function() {
		if(selected !== undefined) {
			$(selected).removeClass('selected');
		}
		if(tripIndex !== undefined) {
			mapObj[tripIndex]["trajectory"].setMap(null);
			mapObj[tripIndex]["trajectory"].setOptions({strokeOpacity: 0.5, strokeColor: "#000"});

			var circles = mapObj[tripIndex]["circles"];
			for(var i = 0; i < circles.length; i++) {
				circles[i].setMap(null);
			}

			tripIndex = undefined;
		}

		$('#edit-1-route-id').html("--");
		$('#edit-2-des').html("--");
		$('#edit-3-del').html("--");
		$('#edit-4-rank').html("--");
		$('#edit-5-rec').html("--");
		$('#edit-6-trip').html("--");
		$('#edit-7-pie').html("--");
		$('#edit-8-val1').html("--");
		$('#edit-9-val2').html("--");

		$('#level-2').css('visibility','hidden');
		$('#level-3').css('visibility','hidden');
	}

	return pub;
}();

function clickRow(row) {
	$('.detail-block').show();
	$('.help-block').hide();
	$('.help-btn').show();
	selectedRow.selectRowInList(row);
	if(globalMode) quitGlobalMode();
}

var currentHover;

function hideHoverRow() {
	if(currentHover !== undefined) {
		var index = indexData.indexOf(indexData.find(function(element) {
			return element["route_id"] == currentHover;
		}));
		if(selectedRow.getTripIndex() != index) {
			// var circles = mapObj[index]["circles"];
			// for(var i = 0; i < circles.length; i++) {
			// 	circles[i].setMap(null);
			// }
			mapObj[index]["trajectory"].setOptions({strokeColor: "#000"});
			if(!globalMode) mapObj[index]["trajectory"].setMap(null);
		}
		currentHover = undefined;
	}
}

function hoverRow(row) {
	var id = parseInt(row.cells[1].innerHTML
			.substr(row.cells[1].innerHTML.indexOf(' ')));
	if(id == selectedRow.getTripIndex()) return;
	var start_end = indexData.find(function(element) {
			return element["route_id"] == id;
		});
	if(start_end === undefined) {
		// map not available
	}
	else {
		var index = indexData.indexOf(start_end);
		currentHover = id;

		// var circles = mapObj[index]["circles"];
		// for(var i = 0; i < circles.length; i++) {
		// 	circles[i].setMap(map);
		// }
		mapObj[index]["trajectory"].setOptions({strokeColor: "#307bbb"});
		mapObj[index]["trajectory"].setMap(map);
	}
}