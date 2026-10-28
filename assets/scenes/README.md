# 장면 사진

방 안에서 창밖을 내다보는 1인칭 시점의, 인물이 없는 어둡고 분위기 있는 무료 사진을 받아 이 폴더에 직접 저장해 사용합니다 (외부 주소를 불러오지 않습니다).
모든 사진은 [Pexels 라이선스](https://www.pexels.com/license/)에 따라 무료로 사용할 수 있으며, 출처 표기는 필수가 아니지만 아래에 남깁니다. 16:9로 잘라 저장했습니다.

| 장면 | 파일 | 사진 | 촬영자 |
| --- | --- | --- | --- |
| 도시 야경 창가 | city-night.jpg | [View from flat window of night cityscape](https://www.pexels.com/photo/3223855/) | Alexander Igrevsky |
| 흐린 날 도시 창가 | city-overcast.jpg | [City View from a Window](https://www.pexels.com/photo/4239736/) | alleksana |
| 호텔 방 창가 | hotel-room.jpg | [Skyscraper behind Window of Hotel Bedroom](https://www.pexels.com/photo/20021123/) | Thomas Balabaud |
| 노을 지는 창가 | sunset-city.jpg | [Urban Sunset View Through Large Windows](https://www.pexels.com/photo/39109151/) | Áλικα |
| 커튼 드리운 창가 | curtain-room.jpg | [View of a City from a Window of a High Floor Apartment](https://www.pexels.com/photo/16502245/) | Pin Han Lim |
| 노을 지는 방 창가 | sunset-room.jpg | [Lamp Near Window](https://www.pexels.com/photo/3551216/) | Aleksey Kuprikov |
| 밤바다 커튼 창가 | night-sea.jpg | [From balcony view of night sea with mountains](https://www.pexels.com/photo/4601868/) | Lucas Pezeta |
| 야간 작업실 창가 | night-office.jpg | [Dimly Lit Office Room with a Computer Desk by a Window](https://www.pexels.com/photo/14963655/) | Iryna Varanovich |

## 사진 바꾸기·추가하기
- 같은 파일 이름으로 덮어쓰거나, `data.js`의 `SCENES`에 항목을 추가합니다. 영상은 `video: 'assets/scenes/<id>.mp4'`를 넣으면 우선 사용됩니다.
- 날씨는 창밖에서만 보이므로, 사진 속 유리창 영역을 `win`(사진 대비 0~1 비율 `{x, y, w, h}`)으로 적어야 합니다. 비·눈이 이미 찍혀 있지 않은 사진을 고르세요.
- 가로형(16:9) 사진이 가장 잘 맞습니다. 다른 비율이면 `pos`(예: `'50% 36%'`)로 보여 줄 부분을 고릅니다.
