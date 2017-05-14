// Style settings
function setStyles() {
	var headerHeight = 52;
	var windowHeight = window.innerHeight;
	var divHeight = (windowHeight - headerHeight)/2;
	var minHeight = 300;
	// if(divHeight < 300) divHeight = 300;

	var wrapperItems = document.getElementsByClassName("div-4");
	for(i = 0; i < wrapperItems.length; i++) {
		wrapperItems[i].style.opacity = 1.0;
		wrapperItems[i].style.height = divHeight + 'px';
	}

	var interactiveItems = document.getElementsByClassName("interactive");
	var itemCount = interactiveItems.length;
	var mgn = (divHeight - (40+20*itemCount)) / (itemCount+1);
	for(i = 0; i < itemCount; i++) {
		interactiveItems[i].style.marginTop = mgn + 'px';
		interactiveItems[i].style.marginBottom = mgn + 'px';
	}
}

function resetBlocks() {
	document.getElementById("week").innerHTML = ""
	+	'<h1 class="intro">Weekly Performance</h1>'
	+	"<h2>Average delay from the schedule grouped by day of week.";

	document.getElementById("month").innerHTML = ""
	+	'<h1 class="intro">Monthly Performance</h1>'
	+	"<h2>Average delay from the schedule grouped by month of year. ";

	document.getElementById("hour").innerHTML = ""
	+	'<h1 class="intro">Hourly Performance</h1>'
	+	"<h2>Average delay from the schedule grouped by hour of day (5-23). ";

	var headerHeight = 52;
	var windowHeight = window.innerHeight;
	var divHeight = (windowHeight - headerHeight)/2;
	var minHeight = 300;
	if(divHeight < 300) divHeight = 300;

	var introItems = document.getElementsByClassName("intro");
	for(i = 0; i < introItems.length; i++) {
		introItems[i].style.marginTop = (divHeight-140)/2 + 'px';
	}
}

function completeLoading() {
	document.getElementById("title-text").innerHTML 
	= 'How On Time Are LA Buses?';
}

// Working with HTML Table
var objHour, objMonth, objWeek, objRoute;
var getCount = 0;

function getFiles() {
	$.ajax({
		type: 'GET',
		url: 'data/routes.json',
		dataType: "text",
		success: function(data) {
			objRoute = JSON.parse(data);
			callInitializeFunctions();
		}
	});
	$.ajax({
		type: 'GET',
		url: 'data/hour-26.json',
		dataType: "text",
		success: function(data) {
			objHour = JSON.parse(data);
			callInitializeFunctions();
		}
	});
	$.ajax({
		type: 'GET',
		url: 'data/month-26.json',
		dataType: "text",
		success: function(data) {
			objMonth = JSON.parse(data);
			callInitializeFunctions();
		}
	});
	$.ajax({
		type: 'GET',
		url: 'data/week-26.json',
		dataType: "text",
		success: function(data) {
			objWeek = JSON.parse(data);
			callInitializeFunctions();
		}
	});
}

function callInitializeFunctions() {
	getCount++;
	if(getCount == 4) {
		setStyles();
		resetBlocks();
		partitionData();
		setDropDown();
		completeLoading();
	}
}

function setDropDown() {
	var itemList = document.getElementsByClassName("drop-down");
	var str = '<option value="-1">Bus line</option>\n';
	for(i = 0; i < arrCount; i++) {
		if(descriptionId[routeId[i]] !== undefined) {
			var des = objRoute.items[descriptionId[routeId[i]]].display_name;
			str += '<option value="' + i + '">' + des + '</option>';
		}
	}
	for(i = 0; i < itemList.length; i++) {
		var ele = itemList[i];
		var itemHeight = ele.offsetHeight;
		ele.style.paddingTop = (20-itemHeight/2) + 'px';
		ele.innerHTML = str;
	}
}

function updateAll() {
	var dropDown = document.getElementsByClassName("drop-down");
	var selected = [];
	var draw = false;
	var op = 2;
	// for(i = 1; i <= 3; i++) {
	// 	if(document.getElementById('op'+i).checked) {
	// 		op = i;
	// 		break;
	// 	}
	// }
	for(i = 0; i < dropDown.length; i++) {
		var newValue = parseInt(dropDown[i].value);
		if(newValue > -1) {
			selected.push(newValue);
			draw = true;
		}
	}
	if(draw) {
		drawHour(selected,op);
		drawMonth(selected,op);
		drawWeek(selected,op);
	}
	else {
		resetBlocks();
	}
	completeLoading();
}
 
// Partitioning data

var routeId = [];
var descriptionId = [];
var hourStart = [];
var monthStart = [];
var weekStart = [];
var arrCount = 0;

function partitionData() {
	for(i = 0; i < objRoute.items.length; i++) {
		descriptionId[objRoute.items[i].id] = i;
	}

	var tempID = 0;
	for(i = 0; i < objHour.items.length; i++) {
		if(tempID != objHour.items[i].route_id) {
			hourStart[arrCount] = i;
			tempID = objHour.items[i].route_id;
			routeId[arrCount] = tempID;
			arrCount++;
		}
	}
	hourStart[arrCount] = objHour.items.length;

	tempID = 0;
	arrCount = 0;
	for(i = 0; i < objMonth.items.length; i++) {
		if(tempID != objMonth.items[i].route_id) {
			monthStart[arrCount] = i;
			tempID = objMonth.items[i].route_id;
			arrCount++;
		}
	}
	monthStart[arrCount] = objMonth.items.length;

	tempID = 0;
	arrCount = 0;
	for(i = 0; i < objWeek.items.length; i++) {
		if(tempID != objWeek.items[i].route_id) {
			weekStart[arrCount] = i;
			tempID = objWeek.items[i].route_id;
			arrCount++;
		}
	}
	weekStart[arrCount] = objWeek.items.length;
}

function r2(x) {
	return Math.floor(x*100)/100;
}

// Draw tables

function drawHour(selected,op) { //(val,start,end) {
	// 2011-2016
	var categories = [];
	for(i = 0; i < 24; i++) categories[i] = i;

	var yText = "";
	if(op <= 2) yText = "Average Delay (min)";
	else yText = "Delay Percentage (%)";

	var options = {
	    chart: { type: 'line' },
        title: { text: 'Hourly Performance' },
        xAxis: {
            categories: categories
        },
        yAxis: {
            title: {
                text: yText
            }
        },
        series: [],
        credits: {
            enabled: false
        },
    };
	for(k = 0; k < selected.length; k++) {
		val = selected[k];
		start = hourStart[val];
		end = hourStart[val+1];
		var data = [];
		for(i = start; i < end; i++) {
			var temp = parseFloat(objHour.items[i].average_delay_only);
			data[parseInt(objHour.items[i].hour)] = r2(temp);
		}
		for(i = 0; i < 24; i++) {
			if(data[i] === undefined) {
				data[i] = null;
			}
		}
    	options.series.push({
    	    name: 'Line ' + routeId[val],
  	    	data: data
  		});
	}
	$(function () { 
	    var myChart = Highcharts.chart('hour', options);
	});
}

function drawMonth(selected,op) {
	var yText = "";
	if(op <= 2) yText = "Average Delay (min)";
	else yText = "Delay Percentage (%)";

	var options = {
	    chart: { type: 'line' },
        title: { text: 'Monthly Performance' },
        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        yAxis: {
            title: {
                text: yText
            }
        },
        series: [],
        credits: {
            enabled: false
        },
    };
    for(k = 0; k < selected.length; k++) {
   		val = selected[k];
		start = monthStart[val];
		end = monthStart[val+1];
		var data = [];
		for(i = start; i < end; i++) {
			var temp = parseFloat(objMonth.items[i].average_delay_only);
			data[objMonth.items[i].month-1] = r2(temp);
		}
		for(i = 0; i < 12; i++) {
			if(data[i] === undefined) {
				data[i] = null;
			}
		}
	    options.series.push({
	        name: 'Line ' + routeId[val],
	        data: data
	    });
    }
	$(function () { 
	    var myChart = Highcharts.chart('month', options);
	});
}

function drawWeek(selected,op) {
	var yText = "";
	if(op <= 2) yText = "Average Delay (min)";
	else yText = "Delay Percentage (%)";

	var options = {
	    chart: { type: 'line' },
        title: { text: 'Weekly Performance' },
        xAxis: {
            categories: ['Sun','Mon','Tue','Wed','Thur','Fri','Sat']
        },
        yAxis: {
            title: {
                text: yText
            }
        },
        series: [],
        credits: {
            enabled: false
        },
    };
    for(k = 0; k < selected.length; k++) {
    	val = selected[k];
		start = weekStart[val];
		end = weekStart[val+1];
		var data = [];
		for(i = start; i < end; i++) {
			var temp = parseFloat(objWeek.items[i].average_delay_only);
			data[objWeek.items[i].day-1] = r2(temp);
		}
		for(i = 0; i < 7; i++) {
			if(data[i] === undefined) {
				data[i] = null;
			}
		}
	    options.series.push({
	        name: 'Line ' + routeId[val],
	        data: data
	    });
    }
	$(function () { 
	    var myChart = Highcharts.chart('week', options);
	});
}


