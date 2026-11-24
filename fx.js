/**
 * Merge Beasts: big moments (version 1.3).
 *
 * burst():          a burst in a rarity's colour, sized by how rare (every crate that opens).
 * premiumPurchase(): the celebration when premium crates are bought, the crates flying to the tray.
 * premiumOpen():    a premium crate's opening scene: it shakes harder and harder, glowing in the
 *                   colour of what is inside, bursts open with rays and a flash, and the beast is
 *                   revealed with its rarity's name before it lands on the field.
 * drawWheel(), spinLights(), spinReveal(): the daily spin wheel, its chasing lights while it
 *                   turns, and the burst behind the prize.
 * Everything is a transform or opacity animation, or the particle canvas: nothing to lag.
 */
const FX = (() => {
  const RANK = { COMMON: 0, RARE: 1, SUPER_RARE: 2, ULTRA_RARE: 3, LEGENDARY: 4, GODLY: 5, DARK_MATTER: 6, LIMITED: 6, COSMIC: 7 };
  function colours(rarity) {
    const R = ART.RARITY[rarity];
    // (1.5: the comet's Cosmic, and the silver Limited.)
    if (!R && rarity === 'COSMIC') return { c: '#b46bff', c2: '#ffe0ff' };
    if (!R && rarity === 'LIMITED') return { c: '#cfd8e6', c2: '#ffffff' };
    return R ? { c: R.c, c2: R.c2 } : { c: '#ffd36b', c2: '#fff6d8' };
  }
  const label = (rarity) => (RARITIES[rarity] ? RARITIES[rarity].name : rarity).toUpperCase();
  const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // (1.5: a comet beast's picture comes from its own artwork, comet.js.)
  const beastPicture = (id) => (BEAST_TEMPLATES[id] && BEAST_TEMPLATES[id].comet && typeof COMET !== 'undefined' ? COMET.canvasFor(id, 360).toDataURL('image/png') : null) || ART.cached('beast', id, false, false, 360, true, true) || ('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART.beast(id, { noGround: true, pad: true })));

  /** A burst at a point on screen in the rarity's colour; `power` scales it (1 = a normal crate). */
  function burst(x, y, rarity, power = 1) {
    const { c, c2 } = colours(rarity);
    const rank = RANK[rarity] || 0;
    const p = power * (0.6 + rank * 0.35);
    if (typeof particles !== 'undefined' && particles && particles.spawnRarityBurst) particles.spawnRarityBurst(x, y, c, c2, p);
    if (rank >= 2 || power > 1.2) {
      // A ring of light that spreads out from the point.
      const ring = el('div', 'fx-ring', document.body);
      ring.style.left = `${x}px`; ring.style.top = `${y}px`;
      ring.style.setProperty('--fx-c', c);
      ring.style.setProperty('--fx-size', `${Math.round(90 + p * 60)}px`);
      setTimeout(() => ring.remove(), 900);
    }
    if (rank >= 4) {
      const flash = el('div', 'fx-flash', document.body);
      flash.style.setProperty('--fx-c', c);
      setTimeout(() => flash.remove(), 700);
    }
  }

  /** The premium crate picture, for the effects (the same art as on the field). */
  const crateSvg = () => ART.crate(true).replace('class="crate-sprite crate-v2"', 'class="fx-crate-svg"');

  /** Bought premium crates: they drop in over rays, then fly to the premium tray. Tap to skip. */
  function premiumPurchase(count = 3) {
    return new Promise((resolve) => {
      const o = el('div', 'fx-overlay fx-buy', document.body);
      const rays = el('div', 'fx-rays', o); rays.style.setProperty('--fx-c', '#ff4fe0'); rays.style.setProperty('--fx-c2', '#ffd36b');
      el('div', 'fx-glow', o).style.setProperty('--fx-c', '#ff4fe0');
      const title = el('div', 'fx-title', o); title.textContent = `+${count} PREMIUM CRATES`;
      const row = el('div', 'fx-crate-row', o);
      const crates = [];
      for (let i = 0; i < count; i++) { const w = el('div', 'fx-crate-drop', row); w.style.animationDelay = `${0.15 + i * 0.18}s`; w.innerHTML = crateSvg(); crates.push(w); }
      const sub = el('div', 'fx-sub', o); sub.textContent = 'Tap a premium crate in your tray to open it';
      requestAnimationFrame(() => o.classList.add('on'));
      setTimeout(() => { const r = title.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 'LEGENDARY', 1.2); }, 350);
      let done = false;
      const finish = async () => {
        if (done) return; done = true;
        // Into the tray.
        const tray = document.getElementById('premium-spawner-slot');
        const t = tray ? tray.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 60, width: 0, height: 0 };
        crates.forEach((w, i) => {
          const r = w.getBoundingClientRect();
          const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
          w.style.animation = 'none';
          w.style.transition = `transform 0.55s cubic-bezier(.5,-0.2,.7,1) ${i * 0.08}s, opacity 0.55s ease ${i * 0.08 + 0.3}s`;
          w.style.transform = `translate(${dx}px, ${dy}px) scale(0.25) rotate(${(i - 1) * 25}deg)`;
          w.style.opacity = '0';
        });
        o.classList.add('leaving');
        await wait(800);
        if (tray) { tray.classList.add('fx-pop'); setTimeout(() => tray.classList.remove('fx-pop'), 600); const r = tray.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 'LEGENDARY', 0.8); }
        o.remove();
        resolve();
      };
      o.addEventListener('click', finish);
      setTimeout(finish, 2600);
    });
  }

  /**
   * A premium crate opening at (x, y) on screen, `beastId` inside. Resolves when the beast should
   * appear on the field (the scene shrinks to where it lands). Tap during the reveal to hurry on.
   */
  function premiumOpen(x, y, beastId) {
    return new Promise((resolve) => {
      const t = BEAST_TEMPLATES[beastId];
      const rarity = t ? t.rarity : 'RARE';
      const { c, c2 } = colours(rarity);
      const rank = RANK[rarity] || 1;
      const o = el('div', 'fx-overlay fx-open', document.body);
      // (1.5: a Cosmic one opens in black and stars.)
      const cosmic = rarity === 'COSMIC';
      if (cosmic) o.classList.add('fx-cosmic');
      o.style.setProperty('--fx-c', c); o.style.setProperty('--fx-c2', c2);
      const stage = el('div', 'fx-stage', o);
      stage.style.left = `${x}px`; stage.style.top = `${y}px`;
      const glow = el('div', 'fx-glow', stage);
      const rays = el('div', 'fx-rays', stage);
      const field = cosmic ? el('div', 'fx-starfield', stage) : null;
      // (1.5: on the comet, a golden premium egg shakes and cracks open instead of a crate.)
      const crate = el('div', 'fx-crate-shake', stage); crate.innerHTML = t && t.comet && typeof COMET !== 'undefined' ? COMET.eggSvg(true) : crateSvg();
      try { ART.picture('beast', beastId, false, false, 360, true, true, true); } catch (e) { /* drawn later */ }
      requestAnimationFrame(() => o.classList.add('on'));
      // Move the scene to the middle of the screen while it shakes.
      stage.animate([{ left: `${x}px`, top: `${y}px` }, { left: `${innerWidth / 2}px`, top: `${innerHeight * 0.44}px` }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      let stepT = 0;
      const shakes = setInterval(() => { stepT++; if (typeof particles !== 'undefined' && particles && stepT % 3 === 0) { const r = crate.getBoundingClientRect(); particles.spawnTrail(r.left + Math.random() * r.width, r.top + Math.random() * r.height, c); } }, 60);
      if (typeof audio !== 'undefined' && audio && audio.playClick) { [200, 520, 760, 920].forEach((ms) => setTimeout(() => audio.playClick(), ms)); }
      setTimeout(() => {
        clearInterval(shakes);
        // Open: the crate bursts, rays and a flash in the colour of what was inside.
        crate.classList.add('burst');
        rays.classList.add('on');
        glow.classList.add('on');
        if (field) { field.classList.add('on'); const sr = stage.getBoundingClientRect(); cosmicBurst(sr.left, sr.top, 1.6); }
        const r = stage.getBoundingClientRect();
        burst(r.left, r.top, rarity, 1.6 + rank * 0.15);
        if (typeof audio !== 'undefined' && audio) { try { audio.playUnlock(['GODLY', 'DARK_MATTER'].includes(rarity) ? 'GODLY' : rarity); } catch (e) { /* no sound */ } }
        const banner = el('div', 'fx-banner', stage);
        const pic = el('img', 'fx-beast'); pic.alt = '';
        const show = () => { if (!pic.parentNode && !done) stage.insertBefore(pic, banner); };
        pic.onload = show; pic.onerror = show;
        pic.src = beastPicture(beastId);
        if (pic.complete && pic.naturalWidth) show();
        banner.innerHTML = `<div class="fx-rarity">${label(rarity)}!</div><div class="fx-name">${t ? t.name : ''}</div><div class="fx-tier">Tier ${t ? t.tier : ''}</div>`;
      }, 1100);
      let done = false;
      const finish = async () => {
        if (done) return; done = true;
        o.classList.add('leaving');
        stage.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
        await wait(380);
        o.remove();
        resolve();
      };
      setTimeout(() => o.addEventListener('click', finish), 1300);
      setTimeout(finish, 3300 + rank * 150);
    });
  }

  /**
   * 1.5 (Sam, 24 Nov: Cosmic should look cosmic): where a Cosmic beast hatches, from an egg or a
   * cocoon, a black glow rimmed in violet swells and fades, and stars fly out of it.
   */
  function cosmicBurst(x, y, scale = 1) {
    // (Not over a battle: a cocoon can hatch on the comet while one is on, Sam 24 Nov.)
    if (document.getElementById('battle-screen') || document.body.classList.contains('bt-in-battle')) return;
    const b = el('div', 'fx-cosmic-burst', document.body);
    b.style.left = `${x}px`; b.style.top = `${y}px`; b.style.setProperty('--k', scale);
    el('div', 'cb-glow', b);
    const cols = ['#ffffff', '#ffffff', '#c8a8ff', '#7ad8ff', '#ffd36b', '#ff9ae8'];
    for (let i = 0; i < 22; i++) {
      const s = el('i', '', b), a = Math.random() * Math.PI * 2, d = (50 + Math.random() * 90) * scale;
      s.style.color = cols[i % cols.length];
      s.style.setProperty('--dx', `${(Math.cos(a) * d).toFixed(0)}px`); s.style.setProperty('--dy', `${(Math.sin(a) * d).toFixed(0)}px`);
      s.style.setProperty('--s', (0.6 + Math.random() * 1.1).toFixed(2));
      s.style.animationDelay = `${(Math.random() * 0.35).toFixed(2)}s`;
    }
    setTimeout(() => b.remove(), 1900);
  }

  // ---------------------------------------------------------------- the daily spin
  /** The wheel: a jewelled gold rim, shaded segments in the rarities' colours, gems, a hub. */
  function drawWheel(canvas, segments, theme = null) {
    // (1.5: theme 'comet', violet and silver with stars instead of gold.)
    const cm = theme === 'comet';
    const S = 560;
    if (canvas.width !== S) { canvas.width = S; canvas.height = S; }
    const ctx = canvas.getContext('2d');
    const cx = S / 2, cy = S / 2, R = S / 2 - 34;
    ctx.clearRect(0, 0, S, S);
    // Rim.
    const rim = ctx.createRadialGradient(cx, cy, R, cx, cy, R + 30);
    (cm ? ['#241050', '#e2d6ff', '#8a5cff', '#f6f0ff', '#241050'] : ['#7a4a00', '#ffe27a', '#ffb300', '#fff3b0', '#8a5a00']).forEach((col, i) => rim.addColorStop([0, 0.3, 0.55, 0.8, 1][i], col));
    ctx.beginPath(); ctx.arc(cx, cy, R + 30, 0, Math.PI * 2); ctx.fillStyle = rim; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, Math.PI * 2); ctx.fillStyle = cm ? '#120a2a' : '#2a1600'; ctx.fill();
    // Segments.
    for (const seg of segments) {
      const a0 = (seg.startDeg * Math.PI) / 180, a1 = (seg.endDeg * Math.PI) / 180;
      const { c, c2 } = colours(seg.rarity);
      const g = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R);
      g.addColorStop(0, c2); g.addColorStop(0.55, seg.rarity === 'COMMON' ? '#c9d6ea' : c); g.addColorStop(1, seg.rarity === 'COMMON' ? '#8ea2c0' : ART.shade(c, -0.35));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = cm ? '#e8dcff' : '#ffe27a'; ctx.lineWidth = 3; ctx.stroke();
      // A gem for every rarity, a name where it fits.
      const mid = (a0 + a1) / 2;
      const gx = cx + Math.cos(mid) * (R - 26), gy = cy + Math.sin(mid) * (R - 26);
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(mid + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, -2); ctx.lineTo(0, 11); ctx.lineTo(-9, -2); ctx.closePath();
      const gg = ctx.createLinearGradient(-9, -11, 9, 11); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.5, c); gg.addColorStop(1, ART.shade(c, -0.5));
      ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = cm ? '#f6f0ff' : '#fff3b0'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      if (seg.chance >= 5) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(mid);
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.font = '800 22px "Fredoka", "Outfit", sans-serif';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(seg.name, R - 54, 0);
        ctx.fillStyle = '#ffffff'; ctx.fillText(seg.name, R - 54, 0);
        ctx.restore();
      }
    }
    // Gloss.
    const gl = ctx.createLinearGradient(0, cy - R, 0, cy + R);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(0.45, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();
    // (The comet's: a scatter of small stars over it.)
    if (cm) for (let i = 0; i < 46; i++) { const a = i * 2.39996, rr = R * (0.32 + 0.6 * ((i * 0.6180339) % 1)); ctx.globalAlpha = 0.45 + 0.4 * ((i * 0.37) % 1); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.2 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    ctx.globalAlpha = 1;
    // Rivets on the rim.
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (R + 17), cy + Math.sin(a) * (R + 17), 3.5, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? (cm ? '#f6f0ff' : '#fff3b0') : (cm ? '#7a4ad8' : '#b47300'); ctx.fill(); }
    // Hub.
    const hub = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 52);
    (cm ? ['#ffffff', '#b48cff', '#2a1060'] : ['#fff3b0', '#ffbe2e', '#8a5a00']).forEach((col, i) => hub.addColorStop([0, 0.5, 1][i], col));
    ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fillStyle = hub; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = cm ? '#1a0a40' : '#5a3a00'; ctx.stroke();
    if (cm) { ctx.font = '800 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText('☄', cx, cy + 2); }
  }

  /** Bulbs round the wheel that chase while it spins (a ring that does not turn). */
  function spinLights(on) {
    const cont = document.querySelector('.wheel-container');
    if (!cont) return;
    let ring = cont.querySelector('.fx-bulbs');
    if (!ring) {
      ring = el('div', 'fx-bulbs', cont);
      for (let i = 0; i < 24; i++) { const b = el('i', '', ring); b.style.animationDelay = `${(i % 3) * 0.12}s`; }
    }
    // On the middle of the gold rim (drawWheel: the rim runs from 250 to 276 of 280 in the canvas).
    const radius = (cont.getBoundingClientRect().width / 2) * (263 / 280);
    [...ring.children].forEach((b, i) => { b.style.transform = `rotate(${(i / 24) * 360}deg) translateY(${-radius.toFixed(1)}px)`; });
    ring.classList.toggle('chase', !!on);
  }

  /** Behind the prize: rays and a glow in its rarity's colour, and a burst. */
  function spinReveal(rarity) {
    const card = document.getElementById('spin-result-card');
    const box = document.getElementById('spin-result-container');
    if (!card || !box) return;
    const { c, c2 } = colours(rarity);
    box.style.setProperty('--fx-c', c); box.style.setProperty('--fx-c2', c2);
    box.classList.add('fx-reveal');
    // The rays sit inside the card, behind the beast (the card's art is replaced on every spin).
    card.querySelectorAll('.fx-card-rays').forEach((r) => r.remove());
    const rays = el('div', 'fx-card-rays', null);
    card.insertBefore(rays, card.firstChild);
    void rays.offsetWidth; rays.classList.add('on');
    const r = card.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, rarity, 1.4);
    // The name and tier on a solid plate bordered in the rarity's colour (Sam, 15 Nov: hard to read).
    const name = document.getElementById('spin-result-name'), meta = document.getElementById('spin-result-meta');
    if (name && meta && !name.parentNode.classList.contains('fx-plate')) {
      const plate = el('div', 'fx-plate', null);
      name.parentNode.insertBefore(plate, name);
      plate.append(name, meta);
    }
    const title = box.firstElementChild;
    if (title) { title.textContent = `${label(rarity)}!`; title.style.color = c; title.style.textShadow = `0 0 12px ${c}`; }
  }

  return { burst, premiumPurchase, premiumOpen, cosmicBurst, drawWheel, spinLights, spinReveal, colours, RANK };
})();
