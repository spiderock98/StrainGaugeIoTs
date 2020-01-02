var btnLogout = document.getElementById('btnLogout');
var fieldDashboard = document.getElementById('fieldDashboard');
var fieldDevices = document.getElementById('fieldDevices');
var btnDevices = document.getElementById('btnDevices');
var menu = document.getElementById('menu');
var stt1Sw = document.getElementById('stt1Sw');
// var stt1txt = document.getElementById('stt1txt');
// var stt1icon = document.getElementById('stt1icon');

var modal = document.getElementById('myModal');
var body = document.getElementsByTagName('body');
var container = document.getElementById('myContainer');
var btnClose = document.getElementById("closeModal");

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

stt1Sw.onclick = function() {
    changeStatus(stt1Sw, stt1txt, stt1icon);
};

// Open the modal
btnDevices.onclick = function () {
    modal.className = "Modal is-visuallyHidden";
    setTimeout(function () {
        container.className = "MainContainer is-blurred";
        menu.className = "menu is-blurred";
        modal.className = "Modal";
    }, 100);
    container.parentElement.className = "ModalOpen";
}
// Close the modal
btnClose.onclick = function () {
    modal.className = "Modal is-hidden is-visuallyHidden";
    body.className = "";
    container.className = "MainContainer";
    menu.className = "menu";
    container.parentElement.className = "";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.className = "Modal is-hidden";
        body.className = "";
        container.className = "MainContainer";
        menu.className = "menu";
        container.parentElement.className = "";
    }
}

fieldDashboard.addEventListener('click', function () { window.location.href = '/home' });

fieldDevices.addEventListener('click', function () { window.location.href = '/devices' });

fieldUsers.addEventListener('click', () => window.location.href = '/users');

btnLogout.addEventListener('click', function () { window.location.href = '/login'; });