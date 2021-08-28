// main.html

// 날씨 정보 받아오기
// 현재 날씨 + 앞으로 12시간 날씨
window.onload = async function () {
    try {
        let res = await fetch('/get_session');
        let res_json = await res.json();
        let session = await res_json.session;
        console.log(session);

        const latitude = session.position.latitude;
        const longitude = session.position.longitude;

        res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=metric&exclude=minutely,daily,alert&appid=2a12c46f6651477a4292731a92394ae0`);
        let weatherInfo = await res.json();
        let data_weather = {
            date: new Date(weatherInfo.current.dt * 1000),
            temp: weatherInfo.current.temp,
            feels_like: weatherInfo.current.feels_like,
            weather: weatherInfo.current.weather[0].main,
            icon: `http://openweathermap.org/img/wn/${weatherInfo.current.weather[0].icon}@2x.png`
        };

        await fetch('/change_weather', { // 서버에 날씨정보 전송
            method: 'POST',
            body: JSON.stringify(data_weather),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 위치
        let geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2RegionCode(longitude, latitude, function (result, status) {
            if (status === kakao.maps.services.Status.OK) {
                let location = document.getElementById("location");

                for (let i = 0; i < result.length; i++) {
                    if (result[i].region_type === 'H') {
                        location.innerHTML = result[i].address_name;
                        break;
                    }
                }
            }
        });

        // UNIX 시간 일반 시간으로 바꾸기
        // 날짜
        let date = document.getElementById("date");
        date.innerHTML = data_weather.date.getFullYear() + "년 " + (data_weather.date.getMonth() + 1) + "월 " + data_weather.date.getDate() + "일 ";
        // 날씨 아이콘
        let weather_icon = document.getElementById("weather_icon");
        let iconimg = document.createElement("img");
        iconimg.src = data_weather.icon;
        iconimg.alt = "weather icon";
        weather_icon.appendChild(iconimg);
        // 날씨, 온도, 체감온도
        let weather = document.getElementById("weather");
        weather.innerHTML = data_weather.weather;
        let temp = document.getElementById("temp");
        temp.innerHTML = '현재 온도 ' + data_weather.temp + '&#8451;';
        let feels_like = document.getElementById("feels_like");
        feels_like.innerHTML = '체감 온도 ' + data_weather.feels_like + '&#8451;';
    } catch (err) {
        console.log(err);
    }

}
