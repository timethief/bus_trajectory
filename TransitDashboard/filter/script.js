function getFiles() {
	$.ajax({
		type: 'GET',
		url: 'data/dev-occurance.csv',
		dataType: "text",
		success: function(csv) {
			$("#chart-occ").highcharts({
				chart: {
					type: 'line'
				},
				data: {
					csv: csv
				},
				title: {
					text: ''
				},
				yAxis: {
					title: {
						text: 'log(occurances)'
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
						return 'Log(occurances) of schedule deviation <b>'
						 + this.x + '</b> is <b>' + this.y + '</b>.';
					}
				}
			});
		}
	});
	$.ajax({
		type: 'GET',
		url: 'data/data-count-new.csv',
		dataType: "text",
		success: function(csv) {
			$("#chart-dat").highcharts({
				chart: {
					type: 'column'
				},
				data: {
					csv: csv
				},
				title: {
					text: ''
				},
				yAxis: {
					title: {
						text: 'Data Count'
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
						return 'Data count: <b>' + this.y + '</b>';
					}
				}
			});
		}
	});
}