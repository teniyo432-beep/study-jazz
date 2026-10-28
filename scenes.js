// 장면 렌더러: assets/scenes 의 실사 사진(또는 영상)을 배경으로 보여준다.
// 날씨 효과는 장면 전체가 아니라 "창문 영역(scene.win)" 안에만 그려지므로,
// 화면 비율(object-fit: cover)로 잘린 상태의 창문 위치를 getWin()으로 계산해 준다.
(function () {
  class SceneRenderer {
    constructor(video, image) {
      this.video = video; this.image = image; this.scene = null;
    }

    setScene(scene) {
      this.scene = scene;
      const v = this.video, im = this.image;
      [v, im].forEach((el) => { el.classList.remove('on', 'drift'); el.removeAttribute('src'); });
      const pos = scene.pos || '50% 50%';
      v.style.objectPosition = im.style.objectPosition = pos;

      // 우선순위: 영상 → 이미지. 영상이 없거나 실패하면 이미지로 넘어간다.
      const showImage = () => {
        if (!scene.image) return;
        im.onload = () => {
          if (this.scene !== scene) return;
          im.classList.add('on');
          if (!scene.win) im.classList.add('drift'); // 창문 위치가 어긋나지 않도록 창문 있는 장면은 고정
        };
        im.onerror = () => im.classList.remove('on');
        im.src = scene.image;
      };
      if (scene.video) {
        v.onerror = () => { v.classList.remove('on'); v.removeAttribute('src'); showImage(); };
        v.oncanplay = () => { if (this.scene === scene) v.classList.add('on'); };
        v.src = scene.video; v.play().catch(() => {});
      } else showImage();
    }

    // 창문 영역을 화면 좌표(px)로 반환. 창문이 없는 장면이면 null → 날씨 화면 효과를 그리지 않는다.
    getWin() {
      const s = this.scene; if (!s || !s.win) return null;
      const useVideo = this.video.classList.contains('on');
      const el = useVideo ? this.video : this.image.classList.contains('on') ? this.image : null;
      if (!el) return null;
      const iw = useVideo ? this.video.videoWidth : this.image.naturalWidth;
      const ih = useVideo ? this.video.videoHeight : this.image.naturalHeight;
      if (!iw || !ih) return null;
      const vw = innerWidth, vh = innerHeight, k = Math.max(vw / iw, vh / ih);
      const [px, py] = (s.pos || '50% 50%').split(' ').map((n) => parseFloat(n) / 100);
      const ox = (vw - iw * k) * px, oy = (vh - ih * k) * py;
      return { x: ox + s.win.x * iw * k, y: oy + s.win.y * ih * k, w: s.win.w * iw * k, h: s.win.h * ih * k };
    }
  }

  window.SceneRenderer = SceneRenderer;
})();
