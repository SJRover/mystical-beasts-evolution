/**
 * Merge Beasts: beasts on the field (version 1.3).
 *
 * dress() puts a beast's picture (art.js, drawn once) into its field container with its rarity
 * glow behind it and a shadow under it. speed() and animate() run every frame from the game loop:
 * each beast speeds up and slows down over time, steers smoothly instead of snapping round,
 * moves the way its body does (walkers waddle, droplets bounce, fliers hover, jellyfish drift,
 * sea creatures swim) and now and then does something: a hop, a swirl, a burst of speed, a
 * wiggle, a loop. Everything moves by transform only, so the phone's graphics chip does the work.
 *
 * The average speed is unchanged (the speed multipliers average 1), so the walk speed bonus from
 * the Sanctuary still means what it did. Nothing here changes what beasts earn or do.
 */
const FIELD = (() => {
  const DPR = () => Math.min(3, window.devicePixelRatio || 1);
  const SPEEDS = [0.25, 0.6, 1, 1, 1.4, 1.75];
  const ACTIONS = {
    walk: ['hop', 'wiggle', 'burst', 'spin', 'hop'],
    hop: ['bigHop', 'burst', 'spin', 'bigHop'],
    fly: ['swirl', 'loop', 'burst', 'dive'],
    float: ['swirl', 'pulse', 'rise'],
    swim: ['burst', 'swirl', 'roll'],
  };
  const DURATION = { hop: 0.55, bigHop: 0.75, wiggle: 0.7, burst: 0.6, spin: 0.85, swirl: 0.9, loop: 1.0, dive: 0.8, pulse: 0.8, rise: 1.2, roll: 0.9 };
  const TRAIL_RARITIES = new Set(['SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER']);
  const motions = new Map();
  const motionOf = (type) => {
    if (!motions.has(type)) {
      const t = BEAST_TEMPLATES[type];
      // (1.5: a comet beast moves the way its species does: walking, flying, floating or swimming.)
      let m = t && t.limited ? 'walk' : t && t.comet && typeof COMET !== 'undefined' ? (COMET.BY_ID[t.comet.species] || {}).motion || 'walk' : ART.motion(type);
      if (t && t.system === 'low_gravity' && m === 'walk') m = 'float';
      motions.set(type, m);
    }
    return motions.get(type);
  };
  const ease = (x) => x * x * (3 - 2 * x);

  /** The beast's picture, glow and shadow, into its field container (which keeps its tag). */
  function dress(container, id, evolved, infected) {
    const size = parseFloat(container.style.width) || 100;
    const t = BEAST_TEMPLATES[id];
    container.classList.add('beast-v2');
    const shadow = document.createElement('div');
    shadow.className = 'beast-shadow';
    const auraWrap = document.createElement('div');
    auraWrap.className = 'beast-aura';
    const auraImg = new Image();
    auraImg.alt = '';
    auraImg.draggable = false;
    auraWrap.appendChild(auraImg);
    const r = infected ? 'INFECTED' : t.rarity;
    if (['SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'].includes(r) || (evolved && !infected)) auraWrap.classList.add('spin');
    const sprite = document.createElement('div');
    sprite.className = 'beast-sprite';
    container.prepend(sprite);
    container.prepend(shadow);
    container.prepend(auraWrap);

    // The picture has a quarter's room round the beast for its glow (the sprite is drawn 125% big).
    const px = size * 1.25 * DPR() * 1.35; // room to zoom in before it softens
    // 1.5: a comet beast is drawn live from its artwork (comet_art.js), so it moves: legs, wings,
    // tails, its colours shifting, a Cosmic one's stars circling (animate() below redraws it).
    if (t && ((t.comet && typeof COMET_ART !== 'undefined') || (t.limited && typeof LIMITED !== 'undefined')) && !infected) {
      const cv = document.createElement('canvas');
      cv.className = 'beast-img comet-live';
      // (Sam, 24 Nov: the comet was much laggier than the other worlds. Its canvases are now drawn at
      // the size shown, no bigger than 360, ten times a second at most, off screen not at all,
      // and no more than a few in one frame: see animate().)
      const n = Math.min(360, Math.round(size * 1.25 * DPR()));
      cv.width = cv.height = n;
      sprite.appendChild(cv);
      container._comet = { cv, g: cv.getContext('2d'), px: n, species: t.comet ? t.comet.species : null, stage: t.comet ? t.comet.stage : 0, limited: t.limited ? id : null, glow: t.limited ? 'rgba(220,232,245,0.7)' : (RARITIES[t.rarity] || {}).glow || 'rgba(255,255,255,0.5)', next: Math.random() / 10, vis: true };
      watchComet(cv, container._comet);
      drawComet(container._comet, Math.random() * 10, 0);
      const auraNow2 = ART.cached('aura', id, evolved, infected, px * 1.2);
      if (auraNow2) auraImg.src = auraNow2;
      else ART.picture('aura', id, evolved, infected, px * 1.2).then((url) => { if (url) auraImg.src = url; else auraWrap.remove(); }, () => auraWrap.remove());
      return sprite;
    }
    const img = new Image();
    img.className = 'beast-img';
    img.alt = '';
    img.draggable = false;
    sprite.appendChild(img);
    const now = ART.cached('beast', id, evolved, infected, px, true, true);
    if (now) img.src = now;
    else {
      // The vector drawing at once (no filters, cheap), the finished glowing picture as soon as it is made.
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART.beast(id, { evolved, infected, noGround: true, pad: true }));
      ART.picture('beast', id, evolved, infected, px, true, true).then((url) => { if (url) img.src = url; });
    }
    const auraNow = ART.cached('aura', id, evolved, infected, px * 1.2);
    if (auraNow) auraImg.src = auraNow;
    else ART.picture('aura', id, evolved, infected, px * 1.2).then((url) => { if (url) auraImg.src = url; else auraWrap.remove(); });
    return sprite;
  }

  /** Which comet canvases are on screen (a beast off screen is not redrawn). */
  let cometSeen = null;
  const cometWatched = new Set();
  function watchComet(cv, cm) {
    // (Canvases of beasts gone from the field are let go, so the watcher holds on to nothing.)
    for (const old of cometWatched) if (!old.isConnected) { if (cometSeen) cometSeen.unobserve(old); cometWatched.delete(old); old._cm = null; }
    cv._cm = cm;
    cometWatched.add(cv);
    // (A beast just hatched or fused moves at once, if the slots are not all taken.)
    const now = performance.now();
    if ([...cometWatched].filter((c) => c._cm && c._cm.liveUntil > now).length < COMET_LIVE + 1) { cm.liveUntil = now + COMET_TURN; cm.lastLive = now; }
    if (typeof IntersectionObserver === 'undefined') return;
    if (!cometSeen) cometSeen = new IntersectionObserver((list) => { for (const e of list) if (e.target._cm) e.target._cm.vis = e.isIntersecting; }, { rootMargin: '80px' });
    cometSeen.observe(cv);
  }
  /** How many comet beasts have been redrawn in this frame (a few at most; the rest wait a frame). */
  let cometFrame = -1, cometDrawn = 0, cometTurnAt = 0;
  const COMET_PER_FRAME = 3;
  // Live slots (Sam, 24 Nov, the comet still laggy): drawing every comet beast's artwork ten times a
  // second kept the main thread 84% busy with twenty on the field (Prime: 22%). Now only a few move
  // their artwork at once, a few seconds each in turn, those waiting longest first; the rest hold
  // their last frame and still bob, sway and walk like every other beast.
  const COMET_LIVE = 4, COMET_TURN = 3500;
  function cometTurns(now) {
    if (now < cometTurnAt) return;
    cometTurnAt = now + 400;
    const all = [];
    for (const cv of cometWatched) if (cv.isConnected && cv._cm) all.push(cv._cm);
    let live = all.filter((c) => c.liveUntil > now).length;
    const waiting = all.filter((c) => !(c.liveUntil > now) && c.vis).sort((a, b) => (a.lastLive || 0) - (b.lastLive || 0));
    for (const c of waiting) {
      if (live >= COMET_LIVE) break;
      c.liveUntil = now + COMET_TURN; c.lastLive = now; live++;
    }
  }

  /** One frame of a comet beast on its canvas: a soft glow of its rarity, then the beast. */
  function drawComet(c, t, walk) {
    const g = c.g, px = c.px;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, px, px);
    // (The glow stays inside the canvas: cut off at its bottom edge, it showed as a line.)
    const gr = g.createRadialGradient(px / 2, px * 0.6, 0, px / 2, px * 0.6, px * 0.38);
    gr.addColorStop(0, c.glow); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.45; g.fillStyle = gr; g.fillRect(0, 0, px, px); g.globalAlpha = 1;
    g.translate(px / 2, px * 0.9);
    if (c.limited) LIMITED.draw(g, c.limited, { t, walk }, px * 0.62);
    else COMET_ART.draw(g, c.species, c.stage, { t, walk }, px * 0.6 * (COMET_ART.grow ? COMET_ART.grow(c.stage, 1) : 1));
  }

  /** This frame's speed multiplier for a beast, easing towards a new target every few seconds. */
  function speed(b, dt) {
    if (!Number.isFinite(b.spd)) b.spd = 1;
    if (!Number.isFinite(b.spdT)) b.spdT = b.spd;
    if (!Number.isFinite(b.spdNext)) b.spdNext = Math.random() * 2;
    b.spdNext -= dt;
    if (b.spdNext <= 0) {
      b.spdT = SPEEDS[(Math.random() * SPEEDS.length) | 0];
      b.spdNext = 1.2 + Math.random() * 2.8;
    }
    b.spd += (b.spdT - b.spd) * (1 - Math.exp(-dt * 1.6));
    if (b.tvx !== undefined) {
      const s = 1 - Math.exp(-dt * 2.2);
      b.vx += (b.tvx - b.vx) * s;
      b.vy += (b.tvy - b.vy) * s;
    }
    if (Math.abs(b.vx) > 0.03) {
      const d = b.vx > 0 ? 1 : -1;
      if (d !== b.direction) {
        b.direction = d;
        const tag = b.dom.querySelector('.beast-tag');
        if (tag) tag.style.transform = d < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      }
    }
    let mul = b.spd;
    if (b.act && b.act.kind === 'burst') mul *= 1 + 2.6 * Math.sin(Math.PI * Math.min(1, b.act.t / b.act.d));
    if (b.act && b.act.kind === 'dive') mul *= 1 + 1.6 * Math.sin(Math.PI * Math.min(1, b.act.t / b.act.d));
    return mul;
  }

  function startAction(b, m) {
    const list = ACTIONS[m] || ACTIONS.walk;
    const kind = list[(Math.random() * list.length) | 0];
    b.act = { kind, t: 0, d: DURATION[kind], landed: false };
    const abs = feet(b);
    const t = BEAST_TEMPLATES[b.type];
    const col = colourOf(b);
    if (!particles || !abs) return;
    if (kind === 'burst' || kind === 'dive') particles.spawnBurstRing(abs.x, abs.cy, col);
    if (kind === 'swirl' || kind === 'spin' || kind === 'loop' || kind === 'roll') particles.spawnSwirl(abs.x, abs.cy, abs.r, col);
    if (kind === 'pulse') particles.spawnBurstRing(abs.x, abs.cy, col);
    if (t && t.svgParams && t.svgParams.body === 'jellyfish' && kind === 'rise') particles.spawnBubbles(abs.x, abs.y, 5);
  }

  function colourOf(b) {
    if (b.infected) return '#b56bff';
    const t = BEAST_TEMPLATES[b.type];
    const R = ART.RARITY[t.rarity];
    if (R) return R.c;
    if (b.evolved) return '#ffd700';
    return (t.svgParams && t.svgParams.color && t.svgParams.color[1]) || '#ffffff';
  }

  function feet(b) {
    if (typeof playgroundRect === 'undefined' || !playgroundRect.width) return null;
    // On screen: the world's zoom scales the beast.
    const size = (b._size || (b._size = parseFloat(b.dom.style.width) || 100)) * (typeof WORLD !== 'undefined' ? WORLD.zoom() : 1);
    const x = playgroundRect.left + (b.x / 100) * playgroundRect.width + size / 2;
    const y = playgroundRect.top + (b.y / 100) * playgroundRect.height + size * 0.92;
    return { x, y, cy: y - size * 0.42, r: size * 0.5 };
  }

  /** The beast's body language and actions for this frame: a transform on its picture. */
  function animate(b, dt) {
    const sprite = b._sprite || (b._sprite = b.dom.querySelector('.beast-sprite'));
    if (!sprite) return;
    const size = b._size || (b._size = parseFloat(b.dom.style.width) || 100);
    const k = size / 100;
    const m = motionOf(b.type);
    b.lt = (b.lt === undefined ? Math.random() * 20 : b.lt) + dt;
    const t = b.lt, spd = b.spd || 1;
    // (A comet beast's next frame, about ten a second, if it has a live slot, is on screen and this
    // frame has room.)
    const cm = b.dom._comet;
    if (cm && (cm.next -= dt) <= 0 && cm.vis) {
      const now = performance.now();
      const frame = document.timeline ? document.timeline.currentTime : now;
      if (frame !== cometFrame) { cometFrame = frame; cometDrawn = 0; cometTurns(now); }
      if (cm.liveUntil > now && cometDrawn < COMET_PER_FRAME) { cometDrawn++; cm.next = 1 / 10; drawComet(cm, t, (b.step || t * 6) / (Math.PI * 2)); }
    }
    if (b.actNext === undefined) b.actNext = 2 + Math.random() * 6;

    let y = 0, rot = 0, sx = 1, sy = 1, shadow = 1;
    if (m === 'walk') {
      b.step = (b.step || 0) + dt * 8.5 * Math.max(0.2, spd);
      rot = Math.sin(b.step) * 4.5 * Math.min(1.4, spd);
      y = -Math.abs(Math.sin(b.step)) * 2.6 * k * Math.min(1.4, spd);
    } else if (m === 'hop') {
      b.step = (b.step || 0) + dt * 5.2 * Math.max(0.35, spd);
      const s = Math.abs(Math.sin(b.step));
      y = -s * 11 * k * Math.min(1.3, 0.4 + spd * 0.6);
      sy = 0.88 + 0.12 * Math.min(1, s * 3) + 0.06 * s;
      sx = 1 / Math.sqrt(sy);
      shadow = 1 - s * 0.35;
    } else if (m === 'fly') {
      y = (Math.sin(t * 2.6) * 5 - 7) * k;
      rot = Math.sin(t * 1.8) * 3 + Math.max(-8, Math.min(8, (b.vx || 0) * 10));
      shadow = 0.75 + Math.sin(t * 2.6) * 0.08;
    } else if (m === 'float') {
      y = (Math.sin(t * 1.5) * 7 - 5) * k;
      sy = 1 + Math.sin(t * 3) * 0.045;
      sx = 1 - Math.sin(t * 3) * 0.035;
      shadow = 0.7 + Math.sin(t * 1.5) * 0.1;
    } else if (m === 'swim') {
      y = (Math.sin(t * 2.1) * 5 - 4) * k;
      rot = Math.sin(t * 3.2) * 6;
      shadow = 0.8;
    }
    // Breathing.
    sy *= 1 + Math.sin(t * 2.3) * 0.028;
    sx *= 1 - Math.sin(t * 2.3) * 0.02;

    // Now and then, an action.
    if (!b.act) {
      b.actNext -= dt;
      if (b.actNext <= 0 && draggedBeastIs(b) === false) {
        startAction(b, m);
        b.actNext = 3 + Math.random() * 7;
      }
    }
    if (b.act) {
      const a = b.act;
      a.t += dt;
      const p = Math.min(1, a.t / a.d), e = ease(p);
      switch (a.kind) {
        case 'hop': case 'bigHop': {
          const h = (a.kind === 'bigHop' ? 34 : 22) * k;
          const arc = Math.sin(Math.PI * p);
          y -= arc * h;
          if (p < 0.12) { sy *= 0.82 + p * 1.5; sx *= 1.12 - p; } else if (p > 0.88) { sy *= 0.84 + (1 - p) * 1.3; sx *= 1.1 - (1 - p) * 0.8; } else { sy *= 1.06; sx *= 0.96; }
          shadow *= 1 - arc * 0.55;
          if (p >= 1 && !a.landed) { a.landed = true; const f = feet(b); if (f && particles) particles.spawnDust(f.x, f.y, size); }
          break;
        }
        case 'wiggle': rot += Math.sin(p * Math.PI * 6) * 13 * (1 - p); break;
        case 'spin': case 'swirl': rot += e * 360; { const s = 1 + Math.sin(Math.PI * p) * 0.14; sx *= s; sy *= s; } y -= Math.sin(Math.PI * p) * 10 * k; break;
        case 'loop': rot += e * 360; y -= Math.sin(Math.PI * p) * 26 * k; break;
        case 'roll': rot += e * 360; break;
        case 'burst': sx *= 1 + Math.sin(Math.PI * p) * 0.16; sy *= 1 - Math.sin(Math.PI * p) * 0.1; rot += Math.sin(Math.PI * p) * 8; break;
        case 'dive': y += Math.sin(Math.PI * p) * 12 * k; rot += Math.sin(Math.PI * p) * 14; break;
        case 'pulse': { const s = 1 + Math.sin(Math.PI * p * 2) * 0.12; sx *= s; sy *= s; } break;
        case 'rise': y -= Math.sin(Math.PI * p) * 22 * k; sy *= 1 + Math.sin(Math.PI * p * 4) * 0.05; break;
      }
      if (p >= 1) b.act = null;
    }

    // Trails for the rarest, the evolved and the infected while they move.
    b.trail = (b.trail || 0) - dt;
    if (b.trail <= 0 && particles) {
      const tpl = BEAST_TEMPLATES[b.type];
      const moving = spd > 0.55 || (b.act && b.act.kind !== 'wiggle');
      if (moving && (TRAIL_RARITIES.has(tpl.rarity) || b.evolved || b.infected)) {
        const f = feet(b);
        if (f) particles.spawnTrail(f.x + (Math.random() - 0.5) * size * 0.4, f.cy + (Math.random() - 0.2) * size * 0.4, colourOf(b));
      }
      b.trail = 0.09 + Math.random() * 0.08;
    }

    sprite.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    const sh = b._shadow || (b._shadow = b.dom.querySelector('.beast-shadow'));
    if (sh) sh.style.transform = `scale(${shadow.toFixed(3)})`;
  }

  function draggedBeastIs(b) {
    try { return typeof draggedBeast !== 'undefined' && draggedBeast === b; } catch (e) { return false; }
  }

  /**
   * Beasts bump off one another: overlapping bodies are pushed apart and turned away. The one being
   * dragged and the shadow enemies are left out (a merge is still only a drop onto a match, and a
   * shadow must reach the beast it eats).
   */
  function collide(list, W, H) {
    const n = list.length;
    if (n < 2) return;
    const held = (typeof draggedBeast !== 'undefined') ? draggedBeast : null;
    const c = [];
    for (let i = 0; i < n; i++) {
      const b = list[i];
      const s = b._size || (b._size = parseFloat(b.dom.style.width) || 80);
      const skip = b === held || (typeof isBossBeast === 'function' && isBossBeast(b.type));
      c.push({ b, s, skip, x: (b.x / 100) * W + s / 2, y: (b.y / 100) * H + s * 0.62, r: s * 0.33 });
    }
    for (let i = 0; i < n; i++) {
      const A = c[i];
      if (A.skip) continue;
      for (let j = i + 1; j < n; j++) {
        const Bc = c[j];
        if (Bc.skip) continue;
        const dx = Bc.x - A.x, dy = Bc.y - A.y, rs = A.r + Bc.r, d2 = dx * dx + dy * dy;
        if (d2 >= rs * rs) continue;
        const d = Math.sqrt(d2) || 0.01;
        const nx = d2 ? dx / d : 1, ny = d2 ? dy / d : 0;
        const push = (rs - d) * 0.5;
        A.x -= nx * push; A.y -= ny * push; Bc.x += nx * push; Bc.y += ny * push;
        A.b.x -= ((nx * push) / W) * 100; A.b.y -= ((ny * push) / H) * 100;
        Bc.b.x += ((nx * push) / W) * 100; Bc.b.y += ((ny * push) / H) * 100;
        // Turn each away if it was walking into the other.
        const da = A.b.vx * nx + A.b.vy * ny;
        if (da > 0) { A.b.vx -= 2 * da * nx; A.b.vy -= 2 * da * ny; A.b.tvx = A.b.vx; A.b.tvy = A.b.vy; }
        const db = Bc.b.vx * nx + Bc.b.vy * ny;
        if (db < 0) { Bc.b.vx -= 2 * db * nx; Bc.b.vy -= 2 * db * ny; Bc.b.tvx = Bc.b.vx; Bc.b.tvy = Bc.b.vy; }
      }
    }
  }

  /** Make the pictures for these beasts ahead of time, so new ones appear finished. */
  function warm(ids) {
    for (const id of ids) {
      if (!BEAST_TEMPLATES[id]) continue;
      ART.picture('beast', id, false, false, 220 * 1.25 * DPR(), true, true);
      ART.picture('aura', id, false, false, 260 * DPR());
    }
  }

  return { dress, speed, animate, collide, warm };
})();
