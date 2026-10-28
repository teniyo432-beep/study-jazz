(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'window-jazz-state-v1';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 상태 (localStorage 저장/복원) ----------
  const defaults = { scene: 'city-overcast', weather: 'rain', intensity: 0.6, jazzVol: 0.85, weatherVol: 0.4, track: 't1', lang: 'ko', focusMin: 25, restMin: 5, theme: 'warm' };
  let state = { ...defaults };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const byId = (arr, id) => arr.find((x) => x.id === id) || arr[0];
  // 더 이상 없는 옵션(예: 삭제된 '바람')이 저장돼 있으면 기본값으로 되돌린다
  if (!WEATHERS.some((w) => w.id === state.weather)) state.weather = 'clear';
  if (!SCENES.some((s) => s.id === state.scene)) state.scene = defaults.scene;
  if (!THEMES.some((x) => x.id === state.theme)) state.theme = 'warm';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const t = (k) => I18N[state.lang][k];

  const renderer = new SceneRenderer($('#bgVideo'), $('#bgImage'));
  const audio = new AudioEngine();

  // ---------- 날씨 화면 효과: weather.js (창문 영역 안에서만 그린다) ----------
  const wx = new WeatherFX($('#fx'),() => renderer.getWin(), () => { if (audio.ctx && audio.ctx.state === 'running') audio.rumble(); }, reduceMotion);


  // ---------- 적용 함수 ----------
  function applyScene() { renderer.setScene(byId(SCENES, state.scene)); }
  function applyWeather() { audio.setWeather(state.weather, state.intensity); wx.set(state.weather, state.intensity); }
  function applyTrack(autoplay) { audio.loadTrack(byId(TRACKS, state.track), autoplay); updateNowPlaying(); }
  function applyTheme() {
    // 컬러 테마는 UI(메뉴·버튼·강조색)에만 적용한다. 장면 사진의 색감은 바꾸지 않는다.
    const th = byId(THEMES, state.theme), root = document.documentElement.style;
    root.setProperty('--accent', th.accent); root.setProperty('--glass', th.glass);
  }
  function nextTrack(dir = 1) {
    const i = TRACKS.findIndex((x) => x.id === state.track);
    state.track = TRACKS[(i + dir + TRACKS.length) % TRACKS.length].id;
    save(); applyTrack(audio.playing); renderPanels();
  }
  audio.onTrackEnd = () => nextTrack(1);
  audio.setJazzVol(state.jazzVol); audio.setWeatherVol(state.weatherVol);
  audio.weather = state.weather; audio.intensity = state.intensity;

  // ---------- UI 렌더링 ----------
  function renderPanels() {
    document.documentElement.lang = state.lang;
    $('#title').textContent = t('appName');
    $('#startText').textContent = t('start');
    document.querySelectorAll('[data-panel]').forEach((b) => { b.querySelector('span').textContent = t(b.dataset.panel); });
    $('#fsBtn span').textContent = t('fullscreen');
    $('#langBtn i').textContent = t('language'); $('#langBtn span').textContent = t('langName');
    $('#prev').title = t('prev'); $('#next').title = t('next');
    $('#volMin').textContent = t('volMin'); $('#volMax').textContent = t('volMax');
    $('#musicBtn').title = t('music');
    $('#jazzVol').value = Math.round(state.jazzVol * 100);

    $('#p-scene').innerHTML = `<div class="grid">${SCENES.map((s) =>
      `<button class="tile ${s.id === state.scene ? 'on' : ''}" data-scene="${s.id}" style="background-image:url('${s.image}')"><b>${s.name[state.lang]}</b></button>`).join('')}</div>`;

    const hasWin = !!byId(SCENES, state.scene).win;
    $('#p-weather').innerHTML = `<div class="chips">${WEATHERS.map((w) =>
      `<button class="chip ${w.id === state.weather ? 'on' : ''}" data-weather="${w.id}"><i>${w.icon}</i>${w.name[state.lang]}</button>`).join('')}</div>
      <label class="row"><span>${t('intensity')}</span><input type="range" id="intensity" min="0" max="100" value="${Math.round(state.intensity * 100)}"></label>
      <label class="row"><span>${t('weatherSfx')}</span><input type="range" id="weatherVol" min="0" max="100" value="${Math.round(state.weatherVol * 100)}"></label>
      <p class="note">${hasWin ? t('windowOnly') : t('noWindow')}</p>`;

    $('#p-music').innerHTML = `<ul class="tracks">${TRACKS.map((tr) =>
      `<li><button class="track ${tr.id === state.track ? 'on' : ''}" data-track="${tr.id}">
        <b>${tr.title[state.lang]}</b><small>${t('original')}: ${tr.original} · ${tr.credit || ''}</small></button></li>`).join('')}</ul>`;

    $('#p-timer').innerHTML = `
      <div class="tmode" id="tmode"></div><div class="tbig" id="tbig"></div>
      <div class="chips"><button class="chip" id="tToggle"></button><button class="chip" id="tReset">${t('reset')}</button></div>
      <div class="chips">${[[25, 5], [50, 10], [90, 15]].map(([f, r]) =>
        `<button class="chip ${state.focusMin === f && state.restMin === r ? 'on' : ''}" data-tpre="${f}-${r}">${f} / ${r}${t('min')}</button>`).join('')}</div>
      <label class="row"><span>${t('focus')} (${t('min')})</span><input type="number" id="focusMin" min="1" max="180" value="${state.focusMin}"></label>
      <label class="row"><span>${t('rest')} (${t('min')})</span><input type="number" id="restMin" min="1" max="60" value="${state.restMin}"></label>`;
    updateTimerUI();

    $('#p-presets').innerHTML = `<ul class="tracks">${PRESETS.map((p) =>
      `<li><button class="track" data-preset="${p.id}"><b>${p.name[state.lang]}</b>
      <small>${byId(SCENES, p.scene).name[state.lang]} · ${byId(WEATHERS, p.weather).name[state.lang]}</small></button></li>`).join('')}</ul>`;

    $('#p-theme').innerHTML = `<div class="themes">${THEMES.map((th) =>
      `<button class="theme ${th.id === state.theme ? 'on' : ''}" data-theme="${th.id}">
        <span class="sw" style="background:${th.accent}"></span><b>${th.name[state.lang]}</b></button>`).join('')}</div>
      <p class="note">${t('themeNote')}</p>`;
    updateNowPlaying();
  }

  function updateNowPlaying() {
    $('#now').textContent = byId(TRACKS, state.track).title[state.lang];
    $('#playBtn').textContent = audio.playing ? '❚❚' : '▶';
    $('#playBtn').title = audio.playing ? t('pause') : t('play');
  }

  // ---------- 패널 열기/닫기 ----------
  let openLeft = null, musicOpen = false;
  function toggleLeft(name) {
    openLeft = openLeft === name ? null : name;
    document.querySelectorAll('#lpanels .panel').forEach((p) => p.classList.toggle('open', p.id === 'p-' + openLeft));
    document.querySelectorAll('#rail [data-panel]').forEach((b) => b.classList.toggle('on', b.dataset.panel === openLeft));
  }
  document.querySelectorAll('#rail [data-panel]').forEach((b) => b.addEventListener('click', () => toggleLeft(b.dataset.panel)));
  $('#musicBtn').addEventListener('click', () => {
    musicOpen = !musicOpen;
    $('#p-music').classList.toggle('open', musicOpen); $('#musicBtn').classList.toggle('on', musicOpen);
  });

  // 위임 이벤트
  $('#ui').addEventListener('click', (e) => {
    const el = e.target.closest('button'); if (!el) return;
    if (el.dataset.scene) { state.scene = el.dataset.scene; save(); applyScene(); renderPanels(); }
    else if (el.dataset.weather) { state.weather = el.dataset.weather; save(); applyWeather(); renderPanels(); }
    else if (el.dataset.track) { state.track = el.dataset.track; save(); applyTrack(true); renderPanels(); }
    else if (el.dataset.theme) { state.theme = el.dataset.theme; save(); applyTheme(); renderPanels(); }
    else if (el.dataset.preset) {
      const p = byId(PRESETS, el.dataset.preset);
      Object.assign(state, { scene: p.scene, weather: p.weather, track: p.track }); save();
      applyScene(); applyWeather(); applyTrack(true); renderPanels();
    } else if (el.dataset.tpre) {
      [state.focusMin, state.restMin] = el.dataset.tpre.split('-').map(Number); save();
      if (!T.running) T.left = timerFull();
      renderPanels();
    } else if (el.id === 'tToggle') timerToggle();
    else if (el.id === 'tReset') timerReset();
  });
  $('#ui').addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'focusMin' || id === 'restMin') {
      const isFocus = id === 'focusMin', max = isFocus ? 180 : 60;
      const n = Math.round(Number(e.target.value));
      if (!n) return;                       // 입력 중(빈 칸)에는 무시
      state[isFocus ? 'focusMin' : 'restMin'] = Math.min(max, Math.max(1, n)); save();
      if (!T.running && T.mode === (isFocus ? 'focus' : 'rest')) T.left = timerFull();
      updateTimerUI();
      return;
    }
    const v = e.target.value / 100;
    if (id === 'intensity') { state.intensity = v; audio.setWeather(state.weather, v); wx.set(state.weather, v); }
    else if (id === 'jazzVol') { state.jazzVol = v; audio.setJazzVol(v); }
    else if (id === 'weatherVol') { state.weatherVol = v; audio.setWeatherVol(v); }
    else return;
    save();
  });

  // ---------- 재생 컨트롤 ----------
  async function togglePlay() {
    if (audio.playing) audio.pause();
    else { audio.setWeather(state.weather, state.intensity); await audio.play(); }
    updateNowPlaying();
  }
  $('#playBtn').addEventListener('click', togglePlay);
  $('#prev').addEventListener('click', () => nextTrack(-1));
  $('#next').addEventListener('click', () => nextTrack(1));
  $('#langBtn').addEventListener('click', () => { state.lang = state.lang === 'ko' ? 'en' : 'ko'; save(); renderPanels(); });
  $('#fsBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {});
  });
  $('#startBtn').addEventListener('click', () => {
    $('#start').classList.add('gone');
    applyTrack(true);
    audio.setWeather(state.weather, state.intensity);
  });
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !/INPUT|BUTTON/.test(e.target.tagName)) {
      e.preventDefault();
      if (!$('#start').classList.contains('gone')) $('#startBtn').click(); else togglePlay();
    }
  });

  // ---------- 집중 타이머 (집중/휴식 시간을 직접 조절) ----------
  const T = { mode: 'focus', left: state.focusMin * 60, running: false, id: null };
  const timerFull = () => (T.mode === 'focus' ? state.focusMin : state.restMin) * 60;
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  function updateTimerUI() {
    const big = $('#tbig'); if (!big) return;
    $('#tmode').textContent = T.mode === 'focus' ? t('focus') : t('rest');
    big.textContent = fmt(T.left);
    $('#tToggle').textContent = T.running ? t('pauseT') : t('startT');
    const badge = $('#badge');
    badge.textContent = (T.mode === 'focus' ? '● ' : '○ ') + fmt(T.left);
    badge.classList.toggle('show', T.running || T.left !== timerFull());
  }
  function timerToggle() {
    T.running = !T.running;
    clearInterval(T.id);
    if (T.running) T.id = setInterval(() => {
      T.left--;
      if (T.left <= 0) {
        audio.chime();
        T.mode = T.mode === 'focus' ? 'rest' : 'focus';
        T.left = timerFull(); T.running = false; clearInterval(T.id);
      }
      updateTimerUI();
    }, 1000);
    updateTimerUI();
  }
  function timerReset() {
    clearInterval(T.id); T.running = false; T.mode = 'focus'; T.left = timerFull(); updateTimerUI();
  }

  // ---------- 조작 UI 자동 숨김 (5초) ----------
  let hideTimer;
  function wake() {
    document.body.classList.remove('idle'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => document.body.classList.add('idle'), 5000);
  }
  ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  wake();

  // ---------- 시작 ----------
  applyTheme(); applyScene(); applyWeather(); audio.track = byId(TRACKS, state.track);
  renderPanels();
})();
