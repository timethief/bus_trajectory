var tripData;
var tripIndex;
var mapStyles;
var gpsSpace; var gpsStop;
var gtfsSpace; var gtfsStop;

$(document).ready(function() {
	getTripData();
	initMap();
	$(window).trigger('resize');

	$('[data-toggle="popover"]').popover({
		placement: "bottom",
		title: '<div align=center>Select Time Range</div>',
		content: '<div class="popover-wrapper"><input type="text" id="time-slider"></div>',
		container: 'body',
		html: true,
		animation: false
	});

	$('#date-picker').datepicker({
		format: "yyyy.mm.dd",
		startDate: "2016.01.01",
		endDate: "2016.02.29",
		clearBtn: true,
		autoclose: true
	});

	$('#date-picker').datepicker().on('changeDate', function (e) {
		applyFilters();
	});

	$('[data-toggle="popover"]').on('shown.bs.popover', function () {
		var str = $(this).html().split('-');
		var start = parseInt(str[0].substr(0,str[0].indexOf(':')));
		var end = parseInt(str[1].substr(0,str[1].indexOf(':')));

		var slider = $("#time-slider").ionRangeSlider({
			type: 'double',
			min: 0,
			max: 24,
			from: start,
			to: end,
			min_interval: 1,
			step: 1,
			postfix: ":00",
			decorate_both: true,
			grid: true,
			grid_num: 6,
			onChange: function(values) {
				var str = values['from'] + ':00-' + values['to'] + ':00';
				$('[data-toggle="popover"]').html(str);
				applyFilters();
			}
		});
	});

	$('#sel-prev-btn').click(function() {
		var previous = selectedTrip.getSelected();
		if(previous === undefined) return;
		if(previous.prevAll('tr:visible:first') === undefined) return;
		previous.prevAll('tr:visible:first').trigger('click');
	});

	$('#sel-next-btn').click(function() {
		var previous = selectedTrip.getSelected();
		if(previous === undefined) return;
		if(previous.nextAll('tr:visible:first') === undefined) return;
		previous.nextAll('tr:visible:first').trigger('click');
	});

	var delay = (function() {
		var timer = 0;
		return function(callback, ms) {
			clearTimeout(timer);
			timer = setTimeout(callback, ms);
			console.log('Timeout Started');
		};
	})();

	$('#data-count-constraint').keyup(function() {
		delay(applyFilters, 1000);
	});

	$("li[role='presentation']").click(function() {
		$("li[role='presentation']").each(function() {
			$('.' + $(this).attr('for')).hide();
			$(this).removeClass('active');
		});
		$('.' + $(this).attr('for')).show();
		$(this).addClass('active');
		if(selectedTrip.getSelected() !== undefined)
			selectedTrip.getSelected().trigger('click');
	});
});

$(window).resize(function() {
	$('.div-2').each(function() {
		$(this).css('height', window.innerHeight - 60);
	});
	var divHeight = $('.div-2').height();
	var headHeight = $('#trip-list thead').height();
	$('#trip-list tbody').css('height', divHeight - 46*2 - headHeight);
	$('.sel-wrapper').css('height', divHeight + 3);

	var rightContent = divHeight + 3 - $('.nav-tabs').height();
	$('.content').css('height', rightContent);
	$('#trip-detail').css('height', rightContent);
	headHeight = $('#trip-detail thead').height();
	$('#trip-detail tbody').css('height', rightContent - headHeight);

//	$('.analysis').css('paddingTop', (rightContent - $('#chart-cum').height())/2);
	$('.analysis').children().each(function() {
		$(this).css('height',rightContent/2);
	});
});

function applyFilters() {
	var datePickerVal = $('#date-picker').val();

	var str = $('.time-range-btn').html().split('-');
	var rangeStart = parseInt(str[0].substr(0,str[0].indexOf(':')));
	var rangeEnd = parseInt(str[1].substr(0,str[1].indexOf(':')));

	var minVal = $('#data-count-constraint').val();

	if((datePickerVal === undefined || datePickerVal == '')
	  && rangeStart == 0 && rangeEnd == 24 && minVal == '') 
		return;

	$('#trip-list tbody tr').each(function () {
		var showing = true;
		if(!(datePickerVal === undefined || datePickerVal == '')) {
			var dateVal = $(this).children().first().next().next().next().html();
			showing &= (dateVal == datePickerVal);
		}
		if(!(rangeStart == 0 && rangeEnd == 24)) {
			var hourStr = $(this).children().first().next().next().next().next().next().html();
			var hourVal = parseInt(hourStr.substr(0, hourStr.indexOf(':')));
			showing &= (hourVal >= rangeStart && hourVal < rangeEnd);
		}
		if($('#data-count-constraint').val() != '') {
			var dataCountConstraint = $(this).children().first().next().next().next().next().html();
			showing &= (parseInt(dataCountConstraint) > parseInt(minVal));
		}
		if(showing) $(this).show();
		else $(this).hide();
	});
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

var toLoad = 9;
function checkLoaded() {
	toLoad--;
	if(toLoad == 0) {
		$('#title').html('GPS Analysis');
		$('.not-showing').each(function() {
			$(this).fadeIn(function() {
				$(this).removeClass('not-showing');
			});
		});
	}
}

function getTripData() {
	loadData('../data_matching/trip_list.csv', function(data) {
		$('#trip-list').html(toTable(data));
		checkLoaded();
		
		$('#trip-list tbody tr').click(function() {
			selectedTrip.selectTripInList($(this));
			var ix = selectedTrip.getId();
			var indexes = getIndex(ix);
			if(indexes === undefined) return;
			var slicedData = tripData.slice(indexes.start-1, indexes.end);

			var tableStr = toTable(slicedData, true);
			$('#trip-detail').html(tableStr);

			drawMap(indexes.start-1, indexes.end);

			drawCumChart(indexes.start-1, indexes.end, 0);
			drawCumChart(indexes.start-1, indexes.end, 1);

			$('#sel-label').children().first().html(ix);

			$(window).trigger('resize');
		});
		$(window).trigger('resize');
	});
	loadData('../data_matching/gps_data.csv', function(data) {
		tripData = data;
		checkLoaded();
	});
	loadData('../data_matching/gps_index.csv', function(data) {
		tripIndex = data;
		checkLoaded();
	});
	loadData('../data_matching/gps_space.csv', function(data) {
		gpsSpace = data;
		checkLoaded();
	}, false);
	loadData('../data_matching/gps_stop.csv', function(data) {
		gpsStop = data;
		checkLoaded();
	}, false);
	loadData('../data_matching/gtfs_space.csv', function(data) {
		gtfsSpace = data;
		checkLoaded();
	}, false);
	loadData('../data_matching/gtfs_stop.csv', function(data) {
		gtfsStop = data;
		checkLoaded();
	}, false);
	$.getJSON('../data/map_styles.json',function(data) {
		mapStyles = data;
		checkLoaded();
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

function toTable(data, hasIndex) {
	var html = '';
	html += '<thead><tr>';
	if(hasIndex) {
		html += '<th>No</th>';
	}
	for(var item in data[0]) {
		html += '<th>' + item + '</th>';
	}
	html += '</tr></thead>';
	html += '<tbody>';
	var ind = 1;
	for(var row in data) {
		html += '<tr>';
		if(hasIndex) {
			html += '<td>' + ind + '</td>';
		}
		for(var item in data[0]) {
			html += '<td>' + data[row][item] + '</td>';
		}
		html += '</tr>';
		ind += 1;
	}
	html += '</tbody>';
	return html;
}

var selectedTrip = function() {
	var selected;
	var id;

	var pub = {};

	pub.selectTripInList = function(target) {
		if(selected !== undefined) {
			selected.removeClass('info');
		}
		selected = target;
		id = parseInt(target.children().first().html());
		selected.addClass('info');
		$('.content').removeClass('empty');
	}

	pub.getId = function() {
		return id;
	}

	pub.getSelected = function() {
		return selected;
	}

	return pub;
}();

function getIndex(ix) {
	if(tripData === undefined || tripIndex === undefined) 
		return undefined;
	var indexes = {};
	var loc = getIndexHelper(ix, 0, tripIndex.length);
	if(loc === undefined)
		return undefined;
	indexes.start = tripIndex[loc]['start_index'];
	indexes.end = tripIndex[loc]['end_index'];
	return indexes;
}

function getIndexHelper(ix, s, e) {
	if(e - s <= 0) return undefined;
	var mid = Math.floor((s+e)/2);
	var midIx = parseInt(tripIndex[mid]['ix']);
	if(midIx == ix) 
		return mid;
	else if(midIx > ix) 
		return getIndexHelper(ix, s, mid);
	else 
		return getIndexHelper(ix, mid+1, e);
}

// Working with maps
var map;
var markers = [];
var trajectory;
var trajLabels = [];
var currentStart;
var currentMarker;

google.maps.event.addListenerOnce(map, 'idle', function() {
	var canvasElements = jQuery('canvas');
	for(var i=0; i<canvasElements.length; i++){
		canvasElements[i].parentNode.style.zIndex = 9999;
	}
});

function initMap() {
	var mapOptions = {
		center: new google.maps.LatLng(34.0522,-118.2437),
		zoom: 12,
		minZoom: 10,
		maxZoom: 14,
		styles: mapStyles,
		streetViewControl: false,
		mapTypeControl: false
	};
	map = new google.maps.Map(document.getElementById("trip-map"), mapOptions);
	map.addListener('zoom_changed',function() {
		for(var i = 0; i < trajLabels.length; i++) {
			trajLabels[i].set('fontSize', 6*Math.pow(2,map.getZoom()-12));
		}
	});
	toLoad--;
}

function clearMap() {
	if(markers.length != 0) {
		for(var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
			trajLabels[i].setMap(null);
		}
		markers = [];
		trajLabels = [];
		trajectory.setMap(null);
	}
}

function drawMap(start, end) {
	clearMap();
	currentStart = start;

	var newPath = [];
	for(i = start; i < end; i++) {
		newPath[i-start] = new google.maps.LatLng(tripData[i]['Lattitude'], tripData[i]['Longitude']);
	}
	trajectory = new google.maps.Polyline({
		path: newPath,
		strokeColor: "#000",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		clickable: false
	});
	trajectory.setMap(map);

	for(i = start; i < end; i++) {
		addMarker(i);
	}
}

function addMarker(i) {
	var tmpPos = new google.maps.LatLng(tripData[i]['Lattitude'], tripData[i]['Longitude']);
	var newCircle = new google.maps.Circle({
		center: tmpPos,
		radius: 200,
		strokeColor: "rgb(28,119,186)",
		strokeOpacity: 1.0,
		strokeWeight: 1,
		fillColor: "rgb(108,167,210)",
		fillOpacity: 1,
		zIndex: 100
	});
	newCircle.setMap(map);
	var contentStr = '<h5 align=center>Data Point No. ' + (i-currentStart+1) + '</h3>'
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
	markers.push(newCircle);

	trajLabels.push(new MapLabel({
		text: '' + (i-currentStart+1),
		position: new google.maps.LatLng(tripData[i]['Lattitude'], tripData[i]['Longitude']),
		map: map,
		fontSize: 6*Math.pow(2,map.getZoom()-12),
		align: 'bottom'
	}));
}

// Working with cumulative charts
function drawCumChart(start, end) {
	var gpsSpaceSliced = toArray(gpsSpace, start, end);
	var gpsStopSliced = toArray(gpsStop, start, end);
	var gtfsSpaceSliced = toArray(gtfsSpace, start, end);
	var gtfsStopSliced = toArray(gtfsStop, start, end);
	
	drawHighchart({
		series: [{
			name: 'GPS',
			data: gpsSpaceSliced
		}, {
			name: 'GTFS',
			data: gtfsSpaceSliced
		}],
		id: "#chart-cum",
		title: 'Space-time Chart',
		xName: 'Cumulative Time',
		yName: 'Cumulative Distance',
		prefix: '',
		postfix: ' miles'
	});
	
	drawHighchart({
		series: [{
			name: 'GPS',
			data: gpsStopSliced
		}, {
			name: 'GTFS',
			data: gtfsStopSliced
		}],
		id: "#chart-seq",
		title: 'Stop-time Chart',
		xName: 'Cumulative Time',
		yName: 'Stop Sequence',
		prefix: 'No. ',
		postfix: ''
	});
}

function drawHighchart(options) {
	$(options.id).highcharts({
		chart: { type: 'line' },
		series: options.series,
		title: { text: options.title },
		xAxis: { title: { text: options.xName } },
		yAxis: { title: { text: options.yName } },
		credits: { enabled: false },
		tooltip: { formatter: function() {
			return '' + options.xName + ': <b>' + this.x + '</b> mins.\t' 
			+ '<br>' + options.yName + ': ' 
			+ options.prefix + '<b>' + this.y + '</b>' + options.postfix + '.';
		}}
	});
}