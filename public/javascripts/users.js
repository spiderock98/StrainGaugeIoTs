$('#fieldDashboard').click(() => window.location.href = '/home');
// $('#fieldDevices').click(() => { window.location.href = '/devices' });
$('#fieldUsers').click(() => window.location.href = '/users');
$('#btnLogout').click(() => window.location.href = '/login');
var qrLog = document.getElementById('qrLog');
var combobox = document.getElementById('combobox');

var socketBrowser = io('/Browser');

$(document).ready(() => {
    let today = new Date();
    qrLog.value = today.toISOString().substr(0, 10);
    $('#btnToday').click(() => qrLog.value = today.toISOString().substr(0, 10));
});
// onclick "view log"
socketBrowser.on('card', (html) => {
    $("div.card-grid-space").replaceWith(html);
    // document.getElementById('tbInfo').style = "display: inline;";

    function changeStatus(sw, sttTxt, sttIcon) {
        this.sttTxt = document.getElementsByClassName(sttTxt);
        this.sttIcon = document.getElementsByClassName(sttIcon);
        if (sw.checked == true) {
            sttTxt.style = "color: darkgreen;";
            sttTxt.innerHTML = "Online";
            sttIcon.src = "/images/active.svg";
        }
        else {
            sttTxt.style = "color: darkred;";
            sttTxt.innerHTML = "Offline";
            sttIcon.src = "/images/error.png";
        }
    };

    document.getElementById('stt1Sw').onclick = () => {
        changeStatus(stt1Sw, stt1txt, stt1icon);
    };
})

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
                let userDate = new Date(qrLog.value);
                let result = {};
                let retArr = [];

                for (let time in jsonData) {
                    let qrDate = new Date();
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
                    XLSX.writeFile(wb, combobox.value + '-' + qrLog.value + '.xlsx');
                }
                else { window.alert('No Logs on ' + qrLog.value); }
            },
            202: () => {
                // console.log('202 log area found');
                google.charts.load('current', { packages: ['controls', 'corechart'] });
                google.charts.setOnLoadCallback(drawLine);

                // function drawLine() {
                //     var data = google.visualization.arrayToDataTable([
                //         [{ label: 'Time', type: 'datetime' },
                //         { label: 'Sensor', type: 'number' }],
                //     ]);

                //     let now = new Date();
                //     var rangeFilter = new google.visualization.ControlWrapper({
                //         controlType: 'ChartRangeFilter',
                //         containerId: 'filter-range',
                //         options: {
                //             filterColumnIndex: 0,
                //             ui: {
                //                 chartType: 'ComboChart',
                //                 chartOptions: {
                //                     chartArea: { width: '100%' },
                //                     hAxis: { baselineColor: 'none' },
                //                     height: 72,
                //                 },
                //             },
                //         },
                //         state: {
                //             range: {
                //                 start: new Date(2020, 0, 1),
                //                 end: new Date(2020, 0, 7),
                //                 // start: new Date(2020, now.getMonth(), now.getDate(), 10),
                //                 // end: new Date(2020, now.getMonth(), now.getDate(), 24),
                //             },
                //         },
                //     });

                //     var chart = new google.visualization.ChartWrapper({
                //         chartType: 'AreaChart',
                //         containerId: 'linechart',
                //         options: {
                //             title: 'Logs Table ' + combobox.value,
                //             hAxis: { title: 'Time' },
                //             vAxis: { title: 'Sensor Value', minValue: 0 },
                //             explorer: { axis: 'horizontal', keepInBounds: true },
                //         }
                //     });

                //     var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard'));

                //     dashboard.bind(rangeFilter, chart);
                //     dashboard.draw(data);
                    
                //     let sortDate = [];
                //     for (var time in jsonData) {
                //         let dbDate = new Date();
                //         dbDate.setTime(time);
                //         sortDate.push([dbDate, parseInt(jsonData[time])]);
                //     }
                //     data.addRows(sortDate);

                //     // chart.draw(data, options);
                    

                //     // on new log data
                //     socketBrowser.on('cloudVal', (time, log) => {
                //         var d = new Date();
                //         d.setTime(time);

                //         data.addRows([
                //             [d, parseInt(log)]
                //         ]);
                //         dashboard.draw(data);
                //     });
                // }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                function drawLine() {
                    var rangeFilter = new google.visualization.ControlWrapper({
                        controlType: 'ChartRangeFilter',
                        containerId: 'filter-range',
                        options: {
                            filterColumnIndex: 0,
                            ui: {
                                chartType: 'AreaChart',
                                chartOptions: {
                                    chartArea: { width: '90%', height: '50%' },
                                    hAxis: { baselineColor: 'none' },
                                },
                            },
                        },
                        controlPosition: 'bottom',
                        controlWrapperParams: {
                            state: {
                                range: {
                                    start: new Date(2020, 0, 1),
                                    end: new Date(2020, 0, 7)
                                },
                            },
                        },
                    });


                    var data = google.visualization.arrayToDataTable([
                        // ['Time', 'Sensor Values'],
                        [{ label: 'Time', type: 'datetime' },
                        { label: 'Sensor', type: 'number' }],
                        // [new Date(2020, 0, 1), 1],
                    ]);

                    var options = {
                        title: 'Logs Table ' + combobox.value,
                        // chartArea: { width: '90%' },
                        animation: { startup: true, duration: 1000, easing: 'out' },
                        // pointSize: 2,
                        hAxis: { title: 'Time', titleTextStyle: { color: '#333' }, },
                        vAxis: { title: 'Sensor Value', minValue: 0 },
                        // style: { 'fill-color': '#a52714' },
                        explorer: { axis: 'horizontal', keepInBounds: true, maxZoomIn: .05 },
                        // point: { size: 2, shape-type: 'star', fill-color: 'fill-color', }
                    };

                    var chart = new google.visualization.AreaChart(document.getElementById('linechart'));
                    chart.draw(data, options); // init

                    let userDate = new Date(qrLog.value);
                    let sortDate = [];


                    for (let time in jsonData) {
                        let qrDate = new Date();
                        qrDate.setTime(time);
                        if ((qrDate.getDate() == userDate.getDate()) && (qrDate.getMonth() == userDate.getMonth())) {
                            // sortDate.push([new Date(qrDate.getFullYear(), qrDate.getMonth(), qrDate.getDate()), jsonData[time]]);
                            sortDate.push([qrDate, parseInt(jsonData[time])]);
                            // sortDate.push([[qrDate.getHours(), qrDate.getMinutes(), qrDate.getSeconds()], parseInt(jsonData[time])]);
                        }
                    }
                    data.addRows(sortDate);
                    chart.draw(data, options);

                    // on new log data
                    socketBrowser.on('cloudVal', (time, log) => {
                        var d = new Date();
                        d.setTime(time);

                        data.addRows([
                            [d, parseInt(log)]
                        ]);
                        chart.draw(data, options);
                    });
                }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // function drawLine() {
                //     var data = google.visualization.arrayToDataTable([
                //         ['Time', 'Sensor Values'],
                //         [Date(), Number()],
                //     ]);

                //     var options = {
                //         title: 'Logs Table ' + combobox.value,
                //         // chartArea: { width: '90%' },
                //         animation: { startup: true, duration: 1000, easing: 'out' },
                //         // pointSize: 2,
                //         // hAxis: { title: 'Time', titleTextStyle: { color: '#333' },  },
                //         vAxis: { title: 'Sensor Value', minValue: 0 },
                //         // style: { 'fill-color': '#a52714' },
                //         explorer: { axis: 'horizontal' },
                //         // point: { size: 2, shape-type: 'star', fill-color: 'fill-color', }
                //     };

                //     var chart = new google.visualization.AreaChart(document.getElementById('linechart'));
                //     chart.draw(data, options); // init

                //     // var dbDate = new Date();
                //     // var sortDate = [];
                //     // for (var time in jsonData) {
                //     //     dbDate.setTime(time);
                //     //     // sortDate.push([dbDate.toISOString(), parseInt(jsonData[time])]);
                //     //     // sortDate.push([dbDate.toTimeString(), parseInt(jsonData[time])]);
                //     //     sortDate.push([dbDate.toLocaleTimeString(), parseInt(jsonData[time])]);
                //     // }

                //     let userDate = new Date(qrLog.value);
                //     let sortDate = [];
                //     let qrDate = new Date();

                //     for (let time in jsonData) {
                //         qrDate.setTime(time);
                //         if ((qrDate.getDate() == userDate.getDate()) && (qrDate.getMonth() == userDate.getMonth())) {
                //             sortDate.push([qrDate, parseInt(jsonData[time])]);
                //         }
                //     }
                //     data.addRows(sortDate);
                //     chart.draw(data, options);

                //     // on new log data
                //     socketBrowser.on('cloudVal', (time, log) => {
                //         var d = new Date();
                //         d.setTime(time);

                //         data.addRows([
                //             [d.toLocaleTimeString(), parseInt(log)]
                //         ]);
                //         chart.draw(data, options);
                //     });
                // }
            }
        }
    });
});
