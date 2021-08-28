let ok;
let user_name;
let email;
let password;
let personal;
let form;
let data;

document.addEventListener('DOMContentLoaded', function () {
    ok = document.getElementById('ok');
    user_name = document.getElementById('name');
    email = document.getElementById('email');
    password = document.getElementById('password');
    personal = document.getElementById('personal');
    form = document.getElementById('form');


})


function sign_up() {
    if (user_name.value == "") {
        alert("이름 써주세요");
        user_name.focus();
        return;
    }

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


    if (personal.value == "") {
        alert('추위정도 써주세요');
        personal.focus();
        return;
    }

    data = {
        "userinfo": {
            name: user_name.value,
            email: email.value,
            password: password.value,
            personal: personal.value
        },
        "Location": {
            "lad": " ",
            "lon": " "
        }
    };

    // 서버로 회원가입 정보 전송
    fetch('/signup', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(Response => Response.json())
        .then(Response => {
            console.log(Response.success);
            if (Response.success) { // 회원가입에 성공했을 경우
                alert('회원가입 되었습니다.');
                location.href = '/';
            } else { // 회원가입에 실패했을 경우
                alert('중복된 이메일입니다.');
            }
        })
        .catch(error => console.error(error))
}
