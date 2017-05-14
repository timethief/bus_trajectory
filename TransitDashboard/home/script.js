/* navbar on scroll */
$(document).ready(function() {
	$(window).resize(function() {
		styleNavbar();
	});
	$(window).scroll(function() {
		styleNavbar();
	});
});

function styleNavbar() {
	var topPos = $(window).scrollTop();

	console.log(topPos >= 80 || $('nav').width() <= 768);
	if (topPos >= 80 || $('nav').width() <= 768) {
		$('nav').removeClass('white');
	}
	else {
		$('nav').addClass('white');
	}
}

/* get data */
function getFiles(str) {
	styleNavbar();

	var prefix = 'home/data/';
	var lateBusData = prefix + 'late-buses-delay.csv';
	var earlBusData = prefix + 'late-buses-early.csv';
	var avgWeekData = prefix + 'dev-del-week-avg.csv';
	var sumWeekData = prefix + 'dev-del-week-sum.csv';
	var avgHourData = prefix + 'dev-del-hour-avg.csv';
	var sumHourData = prefix + 'dev-del-hour-sum.csv';
	var relData = prefix + 'rel.json';
	var relInfo = [];
	var relSet  = false;
	$.getJSON(relData,function(data) {
		for(var i = 0; i < data.length; i++) {
			relInfo[data[i]['route_id']] = data[i]['rel'];
		}
		relSet = true;
	});
	$.ajax({
		type: 'GET',
		url: lateBusData,
		dataType: "text",
		success: function(csv) {
			var descriptionId = [];
			$.getJSON(prefix + 'routes.json', function(objRoute) {
				for(i = 0; i < objRoute.items.length; i++) {
					descriptionId[objRoute.items[i].id] = objRoute.items[i].display_name;
				}
			});
			$("#chart-bus-l").highcharts({
				chart: {
					type: 'bar'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Top 10 Most Delayed Buses'
				},
				xAxis: {
					labels: {
						formatter: function() {
							return this.value.substr(1,this.value.length-2);
						}
					}
				},
				yAxis: {
					min: 0,
					max: 6,
					title: {
						text: 'Average Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = this.point.name.substr(1,this.point.name.length-2);
						var reliability = 0;
						if(relSet && relInfo[parseInt(name)] !== undefined) {
							reliability = (relInfo[parseInt(name)]*100).toFixed(1);
						}
						name = descriptionId[parseInt(name)];
						return '<b>Route ' + name + '</b>'
							+ ' <br> Average delay: <b>' + this.y + '</b> mins.'
							+ ' <br> Reliability: <b>' + reliability + '%</b> on time.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: earlBusData,
		dataType: "text",
		success: function(csv) {
			var descriptionId = [];
			$.getJSON(prefix + 'routes.json', function(objRoute) {
				for(i = 0; i < objRoute.items.length; i++) {
					descriptionId[objRoute.items[i].id] = objRoute.items[i].display_name;
				}
			});
			$("#chart-bus-e").highcharts({
				chart: {
					type: 'bar'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Top 10 Least Delayed Buses'
				},
				xAxis: {
					labels: {
						formatter: function() {
							return this.value.substr(1,this.value.length-2);
						}
					}
				},
				yAxis: {
					min: 0,
					max: 6,
					title: {
						text: 'Average Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = this.point.name.substr(1,this.point.name.length-2);
						var reliability = 0;
						if(relSet && relInfo[parseInt(name)] !== undefined) {
							reliability = (relInfo[parseInt(name)]*100).toFixed(1);
						}
						name = descriptionId[parseInt(name)];
						return '<b>Route ' + name + '</b>'
							+ ' <br> Average delay: <b>' + this.y + '</b> mins.'
							+ ' <br> Reliability: <b>' + reliability + '%</b> on time.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: avgWeekData,
		dataType: "text",
		success: function(csv) {
			$("#chart-wka").highcharts({
				chart: {
					type: 'line'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Average Daily Delay of LA Metro Buses'
				},
				xAxis: {
					labels: {
						formatter: function() {
							return weekdayStr(this.value);
						}
					}
				},
				yAxis: {
					title: {
						text: 'Average Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = weekdayFullStr(this.x);
						return 'Average delay on <b>' + name + '</b>: <b>' + this.y + '</b> mins.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: sumWeekData,
		dataType: "text",
		success: function(csv) {
			$("#chart-wks").highcharts({
				chart: {
					type: 'line'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Total Daily Delay of LA Metro Bus System'
				},
				xAxis: {
					labels: {
						formatter: function() {
							return weekdayStr(this.value);
						}
					}
				},
				yAxis: {
					title: {
						text: 'Total Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = weekdayFullStr(this.x);
						return 'Total delay on <b>' + name + '</b>: <b>' + this.y + '</b> mins.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: avgHourData,
		dataType: "text",
		success: function(csv) {
			$("#chart-hra").highcharts({
				chart: {
					type: 'line'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Average Hourly Delay of LA Metro Bus System'
				},
				xAxis: {
					tickInterval: 1,
					title: {
						text: 'Hour of Day'
					},
					labels: {
						formatter: function() {
							var str = this.value;
							if(str == '12') str += 'p.m';
							else if(this.value > 12) str = this.value-12;
							else if(str == '5') str += 'a.m';
							return str;
						}
					}
				},
				yAxis: {
					title: {
						text: 'Average Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = this.point.name;
						return 'Average delay: <b>' + this.y + '</b> mins.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: sumHourData,
		dataType: "text",
		success: function(csv) {
			$("#chart-hrs").highcharts({
				chart: {
					type: 'line'
				},
				data: {
					csv: csv
				},
				title: {
					text: 'Total Hourly Delay of LA Metro Bus System'
				},
				xAxis: {
					tickInterval: 1,
					title: {
						text: 'Hour of Day'
					},
					labels: {
						formatter: function() {
							var str = this.value;
							if(str == '12') str += 'p.m';
							else if(str == '5') str += 'a.m';
							else if(this.value > 12) str = this.value-12;
							return str;
						}
					}
				},
				yAxis: {
					title: {
						text: 'Total Delay (min)'
					}
				},
				credits: {
					enabled: false
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						var name = this.point.name;
						return 'Total delay: <b>' + this.y + '</b> mins.';
					}
				}
			});
		}
	});
}

function weekdayStr(x) {
	if(x == 1) return 'Sun';
	else if(x == 2) return 'Mon';
	else if(x == 3) return 'Tue';
	else if(x == 4) return 'Wed';
	else if(x == 5) return 'Thu';
	else if(x == 6) return 'Fri';
	else if(x == 7) return 'Sat';
}

function weekdayFullStr(x) {
	if(x == 1) return 'Sunday';
	else if(x == 2) return 'Monday';
	else if(x == 3) return 'Tuesday';
	else if(x == 4) return 'Wednesday';
	else if(x == 5) return 'Thursday';
	else if(x == 6) return 'Friday';
	else if(x == 7) return 'Saturday';
}