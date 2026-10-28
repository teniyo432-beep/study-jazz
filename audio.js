// 오디오 엔진: 재즈(음원 파일 또는 합성) + 날씨 효과음(합성). 외부 음원 없이 동작한다.
// 주변소리(카페 웅성거림 등)는 집중을 위해 의도적으로 제공하지 않는다.
(function () {
  const STYLE = {
    lofi:  { swing: 0.58, lp: 2400, delay: 0.22, melody: 0.2,  vinyl: true },
    swing: { swing: 0.64, lp: 5200, delay: 0.12, melody: 0.42, vinyl: false },
    bossa: { swing: 0.5,  lp: 4200, delay: 0.16, melody: 0.3,  vinyl: false },
  };

  const PROG = {
    lofi:  [[0, 'M9'], [9, 'm9'], [2, 'm9'], [7, 'd9']],
    swing: [[2, 'm7'], [7, 'd7'], [0, 'M7'], [9, 'd7'], [2, 'm7'], [7, 'd7'], [0, 'M7'], [0, 'M7']],
    bossa: [[2, 'm9'], [7, 'd9'], [0, 'M9'], [9, 'm7'], [2, 'm9'], [7, 'd9'], [0, 'M9'], [5, 'M7']],
  };

  const QUAL = { M7: [4, 7, 11, 14], M9: [4, 7, 11, 14], m7: [3, 7, 10, 14], m9: [3, 7, 10, 14], d7: [4, 10, 14, 16], d9: [4, 10, 14, 16] };
  const SCALE_TONES = { M7: [0, 2, 4, 7, 9, 11], M9: [0, 2, 4, 7, 9, 11], m7: [0, 2, 3, 5, 7, 10], m9: [0, 2, 3, 5, 7, 10], d7: [0, 2, 4, 7, 9, 10], d9: [0, 2, 4, 7, 9, 10] };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const JAZZ_BOOST = 1.8;   // 재즈 볼륨 증폭 배율 (슬라이더 최대일 때 원음의 약 1.8배, 리미터로 깨짐 방지)

  class AudioEngine {
    constructor() {
      this.ctx = null; this.playing = false; this.track = null;
      this.jazzVol = 0.85; this.weatherVol = 0.4;
      this.weather = 'clear'; this.intensity = 0.6;
      this.onTrackEnd = () => {}; this.onThunder = () => {};
      this.timer = null;
    }

    ensure() {
      if (this.ctx) return;
      const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 최종 출력 앞에 리미터를 둬서 재즈를 크게 키워도 소리가 깨지지 않게 한다
      this.limiter = ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -4; this.limiter.knee.value = 0; this.limiter.ratio.value = 12;
      this.limiter.attack.value = 0.003; this.limiter.release.value = 0.25;
      this.limiter.connect(ctx.destination);
      this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.limiter);
      this.jazzGain = ctx.createGain(); this.jazzGain.gain.value = this.jazzVol * JAZZ_BOOST; this.jazzGain.connect(this.master);
      this.weatherGain = ctx.createGain(); this.weatherGain.gain.value = this.weatherVol; this.weatherGain.connect(this.master);

      // 재즈 버스: 로우패스 + 짧은 딜레이
      this.bus = ctx.createGain();
      this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 4000;
      this.delay = ctx.createDelay(1); this.delay.delayTime.value = 0.28;
      this.fb = ctx.createGain(); this.fb.gain.value = 0.28;
      this.wet = ctx.createGain(); this.wet.gain.value = 0.15;
      this.bus.connect(this.lp); this.lp.connect(this.jazzGain);
      this.lp.connect(this.delay); this.delay.connect(this.fb); this.fb.connect(this.delay);
      this.delay.connect(this.wet); this.wet.connect(this.jazzGain);

      // 노이즈 버퍼 (흰색 노이즈 / 지직 소리)
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const cl = ctx.sampleRate * 3;
      this.crackle = ctx.createBuffer(1, cl, ctx.sampleRate);
      const c = this.crackle.getChannelData(0);
      for (let i = 0; i < cl; i++) c[i] = Math.random() < 0.0006 ? (Math.random() * 2 - 1) : 0;
      // 갈색 노이즈: 천둥의 묵직한 우르릉에 쓴다 (흰색 노이즈보다 저음이 풍부하다)
      const bl = ctx.sampleRate * 8;
      this.brown = ctx.createBuffer(1, bl, ctx.sampleRate);
      const bd = this.brown.getChannelData(0); let last = 0;
      for (let i = 0; i < bl; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }

      this.buildWeather();
    }

    // ---------- 날씨 효과음 ----------
    loopNoise(buf) {
      const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s;
    }
    buildWeather() {
      const ctx = this.ctx;
      // 비: 대역 통과 노이즈
      const rain = this.loopNoise(this.noise);
      const rbp = ctx.createBiquadFilter(); rbp.type = 'bandpass'; rbp.frequency.value = 2200; rbp.Q.value = 0.4;
      const rhp = ctx.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 700;
      this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
      rain.connect(rbp); rbp.connect(rhp); rhp.connect(this.rainGain); this.rainGain.connect(this.weatherGain);
      this.applyWeather();
    }
    applyWeather() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, k = this.intensity, w = this.weather;
      const set = (g, v) => g.gain.setTargetAtTime(v, t, 0.6);
      // 비: 빗소리. 천둥: 은은한 빗소리 위로 천둥이 친다(천둥 소리는 app.js가 번쩍임과 맞춰 rumble 호출). 눈은 소리 없음, 바람 소리는 없다.
      set(this.rainGain, w === 'rain' ? 0.1 + k * 0.5 : w === 'thunder' ? 0.06 + k * 0.22 : 0);
    }
    // 천둥: 가까이서 "쾅" 하고 갈라지는 소리 + 몇 초 동안 굴러가는 우르릉.
    // 노트북 스피커에서도 들리도록 중저음(150~1000Hz) 대역을 충분히 넣는다.
    rumble() {
      const ctx = this.ctx, t = ctx.currentTime, k = this.intensity, out = this.weatherGain;
      const near = Math.random() < 0.6;                     // 가까운 천둥은 갈라지는 소리가 있다
      if (near) {
        for (let i = 0; i < 4; i++) {                        // 짧게 여러 번 갈라지는 소리
          const ct = t + i * (0.04 + Math.random() * 0.07);
          const s = ctx.createBufferSource(); s.buffer = this.noise;
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 1600; bp.Q.value = 0.7;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, ct); g.gain.exponentialRampToValueAtTime((0.5 + k * 0.4) * (1 - i * 0.18), ct + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, ct + 0.25 + Math.random() * 0.2);
          s.connect(bp); bp.connect(g); g.connect(out); s.start(ct, Math.random()); s.stop(ct + 0.6);
        }
      }
      // 우르릉: 갈색 노이즈를 저역 통과시키며 점점 낮고 멀어지게, 음량은 여러 번 출렁이게
      const dur = 5 + Math.random() * 3, st = t + (near ? 0.05 : 0);
      const src = ctx.createBufferSource(); src.buffer = this.brown;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
      lp.frequency.setValueAtTime(near ? 1100 : 600, st); lp.frequency.exponentialRampToValueAtTime(140, st + dur);
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 180; body.gain.value = 8; body.Q.value = 0.8;
      const g = ctx.createGain(), peak = (near ? 1.1 : 0.75) * (0.6 + k * 0.6);
      const steps = 24, curve = new Float32Array(steps);
      for (let i = 0; i < steps; i++) {
        const p = i / (steps - 1), env = p < 0.06 ? p / 0.06 : Math.pow(1 - (p - 0.06) / 0.94, 1.6);
        curve[i] = Math.max(0.0001, peak * env * (0.65 + Math.random() * 0.45));   // 굴러가며 출렁이는 느낌
      }
      g.gain.setValueAtTime(0.0001, st); g.gain.setValueCurveAtTime(curve, st + 0.01, dur);
      src.connect(lp); lp.connect(body); body.connect(g); g.connect(out);
      src.start(st, Math.random() * 2); src.stop(st + dur + 0.1);
      this.onThunder();
    }
    setWeather(id, intensity) { this.weather = id; this.intensity = intensity; this.applyWeather(); }
    setWeatherVol(v) { this.weatherVol = v; if (this.ctx) this.weatherGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
    setJazzVol(v) {
      this.jazzVol = v;
      if (this.ctx) this.jazzGain.gain.setTargetAtTime(v * JAZZ_BOOST, this.ctx.currentTime, 0.05);
      if (this.el && !this.el._routed) this.el.volume = v;    // 증폭 경로를 못 쓰는 경우(로컬 파일 등)만 기본 볼륨 사용
    }

    // ---------- 재생 제어 ----------
    async play() {
      this.ensure();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.playing = true;
      if (this.el) this.el.play().catch(() => {});
      else if (!this.timer && this.track) this.startTrack();
    }
    pause() {
      this.playing = false;
      if (this.ctx) this.ctx.suspend();
      if (this.el) this.el.pause();
    }
    async loadTrack(track, autoplay) {
      this.track = track;
      this.stopSynth();
      if (this.el) {   // 이전 곡의 이벤트가 늦게 들어와 새 곡을 방해하지 않도록 끊는다
        this.el.onended = this.el.onerror = null; this.el.pause(); this.el.removeAttribute('src'); this.el = null;
      }
      if (!autoplay) return;
      await this.play();
    }

    // 음원 파일이 지정된 곡은 파일로, 아니면 합성으로 재생
    startTrack() {
      const tr = this.track; if (!tr) return;
      if (tr.src) {
        const el = new Audio(tr.src); el.volume = this.jazzVol; el.preload = 'auto';
        // 웹(http/https)에서는 음원을 오디오 처리 경로로 보내 브라우저 볼륨 상한보다 크게 키운다.
        // 로컬 파일(file://)에서는 보안 정책상 소리가 막힐 수 있어 기본 볼륨으로 재생한다.
        if (/^https?:$/.test(location.protocol)) {
          try { this.ctx.createMediaElementSource(el).connect(this.jazzGain); el._routed = true; el.volume = 1; } catch (e) {}
        }
        // 음원을 불러오지 못하면(파일 없음 등) 합성 재즈로 대체한다
        const fallback = () => { if (this.el !== el) return; this.el = null; if (this.playing) this.startSynth(); };
        el.onended = () => { if (this.el === el) this.onTrackEnd(); };
        el.onerror = fallback;
        this.el = el;
        el.play().catch((e) => { if (e && e.name === 'AbortError') return; fallback(); });
      } else this.startSynth();
    }

    // ---------- 합성 재즈 ----------
    startSynth() {
      this.stopSynth();
      const tr = this.track, st = STYLE[tr.style], ctx = this.ctx;
      this.lp.frequency.value = st.lp;
      this.wet.gain.value = st.delay;
      this.s = { step: 0, bar: 0, next: ctx.currentTime + 0.15, last: 72, beat: 60 / tr.bpm, maxBars: 32 };
      if (st.vinyl) {
        const src = ctx.createBufferSource(); src.buffer = this.crackle; src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
        const g = ctx.createGain(); g.gain.value = 0.25;
        src.connect(f); f.connect(g); g.connect(this.bus); src.start();
        this.vinyl = src;
      }
      this.timer = setInterval(() => this.tick(), 30);
    }
    stopSynth() {
      clearInterval(this.timer); this.timer = null;
      if (this.vinyl) { try { this.vinyl.stop(); } catch (e) {} this.vinyl = null; }
    }
    tick() {
      if (this.ctx.state !== 'running') return;
      const s = this.s, tr = this.track;
      while (s.next < this.ctx.currentTime + 0.25) {
        this.scheduleStep(s.next);
        const st = STYLE[tr.style];
        const off = s.step & 1;
        s.next += s.beat * (off ? 1 - st.swing : st.swing);
        s.step++;
        if (s.step === 8) {
          s.step = 0; s.bar++;
          if (s.bar >= s.maxBars) { this.stopSynth(); this.onTrackEnd(); return; }
        }
      }
    }
    chordAt(bar, offset = 0) {
      const p = PROG[this.track.style];
      const [r, q] = p[(bar + offset) % p.length];
      return { root: (this.track.key + r) % 12, q };
    }
    scheduleStep(t) {
      const tr = this.track, s = this.s, style = tr.style, i = s.step, beatLen = s.beat;
      const ch = this.chordAt(s.bar), next = this.chordAt(s.bar, 1);
      const bassRoot = 36 + ch.root;
      const rnd = Math.random;

      // 베이스
      if (style === 'swing') {
        if (i % 2 === 0) {
          const b = i / 2, n5 = bassRoot + 7, nxt = 36 + next.root;
          const note = b === 0 ? bassRoot : b === 1 ? bassRoot + (QUAL[ch.q][0]) : b === 2 ? n5 : (nxt + (rnd() < 0.5 ? 1 : -1));
          this.bass(note < 33 ? note + 12 : note, t, beatLen * 0.9, 0.5);
        }
      } else if (style === 'bossa') {
        if (i === 0 || i === 4) this.bass(bassRoot, t, beatLen * 0.9, 0.5);
        if (i === 3 || i === 7) this.bass(bassRoot + 7, t, beatLen * 0.7, 0.42);
      } else {
        if (i === 0) this.bass(bassRoot, t, beatLen * 2.4, 0.55);
        if (i === 5) this.bass(bassRoot + 7, t, beatLen * 1.2, 0.4);
      }

      // 코드 컴핑
      const comp = style === 'swing' ? (i === 0 || i === 3 || (i === 6 && rnd() < 0.4))
        : style === 'bossa' ? (i === 0 || i === 3 || i === 6)
        : (i === 0 || (i === 5 && rnd() < 0.7));
      if (comp && (i === 0 || rnd() > 0.15)) this.comp(ch, t, style === 'lofi' ? beatLen * 2.2 : beatLen * 0.9, style === 'lofi' ? 0.11 : 0.09);

      // 드럼 (브러시/하이햇)
      if (style === 'swing') {
        if (i % 2 === 0) this.hat(t, 0.05, 6500);
        if (i === 3 || i === 7) this.hat(t, 0.04, 6500);
        if (i === 2 || i === 6) this.hat(t, 0.1, 3200, 0.08);
        if (i === 0 && rnd() < 0.4) this.kick(t, 0.18);
      } else if (style === 'bossa') {
        this.hat(t, i % 2 ? 0.035 : 0.05, 7000);
        if (i === 0 || i === 3 || i === 4 || i === 7) this.kick(t, 0.2);
        if (i === 0 || i === 3 || i === 6) this.hat(t, 0.1, 2400, 0.04);
      } else {
        if (i === 0 || (i === 5 && rnd() < 0.6)) this.kick(t, 0.32);
        if (i === 4) this.snare(t, 0.14);
        this.hat(t, i % 2 ? 0.02 : 0.035, 7500);
      }

      // 멜로디 (코드톤 + 스케일 톤을 계단식으로)
      if (rnd() < STYLE[style].melody * (i % 2 ? 0.7 : 1)) {
        const tones = SCALE_TONES[ch.q];
        let n = s.last + [-4, -2, -1, 1, 2, 4][Math.floor(rnd() * 6)];
        n = Math.max(64, Math.min(86, n));
        const pc = ((n - ch.root) % 12 + 12) % 12;
        // 스케일 밖의 음이면 가까운 스케일 음으로 이동
        let best = pc, bd = 99;
        tones.forEach((x) => { const d = Math.abs(x - pc); if (d < bd) { bd = d; best = x; } });
        n += best - pc;
        s.last = n;
        this.lead(n, t, beatLen * (rnd() < 0.4 ? 1.6 : 0.8), style === 'lofi' ? 0.07 : 0.08);
      }
    }

    // ---------- 악기 ----------
    env(g, t, a, d, peak, endV = 0.0001) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(endV, t + a + d);
    }
    osc(type, f, t, dur, peak, a = 0.01, dest = this.bus, detune = 0) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = detune;
      this.env(g, t, a, dur, peak);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + a + dur + 0.05);
    }
    bass(midi, t, dur, vel) {
      const f = mtof(midi);
      this.osc('sine', f, t, dur, vel, 0.015);
      this.osc('triangle', f, t, dur * 0.6, vel * 0.35, 0.015);
    }
    comp(ch, t, dur, vel) {
      QUAL[ch.q].forEach((iv, k) => {
        let m = 48 + ch.root + iv;
        while (m > 74) m -= 12; while (m < 55) m += 12;
        const f = mtof(m), dt = k * 0.006;           // 살짝 어긋나게 눌러 사람 느낌을 낸다
        this.osc('sine', f, t + dt, dur * 1.4, vel / 2, 0.008, this.bus, (Math.random() - 0.5) * 8);
        this.osc('sine', f * 2, t + dt, dur * 0.5, vel / 6, 0.004);
        this.osc('triangle', f, t + dt, dur * 0.8, vel / 5, 0.01);
      });
    }
    lead(midi, t, dur, vel) {
      const f = mtof(midi);
      this.osc('sine', f, t, dur * 1.5, vel, 0.02);
      this.osc('triangle', f * 2, t, dur * 0.5, vel * 0.18, 0.02);
    }
    noiseHit(t, dur, hp, peak, type = 'highpass', q = 0.7) {
      const src = this.ctx.createBufferSource(); src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = hp; f.Q.value = q;
      const g = this.ctx.createGain();
      this.env(g, t, 0.002, dur, peak);
      src.connect(f); f.connect(g); g.connect(this.bus);
      src.start(t, Math.random()); src.stop(t + dur + 0.05);
    }
    hat(t, vel, freq, dur = 0.05) { this.noiseHit(t, dur, freq, vel * 0.7); }
    snare(t, vel) { this.noiseHit(t, 0.14, 1800, vel, 'bandpass', 0.8); }
    kick(t, vel) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      this.env(g, t, 0.003, 0.22, vel);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.3);
    }

    chime() {
      this.ensure();
      const t = this.ctx.currentTime;
      [659.25, 783.99, 987.77].forEach((f, k) => this.osc('sine', f, t + k * 0.22, 1.4, 0.12, 0.01, this.master));
    }
  }

  window.AudioEngine = AudioEngine;
})();
