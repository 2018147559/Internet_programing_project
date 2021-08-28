// 세션 정보 얻어오기
fetch('/get_session')
.then(res => {
    return res.json();
})
.then(res_json => {
    let session = res_json.session;
    console.log(session);
    showMap(session);
    nowLoc(session);
})

// 새로운 위치 저장할 변수
// button event 에서도 사용
let newLatitude;
let newLongitude;

function showMap(session) {
    // Kakaomap API
    // 현재 위치 정보 -> 지도에 표시
    const latitude = session.position.latitude;
    const longitude = session.position.longitude;

    let mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(latitude, longitude), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

    // 지도 생성
    let map = new kakao.maps.Map(mapContainer, mapOption);

    // 주소-좌표 변환 객체 
    let geocoder = new kakao.maps.services.Geocoder();

    // 클릭한 위치를 표시할 마커
    let marker = new kakao.maps.Marker();
    // 클릭한 위치에 대한 주소를 표시할 인포윈도우
    let infowindow = new kakao.maps.InfoWindow({zindex:1}); 

    // 현재 지도 중심좌표로 주소를 검색해서 지도 좌측 상단에 표시
    // 지도 옮기면 바뀜
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);

    // 지도를 클릭했을 때 클릭 위치 좌표에 대한 주소정보를 표시
    kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
        searchDetailAddrFromCoords(mouseEvent.latLng, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                let detailAddr = !!result[0].road_address ? '<div>도로명주소 : ' + result[0].road_address.address_name + '</div>' : '';
                detailAddr += '<div>지번 주소 : ' + result[0].address.address_name + '</div>';
                
                let content = '<div class="bAddr">' + detailAddr + '</div>';

                // 마커를 클릭한 위치에 표시 
                marker.setPosition(mouseEvent.latLng);
                marker.setMap(map);
                // 새로운 위치로 지정
                let markerPos = marker.getPosition(); // LatLng 객체
                newLatitude = markerPos.getLat();
                newLongitude = markerPos.getLng();
                console.log(newLatitude, newLongitude);

                // 인포윈도우에 클릭한 위치에 대한 상세 주소정보를 표시
                infowindow.setContent(content);
                infowindow.open(map, marker);
            }   
        });
    });

    // 중심 좌표나 확대 수준이 변경됐을 때 지도 중심 좌표에 대한 주소 정보 다시 표시
    kakao.maps.event.addListener(map, 'idle', function() {
        searchAddrFromCoords(map.getCenter(), displayCenterInfo);
    });

    // 지도 중심 위치 알려줌
    function searchAddrFromCoords(coords, callback) {
        // 좌표로 행정동 주소 정보를 요청
        geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);         
    }

    // 선택한 곳의 상세 정보 알려줌
    function searchDetailAddrFromCoords(coords, callback) {
        // 좌표로 법정동 상세 주소 정보를 요청
        geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
    }

    // 지도 좌측상단에 지도 중심좌표에 대한 주소정보 표시
    function displayCenterInfo(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            let infoDiv = document.getElementById('centerAddr');

            for(let i = 0; i < result.length; i++) {
                // 행정동의 region_type 값은 'H' 이므로
                if (result[i].region_type === 'H') {
                    infoDiv.innerHTML = result[i].address_name;
                    break;
                }
            }
        }    
    }
}

function nowLoc(session) {
    const latitude = session.position.latitude;
    const longitude = session.position.longitude;

    // 현재 주소 정보 보여주기
    // 주소-좌표 변환 객체
    let geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(longitude, latitude, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
            let headerLoc = document.getElementById("presentLoc");

            for (let i = 0; i < result.length; i++) {
                if (result[i].region_type === 'H') {
                    headerLoc.innerHTML = '현재 위치:' + result[i].address_name;
                    break;
                }
            }
        }
    });
}

// 버튼 이벤트 함수
// 버튼 누르면 현재 위치를 바꾸고 메인으로 돌아감
let button = document.getElementById("modify");
button.addEventListener("click", newLocation);

function newLocation() {
    // 위치 바꿨을 때
    if (newLatitude != undefined && newLongitude != undefined) {
        let data_position = {
            lati: newLatitude,
            long: newLongitude
        };

        fetch('/change_position', {
            method: 'POST',
            body: JSON.stringify(data_position),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        window.location.href = '/main';
    }
    else { // 클릭 안해서 위치 변경 안되었을 때
        alert('변경할 위치를 골라주십시오.');
    }
}