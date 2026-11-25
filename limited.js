/**
 * Merge Beasts 1.5: limited-time beasts (Sam, 23 and 24 Nov; UPDATE_1.5.md).
 *
 * A limited beast is won by finishing several hard challenges before its event ends; after that it
 * can never be won by challenges again. They have a silver look: the name with a metallic shine
 * sweeping across it, a reflective silver glow round the beast. While an event is live, opening the
 * game shows a banner with the beast bursting out of it; the Achievements screen has a Limited tab
 * with the challenges and their progress; the Beastopedia has a Limited section (won ones in
 * colour, the live one and missed ones as shadows with what it took).
 *
 * The first: the Abominable Snowman, Tier 18, until the end of 6 January 2027. It behaves like a
 * Relic (it never merges or goes in an incubator, it earns in any meadow and battles in every world)
 * and has a special of its own in battle, Blizzard.
 *
 * Challenge progress counts from when the event is first seen and is saved (state.limited).
 */
const LIMITED = (() => {
  const TAU = Math.PI * 2;
  let h = null;
  const H = () => h || (h = typeof MUTANT_ART !== 'undefined' ? MUTANT_ART.H : null);

  // ------------------------------------------------------------------ the beasts and their events
  // Their rarity reads Limited, in shining silver (Sam, 24 Nov), and earns like Godly.
  if (typeof RARITIES !== 'undefined') RARITIES.LIMITED = { name: 'Limited', color: '#e2e9f2', multiplier: (RARITIES.GODLY || {}).multiplier || 1000, glow: 'rgba(232,240,250,0.95)', limited: true };
  const BEASTS = {
    abominable_snowman: {
      id: 'abominable_snowman', name: 'The Abominable Snowman', tier: 18, rarity: 'LIMITED', element: 'WATER', ability: 'blizzard',
      lore: 'It walks out of the blizzard on the longest night of the year and back into it before dawn. Nobody who has seen it up close will say how big it was. Its breath freezes birds in the air.',
    },
  };
  // (The event ends at the end of 6 January 2027, wherever the player is.)
  const EVENTS = [{
    id: 'snowman_2026', beast: 'abominable_snowman', start: new Date(2026, 10, 24).getTime(), end: new Date(2027, 0, 6, 23, 59, 59).getTime(), endText: '6 January',
    challenges: [
      // (Short, Sam 24 Nov. Stars: each level once, replays under the star time count; a beast taken
      // back out of the trash does not count.)
      { id: 'merge6', text: 'Merge 1,000 beasts above Tier 5.', need: 1000 },
      { id: 'stars', text: 'Earn 100 battle stars.', need: 100 },
      { id: 'trash15', text: 'Trash 100 beasts of Tier 15+.', need: 100 },
      { id: 'evolve6', text: 'Evolve a beast above Tier 5.', need: 1 },
    ],
  }];
  for (const b of Object.values(BEASTS)) {
    BEAST_TEMPLATES[b.id] = { ...b, cost: 0, evolutions: [], system: 'relic', relic: true, limited: true, baseCps: 1e20, svgParams: { body: 'relic', eyes: 'normal', color: '#ffffff', glow: true } };
  }

  // (The latest time the game has seen, so setting the phone's clock back cannot keep an event open.)
  const now = () => Math.max(Date.now(), (typeof state !== 'undefined' && state.maxTimeSeen) || 0);
  const live = () => EVENTS.filter((e) => now() >= e.start && now() <= e.end);
  const won = (e) => !!(state.limited && state.limited[e.id] && state.limited[e.id].won);
  const prog = (e) => { const L = state.limited || (state.limited = {}); return L[e.id] || (L[e.id] = { merge6: 0, stars: [], trash15: 0, evolve6: 0, won: 0, since: now() }); };
  const count = (e, c) => { const p = prog(e); return c.id === 'stars' ? (p.stars || []).length : p[c.id] || 0; };
  const daysLeft = (e) => Math.max(0, Math.ceil((e.end - now()) / 86400000));

  /** Something towards a live event's challenge happened (game.js and battle.js call these). */
  function note(kind, n = 1) {
    let any = false;
    for (const e of live()) {
      if (won(e) || !e.challenges.some((c) => c.id === kind)) continue;
      prog(e)[kind] = (prog(e)[kind] || 0) + n; any = true;
      check(e);
    }
    return any;
  }
  const unnote = (kind) => { for (const e of live()) { const p = prog(e); if (!won(e) && p[kind] > 0) p[kind]--; } };
  function noteStar(levelId) {
    for (const e of live()) {
      if (won(e)) continue;
      const p = prog(e);
      if (!(p.stars || (p.stars = [])).includes(levelId)) { p.stars.push(levelId); check(e); }
    }
  }
  /** Every challenge done in time: the beast joins you. */
  function check(e) {
    if (won(e) || !e.challenges.every((c) => count(e, c) >= c.need)) return;
    prog(e).won = now();
    const id = e.beast;
    if (state.currentSolarSystem !== 'comet' && !state.inBeastHub && typeof spawnBeastOnField === 'function') {
      const p = typeof WORLD !== 'undefined' && WORLD.viewPct ? WORLD.viewPct(45, 50) : { x: 45, y: 50 };
      spawnBeastOnField(id, p.x, p.y, false, false);
    } else if (state.primeSystem && state.primeSystem.beastsOnField) state.primeSystem.beastsOnField.push({ type: id, x: 45, y: 50, evolved: false, infected: false, deathTimer: 45 });
    if (typeof checkDiscovery === 'function') checkDiscovery(id);
    if (typeof spawnToastNotification === 'function') spawnToastNotification('❄ Limited beast won!', `<b>${BEASTS[id].name}</b> joins you, in time.`, svg(id));
    if (typeof saveGame === 'function') saveGame();
  }

  // ------------------------------------------------------------------ the Snowman, drawn
  /**
   * The Abominable Snowman (World 7's detail at the least, Sam's rule): shaggy white fur in tufts,
   * a hunched barrel of a body, long arms with blue-grey palms and black claws, thick legs with knees
   * and broad four-toed feet, a blue-grey face under a heavy brow, ice-blue eyes, fangs, curled
   * horns of ice, icicles in its fur, frost breath. pose: t, walk (cycles), atk (a blow, or -1).
   */
  function snowman(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, eye, gait, blow, steam, shade, rgba, lerp } = H();
    const t = A.t, g = gait(A, 0.8), b = blow(A.atk);
    const fur = '#eef4fa', furD = '#c8d6e4', furS = '#a8b8cc', skin = '#7a8aa8', skinD = '#56647e', claw = '#1a1c24', ice = '#bfefff', eyeC = '#7ad8ff';
    const tuft = (x, y, r, a, col = fur) => shape(ctx, col, () => { const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca; ctx.moveTo(x + px * r * 0.9, y + py * r * 0.9); ctx.bezierCurveTo(x + px * r * 1.1 + ca * r * 1.3, y + py * r * 1.1 + sa * r * 1.3, x + ca * r * 2.1 + px * r * 0.5, y + sa * r * 2.1 + py * r * 0.5, x + ca * r * 2.3, y + sa * r * 2.3); ctx.bezierCurveTo(x + ca * r * 1.6 - px * r * 0.2, y + sa * r * 1.6 - py * r * 0.2, x - px * r * 1.0 + ca * r * 0.9, y - py * r * 1.0 + sa * r * 0.9, x - px * r * 0.9, y - py * r * 0.9); }, null);
    const icicle = (x, y, len) => shape(ctx, vgrad(ctx, y, y + len, '#ffffff', ice), () => { ctx.moveTo(x - 1.2, y); ctx.lineTo(x, y + len); ctx.lineTo(x + 1.2, y); }, 'rgba(90,150,190,0.55)', H().LW * 0.35);
    /** Shaggy fur: little V-shaped clumps scattered over an area (fixed places, so it does not flicker). */
    const shag = (cx, cy, rx, ry, n, col, seed = 1) => stroke(ctx, col, H().LW * 0.6, () => { for (let i = 0; i < n; i++) { const a = (i * 2.399 + seed) % TAU, r = Math.sqrt((i * 0.618 + seed * 0.37) % 1), x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r; ctx.moveTo(x - 1.3, y - 1.5); ctx.quadraticCurveTo(x - 0.4, y + 0.4, x, y + 1.7); ctx.moveTo(x + 1.3, y - 1.5); ctx.quadraticCurveTo(x + 0.4, y + 0.4, x, y + 1.7); } });
    ctx.save(); ctx.translate(0, g.bob * 1.4);
    // Legs: furry thighs, a knee, shins, broad feet with four toes and black claws, blue-grey soles.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 4;
      const hip = { x: sd * 9, y: -24 }, knee = { x: sd * 11, y: -13 - lift }, ank = { x: sd * 10 + sd * g.s, y: -5 - lift };
      chain(ctx, [hip, knee, ank], [7, 6, 5.4], fur);
      shag(lerp(hip.x, knee.x, 0.5), lerp(hip.y, knee.y, 0.5), 4.6, 5, 7, rgba(furS, 0.7), sd + 3);
      for (let k = 0; k < 5; k++) tuft(knee.x + sd * (4.6 - k * 0.4), knee.y - 2 + k * 2, 1.9, sd > 0 ? 0.5 : Math.PI - 0.5, k % 2 ? furD : fur);
      for (let k = 0; k < 5; k++) tuft(ank.x - 5 + k * 2.5, ank.y + 0.6, 1.8, Math.PI / 2, k % 2 ? fur : furD);
      ell(ctx, ank.x, -2.4 - lift, 7.4, 3.6, fur);
      for (let k = 0; k < 4; k++) { const x = ank.x - 4.8 + k * 3.2; ell(ctx, x, -1.4 - lift, 1.8, 1.6, fur); shape(ctx, claw, () => { ctx.moveTo(x - 0.8, -0.6 - lift); ctx.quadraticCurveTo(x, 1.8 - lift, x + 0.9, 0.6 - lift); ctx.lineTo(x + 0.6, -0.6 - lift); }, null); }
      ell(ctx, ank.x, -0.8 - lift, 4, 1, skinD, null);
    }
    // Ice crystals grown out of its back and shoulders, behind it: six-sided shards, catching light.
    const crystal = (x, y, len, ang, w) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      glow(ctx, 0, -len * 0.6, len * 0.7, ice, 0.25 + 0.1 * Math.sin(t * 2 + x));
      shape(ctx, vgrad(ctx, -len, 0, '#ffffff', '#8ad0f0'), () => { ctx.moveTo(-w, 0); ctx.lineTo(-w, -len * 0.75); ctx.lineTo(0, -len); ctx.lineTo(w, -len * 0.75); ctx.lineTo(w, 0); }, 'rgba(60,120,170,0.7)', H().LW * 0.5);
      shape(ctx, 'rgba(255,255,255,0.55)', () => { ctx.moveTo(-w * 0.55, -1); ctx.lineTo(-w * 0.55, -len * 0.72); ctx.lineTo(0, -len * 0.94); ctx.lineTo(0, -1); }, null);
      ctx.restore();
    };
    for (const sd of [-1, 1]) { crystal(sd * 16, -55, 21, sd * 0.8, 3); crystal(sd * 10, -58, 26, sd * 0.42, 3.4); crystal(sd * 20, -48, 14, sd * 1.1, 2.3); crystal(sd * 5, -60, 16, sd * 0.2, 2.4); }
    // The body: a hunched barrel of shaggy fur, a paler chest, tufts round its edge, icicles.
    shape(ctx, vgrad(ctx, -60, -18, '#ffffff', furD), () => { ctx.moveTo(-16, -20); ctx.bezierCurveTo(-26, -30, -26, -52, -14, -58); ctx.quadraticCurveTo(0, -64, 14, -58); ctx.bezierCurveTo(26, -52, 26, -30, 16, -20); ctx.quadraticCurveTo(0, -14, -16, -20); });
    for (let i = 0; i < 26; i++) { const a = Math.PI * 0.12 + (i / 25) * Math.PI * 1.76, rx = 20, ry = 20; tuft(Math.cos(a + Math.PI / 2) * rx, -39 + Math.sin(a + Math.PI / 2) * ry, 3.2, a + Math.PI / 2 + Math.sin(t * 1.6 + i) * 0.08, i % 2 ? fur : furD); }
    shape(ctx, vgrad(ctx, -50, -24, '#f6fbff', '#dce8f4'), () => { ctx.ellipse(0, -36, 10, 14, 0, 0, TAU); }, null);
    shag(0, -40, 18, 16, 34, rgba(furS, 0.75), 1);
    shag(0, -36, 8, 11, 10, rgba('#b8c8dc', 0.8), 7);
    // A shaggy fringe hanging from its belly over its hips, layered.
    for (let row = 0; row < 2; row++) for (let x = -17 + row * 1.6; x <= 17; x += 3.2) tuft(x, -21 + row * 2 + Math.abs(x) * 0.08 + Math.sin(t * 2 + x) * 0.3, 2.5 - row * 0.5, Math.PI / 2 + x * 0.012, (Math.round(x) + row) % 2 ? fur : furD);
    // A mantle of long fur over the shoulders, joining the head to the body.
    for (let i = 0; i < 14; i++) { const x = -20 + i * 3.1, y = -55 + Math.abs(x) * 0.12; tuft(x, y, 3.2, Math.PI / 2 + x * 0.03, i % 2 ? fur : '#ffffff'); }
    // Shading: shadow down its flanks and under its belly, light on its chest; frost caught in the fur.
    for (const sd of [-1, 1]) ell(ctx, sd * 15, -34, 5, 13, rgba('#8ea0b8', 0.22), null, sd * 0.15);
    ell(ctx, 0, -24, 14, 3.5, rgba('#8ea0b8', 0.25), null);
    ell(ctx, -5, -46, 6, 4, rgba('#ffffff', 0.45), null, -0.3);
    for (const [x, y, r] of [[-11, -44, 2.6], [12, -30, 2.2], [-8, -27, 1.8], [6, -50, 1.6]]) { ell(ctx, x, y, r * 1.3, r, rgba(ice, 0.4), null, 0.4); stroke(ctx, 'rgba(255,255,255,0.85)', H().LW * 0.5, () => { ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y + r * 0.6); }); }
    // Arms: long and heavy, reaching past its knees, the right one swinging down in a blow.
    const sw = b.wind ? -b.wind : b.hit;
    for (const sd of [-1, 1]) {
      const raise = sd > 0 ? b.wind : 0, hit = sd > 0 ? b.hit : 0;
      const sh = { x: sd * 17, y: -52 }, el = { x: sd * (24 + raise * 2), y: lerp(-34, -58, raise) + hit * 6 }, hd = { x: sd * lerp(24, 18, raise), y: lerp(-14 - Math.sin(t * 2 + sd) * 1.5 + Math.max(0, -sd * g.s) * 2, -70, raise) + hit * 14 };
      chain(ctx, [sh, el, hd], [7.4, 6.2, 5.2], fur);
      shag(lerp(sh.x, el.x, 0.5), lerp(sh.y, el.y, 0.5), 4.4, 6, 8, rgba(furS, 0.7), sd + 5);
      shag(lerp(el.x, hd.x, 0.45), lerp(el.y, hd.y, 0.45), 3.6, 5, 6, rgba(furS, 0.7), sd + 9);
      // Long fur hanging off the back of each arm, swaying.
      for (let k = 0; k < 7; k++) { const q = k / 6, x = lerp(sh.x, hd.x, q), y = lerp(sh.y, hd.y, q); tuft(x + sd * (5.6 - q * 1.2), y + 1, 2.2 - q * 0.4, (sd > 0 ? 0.6 : Math.PI - 0.6) + Math.sin(t * 2 + k) * 0.15, k % 2 ? furD : fur); }
      icicle(el.x - sd * 1, el.y + 5, 3.4); icicle(el.x + sd * 2, el.y + 4.6, 2.4);
      // A broken iron shackle on its left wrist, a few links of chain still swinging from it.
      if (sd < 0) {
        const wx = lerp(el.x, hd.x, 0.78), wy = lerp(el.y, hd.y, 0.78), ang = Math.atan2(hd.y - el.y, hd.x - el.x);
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(ang);
        shape(ctx, vgrad(ctx, -5, 5, '#8a909c', '#3a3e48'), () => { ctx.rect(-1.8, -5.6, 3.6, 11.2); }, undefined, H().LW * 0.6);
        stroke(ctx, 'rgba(255,255,255,0.55)', H().LW * 0.5, () => { ctx.moveTo(-0.9, -5); ctx.lineTo(-0.9, 5); });
        for (const ry of [-3.6, 3.6]) ell(ctx, 0, ry, 0.6, 0.6, '#c8ccd4', null);
        ctx.restore();
        let lx = wx + Math.cos(ang + Math.PI / 2) * 5, ly = wy + Math.sin(ang + Math.PI / 2) * 5;
        for (let k = 0; k < 3; k++) { const sway = Math.sin(t * 3 + k) * 0.4; ell(ctx, lx, ly + 1.6, 1.1, 1.7, null, '#4a4e58', sway + (k % 2 ? 1.57 : 0), H().LW * 0.9); lx += Math.sin(sway) * 1.2; ly += 2.6; }
      }
      // The hand: a blue-grey palm, thick fingers, black claws.
      ell(ctx, hd.x, hd.y + 2, 5.4, 4.6, vgrad(ctx, hd.y - 3, hd.y + 7, skin, skinD));
      for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + (k - 1.5) * 0.42 + (raise > 0.5 ? Math.PI : 0); const fx = hd.x + Math.cos(a) * 5.2, fy = hd.y + 2 + Math.sin(a) * 5.2; chain(ctx, [{ x: hd.x + Math.cos(a) * 3, y: hd.y + 2 + Math.sin(a) * 3 }, { x: fx, y: fy }], [1.6, 1.3], skin); shape(ctx, claw, () => { ctx.moveTo(fx - 0.9, fy); ctx.quadraticCurveTo(fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, fx + 0.9, fy); }, null); }
      for (let k = 0; k < 4; k++) ell(ctx, hd.x - 3 + k * 2, hd.y - 0.2, 1, 0.8, shade(skin, 0.15), null);
      tuft(hd.x, hd.y - 3, 2.6, -Math.PI / 2, fur); tuft(hd.x - sd * 2.4, hd.y - 2.2, 1.8, -Math.PI / 2 - sd * 0.5, furD);
    }
    // The head: sunk in a shaggy hood, a blue-grey face, a heavy brow, ice-blue eyes, fangs, horns of ice.
    const hy = -62, jaw = Math.max(b.hit, 0.15 + 0.1 * Math.sin(t * 1.3));
    for (const sd of [-1, 1]) {
      const hp = [{ x: sd * 8, y: hy - 6 }, { x: sd * 16, y: hy - 12 }, { x: sd * 20, y: hy - 4 }, { x: sd * 16, y: hy + 1 }];
      chain(ctx, hp, [3.2, 2.6, 1.8, 0.9], ice);
      stroke(ctx, 'rgba(255,255,255,0.8)', H().LW * 0.6, () => { ctx.moveTo(hp[0].x, hp[0].y - 1.5); ctx.quadraticCurveTo(hp[1].x, hp[1].y - 2.4, hp[2].x - sd * 1, hp[2].y); });
    }
    // (The head's fur has no outline: a mane of long tufts frames the face and runs into the mantle.)
    ell(ctx, 0, hy, 13, 12, vgrad(ctx, hy - 12, hy + 12, '#ffffff', furD), null);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 16; i++) { const a = -Math.PI * 1.05 + (i / 15) * Math.PI * 1.1 + ring * 0.1; tuft(Math.cos(a) * (11.5 + ring * 2), hy + Math.sin(a) * (10.5 + ring * 2), 2.6 - ring * 0.6, a + Math.sin(t * 1.5 + i) * 0.1, (i + ring) % 2 ? fur : '#ffffff'); }
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) tuft(sd * (9 + k * 0.6), hy + 4 + k * 3, 2.4, Math.PI / 2 + sd * 0.4, k % 2 ? fur : furD);
    shape(ctx, vgrad(ctx, hy - 6, hy + 10, skin, skinD), () => { ctx.ellipse(0, hy + 2, 8.4, 8.6, 0, 0, TAU); });
    stroke(ctx, rgba(skinD, 0.6), H().LW * 0.6, () => { ctx.moveTo(-5, hy + 1); ctx.quadraticCurveTo(-6, hy + 5, -4.4, hy + 8); ctx.moveTo(5, hy + 1); ctx.quadraticCurveTo(6, hy + 5, 4.4, hy + 8); });
    shape(ctx, skinD, () => { ctx.moveTo(-8.8, hy - 2.2); ctx.quadraticCurveTo(0, hy - 7, 8.8, hy - 2.2); ctx.lineTo(7.8, hy - 0.2); ctx.quadraticCurveTo(0, hy - 3.8, -7.8, hy - 0.2); }, undefined, H().LW * 0.5);
    for (let k = 0; k < 7; k++) tuft(-7.2 + k * 2.4, hy - 4.2, 1.2, -Math.PI / 2 + (k - 3) * 0.1, '#ffffff');
    // A heavy muzzle.
    ell(ctx, 0, hy + 5.2, 5.2, 3.8, vgrad(ctx, hy + 1.5, hy + 9, shade(skin, 0.18), skin), undefined, 0, H().LW * 0.5);
    for (const sd of [-1, 1]) { glow(ctx, sd * 3.6, hy + 0.4, 5, eyeC, 0.6); eye(ctx, sd * 3.6, hy + 0.6, 1.5, eyeC, 1, -sd); }
    ell(ctx, 0, hy + 4.4, 2.4, 1.4, skinD, null); ell(ctx, -0.9, hy + 4.6, 0.5, 0.4, '#1a1c24', null); ell(ctx, 0.9, hy + 4.6, 0.5, 0.4, '#1a1c24', null);
    shape(ctx, '#2a1a24', () => { ctx.ellipse(0, hy + 7.6 + jaw * 1.4, 4.6, 1 + jaw * 2.6, 0, 0, TAU); }, null);
    for (const sd of [-1, 1]) { shape(ctx, '#ffffff', () => { ctx.moveTo(sd * 3.6, hy + 6.6); ctx.lineTo(sd * 3, hy + 9.2 + jaw * 1.4); ctx.lineTo(sd * 2.4, hy + 6.8); }, null); shape(ctx, '#ffffff', () => { ctx.moveTo(sd * 1.6, hy + 9.6 + jaw * 2.6); ctx.lineTo(sd * 1.2, hy + 7.8 + jaw * 2); ctx.lineTo(sd * 0.8, hy + 9.6 + jaw * 2.6); }, null); }
    steam(ctx, 0, hy + 8, t * 0.7, '#e8f8ff', 2);
    ctx.restore();
    // Snow drifting round it, and glints of silver.
    for (let i = 0; i < 7; i++) { const k = (t * 0.25 + i / 7) % 1; ctx.globalAlpha = 0.8 * Math.sin(k * Math.PI); ell(ctx, Math.sin(i * 2.3 + t * 0.6) * 26, -70 + k * 72, 0.9, 0.9, '#ffffff', null); ctx.globalAlpha = 1; }
  }
  /** The silver look behind a limited beast: a reflective glow and a glint turning round it. */
  function silver(ctx, t, front) {
    const { glow } = H();
    if (!front) { glow(ctx, 0, -36, 52, '#d8e4f0', 0.55); glow(ctx, 0, -36, 30, '#ffffff', 0.35); return; }
    for (let i = 0; i < 4; i++) {
      const a = t * 1.1 + (i / 4) * TAU, x = Math.cos(a) * 30, y = -36 + Math.sin(a) * 12;
      if (Math.sin(a) < 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 0.7 : 3; ctx.lineTo(Math.cos((k / 8) * TAU) * r, Math.sin((k / 8) * TAU) * r); } ctx.fill();
      ctx.restore();
    }
  }
  const ARTS = { abominable_snowman: snowman };
  /** A limited beast drawn at `size` (about 80 units tall), feet at (0, 0). */
  function draw(ctx, id, pose, size = 80) {
    if (!H() || !ARTS[id]) return;
    H().setLine(0.85, '#1c2232');
    const s = size / 80;
    ctx.save(); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 4.6, 0, 0, TAU); ctx.fill();
    silver(ctx, pose.t || 0, false);
    ARTS[id](ctx, { t: pose.t || 0, walk: pose.walk || 0, atk: pose.atk == null ? -1 : pose.atk });
    silver(ctx, pose.t || 0, true);
    ctx.restore();
  }
  /** A picture on a canvas `px` square (as comet.js canvasFor). */
  function canvasFor(id, px, glowOn = true) {
    const c = document.createElement('canvas'); c.width = c.height = px;
    const g = c.getContext('2d');
    // (A little room above for its horns, crystals and glow.)
    g.translate(px / 2, px * 0.92);
    draw(g, id, { t: 1.7 }, px * 0.56);
    return c;
  }
  const svgCache = new Map();
  function svg(id) {
    if (!svgCache.has(id)) svgCache.set(id, `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden"><image href="${canvasFor(id, 192).toDataURL('image/png')}" x="0" y="0" width="100" height="100"/></svg>`);
    return svgCache.get(id);
  }

  // ------------------------------------------------------------------ the banner
  let bannerShown = false;
  /** On opening the game while an event is live (and its beast not yet won): once a session. */
  function banner() {
    if (bannerShown || typeof document === 'undefined') return;
    const e = live().find((x) => !won(x));
    if (!e || !state.isTutorialCompleted) return;
    // (Not over another popup: on the first launch after an update several can come at once.)
    if (document.querySelector('.modal-overlay.active, .modal.active, #battle-screen') && (banner.tries = (banner.tries || 0) + 1) < 60) { setTimeout(banner, 2000); return; }
    bannerShown = true;
    const B = BEASTS[e.beast];
    const el = document.createElement('div');
    el.className = 'limited-banner-wrap';
    el.innerHTML = `<div class="limited-banner">
      <button class="limited-close" aria-label="Close">✕</button>
      <div class="limited-pop"><img alt=""></div>
      <div class="limited-tag">LIMITED NOW</div>
      <div class="limited-title">${B.name}</div>
      <div class="limited-text">Tier ${B.tier}, with a Blizzard special in battle. Finish four challenges by the end of ${e.endText} to win him; after that he is gone for good. ${daysLeft(e)} day${daysLeft(e) === 1 ? '' : 's'} left.</div>
      <button class="limited-go">See Limited Achievements</button>
    </div>`;
    el.querySelector('img').src = canvasFor(e.beast, 360).toDataURL('image/png');
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); };
    el.querySelector('.limited-close').addEventListener('click', close);
    el.addEventListener('click', (ev) => { if (ev.target === el) close(); });
    el.querySelector('.limited-go').addEventListener('click', () => { close(); if (typeof BATTLE !== 'undefined' && BATTLE.openAchievements) BATTLE.openAchievements('limited'); });
    document.body.appendChild(el);
  }

  // ------------------------------------------------------------------ for the screens
  /** The Limited tab of Achievements. */
  function achHtml(rewardChips) {
    let html = '';
    for (const e of EVENTS) {
      const B = BEASTS[e.beast], isLive = now() >= e.start && now() <= e.end, got = won(e);
      html += `<div class="bt-system limited-head"><span class="limited-plain">${B.name}</span> <small>${got ? 'Won' : isLive ? `Until ${e.endText} · ${daysLeft(e)} days left` : 'Ended'}</small></div>
        <div class="limited-reward"><div class="limited-pic">${svg(e.beast)}</div><div><b class="limited-plain">${B.name}</b><span>Tier ${B.tier}, earns in any meadow and battles in every world, with the Blizzard special (enemies near it frozen for three seconds).</span></div></div><div class="bt-achs">`;
      for (const c of e.challenges) {
        const have = Math.min(count(e, c), c.need), done = got || have >= c.need;
        html += `<div class="bt-ach ${done ? 'done' : ''}"><div class="bt-medal"><span>❄</span></div><div class="bt-ach-body"><b>${c.text}</b>${done ? '<em class="bt-ach-got">Done</em>' : `<div class="bt-bar"><i style="width:${(have / c.need) * 100}%"></i></div><em>${have.toLocaleString()}/${c.need.toLocaleString()}</em>`}</div></div>`;
      }
      html += '</div>';
    }
    return html;
  }
  /** The Beastopedia's Limited section (game.js renderBeastopedia). */
  function beastopedia(grid) {
    const head = document.createElement('div');
    head.className = 'beastopedia-section-head limited-section-head';
    // (Won through the challenges or had some other way: Sam, 24 Nov, an unlocked one counted 0 of 1.)
    const got = EVENTS.filter((e) => won(e) || state.unlockedBeasts.includes(e.beast)).length;
    head.innerHTML = `<div><span class="limited-dot"></span><span>Limited Beasts</span></div><span class="comet-count">${got} / ${EVENTS.length}</span>`;
    grid.appendChild(head);
    const sub = document.createElement('div');
    sub.className = 'beastopedia-grid';
    EVENTS.forEach((e, i) => {
      const B = BEASTS[e.beast], has = won(e) || state.unlockedBeasts.includes(e.beast), isLive = now() >= e.start && now() <= e.end;
      const card = document.createElement('div');
      card.className = `beastopedia-card limited-card ${has ? '' : 'locked limited-shadow'}`;
      card.dataset.id = e.beast;
      // (Numbered like every other beast, the shining Limited tag on the right: Sam, 24 Nov.)
      card.innerHTML = `${has && typeof ELEMENT_ICON !== 'undefined' && ELEMENT_ICON[B.element] ? `<span class="pedia-elem" title="${ELEMENTS[B.element].name}">${ELEMENT_ICON[B.element]}</span>` : ''}<div class="beastopedia-card-num"><span>#${String(i + 1).padStart(2, '0')}</span><span class="beastopedia-card-rarity rarity-limited" style="font-weight:bold; font-size:8px; text-transform:uppercase;"><span class="rarity-shine limited-shine">Limited</span></span></div>
        <div class="beastopedia-card-icon">${svg(e.beast)}</div>
        <div class="beastopedia-card-name" style="font-size:9px;margin-top:4px;text-align:center;">${has ? B.name : isLive ? `Until ${e.endText}` : 'Missed'}</div>
        ${has ? '' : `<div class="limited-how">${isLive ? 'Tap for the challenges' : e.challenges.map((c) => c.text.split('.')[0]).join(' · ')}</div>`}`;
      if (!has && isLive) card.addEventListener('click', () => { if (typeof BATTLE !== 'undefined') BATTLE.openAchievements('limited'); });
      sub.appendChild(card);
    });
    grid.appendChild(sub);
  }

  return { BEASTS, EVENTS, live, won, note, unnote, noteStar, draw, canvasFor, svg, banner, achHtml, beastopedia, daysLeft };
})();
if (typeof window !== 'undefined') window.LIMITED = LIMITED;
