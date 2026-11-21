/* ==========================================================================
   FLUID INTERACTIVE ASCII BACKGROUND ENGINE
   Full-hero ambient Swiss ASCII topographic wave field on #ffffff
   - Flows softly in slow organic waves across the Hero canvas
   - Smoothly warps, ripples & subtly distorts as the cursor moves across Hero
   - Elastic spring recovery + gentle click ripple waves
   - Automatically pauses when Hero scrolls out of view
   ========================================================================== */

(function () {
  'use strict';

  // Delicate Swiss editorial ASCII glyph scale (whisper light -> crisp technical mark)
  const GLYPHS = ' ·.:-=+*x/#';

  class FluidAsciiBackground {
    constructor(canvas, container) {
      this.canvas = canvas;
      this.container = container;
      this.ctx = canvas.getContext('2d', { alpha: true });

      this.nodes = [];
      this.ripples = [];
      this.cols = 0;
      this.rows = 0;
      this.stepX = 24;
      this.stepY = 24;
      this.width = 0;
      this.height = 0;

      // Smoothed cursor state for fluid, organic distortion
      this.pointer = {
        targetX: -9999,
        targetY: -9999,
        x: -9999,
        y: -9999,
        vx: 0,
        vy: 0,
        speed: 0,
        inside: false
      };

      this.time = 0;
      this.lastTs = 0;
      this.isVisible = true;
      this.rafId = null;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.init();
    }

    init() {
      this.bindEvents();
      this.resize();
      this.start();
    }

    bindEvents() {
      // Listen on window so movement over giant "PORTFOLIO" & photo still warps the ASCII field seamlessly
      window.addEventListener(
        'pointermove',
        (e) => {
          if (!this.isVisible) return;
          const rect = this.container.getBoundingClientRect();
          const inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;

          this.pointer.inside = inside;
          if (inside) {
            const nx = e.clientX - rect.left;
            const ny = e.clientY - rect.top;
            if (this.pointer.x < -900) {
              this.pointer.x = nx;
              this.pointer.y = ny;
            }
            this.pointer.targetX = nx;
            this.pointer.targetY = ny;
          }
        },
        { passive: true }
      );

      this.container.addEventListener('pointerdown', (e) => {
        if (this.reducedMotion) return;
        const rect = this.container.getBoundingClientRect();
        this.ripples.push({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          radius: 0,
          maxRadius: Math.min(this.width, this.height) * 0.52,
          strength: 1
        });
        if (this.ripples.length > 4) this.ripples.shift();
      });

      document.addEventListener('pointerleave', () => {
        this.pointer.inside = false;
      });

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.resize(), 120);
      });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            this.isVisible = entries[0].isIntersecting;
          },
          { threshold: 0.01 }
        );
        io.observe(this.container);
      }
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clean breathable editorial spacing
      this.stepX = this.width < 640 ? 22 : 26;
      this.stepY = this.width < 640 ? 22 : 26;
      this.cols = Math.ceil(this.width / this.stepX) + 1;
      this.rows = Math.ceil(this.height / this.stepY) + 1;

      this.buildField();
    }

    buildField() {
      this.nodes = [];
      const offsetX = (this.width - (this.cols - 1) * this.stepX) * 0.5;
      const offsetY = (this.height - (this.rows - 1) * this.stepY) * 0.5;

      for (let r = 0; r < this.rows; r++) {
        const by = offsetY + r * this.stepY;
        const v = by / this.height;
        for (let c = 0; c < this.cols; c++) {
          const bx = offsetX + c * this.stepX;
          const u = bx / this.width;
          this.nodes.push({
            bx,
            by,
            u,
            v,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            energy: 0
          });
        }
      }
    }

    // Layered smooth topographic wave function (no sharp noise seams)
    waveValue(u, v, t) {
      const w1 = Math.sin(u * 4.6 + t * 0.55) * Math.cos(v * 3.8 - t * 0.42);
      const w2 = Math.sin((u * 7.2 - v * 5.4) + t * 0.72) * 0.52;
      const w3 = Math.cos((u * 2.8 + v * 6.5) - t * 0.36) * 0.38;
      return (w1 + w2 + w3) * 0.52 + 0.5; // roughly 0..1
    }

    render(ts) {
      const dt = this.lastTs ? Math.min(0.05, (ts - this.lastTs) / 1000) : 0.016;
      this.lastTs = ts;

      if (!this.isVisible || !this.nodes.length) {
        this.rafId = requestAnimationFrame((next) => this.render(next));
        return;
      }

      if (!this.reducedMotion) {
        this.time += dt;
      }

      // Smoothly interpolate pointer for silky fluid distortion
      if (this.pointer.inside) {
        const dx = this.pointer.targetX - this.pointer.x;
        const dy = this.pointer.targetY - this.pointer.y;
        this.pointer.vx = dx * 0.22;
        this.pointer.vy = dy * 0.22;
        this.pointer.x += this.pointer.vx;
        this.pointer.y += this.pointer.vy;
        this.pointer.speed = Math.min(28, Math.hypot(this.pointer.vx, this.pointer.vy));
      } else {
        this.pointer.vx *= 0.88;
        this.pointer.vy *= 0.88;
        this.pointer.speed *= 0.88;
      }

      // Update click ripples
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i];
        rp.radius += 260 * dt;
        rp.strength = Math.max(0, 1 - rp.radius / rp.maxRadius);
        if (rp.strength <= 0.01) this.ripples.splice(i, 1);
      }

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const t = this.time;
      const glyphMax = GLYPHS.length - 1;
      const influenceR = Math.max(150, Math.min(260, this.width * 0.19));
      const influenceR2 = influenceR * influenceR;
      const px = this.pointer.x;
      const py = this.pointer.y;
      const pActive = this.pointer.inside || this.pointer.speed > 0.35;
      const motionBoost = 0.65 + this.pointer.speed * 0.09;

      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];

        // 1. Subtle organic ambient drift
        const w = this.waveValue(n.u, n.v, t);
        const ambientX = this.reducedMotion ? 0 : Math.sin(t * 0.6 + n.v * 5.0) * 2.2;
        const ambientY = this.reducedMotion ? 0 : Math.cos(t * 0.55 + n.u * 5.0) * 2.2;

        // 2. Fluid mouse distortion field (gentle repulsion + velocity drag + subtle swirl)
        if (pActive && !this.reducedMotion) {
          const dx = n.bx + n.ox - px;
          const dy = n.by + n.oy - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < influenceR2 && d2 > 0.1) {
            const dist = Math.sqrt(d2);
            const falloff = 1 - dist / influenceR;
            const smooth = falloff * falloff;
            const nx = dx / dist;
            const ny = dy / dist;

            // Gentle fluid displacement & wake
            const push = smooth * 2.4 * motionBoost;
            n.vx += nx * push - ny * push * 0.28 + this.pointer.vx * smooth * 0.14;
            n.vy += ny * push + nx * push * 0.28 + this.pointer.vy * smooth * 0.14;
            n.energy = Math.min(1, n.energy + smooth * 0.28);
          }
        }

        // 3. Click ripple wave
        for (let rIdx = 0; rIdx < this.ripples.length; rIdx++) {
          const rp = this.ripples[rIdx];
          const rdx = n.bx - rp.x;
          const rdy = n.by - rp.y;
          const rDist = Math.hypot(rdx, rdy);
          const band = Math.abs(rDist - rp.radius);
          if (band < 48 && rDist > 1) {
            const waveF = (1 - band / 48) * rp.strength;
            n.vx += (rdx / rDist) * waveF * 2.2;
            n.vy += (rdy / rDist) * waveF * 2.2;
            n.energy = Math.min(1, n.energy + waveF * 0.35);
          }
        }

        // 4. Silky elastic spring return
        n.vx = (n.vx - n.ox * 0.055) * 0.84;
        n.vy = (n.vy - n.oy * 0.055) * 0.84;
        n.ox += n.vx;
        n.oy += n.vy;
        n.energy *= 0.92;

        // Soft edge vignette so ASCII blends gently near top/bottom borders
        const edgeFadeY = Math.min(1, n.v * 6.5, (1 - n.v) * 6.5);
        const edgeFadeX = Math.min(1, n.u * 10, (1 - n.u) * 10);
        const vignette = Math.max(0, Math.min(1, edgeFadeX * edgeFadeY));

        // Combine ambient wave & cursor distortion energy into glyph selection
        const intensity = Math.max(0, Math.min(1, (w - 0.18) * 0.85 + n.energy * 0.72));
        if (intensity < 0.14) continue;

        const gIdx = Math.min(glyphMax, Math.max(1, Math.floor(intensity * glyphMax)));
        const ch = GLYPHS[gIdx];

        // Subtle editorial gray so giant "PORTFOLIO" & photo stay dominant and ultra-crisp
        const alpha = (0.045 + intensity * 0.14 + n.energy * 0.18) * vignette;
        if (alpha < 0.015) continue;

        ctx.fillStyle = `rgba(22, 22, 22, ${alpha.toFixed(3)})`;
        ctx.fillText(ch, n.bx + ambientX + n.ox, n.by + ambientY + n.oy);
      }

      this.rafId = requestAnimationFrame((next) => this.render(next));
    }

    start() {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame((ts) => this.render(ts));
      }
    }
  }

  window.FluidAsciiBackground = FluidAsciiBackground;
})();
