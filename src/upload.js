//upload.ejs js
// function reset() {
//     Data = new formData(document.getElementById("send"));
//     formData.append('information', document.getElementsByName("information").innerText);
//     fetch('/Post', {
//         method: 'POST',
//         body: formData
//     });

// }


let file;
let info;
document.addEventListener('DOMContentLoaded', function () {
    file = document.getElementById('file');
    info = document.getElementById('info');
})

async function post_file() {
    if (file.value == "") {
        alert("파일을 업로드 해주세요");
        file.focus();
        return;
    }

    if (info.value == "") {
        alert("사진의 설명을 적어주세요");
        info.focus();
        return;
    }

    const data = new FormData();



    let res_raw;
    let res;
    try {
        let lati;
        let long;
        let date;

        EXIF.getData(file.files[0], async function () {
            let lati_t = EXIF.getTag(this, "GPSLatitude");
            let long_t = EXIF.getTag(this, "GPSLongitude");
            let date_t = EXIF.getTag(this, "DateTimeOriginal");
            if (lati_t === undefined || long_t === undefined || date_t === undefined) {
                alert("사진의 메타데이터가 존재하지 않습니다.");
                return;
            }
            lati = lati_t[0] + lati_t[1] / 60 + lati_t[2] / 3600;
            long = long_t[0] + long_t[1] / 60 + long_t[2] / 3600;
            date = date_t.match(/(.*?):(.*?):(.*?) /);

            let date_cur = new Date();
            let weather;

            if (date[1] == date_cur.getFullYear() && date[2] == date_cur.getMonth() + 1 && date[3] == date_cur.getDate()) {
                // 만약 사진의 날짜가 오늘이면
                res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lati}&lon=${long}&units=metric&exclude=minutely,daily,alert&appid=2a12c46f6651477a4292731a92394ae0`);
                let weatherInfo = await res.json();
                weather = {
                    avg: weatherInfo.current.temp
                };

            } else { // 사진의 날짜가 오늘이 아니면
                // 사진의 위치와 가장 가까운 장소의 기상청 날씨 찾기

                res_raw = await fetch('/weatherLocation.json');
                const stns = await res_raw.json();

                let stn;
                let dis_cur;
                let dis_min = Infinity;
                for (let key in stns) {
                    dis_cur = Math.sqrt(Math.pow(lati - stns[key].latitude, 2) + Math.pow(long - stns[key].longitude, 2));
                    if (dis_cur < dis_min) {
                        dis_min = dis_cur;
                        stn = stns[key].stn;
                    }
                }
                console.log(stn);

                res_raw = await fetch(`/getWeather?yy=${date[1]}&mm=${date[2]}&stn=${stn}`);
                console.log(res_raw);
                weather = (await res_raw.json())[date[3]];
                console.log(weather);
            }




            data.append('userfile', file.files[0]);
            data.append('info', info.value);
            data.append('weather', JSON.stringify(weather));
            data.append('location', JSON.stringify({
                latitude: lati,
                longitude: long
            }));

            res_raw = await fetch('/Post', {
                method: 'POST',
                body: data
            })
            res = await res_raw.json();
            if (res.success) {
                alert('업로드가 완료되었습니다.');
                location.reload();
            } else {
                alert('ERROR');
            }
        });



    } catch (err) {
        console.error(err);
    }

}