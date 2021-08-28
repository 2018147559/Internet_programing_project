// main.html

// 날씨 정보 받아오기
// 현재 날씨 + 앞으로 12시간 날씨
window.onload = function() {
    fetch('userInfo.json') 
    .then(function(response) {
        return response.json();
    })
    .then(function(json) {
        let userInfo = json;
        // 유저 위치로부터 날씨 받아오기
        getWeather(userInfo, 1)
    })
    .catch(function(err) {
        console.log('Fetch problem:' + err.message);
    })

    function getWeather(userInfo, 유저번호) {
        const latitude = userInfo[유저번호].Location.lad;
        const longitude = userInfo[유저번호].Location.lon;

        fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=metric&exclude=minutely,daily,alert&appid=2a12c46f6651477a4292731a92394ae0`)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            weatherInfo = json;
            displayWeather(weatherInfo);
        }) 
        .catch(function(err) {
            console.log('Fetch problem:' + err.message);
        })
        
        function displayWeather(weatherInfo) {
            // current
            const date = new Date(weatherInfo.current.dt*1000); // unix
            const temp = weatherInfo.current.temp; // celcius
            const feel_like = weatherInfo.current.feels_like;
            const weather = weatherInfo.current.weather[0].main;
            let icon = weatherInfo.current.weather[0].icon; // ex. "10d"
            icon = icon.replace("\"","");
            const iconscr = `http://openweathermap.org/img/wn/${icon}@2x.png`;
            
            const main = document.querySelector("#main");
            // 위치
            let geocoder = new kakao.maps.services.Geocoder();

            let callback = function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    let location = document.createElement("div");
                    main.appendChild(location);

                    for (let i = 0; i < result.length; i++) {
                        if (result[i].region_type === 'H') {
                            location.innerHTML = result[i].address_name;
                            break;
                        }
                    }
                }
            }

            geocoder.coord2RegionCode(longitude, latitude, callback);
        
            // UNIX 시간 일반 시간으로 바꾸기
            let dayinfo = document.createElement("div");
            main.appendChild(dayinfo);
            let today = date.getFullYear() + "년 " + (date.getMonth()+1) + "월 " + date.getDate() + "일 "; 
            dayinfo.innerHTML = today + '현재 온도: ' + temp + '&#8451;' + '체감 온도: ' + feel_like + '&#8451;' +
            '현재 날씨: ' + weather;
        
            let iconimg = document.createElement("img");
            iconimg.src = iconscr;
            iconimg.alt = "weather icon";
            main.appendChild(iconimg);
            
            // now and next 12 hours
        
        }
    }
}

// photos.html


// photodetail.html

// myphotos.html

// newLocation.html