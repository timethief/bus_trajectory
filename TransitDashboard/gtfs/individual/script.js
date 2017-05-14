var tripData;
var tripIndex;

$(document).ready(function() {
	getTripData();

	// Load trip info when modal called
	$('#sel-trip').on('show.bs.modal', function (e) {
		var previous = selectedTrip.getSelected();
		if(previous === undefined) {
			$('#set-trip-btn').html('Select');
			$('#set-trip-btn').addClass('disabled');
		}
		$('#trip_list tbody tr').click(function() {
			selectedTrip.selectTripInList($(this));
		});
	});

	$('#set-trip-btn').click(function() {
		if($(this).hasClass('disabled')) return;
		if(tripData === undefined || tripIndex === undefined) return;
		var tripId = selectedTrip.getId();
		var indexes = getIndex(tripId);
		if(indexes === undefined) return;
		var slicedData = tripData.slice(indexes.start-1, indexes.end);

		var tableStr = toTable(slicedData);
		$('#trip-detail').html(tableStr);

		drawMap(indexes.start-1, indexes.end);

		drawCumChart(indexes.start-1, indexes.end);

		$('#sel-trip-btn').html(tripId);
		$('#sel-trip').modal('hide');
	});

	$('#sel-prev-btn').click(function() {
		var previous = selectedTrip.getSelected();
		if(previous === undefined) return;
		if(previous.prev() === undefined) return;
		selectedTrip.selectTripInList(previous.prev());
		$('#set-trip-btn').trigger('click');
	});

	$('#sel-next-btn').click(function() {
		var previous = selectedTrip.getSelected();
		if(previous === undefined) return;
		if(previous.next() === undefined) return;
		selectedTrip.selectTripInList(previous.next());
		$('#set-trip-btn').trigger('click');
	});

	$('#raw-data-btn').click(function() {
		$('#raw-data-btn').addClass('active');
		$('#analysis-btn').removeClass('active');
		$('.raw-data').show();
		$('.analysis').hide();
	});

	$('#analysis-btn').click(function() {
		$('#raw-data-btn').removeClass('active');
		$('#analysis-btn').addClass('active');
		$('.raw-data').hide();
		$('.analysis').show();
		$('.analysis #chart-cum').css('width', 800);
		$('.analysis #chart-cum').css('height', 400);
	});
});

function loadData(dir, callback) {
	toLoad++;
	$.ajax({
		type: 'GET',
		url: dir,
		dataType: "text",
		success: function(raw) {
			callback(toObject(raw));
		}
	});
}

var toLoad = 0;
function checkLoaded() {
	toLoad--;
	if(toLoad == 0) {
		$('#title').html('GTFS Analysis');
	}
}

function getTripData() {
	loadData('../data/trip_list.csv', function(data) {
		checkLoaded();
		$('#trip_list').html(toTable(data));
	});
	loadData('../data/gtfs_data.csv', function(data) {
		checkLoaded();
		tripData = data;
	});
	loadData('../data/gtfs_index.csv', function(data) {
		checkLoaded();
		tripIndex = data;
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

function toTable(data) {
	var html = '';
	html += '<thead><tr>';
	for(var item in data[0]) {
		html += '<th>' + item + '</th>';
	}
	html += '</tr></thead>';
	html += '<tbody>';
	for(var row in data) {
		html += '<tr>';
		for(var item in data[0]) {
			html += '<td>' + data[row][item] + '</td>';
		}
		html += '</tr>';
	}
	html += '</tbody>';
	return html;
}

var selectedTrip = function() {
	var selected;
	var id;

	var pub = {};

	pub.selectTripInList = function(target) {
		$('#set-trip-btn').removeClass('disabled');
		if(selected !== undefined) {
			selected.removeClass('info');
		}
		selected = target;
		id = parseInt(target.children().first().html());
		selected.addClass('info');
		$('#set-trip-btn').html('Select Trip ' + id);
	}

	pub.getId = function() {
		return id;
	}

	pub.getSelected = function() {
		return selected;
	}

	return pub;
}();

function getIndex(tripId) {
	if(tripData === undefined || tripIndex === undefined) 
		return undefined;
	var indexes = {};
	var loc = getIndexHelper(tripId, 0, tripIndex.length);
	if(loc === undefined)
		return undefined;
	indexes.start = tripIndex[loc]['start_row'];
	indexes.end = tripIndex[loc]['end_row'];
	return indexes;
}

function getIndexHelper(tripId, s, e) {
	if(e - s <= 0) return undefined;
	var mid = Math.floor((s+e)/2);
	var midTripId = parseInt(tripIndex[mid]['trip_id']);
	if(midTripId == tripId) 
		return mid;
	else if(midTripId > tripId) 
		return getIndexHelper(tripId, s, mid);
	else 
		return getIndexHelper(tripId, mid+1, e);
}

// Working with maps
var map;
var currentStart;
var currentMarker;

function drawMap(start, end) {
	var mid = Math.floor((parseInt(start)+parseInt(end))/2);
	var mapOptions = {
		center: new google.maps.LatLng(tripData[mid]['Lattitude'], tripData[mid]['Longitude']),
		zoom: 12
	};
	map = new google.maps.Map(document.getElementById("map"), mapOptions);
	var newPath = [];
	for(i = start; i < end; i++) {
		newPath[i-start] = new google.maps.LatLng(tripData[i]['Lattitude'], tripData[i]['Longitude']);
	}
	addLine(newPath);
	for(i = start; i < end; i++) {
		addMarker(i);
	}
	currentStart = start;
}

function addMarker(i) {
	var tmpPos = new google.maps.LatLng(tripData[i]['Lattitude'], tripData[i]['Longitude']);
	var newCircle = new google.maps.Circle({
		center: tmpPos,
		radius: 30,
		strokeColor: "#000",
		strokeOpacity: 1.0,
		strokeWeight: 1,
		fillColor: "#000",
		fillOpacity: 0.5
	});
	newCircle.setMap(map);
	var contentStr = '<h5 align=center>' + tripData[i]['No'] + '. ' + tripData[i]['Stop Name'] + '</h3>'
		+ '<p align=center> Time: ' + tripData[i]['Time'] + '</p>';
	var infowindow = new google.maps.InfoWindow({
		content: contentStr
	});
	newCircle.addListener('mouseover', function() {
		infowindow.open(map, newCircle);
		infowindow.setPosition(tmpPos);
	});
	newCircle.addListener('mouseout', function() {
		infowindow.close();
	});
}

function addLine(path) {
	var newPath = new google.maps.Polyline({
		path: path,
		strokeColor: "#000",
		strokeOpacity: 0.8,
		strokeWeight: 2
	});
	newPath.setMap(map);
}

// Working with cumulative charts
function drawCumChart(start, end) {
	$.ajax({
		type: 'GET',
		url: '../data/gtfs_cum.csv',
		dataType: "text",
		success: function(raw) {
			var csvRows = raw.match(/[^\r\n]+/g);
			var csvHead = csvRows.shift();
			var sliced = csvRows.slice(start, end);
			var newCsv = csvHead + '\r\n' + sliced.join('\r\n');
			console.log(newCsv);
			$("#chart-cum").highcharts({
				chart: { type: 'line' },
				data: { csv: newCsv },
				title: { text: 'Space-time Chart' },
				xAxis: { title: { text: 'Cumulative Time' } },
				yAxis: { title: { text: 'Cumulative Distance' } },
				credits: { enabled: false },
				legend: { enabled: false },
				tooltip: { formatter: function() {
					return 'Cumulative Time: <b>' + this.x + '</b> mins.\t' 
					+ '<br>Cumulative Distance: <b>' + this.y + '</b> miles.';
				}}
			});
		}
	});
}