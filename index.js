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
var xlsx = require('xlsx');
var firebase = require('firebase');
var admin = require('firebase-admin');
var server = require('http').Server(app);
var io = require('socket.io')(server);
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

// Socket IO
var nspStream = io.of('/VideoStream');
var nspBrowser = io.of('/Browser');
// var nspEsp = io.of('/Esp8266');

var dbRef = firebase.database().ref('/sensor1/logs');
dbRef.on('child_added', snap => {
    nspBrowser.emit('cloudVal', snap.key, snap.val());
});

io.on('connection', socket => {
    // console.log('Esp8266 has connected');
    socket.on('sensor', data => {
        var update = {};
        var now = new Date();
        update[now.getTime()] = data.value;
        // console.log(data.value);
        firebase.database().ref('/sensor1/logs').update(update);
    });
});

nspStream.on('connection', socket => {
    console.log('Python Socket has connected');
    // redirect data stream 
    socket.on('stream', data => nspBrowser.emit('stream', data));
});

// nspStream.on('connection', socket => {
//     var decoded_image;
//     console.log('Python Socket has connected');
//     // redirect data stream 
//     socket.on('stream', data => {
//         decoded_image = 'data:image/jpg;base64,' + data;
//     });
// });


nspBrowser.on('connection', socket => {
    socket.on('onload', () => {
        dbRef.once('value', snap => { socket.emit('onload', snap.val()); });
    });

    socket.on('frameSize', value => {
        nspStream.emit('frameSize', value);
        // console.log(value);
    })

    socket.on('qrLog', () => {
        // crawl data then send to frontend 
        dbRef.once('value', snap => { nspBrowser.emit('jsCrawl', snap.val()); });
    });

    socket.on('download', date => {
        var userDate = new Date(date);
        dbRef.once('value', snap => {
            var result = {};
            var retArr = [];
            jsonData = snap.val();

            // crawl bunch of jsonData 
            for (var time in jsonData) {
                var qrDate = new Date();
                qrDate.setTime(time);

                if ((qrDate.getDate() == userDate.getDate()) && (qrDate.getMonth() == userDate.getMonth())) {
                    result['time'] = time;
                    result['sensor'] = jsonData[time];
                    retArr.push(result);
                    result = {};
                }
            }
            console.log(retArr);

            if (Object.keys(result).length != 0) {
                // var myJSON  = JSON.stringify(result);
                nspBrowser.emit('jsonXLSX', retArr);
            }
        });

    });
});

// Web Routing
app.get('/', (req, res) => {
    res.render('login');
    console.log('Welcome ' + req.connection.remoteAddress);
    // player.play('./facebook_messenger.mp3', function(err){if (err) throw err});
});

// wait for post auth
app.post('/auth', (req, res) => {
    // Init url and query variable
    // var adr = url.parse(req.url, true);
    // var qdata = adr.query;
    // console.log(req.body);

    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.pass).then(() => {
        // var currentUser = firebase.auth().currentUser;
        // res.send('Welcome ' + currentUser.email);
        res.send('Access Granted');
        // res.download('javascripts/map_bypass.js');
    }).catch(err => { res.send(err.message) });
});


// Set an authentication state observer and get user data
firebase.auth().onAuthStateChanged(user => {
    this.user = user;
    app.get('/home', (req, res) => {
        if (this.user) { res.render('home', { userName: this.user.email }); }
        // else { console.log('no more haha'); }
    });
    // Route devices
    app.get('/devices', (req, res) => {
        if (this.user) { res.render('devices'); }
    });
});

// // Route logout
// app.get('/logout', function(req, res){
//     firebase.auth().signOut();
//     res.send('logout');
//     app.get('/login', function(req, res, next){
//         res.render('login');
//     });
// });

// Route logout
app.get('/login', (req, res) => {
    firebase.auth().signOut();
    res.render('login');
});
