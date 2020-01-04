var express = require('express')
var bodyParser = require('body-parser')

var app = express();
app.use(express.static('public'));

// no more cache
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(express.static(__dirname + '/ressources'));
app.set('view engine', 'ejs')
app.set('views', './views')

// var url = require('url');
// const xlsx = require('xlsx');
const firebase = require('firebase');
const admin = require('firebase-admin');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
// const peerjs = require('peerjs');
// var p2p = require('socket.io-p2p')
// var player = require('play-sound')(opts = {});
server.listen(8080);
// server.listen(process.env.PORT || 8080); 

var serviceAccount = require("./streamopencv-firebase-adminsdk-1m2qi-a0f9a36b01.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://streamopencv.firebaseio.com"
});

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAgb7aS-JDiAqldfh-9kx247333P2VsIPk",
    authDomain: "streamopencv.firebaseapp.com",
    databaseURL: "https://streamopencv.firebaseio.com",
    projectId: "streamopencv",
    storageBucket: "bucket.appspot.com",
    messagingSenderId: "799475033788",
    appId: "1:799475033788:web:356bbc071b9b50c63452b9",
    measurementId: "G-7JYQ524WQY"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var nspStream = io.of('/VideoStream');
var nspBrowser = io.of('/Browser');
// var nspEsp = io.of('/Esp8266');
// var refLog = firebase.database().ref('/sensor1/logs');
var refCrossLog = firebase.database().ref('/crosslock');
var reffilter_Sensor = firebase.database().ref().orderByKey().startAt('sens');

// refLog.on('child_added', snap => nspBrowser.emit('cloudVal', snap.key, snap.val()));

io.on('connection', socket => {
    socket.on('sensor', objData => {
        var MAC = Object.keys(objData).toString();
        reffilter_Sensor.once('value')
            .then(arrSensor => {
                arrSensor.forEach(sensor => {
                    if (MAC == sensor.val().MAC) {
                        var update = {};
                        var now = new Date();
                        var refLOG = firebase.database().ref('/' + sensor.key + '/logs');
                        update[now.getTime()] = objData[MAC];
                        refLOG.update(update);
                    }
                });
            });
    });
});

nspStream.on('connection', socket => {
    console.log('Python Socket has connected');
    // if btn then which socket id can emit
    socket.on('stream', data => nspBrowser.emit('stream', data));
    socket.on('auth', (queryCamID, password, uniqueSensorID) => {
        firebase.database().ref('/' + uniqueSensorID + '/camera').once('value', snap => {
            if ((snap.val().id == queryCamID) && (snap.val().pass == password)) {
                socket.emit('auth', 'GRANTED');
            }
            else { socket.emit('auth', 'DENIED'); }
        });
    });
});



// When home.ejs has been rendered
nspBrowser.on('connection', socket => {
    socket.on('disconnect', () => {
        nspStream.emit('onunload');
        refCrossLog.off();
        reffilter_Sensor.off();
    });
    socket.on('setDBStatus', objCrossLock => {
        refCrossLog.set(objCrossLock);
    });
    socket.once('onload', () => {
        var arrLocation = [];
        reffilter_Sensor.on('value', arrSensor => {
            arrSensor.forEach(sensor => {
                firebase.database().ref('/' + sensor.key + '/location').once('value', location => {
                    arrLocation.push(location.val());
                });
            });
        });

        var objID = {};
        reffilter_Sensor.on('value', arrSensor => {
            arrSensor.forEach(sensor => {
                objID[sensor.key] = sensor.val().camera.id
            });
        });

        var objStatus = {};
        refCrossLog.on('value', snap => {
            console.log(snap.val());
            nspStream.emit('crosslock', snap.val());
            objStatus = snap.val();
            socket.emit('dbInfo', objID, objStatus, arrLocation);
        });
        

        

        // setInterval(() => {
        //     
        // }, 1000);
        

        // refCrossLog.on('value', snap => {
        //     nspStream.emit('crosslock', snap.val());
        //     objStatus = snap.val();
        // });

        // setTimeout(() => {
        //     console.log(objStatus);
        //     socket.emit('dbInfo', objID, objStatus, arrLocation);
        // }, 500);
    });
});

// Web Routing
app.get('/', (req, res) => {
    res.redirect('/login');
    console.log('Welcome ' + req.connection.remoteAddress);
    // player.play('./facebook_messenger.mp3', function(err){if (err) throw err});
});

app.post('/auth', (req, res) => {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.pass).then(() => {
        res.send('Access Granted');
    }).catch(err => { res.send(err.message) });
});


// Set an authentication state observer and get user data
firebase.auth().onAuthStateChanged(user => {
    this.user = user;
    app.get('/home', (req, res) => {
        if (this.user) { res.render('home', { userName: this.user.email }); }
    });
    // Route devices
    // app.get('/devices', (req, res) => {
    //     if (this.user) { res.render('devices'); }
    // });

    app.get('/users', (req, res) => {
        if (this.user) { res.render('users'); }
    });
});

// Route logout
app.get('/login', (req, res) => {
    firebase.auth().signOut();
    res.render('login');
});

var qrLocat;

reffilter_Sensor.once('value')
.then(arrSensor => {
    arrSensor.forEach(sensor => {
        firebase.database().ref('/' + sensor.key + '/logs').on('child_added', snap => {
            if (qrLocat == sensor.val().location.address){
                nspBrowser.emit('cloudVal', snap.key, snap.val());
                // console.log(snap.val());
            }
        });
    });
}).catch(err => console.log(err));

app.post('/calendar', (req, res) => {
    qrLocat = req.body.locatCombobox;
    reffilter_Sensor.once('value')
    .then(arrSensor => {
        arrSensor.forEach(sensor => {
            if (qrLocat == sensor.val().location.address){
                if (req.body.download) { res.status(201).send(sensor.val().logs); } // download request
                // view request
                else {
                    res.status(202).send(sensor.val().logs);
                    fs.readFile('views/' + qrLocat + '.html', (err, html) => {
                        nspBrowser.emit('card', html.toString());
                    });
                }
            }
        });
    }).catch(err => console.log(err));
});

// let demo = new Promise((resolve, reject) => {
//     let arrLocation = [];
//     let objID = {};
//     let objStatus = new Object();

//     reffilter_Sensor.once('value')
//     .then(arrSensor => {
//         arrSensor.forEach(sensor => {
//             objID[sensor.key] = sensor.val().camera.id
//         });
//     })
//     .then(refCrossLog.once('value')
//     .then(snap => {
//         // nspStream.emit('crosslock', snap.val());
//         // objStatus = snap.val();
//         Object.assign(objStatus, snap.val());
//         // console.log(objStatus);
//         // console.log(snap.val());
        
//         // socket.emit('dbInfo', objID, objStatus, arrLocation);
//     }))
//     .then(reffilter_Sensor.once('value')
//     .then(arrSensor => {
//         arrSensor.forEach(sensor => {
//             firebase.database().ref('/' + sensor.key + '/location').once('value', location => {
//                 arrLocation.push(location.val());
//             });
//         });
//     }))
//     .then(resolve({objID, objStatus, arrLocation}))
// });
// ////////////////////////
// let demo3 = new Promise((resolve, reject) => {
//     let arrLocation = [];
//     let objID = {};
//     let objStatus = new Object();

//     reffilter_Sensor.once('value')
//     .then(arrSensor => {
//         arrSensor.forEach(sensor => {
//             objID[sensor.key] = sensor.val().camera.id
//         });
//         return refCrossLog.once('value')
//     })
//     .then(snap => {
//         Object.assign(objStatus, snap.val());
//         return reffilter_Sensor.once('value')
//     })
//     .then(arrSensor => {
//         arrSensor.forEach(sensor => {
//             firebase.database().ref('/' + sensor.key + '/location').once('value', location => {
//                 arrLocation.push(location.val());
//             });
//         });
//     })
//     .then(resolve({objID, objStatus, arrLocation}))
// });
// // demo3.then(msg => console.log(msg));

// ////////////////////
// async function demo2() {
//     const LOCAT = await reffilter_Sensor.once('value')
//     .then(arrSensor => {
//         let arrLocation = [];
//         arrSensor.forEach(sensor => {
//             firebase.database().ref('/' + sensor.key + '/location').once('value')
//             .then(location => {
//                 arrLocation.push(location.val());
//             });
//         });
//         return arrLocation
//     });

//     const ID = await reffilter_Sensor.once('value')
//     .then(arrSensor => {
//         let objID = {};
//         arrSensor.forEach(sensor => {
//             objID[sensor.key] = sensor.val().camera.id
//         });
//         return objID;
//     });

//     const STT = await refCrossLog.once('value')
//     .then(snap => {
//         // Object.assign(objStatus, snap.val());
//         return snap.val();
//     });
// }