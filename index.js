const multer = require('multer');
const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs').promises;
const ejs = require('ejs');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const session = require('express-session');
const { TIMEOUT } = require('dns');
const path = require('path');
const { get } = require('request-promise-native');
app.set('view engine', 'ejs');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('src')); // src 폴더안에 html 파일 & 이미지 폴더
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            //img 폴더에 업로드한 사진들 저장!
            cb(null, 'src/img/')
        },

        filename(req, file, cb) {
            //확장자 추출
            const ext = path.extname(file.originalname);
            //이름설정 원래이름 +  확장자
            cb(null, path.basename(file.originalname, ext) + ext);
        },
    }),
    limit: { fileSize: 20 * 1024 * 1024 },
});
app.use(session({
    // 세션 설정
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));


async function getDBConnection() {
    // 데이터베이스 연결
    const db = await sqlite.open({
        filename: 'database.db',
        driver: sqlite3.Database
    });
    return db;
}

app.get('/', function (req, res) {
    console.log(req.session);
    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    } else { // 로그인 되어있으면 메인 페이지로 연결
        res.render('main', { pos: req.session.position });
        // 메인으로 날씨정보는 보낼 필요 없어서 삭제 weather: req.session.weather
    }
});

app.get('/signup', function (req, res) {
    // 회원가입 페이지로 연결
    res.render('signup');
});
app.post('/signup', async function (req, res) {
    // 클라이언트에서 회원가입 정보를 받아서 데이터베이스에 저장
    var obj = req.body.userinfo;
    const db = await getDBConnection();
    var query;

    // 중복되는 이메일인지 확인
    query = `select email from user_info where email == '${obj.email}'`;
    let rows = await db.all(query);
    if (rows.length != 0) { // 중복될 경우 회원가입 실패
        db.close();
        res.send({ success: false });
    } else { // 중복되지 않는 경우

        // 데이터베이스에 회원 정보 저장
        query = 'insert into user_info(name, email, password, personal) values(?, ?, ?, ?)';
        await db.run(query, [obj.name, obj.email, obj.password, obj.personal]);

        db.close();
        res.send({ success: true });
    }
});

app.get('/login', function (req, res) {
    // 로그인 페이지로 연결
    res.render('login');
});

app.post('/login', async function (req, res) {
    // 클라이언트에서 로그인 정보를 받아서 세션에 저장

    // 존재하는 이메일 & 비밀번호인지 확인
    let db = await getDBConnection();
    let query = 'select * from user_info where email = ? and password = ?';
    let row = await db.all(query, [req.body.email, req.body.password]);
    db.close();
    console.log(row);

    if (row.length == 0) { // 존재하지 않을 경우 로그인 실패
        res.send({ success: false });
    } else { // 존재할 경우
        req.session.user = { // session.user에 로그인 정보 저장
            logged_in: true,
            email: req.body.email,
            personal: row[0].personal
        };
        res.send({ success: true });
    }
});

app.post('/change_position', function (req, res) {
    // 클라이언트에게 위치정보를 받아서 세션을 수정
    req.session.position = {
        latitude: req.body.lati,
        longitude: req.body.long
    }
    console.log(req.body);
    res.send({ success: true });
});

app.post('/change_weather', function (req, res) {
    // 상동
    req.session.weather = {
        date: req.body.date,
        temp: req.body.temp,
        feels_like: req.body.feels_like,
        weather: req.body.weather,
        icon: req.body.icon
    }
    console.log(req.body);
    res.send({ success: true });
});

app.get('/get_session', function (req, res) {
    // 세션정보를 제공함
    res.send({ session: req.session });
});

app.get('/main', function (req, res) {
    //위치 정보를 받고, 날씨 정보를 보냄
    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    } else {
        res.render('main', { pos: req.session.position });
    }
});

app.get('/photos', async function (req, res) {
    // 정렬 된 사진 보여주기
    // db에서 사진 받아와서 정렬
    // 1. 지역(오차 범위는 어느정도?) 2. 날씨 온도 +- 3도
    // 3. 추위 타는 정도, 4. 별점
    if (req.session.weather === undefined) { // 날씨 정보가 없으면 메인으로 리다이렉트
        res.redirect('/');
    }
    let db = await getDBConnection();
    // 정렬 필요!!!
    // 일단은 모든 사진 다 가져옴
    let rule = req.query.rule;
    if (rule === undefined) {
        rule = 0;
    }
    console.log(req.session);
    let current_x = req.session.position.latitude;
    let current_y = req.session.position.longitude;
    let current_temp = req.session.weather.temp;
    let current_personal = req.session.user.personal;
    let query0 = 'select * from pictures';

    let query1 = 'SELECT * from pictures WHERE (' + current_x + ' - image_location_latitude) > -0.7 AND ( ' + current_x + ' - image_location_latitude) < 0.7 AND (' + current_y + ' - image_location_longitude) > -0.5 AND(' + current_y + ' - image_location_longitude) < 0.5';
    let query2 = 'SELECT * from pictures WHERE ( image_temp - ' + current_temp + ') > -3 AND (image_temp - ' + current_temp + ') < 3';
    let query3 = 'SELECT * from pictures WHERE ( image_eval - ' + current_personal + ') >= -1 AND (image_eval - ' + current_personal + ') <= 1 ';
    let query4 = 'SELECT * from pictures ORDER BY image_rate desc';
    let query5 = 'SELECT * from pictures WHERE (' + current_x + ' - image_location_latitude) > -0.7 AND ( ' + current_x + ' - image_location_latitude) < 0.7 AND (' + current_y + ' - image_location_longitude) > -0.5 AND(' + current_y + ' - image_location_longitude) < 0.5  ORDER BY image_temp desc';
    let matchPhotos = await db.all(query0);
    if (rule == 0) {
        matchPhotos = await db.all(query0);
    }
    if (rule == 1) {
        matchPhotos = await db.all(query1);
    }
    if (rule == 2) {
        matchPhotos = await db.all(query2);
    }
    if (rule == 3) {
        matchPhotos = await db.all(query3);
    }
    if (rule == 4) {
        matchPhotos = await db.all(query4);
    }
    db.close();
    console.log(matchPhotos);

    // 기준에 맞는 사진 다 골랐다고 치고
    res.render('photos', { selected: rule, photos: matchPhotos, weather: req.session.weather });
});

app.get('/photodetail/:image_id', async function (req, res) {
    if (req.session.weather === undefined) { // 날씨 정보가 없으면 메인으로 리다이렉트
        res.redirect('/');
    }
    try {
        let db = await getDBConnection();
        console.log(":" + req.params.image_id);
        let query = 'select * from pictures where image_id=' + req.params.image_id + ';';
        let chosen = await db.all(query);
        console.log(chosen); // array 형태
        db.close();
        res.render('photodetail', { photo: chosen, weather: req.session.weather });
    } catch (err) {
        console.log(err);
        res.status(500).send('ERROR');
    }
})

app.post('/change_rate', async function (req, res) {
    let db = await getDBConnection();
    let query1 = 'select image_rate, image_ratingNum from pictures where image_id=' + req.body.rating_img + ';';
    let change = await db.all(query1); // array 형태

    let before_rate = change[0].image_rate; // 원래 평점
    let numOfRates = change[0].image_ratingNum; // 평가한 사람 수
    // update rate 
    let new_numOfRates;
    let new_rate;
    if (before_rate == null && numOfRates == null) {
        new_numOfRates = 1;
        new_rate = req.body.new_rate;
    } else {
        new_numOfRates = numOfRates + 1;
        new_rate = before_rate * numOfRates;
        new_rate += req.body.new_rate;
        new_rate /= new_numOfRates;
    }
    console.log(new_rate);
    let query2 = 'update pictures set image_rate=' + new_rate + ', image_ratingNum=' + new_numOfRates + ' where image_id=' + req.body.rating_img + ';';
    await db.run(query2);
    db.close();
    res.send({ success: true });
});

app.get('/myphotos', async function (req, res) {
    // image_id 큰 순서대로(날짜 최근)

    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    }

    console.log(req.session.user);
    let db = await getDBConnection();
    let query = 'select * from pictures where upload_user= "' + req.session.user.email + '" order by image_id DESC;';
    let mine = await db.all(query);
    db.close();

    res.render('myphotos', { photos: mine, weather: req.session.weather });
});

app.get('/Post', function (req, res) {
    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    }

    res.render('upload');
});
app.post('/Post', upload.single('userfile'), async function (req, res) {
    //사진과 설명 그리고 로그인 정보를 받고 meta extractor을 통해 위치 정보 추출 후 
    //사진, 설명, 로그인 정보에 있는 개인 특성, 위치 정보 저장
    //res.send('Uploaded! : ' + req.file);
    console.log(req.file);
    console.log(req.body);
    console.log(req.session);
    if (req.file === undefined) return false;
    let db = await getDBConnection();
    /* metadata extractor 구현*/

    // node.js에서 fetch api를 사용할 수 없어서 uploat.js에서 
    // metadata extractor api랑 getWeather api를 사용해야 할 것 같습니다.

    // 서버에 사진정보 업로드
    const location = JSON.parse(req.body.location);
    const weather = JSON.parse(req.body.weather);
    console.log(location);
    console.log(weather);
    query = 'insert into pictures(image_name, image_inf, image_eval, image_location_latitude, image_location_longitude, image_temp, upload_user) values(?, ?, ?, ?, ?, ?, ?)';
    await db.run(query, [
        req.file.filename,
        req.body.info,
        req.session.user.personal,
        location.latitude,
        location.longitude,
        weather.avg,
        req.session.user.email // 업로드 유저 명시
    ]);
    db.close();
    res.send({ success: true });
});

app.post('/getPic', function (req, res) {
    //사용자 위치 정보를 받고, 사진 목록을 보냄(제출이 우선이므로 살살)
    //1. 최근 2.별점 3.평가
});

app.get('/getPic/:num', async function (req, res) {
    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    }

    let query = 'SELECT * FROM pictures WHERE product_id = ?';
    //사진 id을 받으면 ejs를 통해 상기 사진 jpg와 정보, 별점을 보여줌
    try {
        let db = await getDBConnection();
        let rows = await db.all(query, [req.params.num]);
        db.close();
        // ejs는 front 쪽에서 
        // 선택된 사진의 name(~.jpg,inf(짧은 설명),eval(1~5점 숫자로 numeric),
        //  x,y (좌표), temp(ature)
        res.render('upload' /*ejs 주소*/, {
            image: rows[0].image_name,
            information: rows[0].image_inf,
            evaluation: rows[0].image_eval,
            x: rows[0].image_location_x,
            y: rows[0].image_location_y,
            temp: rows[0].image_temp
        });
    } catch (error) {
        res.status(500).send("Load not complete");
    }

});

app.get('/newLocation', function (req, res) { // 위치 변경
    if (!req.session.user) { // 로그인 되어있지 않으면 로그인 페이지로 연결
        res.redirect('/login');
    }

    res.render('newLocation', { pos: req.session.position, weather: req.session.weather });
});

app.get('/getWeather', async function (req, res) {
    // api가 작동하지 않아서 소스 그대로 옮겼습니다.
    // 출처: https://github.com/KSeoYoung/weatherapi/blob/master/getWeather.php
    let date = new Date();

    let yy = req.query.yy;
    let mm = req.query.mm;
    let stn = req.query.stn;

    yy = yy == '' ? date.getDate() : yy;
    mm = mm == '' ? date.getMonth() + 1 : mm;
    stn = stn == '' ? 108 : stn;

    try {
        let response = await axios({
            url: `http://www.kma.go.kr/weather/climate/past_cal.jsp?stn=${stn}&yy=${yy}&mm=${mm}&obs=1&x=24&y=9`,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        let encoded_data = iconv.decode(response.data, "EUC-KR").toString();
        const $ = cheerio.load(encoded_data);
        const $bodyList = $('table.table_develop tbody tr').children('td');

        let regex = /평균기온:(.*?)최고기온:(.*?)최저기온:(.*?)평균운량:(.*?)일강수량:(.*?)e/;
        let divList = [];
        let day = 1;
        $bodyList.each(function (i, el) {
            if ($(this).text().indexOf('평균기온') > -1) {
                let line = $(this).text();
                line = line.replace(/℃/gi, '');
                line = line.replace(/mm/gi, '');
                let matches = regex.exec(line + 'e');
                divList[day++] = {
                    avg: matches[1],
                    high: matches[2],
                    low: matches[3],
                    cloud: matches[4],
                    rain: matches[5].replace('-', '0').trim()
                };
            }
        });

        res.send(JSON.stringify(divList));

    } catch (err) {
        console.error(err);
    }
});


var port = 8080;

app.listen(port, function () {
    console.log('server on! http://localhost:' + port);
});