$('#fieldDashboard').click(() => window.location.href = '/home');
$('#fieldDevices').click(() => { window.location.href = '/devices' });
$('#fieldUsers').click(() => window.location.href = '/users');
$('#btnLogout').click(() => window.location.href = '/login');

var socketBrowser = io('/Browser');

// jQuery Form Plugin ajax onlick submit
// https://jquery-form.github.io/form/api/
$(() => {
    var jsonData;
    $('#formCal').ajaxForm({
        success: data => {
            jsonData = data;
        },
        statusCode: {
            201: () => {
                // console.log('201 download found');
                var userDate = new Date(document.getElementById('qrLog').value);
                var result = {};
                var retArr = [];

                for (var time in jsonData) {
                    var qrDate = new Date();
                    qrDate.setTime(time);

                    if ((qrDate.getDate() == userDate.getDate()) && (qrDate.getMonth() == userDate.getMonth())) {
                        result['time'] = qrDate;
                        result['sensor'] = jsonData[time];
                        retArr.push(result);
                        result = {};
                    }
                }
                
                if (retArr.length) {
                    // new sheet from json
                    var sheet = XLSX.utils.json_to_sheet(retArr);
                    // new workbook
                    var wb = XLSX.utils.book_new();
                    // add sheet to workbook
                    XLSX.utils.book_append_sheet(wb, sheet, 'data');
                    // save wb
                    XLSX.writeFile(wb, 'strain.xlsx');
                }
                else { window.alert('Nothing to Download ...'); }
            },
            202: () => {
                // console.log('202 log area found');
                google.charts.load('current', { 'packages': ['corechart'] });
                google.charts.setOnLoadCallback(drawLine);

                function drawLine() {
                    var data = google.visualization.arrayToDataTable([
                        ['Time', 'Sensor Values'],
                        [String(), Number()],
                    ]);

                    var options = {
                        title: 'Logs Table',
                        chartArea: { width: '90%' },
                        animation: { "startup": true, duration: 1000, easing: 'out' },

                        pointSize: 2,
                        hAxis: { title: 'Time', titleTextStyle: { color: '#333' } },
                        vAxis: { minValue: 0 },
                        style: { 'fill-color': '#a52714' },
                        // point: { size: 2, shape-type: 'star', fill-color: 'fill-color', }
                    };
                    
                    var chart = new google.visualization.AreaChart(document.getElementById('linechart'));
                    chart.draw(data, options); // init

                    var dbDate = new Date();
                    var sortDate = [];
                    for (var time in jsonData) {
                        dbDate.setTime(time);
                        sortDate.push([dbDate.toTimeString(), parseInt(jsonData[time])]);
                    }
                    data.addRows(sortDate);
                    chart.draw(data, options);

                    // on new log data 
                    socketBrowser.on('cloudVal', (time, log) => {
                        // console.log('seen');
                        
                        var d = new Date();
                        d.setTime(time);

                        data.addRows([
                            [d.toTimeString(), parseInt(log)]
                        ]);
                        chart.draw(data, options);
                    });
                }

            }
        }
    });
});
