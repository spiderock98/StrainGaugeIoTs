var current = null;
var txtEmail = document.getElementById('email')
var txtPassword = document.getElementById('password')
var btnLogin = document.getElementById('submit')

document.querySelector('#email').addEventListener('focus', function (e) {
    if (current) current.pause();
    current = anime({
        targets: 'path',
        strokeDashoffset: {
            value: 0,
            duration: 700,
            easing: 'easeOutQuart'
        },
        strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
        }
    });
});
document.querySelector('#password').addEventListener('focus', function (e) {
    if (current) current.pause();
    current = anime({
        targets: 'path',
        strokeDashoffset: {
            value: -336,
            duration: 700,
            easing: 'easeOutQuart'
        },
        strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
        }
    });
});
document.querySelector('#submit').addEventListener('focus', function (e) {
    if (current) current.pause();
    current = anime({
        targets: 'path',
        strokeDashoffset: {
            value: -730,
            duration: 700,
            easing: 'easeOutQuart'
        },
        strokeDasharray: {
            value: '530 1386',
            duration: 700,
            easing: 'easeOutQuart'
        }
    });
});


btnLogin.addEventListener('click', function(){
    // $.post('/auth', 
    // {
    //     id: txtEmail.value,
    //     pass: txtPassword.value
    // },
    // function(data, status){
    //     console.log(status);
    //     window.location.href = '/home';
    // });

    $.ajax({
        url: '/auth',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            id: String(txtEmail.value),
            pass: String(txtPassword.value)
        }),
        success: function(result,status){
            window.alert(result);
            window.location.href = '/home';
        }
    });
});
// btnLogin.addEventListener('click', function(){
//     var xhttp = new XMLHttpRequest();
//     xhttp.open("POST", "/auth/?" + "id=" + txtEmail.value + "&pass=" + txtPassword.value, true);
//     xhttp.send();
//     xhttp.onreadystatechange = function() {
//         if (this.readyState == 4 && this.status == 200) {
//             if(this.responseText === 'home') { window.location.href="/home"; }
//             else{ window.alert(this.responseText); }
//         }
//     };
// });
