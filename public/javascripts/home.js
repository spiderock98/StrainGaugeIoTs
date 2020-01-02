var btnLogout = document.getElementById('btnLogout');
var spinbox = document.getElementById("spinbox");
var qrLog = document.getElementById('qrLog');
var fieldDashboard = document.getElementById('fieldDashboard');
var fieldDevices = document.getElementById('fieldDevices');

var socketBrowser = io('/Browser');

// ELEMENTS

fieldDashboard.addEventListener('click', () => window.location.href = '/home');

fieldDevices.addEventListener('click', () => window.location.href = '/devices');

fieldUsers.addEventListener('click', () => window.location.href = '/users');

btnLogout.addEventListener('click', () => window.location.href = '/login');

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
                console.log('201 download found');
                var userDate = new Date(qrLog.value);
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
                console.log('202 log pie found');
                // PIE CHART 
                google.charts.load("current", { packages: ["corechart"] });
                google.charts.setOnLoadCallback(drawPie);
                function drawPie() {
                    var data = google.visualization.arrayToDataTable([
                        ['Time in day', 'Counter'],
                        [String(), Number()],
                    ]);

                    var options = {
                        title: 'Daily Log',
                        is3D: true,
                        width: 900,
                        height: 450,
                    };

                    var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
                    // chart.draw(data, options);

                    // socketBrowser.once('jsCrawl', jsonData => {
                    var result = [];
                    var sortDate = [];
                    var qrDate = new Date(qrLog.value);
                    var dbDate = new Date();

                    for (var i in jsonData) {
                        dbDate.setTime(i);
                        result.push([dbDate.toDateString(), parseInt(jsonData[i])]);
                        if ((dbDate.getDate() == qrDate.getDate()) && (dbDate.getMonth() == qrDate.getMonth())) {
                            sortDate.push([dbDate.toTimeString(), parseInt(jsonData[i])]);
                        }
                    }
                    data.addRows(sortDate);
                    chart.draw(data, options);
                    // });
                }
            }
        }
    });
});

// spinbox.oninput = () => {
//     // room here    
//     socketBrowser.emit('frameSize', spinbox.value);
// }

// AREA CHART

google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawLine);

function drawLine() {
    var data = google.visualization.arrayToDataTable([
        ['Time', 'Sensor Values'],
        [String(), Number()],
    ]);

    var options = {
        title: 'Logs Table',
        // curveType: 'function',
        // legend: { position: 'bottom' },
        // lineWidth: 4,
        chartArea: { width: '80%' },
        animation: { "startup": true, duration: 1000, easing: 'out' },

        pointSize: 2,
        hAxis: { title: 'Time', titleTextStyle: { color: '#333' } },
        vAxis: { minValue: 0 },
        style: { 'fill-color': '#a52714' },
        // point: { size: 2, shape-type: 'star', fill-color: 'fill-color', }
    };

    // var chart = new google.visualization.LineChart(document.getElementById('linechart'));
    var chart = new google.visualization.AreaChart(document.getElementById('linechart'));
    chart.draw(data, options); // init

    // ajax onload page
    // $.ajax('/calendar', {
    //     method: 'POST',
    //     async: false,
    //     success: jsonData => {
    //         var dbDate = new Date();
    //         var sortDate = [];
    //         for (var time in jsonData) {
    //             dbDate.setTime(time);
    //             sortDate.push([dbDate.toTimeString(), parseInt(jsonData[time])]);
    //         }
    //         data.addRows(sortDate);
    //         chart.draw(data, options);
    //     }
    // });

    // on new log data 
    socketBrowser.on('cloudVal', (time, log) => {
        var d = new Date();
        d.setTime(time);

        data.addRows([
            [d.toTimeString(), parseInt(log)]
        ]);
        chart.draw(data, options);
    });
}

class mapDevice {
    constructor(sensorID, camID, status, location, map) {
        this.sensorID = sensorID;
        this.status = status;
        this.camID = camID;
        this.location = location;
        this.map = map;

        this.InfoWindow = new google.maps.InfoWindow();
        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.location.x, this.location.y),
            map: this.map, // put marker into map
            optimized: false,
            // animation: google.maps.Animation.BOUNCE,
        });
    }

    get getCamID() { return this.camID; }
    get getInfoWindow() { return this.InfoWindow; }
    get getMarker() { return this.marker; }
    get getStatus() { return this.status; }
    set setStatus(stt) { this.status = stt; }
}

function initMap() {
    var map = new google.maps.Map(document.getElementById("map"), {
        center: new google.maps.LatLng(16.213342, 107.511174),
        zoom: 6,
    });

    // Refreshing
    socketBrowser.once('dbInfo', (objID, objStatus, arrLocation) => {
        // console.log(objID); // {sensor1: "acer", sensor2: "raspi"}
        // console.log(objStatus); // {acer: "off", raspi: "on"}
        // console.log(arrLocation); // [{address: gtvt, x: 10.845806, y: 106.794524}, {address: thuduc, x: 10.848621, y: 106.773583}]
        var arrMapDevice = [];
        var count = 0;
        for (const item in objID) {
            arrMapDevice.push(new mapDevice(item, objID[item], objStatus[objID[item]], arrLocation[count], map))
            ++count;
        }

        arrMapDevice.forEach(device => {
            console.log(device);
            
            google.maps.event.addListener(device.getMarker, 'click', () => {
                map.setZoom(15);
                device.getMarker.setClickable(false);
                device.getInfoWindow.open(map, device.getMarker);
                socketBrowser.on('stream', data => {
                    // decoded_image = 'data:image/jpg;base64,' + data;
                    device.getInfoWindow.setContent('<img src="' + 'data:image/jpg;base64,' + data + '" alt="video"></img>');
                });

                // if click when dbStatus is ON => first click onload
                if (device.getStatus == 'off') {
                    // SWAP status then write to DB using objStatus
                    arrMapDevice.forEach(element => {
                        if (element.getStatus == 'on') {
                            element.getMarker.setClickable(true);
                            element.getInfoWindow.close();
                            element.setStatus = 'off';
                            objStatus[element.getCamID] = 'off';
                        }
                    });
                    device.setStatus = 'on';
                    objStatus[device.getCamID] = 'on';
                    socketBrowser.emit('setDBStatus', objStatus);
                }
            });
            google.maps.event.addListener(device.getInfoWindow, 'closeclick', () => {
                map.setZoom(8);
                arrMapDevice.forEach(element => {
                    element.getMarker.setClickable(true);
                });
                // device.getMarker.setAnimation(google.maps.Animation.BOUNCE);
            });
        });
    });
    

    // socketBrowser.once('location', arrLocation => {
    //     for (var index in arrLocation) {
    //         arrMarker.push(new google.maps.Marker({
    //             position: new google.maps.LatLng(arrLocation[index].x, arrLocation[index].y),
    //             // animation: google.maps.Animation.BOUNCE,
    //             map: map,
    //             optimized: false,
    //         })
    //         );
    //         arrInfoWindow.push(new google.maps.InfoWindow());
    //         google.maps.event.addListener(arrMarker[index], 'click', (mouse) => {
    //             arrInfoWindow[index].open(map, arrMarker[index]);
    //             map.setZoom(15);
    //         });
    //         google.maps.event.addListener(arrInfoWindow[index], 'closeclick', () => {
    //             map.setZoom(6);
    //             // arrMarker[index].setAnimation(google.maps.Animation.BOUNCE);
    //         });
    //     }
    //     socketBrowser.on('stream', data => {
    //         // decoded_image = 'data:image/jpg;base64,' + data;
    //         arrInfoWindow[1].setContent('<img src="' + 'data:image/jpg;base64,' + data + '" alt="video"></img>');
    //         // marker1.setIcon('data:image/jpg;base64,' + data);
    //     });
    // });
}

// GOOGLE MAPS IMPLEMENT
// new google.maps.LatLng(10.845806, 106.794524), ///utc2
// function initMap() {
//     var map = new google.maps.Map(document.getElementById("map"), {
//         center: new google.maps.LatLng(16.213342, 107.511174),
//         zoom: 6,
//     });

//     var arrMarker = [];
//     var arrInfoWindow = [];
//     socketBrowser.once('location', arrLocation => {
//         for (var index in arrLocation) {
//             arrMarker.push(new google.maps.Marker({
//                 position: new google.maps.LatLng(arrLocation[index].x, arrLocation[index].y),
//                 // animation: google.maps.Animation.BOUNCE,
//                 map: map,
//                 optimized: false,
//             })
//             );
//             arrInfoWindow.push(new google.maps.InfoWindow());
//             google.maps.event.addListener(arrMarker[index], 'click', (mouse) => {
//                 arrInfoWindow[index].open(map, arrMarker[index]);
//                 map.setZoom(15);
//             });
//             google.maps.event.addListener(arrInfoWindow[index], 'closeclick', () => {
//                 map.setZoom(6);
//                 // arrMarker[index].setAnimation(google.maps.Animation.BOUNCE);
//             });
//         }
//         socketBrowser.on('stream', data => {
//             // decoded_image = 'data:image/jpg;base64,' + data;
//             arrInfoWindow[1].setContent('<img src="' + 'data:image/jpg;base64,' + data + '" alt="video"></img>');
//             // marker1.setIcon('data:image/jpg;base64,' + data);
//         });
//     });
// }

// // jQuery Onload
$(document).ready(() => {
    socketBrowser.emit('onload');
});