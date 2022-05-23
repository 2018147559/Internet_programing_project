# Internet_programing_project
project which makes clothes recommending system, by location, weather and many more 

![image](https://user-images.githubusercontent.com/80660346/169879127-9f422541-ada4-40d9-a759-7dd569670467.png)


## 사용 API :
 
- Kakaomap api
- Geolocation api
- Openweathermap api

## 소개
1. 지역마다 온도 및 습도차이가 있습니다.
=> 현재 기온과 지역에 맞추어 코디를 제공
Geolocation api를 통해 사용자의 현재 위치를 탐색하고 2. Openweathermap api를 통해 현재 온도 식별 
 두 정보를 바탕으로 과거 사진들을 (ex) 비슷한 기온, 평점)기준에 맞춰 정렬  

![image](https://user-images.githubusercontent.com/80660346/169879639-25abb48e-262b-4fb0-8d12-178072134ae8.png)

2. 메타 데이터라고 들어보셨나요? => 사진에 남아있는 정보들 (ex) 위치, 시간 기간) 이를 추출함으로서 사용자가 언제 어디서 찍었는지 머리 싸매지 않아도 됩니다. 단지 추출한 두 정보를 가지고 Cheerio 모듈을 통해 기상청 데이터를 크롤링 해 그 당시 그지역 날씨를 받아올 수 있습니다.
![image](https://user-images.githubusercontent.com/80660346/169879349-28aa1fab-11df-4396-99d2-089819a99441.png)
3. 시연 화면입니다. 로그인 및 회원가입 기능, 그 외의 업로드 기능 등은 코드를 읽어보시면서 참고하시면 되겠습니다.
![image](https://user-images.githubusercontent.com/80660346/169879571-f8f6eaf2-6e4d-4d01-9253-42e1892e4e61.png)

