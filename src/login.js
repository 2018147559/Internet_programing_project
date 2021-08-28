
let ok;
let email;
let password;
let form;
let data;

document.addEventListener('DOMContentLoaded', function () {
    ok = document.getElementById('ok');
    email = document.getElementById('email');
    password = document.getElementById('password');
    form = document.getElementById('form');


});


function log_in() {
    if (email.value == "") {
        alert("아이디 써주세요");
        email.focus();
        return;
    }

    if (password.value == "") {
        alert('비밀번호 써주세요');
        password.focus();
        return;
    }

    data = {
        email: email.value,
        password: password.value
    };

    // 서버로 로그인 정보 전송
    fetch('/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(Response => Response.json())
        .then(Response => {
            console.log(Response.success);
            if (Response.success) { // 로그인에 성공할 경우:
                post_position();
            } else { // 로그인에 실패할 경우
                alert('로그인 정보가 없습니다.');
            }
        })
        .catch(error => console.error(error))
}

function post_position() {
    // 현재 위치를 서버로 전송
    navigator.geolocation.getCurrentPosition(async function (pos) {
        try {
            let data_position = {
                lati: pos.coords.latitude,
                long: pos.coords.longitude
            };

            await fetch('/change_position', { // 서버에 위치정보 전송
                method: 'POST',
                body: JSON.stringify(data_position),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            window.location.href = '/';

        } catch (err) {
            console.log(err);
        }

        
    }, function (err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        alert('위치 정보 사용 권한을 허용해 주시기 바랍니다.')
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}
