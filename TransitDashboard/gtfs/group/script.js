var tripData;
var tripIndex;
var tripCum;
var tripList;
var chartIds;
var chartIndexes;

$(document).ready(function() {
	getTripData();

	$('.dropdown ul li').click(function() {
		if($(this).hasClass('active') || $(this).hasClass('divider')) return;
		$(this).parent().children().each(function() {
			$(this).removeClass('active');
		});
		$(this).addClass('active');
		$(this).parent().prev().html(' ' + $(this).children().first().html() + ' <span class="caret"></span> ');

		updateDisplay();
	});
});

function updateDisplay() {
	chartIds = [];
	chartIndexes = [];
	var count = 0;
	var options = {
		chart: {
			renderTo: 'chart',
			type: 'line'
		},
		title: { text: 'Space-time Chart' },
		xAxis: { title: { text: 'Cumulative Distance' } },
		yAxis: { 
			title: { text: 'Time' },
			labels: { formatter: function() {
				var val = parseInt(this.value);
				var hh = Math.floor(val / 60);
				if(hh < 10) hh = '0' + hh;
				var mi = val - 60*hh;
				if(mi < 10) mi = '0' + mi;
				return hh + ':' + mi;
			}}
		},
		credits: { enabled: false },
		legend: { enabled: false },
		tooltip: { formatter: function() {
			var val = parseInt(this.point.y);
			var hh = Math.floor(val / 60);
			if(hh < 10) hh = '0' + hh;
			var mi = val - 60*hh;
			if(mi < 10) mi = '0' + mi;
			var formattedTime =  hh + ':' + mi;
			var seriesIndex = parseInt(this.series.name.substr(7));
			var tripInfo = tripList[chartIndexes[seriesIndex-1]];
			return '<b>Trip ID</b>: ' + chartIds[seriesIndex-1] 
				+ '<br><b>Trip Info</b>: ' + tripInfo['Service'] + ' ' 
					+ tripInfo['Start Time'].substr(0,tripInfo['Start Time'].length-3) + '-' 
					+ tripInfo['End Time'].substr(0,tripInfo['End Time'].length-3)
				+ '<br><b>Time</b>: ' + formattedTime
				+ '<br><b>Cumulative Distance</b>: ' + this.point.x.toFixed(2) + ' miles';
		}},
		series: []
	};
	$('#trip-list tbody tr').each(function() {
		if(filterRow(count)) {
			$(this).show();
			chartIds.push(parseInt($(this).children().first().html()));
			chartIndexes.push(count);
			var indexes = getIndex(parseInt($(this).children().first().html()));
			var newSeries = { data: [] };
			for(var i = indexes.start-1; i < indexes.end; i++) {
				var timeCum = tripCum[i]['cum_time'];
				var timeStr = tripData[i]['Time'];
				var firstColon = timeStr.indexOf(':');
				// actually one before the second colon
				var secondColon = firstColon + timeStr.substr(firstColon+1).indexOf(':');
				var hour = timeStr.substr(0,firstColon);
				var minute = timeStr.substr(firstColon+1, secondColon-firstColon);
				var tp = parseInt(hour)*60 + parseInt(minute) + parseInt(timeCum);
				newSeries.data.push([parseFloat(tripCum[i]['cum_dist']), tp]);
			}

			var ser = $(this).children().first().next().html();
			var dir = $(this).children().first().next().next().html();
			var st = $(this).children().first().next().next().next().next().html();
			var hr = st.substr(0, st.indexOf(':'));

			var colorStr = '#';
			if(ser == 'Weekday') colorStr += '00';
			else if(ser == 'Saturday') colorStr += '88';
			else colorStr += 'ff';
			if(dir == '0') colorStr += '44';
			else colorStr += 'bb';
			if(hr >= 4 && hr < 10) colorStr += '00';
			else if(hr >= 10 && hr < 16) colorStr += '66';
			else if(hr >= 16 && hr < 22) colorStr += 'bb';
			else colorStr += 'ff';
			newSeries.color = colorStr;

			options.series.push(newSeries);
		}
		else $(this).hide();
		count++;
	});
	var chart = new Highcharts.Chart(options);
}

function filterRow(x) {
	var filter = true;
	var ser = tripList[x]['Service'];
	var dir = tripList[x]['Direction'];
	var tr = parseInt(tripList[x]['Start Time'].substr(0,(tripList[x]['Start Time']).indexOf(':')));

	var target = $('#drop4').html().substr(1,3);
	if(target == 'Sat') filter &= (ser == 'Saturday');
	else if(target == 'Sun') filter &= (ser == 'Sunday');
	else if(target == 'Wee') filter &= (ser == 'Weekday');

	target = $('#drop5').html().substr(1,1);
	if(target == '0' || target == '1') filter &= (target == dir);

	target = $('#drop6').html().substr(1,$('#drop6').html().substr(1).indexOf(' '));
	if(target != 'All') {
		var mid = target.indexOf('-');
		var first = target.substr(0,mid);
		var second = target.substr(mid+1);
		first = parseInt(first.substr(0,first.indexOf(':')));
		second = parseInt(second.substr(0,second.indexOf(':')));
		console.log(first + ' ' + second);
		filter &= (tr >= first && tr < second);
	}
	// if(target == ':') filter &= (tr >= 4 && tr < 10);
	// else if(target == '0') filter &= (tr >= 10 && tr < 16);
	// else if(target == '6') filter &= (tr >= 16 && tr < 22);
	// else if(target == '2') filter &= (tr >= 22 && tr < 28);

	return filter;
}

function loadData(dir, callback) {
	$.ajax({
		type: 'GET',
		url: dir,
		dataType: "text",
		success: function(raw) {
			callback(toObject(raw));
		}
	});
}

var toLoad = 4;
function checkLoaded() {
	toLoad--;
	if(toLoad == 0) {
		$('#title').html('GTFS Analysis');
		updateDisplay();
	}
}

function getTripData() {
	loadData('../data/trip_list.csv', function(data) {
		tripList = data;
		checkLoaded();
		$('#trip-list').html(toTable(data));
	});
	loadData('../data/gtfs_data.csv', function(data) {
		tripData = data;
		checkLoaded();
	});
	loadData('../data/gtfs_cum.csv', function(data) {
		tripCum = data;
		checkLoaded();
	});
	loadData('../data/gtfs_index.csv', function(data) {
		tripIndex = data;
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