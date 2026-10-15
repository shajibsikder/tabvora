/* ==========================================================================
   Tabvora Dynamic Background Engine (4-Way 360° Panorama & Live Canvas)
   Hardware-Accelerated, Battery-Optimized, Offline MV3 Architecture
   ========================================================================== */

export class DynamicBackgroundEngine {
  constructor() {
    this.container = document.getElementById('tabvoraBgContainer');
    this.mediaEl = document.getElementById('tabvoraBgMedia');
    this.canvas = document.getElementById('tabvoraLiveCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.activeWp = null;
    this.is360Active = false;
    this.animFrameId = null;
    this.parallaxFrameId = null;
    this.currentEffect = null;
    this.mouseNormX = 0;
    this.mouseNormY = 0;
    this.currOffsetX = 0;
    this.currOffsetY = 0;
    this.startTime = Date.now();

    // 4-Way 360° Infinite Horizontal & Pitch Vertical Navigation System
    this.panX = 0;
    this.panY = 0;
    this.minPanY = -150;
    this.maxPanY = 150;
    this.panVelocityX = 0;
    this.panVelocityY = 0;
    this.isDragging = false;
    this.lastDragX = 0;
    this.lastDragY = 0;
    this.isUserInteracting = false;
    this.idleTimer = null;
    this.autoDriftSpeed = 0.40;

    // Effect particle collections
    this.particles = [];
    this.initListeners();
  }

  initListeners() {
    // 1. Mouse Dragging to Pan in ALL 4 Directions (Up, Down, Left, Right)
    window.addEventListener('mousedown', (e) => {
      if (!this.is360Active) return;
      // Do not initiate drag if user clicked an interactive button, input, or open modal
      if (e.target.closest('button, input, textarea, a, select, .widget-card, .dock-flyout-drawer, dialog, .modal-dialog, .reward-wp-card, .reward-unlock-card, .preview-hud-btn')) return;
      this.isDragging = true;
      this.isUserInteracting = true;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;
      this.panVelocityX = 0;
      this.panVelocityY = 0;
      document.body.classList.add('is-panning-360');
      clearTimeout(this.idleTimer);
    });

    window.addEventListener('mousemove', (e) => {
      // Always track normalized mouse for 3D gyroscopic tilt in all directions
      this.mouseNormX = (e.clientX / window.innerWidth) - 0.5;
      this.mouseNormY = (e.clientY / window.innerHeight) - 0.5;

      if (!this.is360Active) return;

      if (this.isDragging) {
        const deltaX = e.clientX - this.lastDragX;
        const deltaY = e.clientY - this.lastDragY;
        
        // Horizontal: Infinite 360° pan
        this.panX += deltaX * 1.5;
        this.panVelocityX = deltaX * 1.5;

        // Vertical: Pitch up & down (clamped smoothly within headroom)
        this.panY = Math.max(this.minPanY, Math.min(this.maxPanY, this.panY + deltaY * 1.3));
        this.panVelocityY = deltaY * 1.3;

        this.lastDragX = e.clientX;
        this.lastDragY = e.clientY;
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.classList.remove('is-panning-360');
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
          this.isUserInteracting = false;
        }, 3500);
      }
    });

    // Touch Support for mobile / touch devices in all 4 directions
    window.addEventListener('touchstart', (e) => {
      if (!this.is360Active || e.touches.length !== 1) return;
      if (e.target.closest('button, input, textarea, a, select, .widget-card, .dock-flyout-drawer, dialog, .modal-dialog')) return;
      this.isDragging = true;
      this.isUserInteracting = true;
      this.lastDragX = e.touches[0].clientX;
      this.lastDragY = e.touches[0].clientY;
      this.panVelocityX = 0;
      this.panVelocityY = 0;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.is360Active || !this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.lastDragX;
      const deltaY = e.touches[0].clientY - this.lastDragY;

      this.panX += deltaX * 1.5;
      this.panVelocityX = deltaX * 1.5;
      this.panY = Math.max(this.minPanY, Math.min(this.maxPanY, this.panY + deltaY * 1.3));
      this.panVelocityY = deltaY * 1.3;

      this.lastDragX = e.touches[0].clientX;
      this.lastDragY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
          this.isUserInteracting = false;
        }, 3500);
      }
    });

    // Keyboard Arrow Keys for 4-way directional panning (←, →, ↑, ↓)
    window.addEventListener('keydown', (e) => {
      if (!this.is360Active) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        this.stepPan(70, 0);
      } else if (e.key === 'ArrowRight') {
        this.stepPan(-70, 0);
      } else if (e.key === 'ArrowUp') {
        this.stepPan(0, 45);
      } else if (e.key === 'ArrowDown') {
        this.stepPan(0, -45);
      }
    });

    // Window resize handler for razor-sharp canvas
    window.addEventListener('resize', () => {
      if (this.currentEffect) {
        this.resizeCanvas();
      }
    });

    // Smart Battery & CPU Saver
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopLiveAnimation();
        if (this.parallaxFrameId) {
          cancelAnimationFrame(this.parallaxFrameId);
          this.parallaxFrameId = null;
        }
      } else {
        if (this.currentEffect) {
          this.startLiveAnimation(this.currentEffect);
        }
        if (this.is360Active) {
          this.start360Loop();
        }
      }
    });
  }

  stepPan(deltaX = 0, deltaY = 0) {
    this.panX += deltaX;
    this.panY = Math.max(this.minPanY, Math.min(this.maxPanY, this.panY + deltaY));
    this.panVelocityX = deltaX * 0.28;
    this.panVelocityY = deltaY * 0.28;
    this.isUserInteracting = true;
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.isUserInteracting = false;
    }, 4000);
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }
  }

  render(wp) {
    if (!wp) return;
    if (!this.mediaEl) this.mediaEl = document.getElementById('tabvoraBgMedia');
    if (!this.canvas) {
      this.canvas = document.getElementById('tabvoraLiveCanvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    this.activeWp = wp;

    // Body styling: Never paint a background-image directly on body to avoid obscuring the dynamic layer
    document.body.style.backgroundColor = '#080d1a';
    document.body.style.backgroundImage = 'none';

    if (this.mediaEl) {
      if (wp.file) {
        this.mediaEl.style.backgroundImage = `url("${wp.file}")`;
      } else if (wp.gradient) {
        this.mediaEl.style.backgroundImage = wp.gradient;
      }
    }

    // 1. Handle 360° 4-Way Interactive Parallax
    if (wp.type === '360') {
      this.is360Active = true;
      document.body.classList.add('is-360-mode');
      if (this.mediaEl) this.mediaEl.classList.add('is-360-active');
      this.start360Loop();
    } else {
      this.is360Active = false;
      document.body.classList.remove('is-360-mode');
      if (this.mediaEl) {
        this.mediaEl.classList.remove('is-360-active');
        this.mediaEl.style.transform = 'translate3d(0, 0, 0) scale(1.04)';
        this.mediaEl.style.backgroundPosition = 'center center';
      }
      if (this.parallaxFrameId) {
        cancelAnimationFrame(this.parallaxFrameId);
        this.parallaxFrameId = null;
      }
    }

    // 2. Handle Live Motion Canvas
    if (wp.type === 'live' && wp.liveEffect) {
      if (this.canvas) this.canvas.classList.remove('hidden');
      this.startLiveAnimation(wp.liveEffect);
    } else {
      if (this.canvas) this.canvas.classList.add('hidden');
      this.stopLiveAnimation();
    }
  }

  clear() {
    this.is360Active = false;
    document.body.classList.remove('is-360-mode');
    if (this.parallaxFrameId) {
      cancelAnimationFrame(this.parallaxFrameId);
      this.parallaxFrameId = null;
    }
    if (this.mediaEl) {
      this.mediaEl.classList.remove('is-360-active');
      this.mediaEl.style.transform = 'none';
      this.mediaEl.style.backgroundPosition = 'center center';
      this.mediaEl.style.backgroundImage = 'none';
    }
    if (this.canvas) {
      this.canvas.classList.add('hidden');
    }
    this.stopLiveAnimation();
  }

  start360Loop() {
    if (this.parallaxFrameId) {
      cancelAnimationFrame(this.parallaxFrameId);
    }

    const update360 = () => {
      if (!this.is360Active || !this.mediaEl || document.hidden) return;

      // 1. Momentum Glide / Auto Drift in 4 directions
      if (!this.isDragging) {
        // Horizontal inertia
        if (Math.abs(this.panVelocityX) > 0.1) {
          this.panX += this.panVelocityX;
          this.panVelocityX *= 0.92;
        } else if (!this.isUserInteracting) {
          // Continuous slow cinematic auto-pan
          this.panX -= this.autoDriftSpeed;
        }

        // Vertical inertia
        if (Math.abs(this.panVelocityY) > 0.1) {
          this.panY = Math.max(this.minPanY, Math.min(this.maxPanY, this.panY + this.panVelocityY));
          this.panVelocityY *= 0.90;
        }
      }

      // 2. Gyroscopic 3D Parallax Tilt with Mouse in all directions
      const targetTiltX = this.mouseNormX * -28;
      const targetTiltY = this.mouseNormY * -20;
      this.currOffsetX += (targetTiltX - this.currOffsetX) * 0.08;
      this.currOffsetY += (targetTiltY - this.currOffsetY) * 0.08;

      // 3. Apply 4-Way 360 Panorama Position and 3D Tilt
      this.mediaEl.style.backgroundPosition = `${this.panX.toFixed(1)}px calc(50% + ${this.panY.toFixed(1)}px)`;
      this.mediaEl.style.transform = `translate3d(${this.currOffsetX.toFixed(1)}px, ${this.currOffsetY.toFixed(1)}px, 0) scale(1.08)`;

      if (this.is360Active) {
        this.parallaxFrameId = requestAnimationFrame(update360);
      }
    };
    this.parallaxFrameId = requestAnimationFrame(update360);
  }

  startLiveAnimation(effect) {
    this.stopLiveAnimation();
    this.currentEffect = effect;
    this.resizeCanvas();
    this.initParticles(effect);

    const loop = () => {
      if (!this.currentEffect || document.hidden) return;
      this.renderLiveFrame(this.currentEffect);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopLiveAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentEffect = null;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  initParticles(effect) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.particles = [];

    if (effect === 'stars') {
      for (let i = 0; i < 110; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.4 + 0.6,
          alpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.25 + 0.05,
          color: Math.random() > 0.35 ? '#ffffff' : (Math.random() > 0.5 ? '#67e8f9' : '#f472b6'),
          pulseSpeed: Math.random() * 0.02 + 0.01
        });
      }
    } else if (effect === 'rain') {
      for (let i = 0; i < 95; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: Math.random() * 26 + 15,
          speed: Math.random() * 9 + 7,
          color: Math.random() > 0.5 ? '#06b6d4' : (Math.random() > 0.3 ? '#ec4899' : '#38bdf8'),
          opacity: Math.random() * 0.65 + 0.25
        });
      }
    } else if (effect === 'fireflies') {
      // Zen Bioluminescent Fireflies for developer deep focus & eye rest
      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.6 + 1.2,
          baseAlpha: Math.random() * 0.4 + 0.55,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.025 + 0.012,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -Math.random() * 0.32 - 0.12,
          isGold: Math.random() > 0.45
        });
      }
    } else if (effect === 'ocean') {
      // Bioluminescent deep sea micro-plankton
      for (let i = 0; i < 45; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: h * 0.62 + Math.random() * (h * 0.38),
          size: Math.random() * 2.0 + 0.8,
          alpha: Math.random() * 0.65 + 0.25,
          speed: Math.random() * 0.35 + 0.1,
          pulse: Math.random() * 0.03 + 0.01
        });
      }
    } else if (effect === 'zenrain') {
      // Soft midnight focus drizzle on glass
      for (let i = 0; i < 75; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: Math.random() * 18 + 10,
          speed: Math.random() * 5.2 + 3.4,
          opacity: Math.random() * 0.32 + 0.14
        });
      }
    }
  }

  renderLiveFrame(effect) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (effect === 'aurora') {
      // Shimmering Northern Lights Multi-Layer Sine Ribbon Wave
      ctx.clearRect(0, 0, w, h);
      const time = (Date.now() - this.startTime) * 0.0015;

      const waves = [
        { y: h * 0.32, amp: 65, freq: 0.0022, speed: 0.85, color1: 'rgba(16, 185, 129, 0.75)', color2: 'rgba(6, 182, 212, 0.35)' },
        { y: h * 0.40, amp: 85, freq: 0.0017, speed: 1.15, color1: 'rgba(52, 211, 153, 0.85)', color2: 'rgba(139, 92, 246, 0.40)' },
        { y: h * 0.48, amp: 55, freq: 0.0025, speed: 0.65, color1: 'rgba(6, 182, 212, 0.70)', color2: 'rgba(16, 185, 129, 0.25)' }
      ];

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) {
          const y = wave.y + Math.sin(x * wave.freq + time * wave.speed) * wave.amp + Math.cos(x * 0.0012 + time * 0.6) * 22;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, wave.y - 140, 0, h);
        grad.addColorStop(0, wave.color1);
        grad.addColorStop(0.5, wave.color2);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Shimmering vertical light rays / aurora curtain flares
      for (let i = 0; i < 7; i++) {
        const rx = ((time * 35 + i * (w / 7)) % (w + 120)) - 60;
        const rGrad = ctx.createLinearGradient(rx, h * 0.15, rx, h * 0.65);
        rGrad.addColorStop(0, 'rgba(110, 231, 183, 0)');
        rGrad.addColorStop(0.4, 'rgba(52, 211, 153, 0.35)');
        rGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(rx - 25, h * 0.15, 50, h * 0.5);
      }

    } else if (effect === 'stars') {
      // Cosmic Nebula Glow & Stardust Twinkles
      ctx.clearRect(0, 0, w, h);
      const time = (Date.now() - this.startTime) * 0.001;

      // Soft pulsating nebula cloud
      const nebX = w * 0.45 + Math.sin(time * 0.4) * 35;
      const nebY = h * 0.4 + Math.cos(time * 0.3) * 30;
      const nebGrad = ctx.createRadialGradient(nebX, nebY, 20, nebX, nebY, 380);
      nebGrad.addColorStop(0, 'rgba(168, 85, 247, 0.30)');
      nebGrad.addColorStop(0.4, 'rgba(59, 130, 246, 0.20)');
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, w, h);

      // Star Particles
      this.particles.forEach(p => {
        p.alpha += Math.sin(time * p.pulseSpeed * 20) * 0.02;
        p.x -= p.speed;
        if (p.x < 0) p.x = w;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.2, Math.min(0.98, p.alpha));
        ctx.fill();

        // Star cross shimmer on larger stars
        if (p.size > 2.0 && p.alpha > 0.65) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x - 4, p.y);
          ctx.lineTo(p.x + 4, p.y);
          ctx.moveTo(p.x, p.y - 4);
          ctx.lineTo(p.x, p.y + 4);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1.0;

      // Periodic Shooting Star
      const shootCycle = (time * 0.25) % 4;
      if (shootCycle < 0.6) {
        const progress = shootCycle / 0.6;
        const sx = w * 0.85 - progress * w * 0.65;
        const sy = h * 0.12 + progress * h * 0.38;
        const shootGrad = ctx.createLinearGradient(sx, sy, sx + 60, sy - 35);
        shootGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        shootGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 65, sy - 38);
        ctx.strokeStyle = shootGrad;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

    } else if (effect === 'rain') {
      // Cyberpunk Neon Rain Streams
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.y += p.speed;
        if (p.y > h) {
          p.y = -p.len;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.len);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

    } else if (effect === 'fireflies') {
      // Zen Bioluminescent Firefly Forest (Deep Mind Focus & Eye Relaxation)
      ctx.clearRect(0, 0, w, h);
      const time = (Date.now() - this.startTime) * 0.001;

      // Soft ambient twilight forest bottom mist
      const mistGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
      mistGrad.addColorStop(0, 'rgba(6, 78, 59, 0)');
      mistGrad.addColorStop(1, 'rgba(4, 47, 46, 0.24)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      this.particles.forEach(p => {
        // Organic gentle floating motion
        p.x += p.vx + Math.sin(time * 0.85 + p.phase) * 0.42;
        p.y += p.vy + Math.cos(time * 0.65 + p.phase) * 0.32;

        if (p.x < -30) p.x = w + 30;
        else if (p.x > w + 30) p.x = -30;
        if (p.y < -30) p.y = h + 30;
        else if (p.y > h + 30) p.y = -30;

        const pulse = 0.45 + 0.55 * Math.sin(time * p.pulseSpeed * 25 + p.phase);
        const curAlpha = p.baseAlpha * pulse;
        if (curAlpha < 0.05) return;

        // Radial Bioluminescent Aura Halo
        const glowRadius = p.size * 6.5;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);

        if (p.isGold) {
          grad.addColorStop(0, `rgba(254, 240, 138, ${(curAlpha * 0.95).toFixed(2)})`);
          grad.addColorStop(0.35, `rgba(245, 158, 11, ${(curAlpha * 0.40).toFixed(2)})`);
          grad.addColorStop(0.7, `rgba(16, 185, 129, ${(curAlpha * 0.12).toFixed(2)})`);
          grad.addColorStop(1, 'rgba(4, 47, 46, 0)');
        } else {
          grad.addColorStop(0, `rgba(167, 243, 208, ${(curAlpha * 0.95).toFixed(2)})`);
          grad.addColorStop(0.35, `rgba(52, 211, 153, ${(curAlpha * 0.45).toFixed(2)})`);
          grad.addColorStop(0.7, `rgba(6, 182, 212, ${(curAlpha * 0.12).toFixed(2)})`);
          grad.addColorStop(1, 'rgba(6, 78, 59, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ultra-sharp bright core point
        ctx.fillStyle = p.isGold ? '#fffbeb' : '#ecfdf5';
        ctx.globalAlpha = Math.min(1.0, curAlpha * 1.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

    } else if (effect === 'ocean') {
      // Bioluminescent Deep Calm Ocean Waves & Glowing Plankton
      ctx.clearRect(0, 0, w, h);
      const time = (Date.now() - this.startTime) * 0.001;

      const oceanWaves = [
        { y: h * 0.72, amp: 14, freq: 0.0028, speed: 0.75, fill: 'rgba(6, 182, 212, 0.16)', stroke: 'rgba(56, 189, 248, 0.35)' },
        { y: h * 0.81, amp: 18, freq: 0.0022, speed: 0.95, fill: 'rgba(14, 116, 144, 0.28)', stroke: 'rgba(45, 212, 191, 0.42)' },
        { y: h * 0.90, amp: 22, freq: 0.0016, speed: 1.15, fill: 'rgba(15, 23, 42, 0.52)', stroke: 'rgba(103, 232, 249, 0.50)' }
      ];

      oceanWaves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 12) {
          const y = wave.y + Math.sin(x * wave.freq + time * wave.speed) * wave.amp + Math.cos(x * 0.001 + time * 0.5) * 6;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = wave.fill;
        ctx.fill();

        ctx.strokeStyle = wave.stroke;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });

      // Bioluminescent plankton sparkles in ocean
      this.particles.forEach(p => {
        p.x -= p.speed;
        if (p.x < 0) p.x = w;

        const pAlpha = p.alpha * (0.55 + 0.45 * Math.sin(time * p.pulse * 25));
        ctx.fillStyle = 'rgba(103, 232, 249, ' + pAlpha.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y + Math.sin(time + p.x * 0.01) * 3, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (effect === 'zenrain') {
      // Soft Midnight Focus Drizzle on Glass (Tranquil & Low-Contrast)
      ctx.clearRect(0, 0, w, h);

      this.particles.forEach(p => {
        p.y += p.speed;
        if (p.y > h) {
          p.y = -p.len;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 1, p.y + p.len);
        ctx.strokeStyle = '#93c5fd';
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;
    }
  }
}
