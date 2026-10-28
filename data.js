// 콘텐츠 매니페스트 — 장면, 음악, 날씨, 테마, 문구.
// 장면: assets/scenes 의 실사 사진. win = 사진 속 창문(창밖이 보이는 영역, 사진 대비 0~1 비율).
//   날씨 효과는 이 영역(창밖) 안에만 그려진다. win 이 없는 장면에서는 날씨가 소리로만 표현된다.
//   pos = 화면 비율이 달라 사진이 잘릴 때 보여 줄 기준 위치(object-position). 영상은 video 항목에 경로를 넣으면 우선 사용된다.
// 음악: tracks[].src 에 파일 경로를 채우면 된다. 비어 있으면 합성 재즈가 재생된다.

window.SCENES = [
  { id: 'city-night',    image: 'assets/scenes/city-night.jpg',    name: { ko: '도시 야경 창가',     en: 'City Night Window' },
    win: { x: 0.265, y: 0.03, w: 0.46, h: 0.91 } },
  { id: 'city-overcast', image: 'assets/scenes/city-overcast.jpg', name: { ko: '흐린 날 도시 창가',  en: 'Overcast City Window' },
    win: { x: 0.375, y: 0.29, w: 0.385, h: 0.64 } },
  { id: 'hotel-room',    image: 'assets/scenes/hotel-room.jpg',    name: { ko: '호텔 방 창가',       en: 'Hotel Room Window' },
    win: { x: 0.735, y: 0.03, w: 0.26, h: 0.57 } },
  { id: 'sunset-city',   image: 'assets/scenes/sunset-city.jpg',   name: { ko: '노을 지는 창가',     en: 'Sunset Window' },
    win: { x: 0.17, y: 0.2, w: 0.64, h: 0.7 } },
  { id: 'curtain-room',  image: 'assets/scenes/curtain-room.jpg',  name: { ko: '커튼 드리운 창가',   en: 'Curtained Window' },
    win: { x: 0.39, y: 0.2, w: 0.31, h: 0.66 } },
];

// style: lofi | swing | bossa  /  prog: 코드 진행 (key 기준 반음, 품질)
window.TRACKS = [
  { id: 't1', src: '', style: 'lofi',  bpm: 72,  key: 2,
    title: { ko: '비 오는 창가에서 책 읽는 오후', en: 'Rainy Window Reading Afternoon' },
    original: 'Prototype Lo-fi No.1',
    tags: ['rain', 'read'] },
  { id: 't2', src: '', style: 'swing', bpm: 100, key: 0,
    title: { ko: '뉴욕 심야 퇴근길', en: 'Late Night Commute Through Manhattan' },
    original: 'Prototype Swing No.1',
    tags: ['night', 'commute'] },
  { id: 't3', src: '', style: 'bossa', bpm: 84,  key: 5,
    title: { ko: '노을 지는 카페 테라스', en: 'Sunset Café Terrace' },
    original: 'Prototype Bossa No.1',
    tags: ['sunset', 'cafe'] },
  { id: 't4', src: '', style: 'lofi',  bpm: 64,  key: 9,
    title: { ko: '새벽 세 시, 깊은 집중', en: '3 AM Deep Focus' },
    original: 'Prototype Lo-fi No.2',
    tags: ['night', 'focus'] },
  { id: 't5', src: '', style: 'swing', bpm: 88,  key: 7,
    title: { ko: '비 갠 뒤 천천히 걷는 길', en: 'A Slow Walk After the Rain' },
    original: 'Prototype Swing No.2',
    tags: ['rain', 'walk'] },
  { id: 't6', src: '', style: 'bossa', bpm: 76,  key: 10,
    title: { ko: '일요일 아침 서재', en: 'Sunday Morning Study' },
    original: 'Prototype Bossa No.2',
    tags: ['morning', 'study'] },
];

window.WEATHERS = [
  { id: 'clear',   name: { ko: '맑음', en: 'Clear' },   icon: '☀' },
  { id: 'rain',    name: { ko: '비',   en: 'Rain' },    icon: '☂' },
  { id: 'snow',    name: { ko: '눈',   en: 'Snow' },    icon: '❄' },
  { id: 'thunder', name: { ko: '천둥', en: 'Thunder' }, icon: '⚡' },
];

window.PRESETS = [
  { id: 'p1', scene: 'city-overcast', weather: 'rain',    track: 't1', name: { ko: '비 오는 오후 독서',  en: 'Rainy Afternoon Reading' } },
  { id: 'p2', scene: 'city-night',    weather: 'clear',   track: 't2', name: { ko: '도시 야경 작업',      en: 'City Night Work' } },
  { id: 'p3', scene: 'hotel-room',    weather: 'snow',    track: 't4', name: { ko: '눈 오는 밤 집중',    en: 'Snowy Night Focus' } },
  { id: 'p4', scene: 'sunset-city',  weather: 'clear', track: 't3', name: { ko: '노을 산책 기분',     en: 'Sunset Stroll Mood' } },
];

window.THEMES = [
  { id: 'warm',   name: { ko: '따뜻한 호박빛', en: 'Warm Amber' },   accent: '#f0b878', glass: 'rgba(20,16,14,0.62)' },
  { id: 'cool',   name: { ko: '차분한 밤하늘', en: 'Calm Midnight' }, accent: '#8fb8ff', glass: 'rgba(12,16,26,0.62)' },
  { id: 'forest', name: { ko: '숲의 초록',     en: 'Forest Green' },  accent: '#9fd49a', glass: 'rgba(12,20,14,0.62)' },
  { id: 'rose',   name: { ko: '노을 장미',     en: 'Dusk Rose' },     accent: '#f2a7b8', glass: 'rgba(26,14,18,0.62)' },
  { id: 'mono',   name: { ko: '흑백',         en: 'Monochrome' },    accent: '#e6e6e6', glass: 'rgba(16,16,16,0.62)' },
];

window.I18N = {
  ko: {
    appName: 'Study Jazz', start: '재생하려면 눌러 주세요',
    scene: '장면', weather: '날씨', mixer: '볼륨', music: '음악', timer: '타이머', presets: '프리셋',
    volMin: '최소', volMax: '최대', weatherSfx: '날씨 효과음', intensity: '강도',
    fullscreen: '전체화면', language: 'EN', play: '재생', pause: '일시정지', prev: '이전', next: '다음',
    focus: '집중', rest: '휴식', min: '분', theme: '컬러 테마', startT: '시작', pauseT: '일시정지', reset: '초기화',
    original: '원곡', placeholderNote: '임시 장면·합성 재즈 (실제 영상·음원 준비 전 시안)',
    credits: '크레딧', close: '닫기', langName: '언어',
    windowOnly: '날씨는 창문 밖에서만 보여요.', noWindow: '이 장면에는 창문이 없어 날씨는 소리로만 느낄 수 있어요.',
    themeNote: '메뉴와 버튼 색만 바뀌고, 장면 사진은 그대로예요.',
  },
  en: {
    appName: 'Study Jazz', start: 'Tap to start',
    scene: 'Scene', weather: 'Weather', mixer: 'Mixer', music: 'Music', timer: 'Timer', presets: 'Presets',
    volMin: 'Min', volMax: 'Max', weatherSfx: 'Weather sound', intensity: 'Intensity',
    fullscreen: 'Fullscreen', language: '한', play: 'Play', pause: 'Pause', prev: 'Previous', next: 'Next',
    focus: 'Focus', rest: 'Break', min: 'min', theme: 'Color theme', startT: 'Start', pauseT: 'Pause', reset: 'Reset',
    original: 'Original', placeholderNote: 'Placeholder scenes and synthesized jazz (until real video/audio is ready)',
    credits: 'Credits', close: 'Close', langName: 'Language',
    windowOnly: 'Weather is only visible outside the window.', noWindow: 'This scene has no window, so weather is heard but not shown.',
    themeNote: 'Changes menu and button colors only; the scene photo stays as is.',
  },
};
