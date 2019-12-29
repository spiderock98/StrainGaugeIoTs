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
    // socket.on('disconnect', () => console.log('see you again'));
});

// const peer = new peerjs('lwjd5qra8257b9');

nspStream.on('connection', socket => {
    console.log('Python Socket has connected');
    // if btn then which socket id can emit
    socket.on('stream', data => nspBrowser.emit('stream', data));
    socket.on('auth', (queryCamID, password, uniqueSensorID) => {
        var strDBRef = firebase.database().ref('/' + uniqueSensorID + '/camera')
        strDBRef.once('value', snap => {
            if ((snap.val().id == queryCamID) && (snap.val().pass == password)){
                socket.emit('auth', 'GRANTED')
            }
            else { socket.emit('auth', 'DENIED') }
        });
    });
});

///// FIX LAG PENDING /////

// nspStream.on('connection', socket => {
//     var decoded_image;
//     var flagData = true;
//     console.log('Python Socket has connected');
//     // redirect data stream
//     if (flagData){
//         socket.on('stream', data => {
//             // decoded_image = 'data:image/jpg;base64,' + data;
//             // if (!varData) {varData = data;}
//             flagData = false;
//             nspBrowser.emit('stream', data);
//             flagData = true;
//         });
//     }
// });

// When home.ejs has been rendered
nspBrowser.on('connection', socket => {
    var crosslockRef = firebase.database().ref('/crosslock');
    socket.on('onload', () => {
        // nspStream.emit('onload');
        crosslockRef.once('value', snap => {
            nspStream.emit('crosslock', snap.val());
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
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.pass).then(() => {
        res.send('Access Granted');
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

// Route logout
app.get('/login', (req, res) => {
    firebase.auth().signOut();
    res.render('login');
});

app.post('/calendar', (req, res) => {
    if (req.body.download) {
        dbRef.once('value', snap => { res.status(201).send(snap.val()); });
    }
    else {
        dbRef.once('value', snap => { res.status(202).send(snap.val()); });
    }
});