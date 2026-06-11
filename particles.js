/**
 * Mystic Beasts Evolution - Canvas Particle System
 * Manages click bursts, merge explosions, ambient trails, and floating essence orbs.
 */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.orbs = [];
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  clear() {
    this.particles = [];
    this.orbs = [];
  }

  // Spawns sparkles on clicks
  spawnClick(x, y) {
    const colors = ['#fff', '#ffd43b', '#ffa800', '#e3faf2'];
    const count = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        type: 'sparkle'
      });
    }
  }

  // Spawns colored element explosion on merge
  spawnMerge(x, y, color) {
    // 1. Shockwave circle
    this.particles.push({
      x: x,
      y: y,
      size: 10,
      maxSize: 65,
      color: color,
      alpha: 0.8,
      growth: 3,
      type: 'shockwave'
    });

    // 2. Exploding stars/magic dust
    const count = 25 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: color,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        type: 'magic'
      });
    }
  }

  // Spawns ambient sparkles under/around rare beasts
  spawnAmbient(x, y, rarity) {
    if (rarity === 'COMMON') return;
    
    let color = '#1eff00'; // RARE
    let count = 1;
    if (rarity === 'SUPER_RARE') {
      color = '#0070dd';
      count = 2;
    } else if (rarity === 'ULTRA_RARE') {
      // Shifting colors for ultra rare
      const hue = (Date.now() / 10) % 360;
      color = `hsla(${hue}, 100%, 70%, 1.0)`;
      count = 3;
    }

    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.8) {
        this.particles.push({
          x: x + (Math.random() * 60 - 30),
          y: y + (Math.random() * 60 - 20),
          vx: (Math.random() * 0.6 - 0.3),
          vy: -(0.5 + Math.random() * 1.0),
          size: 1.5 + Math.random() * 2,
          color: color,
          alpha: 0.8,
          decay: 0.01 + Math.random() * 0.015,
          type: 'sparkle'
        });
      }
    }
  }

  // Spawns essence orbs that fly to the HUD target
  spawnOrb(startX, startY, targetX, targetY, value, callback) {
    this.orbs.push({
      x: startX,
      y: startY,
      targetX: targetX,
      targetY: targetY,
      value: value,
      callback: callback,
      progress: 0,
      speed: 0.025 + Math.random() * 0.015,
      // Control points for curved Bezier path
      cpX: startX + (Math.random() * 160 - 80),
      cpY: startY - (100 + Math.random() * 100)
    });
  }

  // Frame update
  update() {
    // Update normal particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      if (p.type === 'sparkle' || p.type === 'magic') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity gravity
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'shockwave') {
        p.size += p.growth;
        p.alpha -= 0.03;
        if (p.size >= p.maxSize || p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    // Update Bezier flying orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.progress += o.speed;
      
      if (o.progress >= 1.0) {
        o.callback(o.value); // Add essence to total
        this.orbs.splice(i, 1);
      } else {
        // Quadratic bezier interpolation: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        const t = o.progress;
        const mt = 1 - t;
        o.x = mt * mt * o.x + 2 * mt * t * o.cpX + t * t * o.targetX;
        o.y = mt * mt * o.y + 2 * mt * t * o.cpY + t * t * o.targetY;
        
        // Spawn small tail particles as it flies
        if (Math.random() > 0.4) {
          this.particles.push({
            x: o.x,
            y: o.y,
            vx: Math.random() * 0.4 - 0.2,
            vy: Math.random() * 0.4 - 0.2,
            size: 1.5 + Math.random() * 2,
            color: '#ffd43b',
            alpha: 0.6,
            decay: 0.04,
            type: 'sparkle'
          });
        }
      }
    }
  }

  // Frame draw
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw normal particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      
      if (p.type === 'sparkle' || p.type === 'magic') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        // Star or diamond shape drawing
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'shockwave') {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    });

    // Draw flying orbs (crystal circles with radial glow)
    this.orbs.forEach(o => {
      this.ctx.save();
      
      // Radial glow
      const grad = this.ctx.createRadialGradient(o.x, o.y, 1, o.x, o.y, 8);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fff4b8');
      grad.addColorStop(1, 'rgba(255, 212, 59, 0)');
      
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Core crystal
      this.ctx.fillStyle = '#ffa800';
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Export modules if running in Node environment, otherwise define globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleSystem;
} else {
  window.ParticleSystem = ParticleSystem;
}
