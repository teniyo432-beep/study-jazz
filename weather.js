// 날씨 화면 효과(비·눈·천둥). 항상 "창문 영역(getWin)" 안에서만 그리고, 창밖 풍경 위에 얹는다.
// - 비: 가는 빗줄기  - 눈: 흰 눈송이  - 천둥: 입자 없이 하늘이 번쩍이는 효과(비와 모션이 겹치지 않는다)
(function () {
  class WeatherFX {
    constructor(canvas, getWin, onRumble, reduce) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.getWin = getWin; this.onRumble = onRumble; this.reduce = reduce;
      this.kind = 'clear'; this.k = 0.6;
      this.parts = []; this.flash = 0; this.winKey = ''; this.timer = null;
      this.last = performance.now();
      addEventListener('resize', () => this.size()); this.size();
      requestAnimationFrame((t) => this.frame(t));
    }

    size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = innerWidth * dpr; this.canvas.height = innerHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    set(kind, k) {
      this.k = k;
      if (kind === this.kind) return;
      this.kind = kind; this.parts = []; this.flash = 0;
      clearTimeout(this.timer);
      if (kind === 'thunder') this.schedule(true);
    }

    // 천둥: 빛이 먼저 번쩍이고 잠시 뒤 우르릉 소리가 난다. 소리가 꺼져 있어도 번쩍임은 보인다.
    schedule(first) {
      clearTimeout(this.timer);
      if (this.kind !== 'thunder') return;
      const gap = first ? 1200 : 6000 + (1 - this.k) * 8000 + Math.random() * 6000;
      this.timer = setTimeout(() => { this.strike(); this.schedule(false); }, gap);
    }
    strike() {
      this.flash = 1;
      setTimeout(() => { this.flash = 0.9; }, 140);
      if (Math.random() < 0.5) setTimeout(() => { this.flash = 0.6; }, 330);
      setTimeout(() => this.onRumble(), 700 + Math.random() * 1500);
    }

    targetCount(R) {
      const k = this.k * (this.reduce ? 0.4 : 1);
      const base = { rain: 60 + k * 340, snow: 40 + k * 220 }[this.kind] || 0;
      const area = (R.w * R.h) / (innerWidth * innerHeight);   // 창문이 작으면 입자도 적게
      return base ? Math.max(14, (base * Math.min(1, area * 1.4)) | 0) : 0;
    }
    spawn(R, first) {
      return { x: R.x + Math.random() * (R.w + R.h * 0.15), y: first ? R.y + Math.random() * R.h : R.y - 12, r: Math.random() };
    }

    frame(now) {
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      const c = this.ctx;
      c.clearRect(0, 0, innerWidth, innerHeight);
      const R = this.getWin();
      if (R) {
        const key = [R.x, R.y, R.w, R.h].map(Math.round).join();
        if (key !== this.winKey) { this.winKey = key; this.parts = []; }
        c.save();
        c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();    // 창밖에서만 보이도록 잘라낸다
        const n = this.targetCount(R);
        while (this.parts.length < n) this.parts.push(this.spawn(R, true));
        if (this.parts.length > n) this.parts.length = n;
        if (this.kind === 'rain') {
          c.strokeStyle = 'rgba(200,215,255,0.4)'; c.lineWidth = 1; c.beginPath();
          for (const p of this.parts) {
            const sp = 700 + p.r * 500, len = 9 + p.r * 14;
            p.y += sp * dt; p.x -= sp * 0.12 * dt;
            if (p.y > R.y + R.h || p.x < R.x - 20) Object.assign(p, this.spawn(R, false));
            c.moveTo(p.x, p.y); c.lineTo(p.x + len * 0.12, p.y - len);
          }
          c.stroke();
        } else if (this.kind === 'snow') {
          c.fillStyle = 'rgba(255,255,255,0.85)';
          for (const p of this.parts) {
            p.y += (28 + p.r * 46) * dt; p.x += Math.sin(now / 1200 + p.r * 20) * 12 * dt;
            if (p.y > R.y + R.h + 4) Object.assign(p, this.spawn(R, false));
            c.beginPath(); c.arc(p.x, p.y, 1 + p.r * 2.2, 0, 7); c.fill();
          }
        }
        if (this.flash > 0) {
          // 번개: 하늘(창 위쪽)이 가장 밝고 아래로 갈수록 옅어지는 번쩍임
          this.flash = Math.max(0, this.flash - dt * 3);
          const g = c.createLinearGradient(0, R.y, 0, R.y + R.h);
          g.addColorStop(0, `rgba(238,244,255,${this.flash * 0.9})`);
          g.addColorStop(0.55, `rgba(210,224,255,${this.flash * 0.45})`);
          g.addColorStop(1, `rgba(190,205,245,${this.flash * 0.2})`);
          c.fillStyle = g; c.fillRect(R.x, R.y, R.w, R.h);
        }
        c.restore();
      } else { this.parts = []; this.flash = 0; }
      requestAnimationFrame((t) => this.frame(t));
    }
  }

  window.WeatherFX = WeatherFX;
})();
