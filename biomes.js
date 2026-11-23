/**
 * Merge Beasts: the biome backgrounds (version 1.3).
 *
 * Each of the 32 biomes (16 in each solar system, 1.5) and the Beast Hub is painted once, when it is
 * entered, onto a canvas the size of the world (world.js): a sky and skyline along the top, then
 * textured ground with a winding feature (a path, a river, a lava flow, a chasm), low details
 * scattered over the open ground (flowers, stones, crystals, pools, bones, ...) and taller things
 * framing the edges (trees, crystal spires, pillars, ...), so beasts never walk through a tree.
 * The same seed every time, so a biome always looks the same. Nothing animates here: it costs
 * nothing per frame.
 */
const BIOMES = (() => {
  // ---------------------------------------------------------------- the 24 biomes
  // ground: [top, bottom, patch]; tex: the small texture; feat: the winding feature; low/edge: props.
  const PRIME = [
    { name: 'Forest Meadow', sky: ['#9fe0ff', '#e6f7ff'], horizon: 'hills', hz: ['#5aa05a', '#3f8a49'], ground: ['#5fb350', '#3d8f3f', '#7cc95e'], tex: 'grass', feat: 'path', featC: '#c9a46a', low: { flower: 5, bush: 2, rock: 2, mushroom: 1, pond: 0.4 }, edge: 'tree', edgeC: ['#3f9a46', '#6b4423'] },
    { name: 'Volcanic Canyon', sky: ['#3a1410', '#c2401e'], horizon: 'volcanoes', hz: ['#4a2418', '#2e1610'], ground: ['#5a2e22', '#3a1c16', '#7a3e2a'], tex: 'ash', feat: 'lava', featC: '#ff7a1a', low: { rock: 4, lavaVent: 2, ember: 3, bones: 0.6 }, edge: 'basalt', edgeC: ['#2e1a16', '#ff7a1a'] },
    { name: 'Crystal Cavern', sky: ['#120a2e', '#3b2a7a'], horizon: 'stalactites', hz: ['#2a1d5a', '#1a1240'], ground: ['#3a2d6e', '#241a4a', '#4e3e8e'], tex: 'crystal', feat: 'river', featC: '#4fd8ff', low: { crystal: 5, rock: 2, mushroomGlow: 2 }, edge: 'crystalSpire', edgeC: ['#7cf7e8', '#b46bff'] },
    { name: 'Sky Sanctuary', sky: ['#6fc4ff', '#fff4d6'], horizon: 'clouds', hz: ['#ffffff', '#dfefff'], ground: ['#bfe6ff', '#8ec9f0', '#e3f4ff'], tex: 'cloud', feat: 'path', featC: '#ffe9a8', low: { cloudPuff: 4, flower: 2, feather: 2 }, edge: 'pillar', edgeC: ['#f4efe6', '#ffd36b'] },
    { name: 'Cosmic Nebula', sky: ['#1a0a3a', '#6a2bb0'], horizon: 'nebula', hz: ['#ff6bd6', '#6aa9ff'], ground: ['#2a1650', '#1a0e36', '#3e2470'], tex: 'stars', feat: 'river', featC: '#b46bff', low: { starCluster: 4, crystal: 2, rock: 2 }, edge: 'crystalSpire', edgeC: ['#ff8fd1', '#8a5cff'] },
    { name: 'Celestial Cosmos', sky: ['#0a1030', '#26408a'], horizon: 'planets', hz: ['#ffd36b', '#7cf7e8'], ground: ['#1e2a5a', '#121a3e', '#2c3c78'], tex: 'stars', feat: 'path', featC: '#ffe9a8', low: { starCluster: 3, rune: 2, rock: 2 }, edge: 'obelisk', edgeC: ['#2a3366', '#ffd36b'] },
    { name: 'Demonic Abyss', sky: ['#1a0206', '#6e0a12'], horizon: 'spires', hz: ['#2a0408', '#140204'], ground: ['#3a0a10', '#220408', '#541018'], tex: 'ash', feat: 'chasm', featC: '#ff2a3a', low: { bones: 3, rock: 3, brazier: 1.5, ember: 2 }, edge: 'thorn', edgeC: ['#2a0a0e', '#ff3b3b'] },
    { name: 'Omega Nexus', sky: ['#04141e', '#0e4a5a'], horizon: 'towers', hz: ['#0e2a36', '#06161e'], ground: ['#123a46', '#0a2430', '#1a5262'], tex: 'circuit', feat: 'path', featC: '#3ff6ff', low: { gear: 2, pylon: 1.5, rune: 2, rock: 1 }, edge: 'pylonTall', edgeC: ['#1a3c48', '#3ff6ff'] },
    { name: 'Eldritch Spire', sky: ['#0e0418', '#3a1a5a'], horizon: 'spires', hz: ['#1e0e30', '#0e0618'], ground: ['#2a1640', '#180c28', '#3a2058'], tex: 'veins', feat: 'chasm', featC: '#9dff4a', low: { tentacle: 3, eyeOrb: 1.5, mushroomGlow: 2, rock: 1 }, edge: 'tentacleTall', edgeC: ['#3a1a5a', '#9dff4a'] },
    { name: 'Singularity Void', sky: ['#000000', '#1a0a2a'], horizon: 'blackhole', hz: ['#ff8a3d', '#b46bff'], ground: ['#120a1e', '#06030c', '#1e1030'], tex: 'stars', feat: 'river', featC: '#ff8a3d', low: { shard: 4, starCluster: 2, rune: 1 }, edge: 'obelisk', edgeC: ['#1a1028', '#ff8a3d'] },
    { name: 'Glittery Lava Plains', sky: ['#2a0a1e', '#ff6a3d'], horizon: 'volcanoes', hz: ['#5a1e2a', '#3a1018'], ground: ['#6e2a3a', '#4a1626', '#8e3a4e'], tex: 'glitter', feat: 'lava', featC: '#ffb21a', low: { crystal: 3, lavaVent: 2, ember: 3 }, edge: 'basalt', edgeC: ['#3a1222', '#ffcf3d'] },
    { name: 'Dark Matter Core', sky: ['#000000', '#2a002e'], horizon: 'blackhole', hz: ['#ff2fe9', '#7b00ad'], ground: ['#14001a', '#06000a', '#240030'], tex: 'veins', feat: 'chasm', featC: '#ff2fe9', low: { shard: 3, eyeOrb: 1, rune: 2 }, edge: 'crystalSpire', edgeC: ['#ff2fe9', '#7b00ad'] },
    // 1.5: prestige 12 to 15, the last four. Time's river, a throne under an aurora, the sky broken
    // into floating islands, and the bright edge where things begin.
    { name: 'Chrono Rift', sky: ['#04121a', '#1e5a6a'], horizon: 'clockwork', hz: ['#123440', '#ffd36b'], ground: ['#1e4650', '#122e36', '#2a5c68'], tex: 'circuit', feat: 'river', featC: '#ffd36b', low: { gear: 3, hourglass: 2, rune: 2, shard: 1 }, edge: 'obelisk', edgeC: ['#16303a', '#ffd36b'] },
    { name: 'Astral Throne', sky: ['#0a0620', '#4a2a8a'], horizon: 'aurora', hz: ['#7cf7c8', '#b46bff'], ground: ['#3a2a6a', '#24184a', '#4e3a86'], tex: 'glitter', feat: 'path', featC: '#ffe9a8', low: { starCluster: 2, rune: 2, crystal: 2, brazier: 1.5 }, edge: 'pillar', edgeC: ['#e8dcff', '#ffd36b'] },
    { name: 'Shattered Heavens', sky: ['#1a0a2e', '#ff7a9a'], horizon: 'islands', hz: ['#5a4a7a', '#9ad8ff'], ground: ['#5a4a72', '#3a2e52', '#72608e'], tex: 'stars', feat: 'chasm', featC: '#ff8fd1', low: { floatRock: 3, shard: 2, crystal: 2, feather: 1 }, edge: 'crystalSpire', edgeC: ['#ff8fd1', '#ffd6f0'] },
    { name: 'Edge of Creation', sky: ['#000000', '#ffe9b0'], horizon: 'genesis', hz: ['#fff3c6', '#ff8fd1'], ground: ['#d8b860', '#a8862e', '#ecd48e'], tex: 'glitter', feat: 'river', featC: '#ffffff', low: { flower: 3, crystal: 2, starCluster: 2, floatRock: 1 }, edge: 'crystalTree', edgeC: ['#fff3c6', '#8a6a2e'] },
  ];
  const LOW = [
    { name: 'Methane River', sky: ['#0a2a2a', '#3e8a7a'], horizon: 'mountains', hz: ['#1e4a46', '#123432'], ground: ['#2e6a5e', '#1e4a42', '#3e8272'], tex: 'grass', feat: 'river', featC: '#9dffcf', low: { geyser: 2, rock: 2, mushroomGlow: 2, flower: 2 }, edge: 'alienTree', edgeC: ['#4ec9a0', '#1e4a42'] },
    { name: 'Iron Core', sky: ['#1a0e08', '#7a3a1a'], horizon: 'mountains', hz: ['#3a2418', '#24160e'], ground: ['#4a3a32', '#2e241e', '#5e4a3e'], tex: 'metal', feat: 'lava', featC: '#ff9a3a', low: { gear: 2, rock: 3, lavaVent: 1 }, edge: 'pylonTall', edgeC: ['#3a2a22', '#ff9a3a'] },
    { name: 'Helium Canopy', sky: ['#ffd6f0', '#fff8e8'], horizon: 'clouds', hz: ['#ffe8f6', '#ffd6ea'], ground: ['#ffc6e6', '#f0a6d0', '#ffe0f2'], tex: 'cloud', feat: 'path', featC: '#ffffff', low: { balloon: 3, cloudPuff: 3, flower: 2 }, edge: 'alienTree', edgeC: ['#ff9ad6', '#c86aa0'] },
    { name: 'Ammonia Clouds', sky: ['#c6e8ff', '#f0f8ff'], horizon: 'clouds', hz: ['#e6f2ff', '#cfe4f6'], ground: ['#d6ecfa', '#aed2ec', '#eaf6ff'], tex: 'cloud', feat: 'river', featC: '#8ec9f0', low: { cloudPuff: 4, crystal: 1, feather: 2 }, edge: 'pillar', edgeC: ['#e8f2fa', '#8ec9f0'] },
    { name: 'Carbon Frost', sky: ['#0e1a2a', '#4a6a8a'], horizon: 'mountains', hz: ['#c6dcf0', '#8eaac6'], ground: ['#cfe2f2', '#a6c2dc', '#e6f2fc'], tex: 'ice', feat: 'river', featC: '#6ac2ff', low: { iceSpike: 3, rock: 2, crystal: 1.5 }, edge: 'iceSpire', edgeC: ['#e6f6ff', '#6ac2ff'] },
    { name: 'Nebula Shroud', sky: ['#1e0a2e', '#7a3a9a'], horizon: 'nebula', hz: ['#ff9ad6', '#8a6aff'], ground: ['#3a1e4e', '#26123a', '#4e2a66'], tex: 'stars', feat: 'path', featC: '#ff9ad6', low: { starCluster: 3, mushroomGlow: 2, crystal: 2 }, edge: 'alienTree', edgeC: ['#b46bff', '#3a1e4e'] },
    { name: 'Plasma Ocean', sky: ['#04102a', '#1e4aaa'], horizon: 'waves', hz: ['#3fd8ff', '#1e6aca'], ground: ['#1e3a7a', '#122656', '#2a4e96'], tex: 'water', feat: 'river', featC: '#7cf7ff', low: { coral: 3, bubbleCluster: 3, shell: 1.5 }, edge: 'coralTall', edgeC: ['#ff7ab6', '#3fd8ff'] },
    { name: 'Dark Energy Void', sky: ['#000000', '#0e1e3a'], horizon: 'void', hz: ['#3f6aff', '#9a3aff'], ground: ['#0e1428', '#060a16', '#18203a'], tex: 'stars', feat: 'chasm', featC: '#3f6aff', low: { shard: 3, rune: 2, starCluster: 2 }, edge: 'obelisk', edgeC: ['#141c34', '#3f6aff'] },
    { name: 'Antimatter Abyss', sky: ['#1a0000', '#5a0a2a'], horizon: 'spires', hz: ['#3a0a1e', '#1e0410'], ground: ['#3a0a22', '#220614', '#541032'], tex: 'veins', feat: 'chasm', featC: '#ff3a8a', low: { shard: 3, bones: 2, eyeOrb: 1 }, edge: 'thorn', edgeC: ['#2a0614', '#ff3a8a'] },
    { name: 'Gravitational Core', sky: ['#0a0414', '#3a1a6a'], horizon: 'blackhole', hz: ['#ffd36b', '#8a5cff'], ground: ['#241a40', '#140e28', '#342658'], tex: 'circuit', feat: 'path', featC: '#ffd36b', low: { gear: 1, rune: 3, shard: 2 }, edge: 'obelisk', edgeC: ['#241a40', '#ffd36b'] },
    { name: 'Hypernova Plain', sky: ['#2a0a00', '#ffb03a'], horizon: 'sunburst', hz: ['#ffe066', '#ff7a1a'], ground: ['#a8501e', '#7a3612', '#c8682a'], tex: 'glitter', feat: 'lava', featC: '#ffe066', low: { crystal: 2, ember: 4, rock: 2 }, edge: 'basalt', edgeC: ['#5a2410', '#ffe066'] },
    { name: 'Quantum Singularity', sky: ['#000000', '#002a2e'], horizon: 'blackhole', hz: ['#3ff6ff', '#ff2fe9'], ground: ['#001a1e', '#000a0e', '#002a30'], tex: 'circuit', feat: 'river', featC: '#3ff6ff', low: { shard: 3, rune: 2, eyeOrb: 1 }, edge: 'crystalSpire', edgeC: ['#3ff6ff', '#ff2fe9'] },
    // 1.5: prestige 12 to 15: a pulsar's beams, a magnetic storm, a reef round a wormhole, and the
    // rim of a quasar.
    { name: 'Pulsar Fields', sky: ['#020814', '#16306a'], horizon: 'pulsar', hz: ['#bdf3ff', '#6aa9ff'], ground: ['#16285a', '#0c1838', '#203a78'], tex: 'stars', feat: 'river', featC: '#7cf7ff', low: { crystal: 2, starCluster: 2, geyser: 1, shard: 2 }, edge: 'pylonTall', edgeC: ['#142a4a', '#7cf7ff'] },
    { name: 'Magnetar Storm', sky: ['#12001e', '#4a1a7a'], horizon: 'aurora', hz: ['#c86aff', '#3ff6ff'], ground: ['#2e1450', '#1c0a34', '#40206a'], tex: 'veins', feat: 'chasm', featC: '#c86aff', low: { shard: 3, rune: 2, eyeOrb: 1, floatRock: 1 }, edge: 'thorn', edgeC: ['#2a0e44', '#c86aff'] },
    { name: 'Wormhole Reef', sky: ['#001418', '#0a5a5a'], horizon: 'rings', hz: ['#3ff6c6', '#ff7ab6'], ground: ['#0e4a4a', '#063232', '#166262'], tex: 'water', feat: 'river', featC: '#3ff6c6', low: { coral: 3, bubbleCluster: 2, shell: 1, mushroomGlow: 1.5 }, edge: 'coralTall', edgeC: ['#3ff6c6', '#ff7ab6'] },
    { name: 'Event Horizon', sky: ['#000000', '#2a0e00'], horizon: 'quasar', hz: ['#ffcf3d', '#ff6a1a'], ground: ['#1a1008', '#0a0604', '#2a1a0c'], tex: 'glitter', feat: 'lava', featC: '#ffcf3d', low: { shard: 3, crystal: 2, ember: 2, floatRock: 1 }, edge: 'obelisk', edgeC: ['#1a1008', '#ffcf3d'] },
  ];
  const HUB = { name: 'Beast Hub', sky: ['#0a1030', '#3a2a7a'], horizon: 'planets', hz: ['#ffd36b', '#ff8fd1'], ground: ['#2a2a5a', '#1a1a3e', '#3a3a78'], tex: 'circuit', feat: 'path', featC: '#ffd36b', low: { rune: 3, starCluster: 2, gear: 1 }, edge: 'pylonTall', edgeC: ['#2a2a5a', '#ffd36b'] };

  // ---------------------------------------------------------------- helpers
  function rng(seed) {
    let a = 0;
    for (let i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) | 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  const shade = (h, amt) => { const c = hex(h); return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))).toString(16).padStart(2, '0')).join(''); };
  const pick = (R, weights) => { const e = Object.entries(weights); let s = e.reduce((a, [, w]) => a + w, 0) * R(); for (const [k, w] of e) { s -= w; if (s <= 0) return k; } return e[0][0]; };

  function outline(c, w, col) { c.lineWidth = w; c.strokeStyle = col; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  function blob(c, x, y, r, R, n = 9, wob = 0.22) {
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, rr = r * (1 - wob / 2 + R() * wob);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.62;
      if (i === 0) c.moveTo(px, py); else c.quadraticCurveTo(x + Math.cos(a - Math.PI / n) * rr * 1.08, y + Math.sin(a - Math.PI / n) * rr * 0.67, px, py);
    }
    c.closePath();
  }
  const glowAt = (c, x, y, r, col, a = 0.55) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  function star4(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y); c.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s); c.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y); c.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s); c.fill(); }

  // ---------------------------------------------------------------- props (x, y is the base, s the size)
  const PROPS = {
    flower(c, x, y, s, R, B) { const cols = ['#ff7ab6', '#ffd43b', '#ffffff', '#b46bff', '#ff8a3d']; for (let k = 0; k < 3; k++) { const fx = x + (R() - 0.5) * s * 1.6, fy = y + (R() - 0.5) * s * 0.6, col = cols[(R() * cols.length) | 0]; c.strokeStyle = shade(B.ground[1], -0.3); c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - s * 0.5); c.stroke(); for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; c.fillStyle = col; c.beginPath(); c.arc(fx + Math.cos(a) * s * 0.16, fy - s * 0.5 + Math.sin(a) * s * 0.16, s * 0.13, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#ffe066'; c.beginPath(); c.arc(fx, fy - s * 0.5, s * 0.09, 0, Math.PI * 2); c.fill(); } },
    bush(c, x, y, s, R, B) { const col = shade(B.ground[1], -0.1); for (const [dx, dy, r] of [[-0.34, -0.32, 0.36], [0.34, -0.32, 0.36], [0, -0.62, 0.42]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fillStyle = shade(col, dy < -0.5 ? 0.08 : 0); c.fill(); outline(c, s * 0.06, shade(col, -0.55)); } c.fillStyle = rgba('#ffffff', 0.2); c.beginPath(); c.arc(x - s * 0.12, y - s * 0.82, s * 0.14, 0, Math.PI * 2); c.fill(); for (let k = 0; k < 3; k++) { c.fillStyle = '#ff7ab6'; c.beginPath(); c.arc(x + (R() - 0.5) * s * 0.8, y - s * (0.3 + R() * 0.5), s * 0.05, 0, Math.PI * 2); c.fill(); } },
    rock(c, x, y, s, R, B) {
      // A rounded stone that stands on the ground (it read as a flat leaf before): grey, tinted by the biome.
      const base = shade('#8a8f99', 0), col = '#' + [0, 2, 4].map((i) => Math.round(parseInt(base.slice(1 + i, 3 + i), 16) * 0.7 + parseInt(B.ground[1].slice(1 + i, 3 + i), 16) * 0.3).toString(16).padStart(2, '0')).join('');
      c.fillStyle = rgba('#000000', 0.22); c.beginPath(); c.ellipse(x, y, s * 0.5, s * 0.12, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - s * 0.48, y); c.bezierCurveTo(x - s * 0.52, y - s * 0.5, x - s * 0.1, y - s * 0.72, x + s * 0.12, y - s * 0.62); c.bezierCurveTo(x + s * 0.42, y - s * 0.55, x + s * 0.55, y - s * 0.25, x + s * 0.48, y); c.closePath();
      const g = c.createLinearGradient(x - s * 0.4, y - s * 0.6, x + s * 0.4, y); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.25)); c.fillStyle = g; c.fill(); outline(c, s * 0.05, shade(col, -0.6));
      c.strokeStyle = rgba(shade(col, -0.5), 0.6); c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(x + s * 0.05, y - s * 0.55); c.lineTo(x - s * 0.02, y - s * 0.32); c.lineTo(x + s * 0.12, y - s * 0.18); c.stroke();
      c.fillStyle = rgba('#ffffff', 0.35); c.beginPath(); c.ellipse(x - s * 0.18, y - s * 0.45, s * 0.12, s * 0.06, -0.5, 0, Math.PI * 2); c.fill();
    },
    mushroom(c, x, y, s, R) { c.beginPath(); c.moveTo(x - s * 0.12, y); c.quadraticCurveTo(x - s * 0.14, y - s * 0.35, x - s * 0.09, y - s * 0.6); c.lineTo(x + s * 0.09, y - s * 0.6); c.quadraticCurveTo(x + s * 0.14, y - s * 0.35, x + s * 0.12, y); c.closePath(); c.fillStyle = '#f4ead6'; c.fill(); outline(c, s * 0.04, '#8a7a60'); c.beginPath(); c.moveTo(x - s * 0.42, y - s * 0.56); c.bezierCurveTo(x - s * 0.44, y - s * 1.05, x + s * 0.44, y - s * 1.05, x + s * 0.42, y - s * 0.56); c.quadraticCurveTo(x, y - s * 0.48, x - s * 0.42, y - s * 0.56); c.closePath(); c.fillStyle = '#e8413a'; c.fill(); outline(c, s * 0.05, '#5a1010'); for (const [dx, dy, r] of [[-0.2, -0.72, 0.06], [0.14, -0.82, 0.07], [0.22, -0.64, 0.045], [-0.04, -0.9, 0.04]]) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + dx * s, y + dy * s, s * r, 0, Math.PI * 2); c.fill(); } },
    mushroomGlow(c, x, y, s, R, B) { const col = B.featC; glowAt(c, x, y - s * 0.7, s * 0.9, col, 0.35); c.fillStyle = '#d8d0e8'; c.fillRect(x - s * 0.08, y - s * 0.58, s * 0.16, s * 0.58); c.beginPath(); c.moveTo(x - s * 0.38, y - s * 0.55); c.bezierCurveTo(x - s * 0.4, y - s * 1.0, x + s * 0.4, y - s * 1.0, x + s * 0.38, y - s * 0.55); c.quadraticCurveTo(x, y - s * 0.48, x - s * 0.38, y - s * 0.55); c.closePath(); c.fillStyle = col; c.fill(); outline(c, s * 0.05, shade(col, -0.6)); c.fillStyle = rgba('#ffffff', 0.6); c.beginPath(); c.arc(x - s * 0.12, y - s * 0.8, s * 0.06, 0, Math.PI * 2); c.fill(); },
    pond(c, x, y, s, R, B) { c.beginPath(); c.ellipse(x, y, s * 1.4, s * 0.62, 0, 0, Math.PI * 2); c.fillStyle = '#3fa8e0'; c.fill(); outline(c, s * 0.1, shade(B.ground[1], -0.35)); c.strokeStyle = rgba('#ffffff', 0.5); c.lineWidth = s * 0.06; c.beginPath(); c.ellipse(x - s * 0.3, y - s * 0.15, s * 0.5, s * 0.14, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); for (let k = 0; k < 3; k++) { c.fillStyle = '#5fbf4a'; c.beginPath(); c.ellipse(x + (R() - 0.5) * s * 1.6, y + (R() - 0.5) * s * 0.5, s * 0.16, s * 0.09, 0, 0, Math.PI * 2); c.fill(); } },
    lavaVent(c, x, y, s) { glowAt(c, x, y - s * 0.2, s * 1.1, '#ff7a1a', 0.45); c.beginPath(); c.moveTo(x - s * 0.7, y); c.quadraticCurveTo(x - s * 0.3, y - s * 0.7, x, y - s * 0.55); c.quadraticCurveTo(x + s * 0.3, y - s * 0.7, x + s * 0.7, y); c.closePath(); c.fillStyle = '#3a1c16'; c.fill(); outline(c, s * 0.06, '#1a0a08'); c.beginPath(); c.ellipse(x, y - s * 0.52, s * 0.22, s * 0.08, 0, 0, Math.PI * 2); c.fillStyle = '#ffcf3d'; c.fill(); },
    ember(c, x, y, s, R, B) { for (let k = 0; k < 4; k++) glowAt(c, x + (R() - 0.5) * s * 2, y + (R() - 0.5) * s, s * 0.14, B.featC, 0.9); },
    crystal(c, x, y, s, R, B) { const col = B.featC; glowAt(c, x, y - s * 0.4, s * 0.9, col, 0.25); for (const [dx, h, w, a] of [[-0.25, 0.7, 0.18, -0.25], [0.05, 1, 0.22, 0], [0.3, 0.6, 0.16, 0.3]]) { c.save(); c.translate(x + dx * s, y); c.rotate(a); c.beginPath(); c.moveTo(-w * s, 0); c.lineTo(-w * s, -h * s * 0.7); c.lineTo(0, -h * s); c.lineTo(w * s, -h * s * 0.7); c.lineTo(w * s, 0); c.closePath(); const g = c.createLinearGradient(-w * s, 0, w * s, 0); g.addColorStop(0, shade(col, 0.5)); g.addColorStop(1, shade(col, -0.25)); c.fillStyle = g; c.fill(); outline(c, s * 0.04, shade(col, -0.6)); c.restore(); } },
    cloudPuff(c, x, y, s, R, B) { c.fillStyle = rgba('#ffffff', 0.85); for (const [dx, dy, r] of [[-0.4, 0, 0.32], [0, -0.15, 0.42], [0.4, 0, 0.32]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); } c.strokeStyle = rgba(shade(B.ground[1], -0.2), 0.5); c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(x - s * 0.7, y + s * 0.22); c.lineTo(x + s * 0.7, y + s * 0.22); c.stroke(); },
    feather(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(-0.6); c.beginPath(); c.ellipse(0, -s * 0.3, s * 0.1, s * 0.34, 0, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill(); outline(c, s * 0.03, '#b8c8d8'); c.restore(); },
    starCluster(c, x, y, s, R, B) { for (let k = 0; k < 4; k++) star4(c, x + (R() - 0.5) * s * 1.6, y + (R() - 0.5) * s * 0.8, s * (0.08 + R() * 0.12), k % 2 ? '#ffffff' : shade(B.featC, 0.4)); },
    rune(c, x, y, s, R, B) { glowAt(c, x, y, s * 0.8, B.featC, 0.3); c.strokeStyle = B.featC; c.lineWidth = s * 0.06; c.beginPath(); c.ellipse(x, y, s * 0.5, s * 0.22, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x - s * 0.25, y); c.lineTo(x, y - s * 0.12); c.lineTo(x + s * 0.25, y); c.lineTo(x, y + s * 0.12); c.closePath(); c.stroke(); },
    bones(c, x, y, s) { c.strokeStyle = '#efe6d2'; c.lineWidth = s * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s * 0.4, y - s * 0.1); c.lineTo(x + s * 0.4, y + s * 0.05); c.moveTo(x - s * 0.3, y + s * 0.15); c.lineTo(x + s * 0.25, y - s * 0.2); c.stroke(); c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(x + s * 0.55, y - s * 0.25, s * 0.2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2a1a14'; c.beginPath(); c.arc(x + s * 0.5, y - s * 0.27, s * 0.05, 0, Math.PI * 2); c.arc(x + s * 0.61, y - s * 0.27, s * 0.05, 0, Math.PI * 2); c.fill(); },
    brazier(c, x, y, s) { glowAt(c, x, y - s * 0.7, s, '#ff7a1a', 0.5); c.fillStyle = '#3a2a2a'; c.fillRect(x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.5); c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.2, y - s * 0.35); c.lineTo(x - s * 0.2, y - s * 0.35); c.closePath(); c.fill(); c.fillStyle = '#ffb21a'; c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.5); c.quadraticCurveTo(x, y - s * 1.1, x + s * 0.2, y - s * 0.5); c.fill(); },
    gear(c, x, y, s, R, B) { c.save(); c.translate(x, y - s * 0.3); c.fillStyle = shade(B.ground[1], 0.15); c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? s * 0.4 : s * 0.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6); } c.closePath(); c.fill(); outline(c, s * 0.04, shade(B.ground[1], -0.5)); c.fillStyle = B.featC; c.beginPath(); c.ellipse(0, 0, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); c.fill(); c.restore(); },
    pylon(c, x, y, s, R, B) { glowAt(c, x, y - s, s * 0.6, B.featC, 0.4); c.fillStyle = shade(B.ground[1], 0.1); c.beginPath(); c.moveTo(x - s * 0.18, y); c.lineTo(x - s * 0.06, y - s); c.lineTo(x + s * 0.06, y - s); c.lineTo(x + s * 0.18, y); c.closePath(); c.fill(); outline(c, s * 0.04, shade(B.ground[1], -0.5)); c.fillStyle = B.featC; c.beginPath(); c.arc(x, y - s, s * 0.1, 0, Math.PI * 2); c.fill(); },
    tentacle(c, x, y, s, R, B) { c.save(); c.translate(x, y); const col = shade(B.ground[2], 0.15); c.beginPath(); c.moveTo(-s * 0.18, 0); c.bezierCurveTo(-s * 0.3, -s * 0.5, s * 0.25, -s * 0.6, s * 0.05, -s * 1.1); c.bezierCurveTo(s * 0.3, -s * 0.6, -s * 0.05, -s * 0.4, s * 0.18, 0); c.closePath(); c.fillStyle = col; c.fill(); outline(c, s * 0.05, shade(col, -0.6)); for (let k = 0; k < 3; k++) { c.fillStyle = B.featC; c.beginPath(); c.arc(-s * 0.02 + k * 0.03 * s, -s * (0.25 + k * 0.22), s * 0.04, 0, Math.PI * 2); c.fill(); } c.restore(); },
    eyeOrb(c, x, y, s, R, B) { glowAt(c, x, y - s * 0.3, s * 0.8, B.featC, 0.35); c.beginPath(); c.arc(x, y - s * 0.3, s * 0.3, 0, Math.PI * 2); c.fillStyle = '#f4f0e6'; c.fill(); outline(c, s * 0.04, '#2a1a2a'); c.fillStyle = B.featC; c.beginPath(); c.arc(x, y - s * 0.3, s * 0.15, 0, Math.PI * 2); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(x, y - s * 0.3, s * 0.07, 0, Math.PI * 2); c.fill(); },
    shard(c, x, y, s, R, B) { const col = B.featC; glowAt(c, x, y - s * 0.4, s * 0.7, col, 0.3); c.save(); c.translate(x, y); c.rotate((R() - 0.5) * 0.6); c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.2, -s * 0.3); c.lineTo(0, 0); c.lineTo(-s * 0.2, -s * 0.3); c.closePath(); c.fillStyle = shade(col, 0.2); c.fill(); outline(c, s * 0.04, shade(col, -0.6)); c.restore(); },
    geyser(c, x, y, s, R, B) { c.beginPath(); c.ellipse(x, y, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); c.fillStyle = shade(B.ground[1], -0.3); c.fill(); for (let k = 0; k < 3; k++) { c.fillStyle = rgba(B.featC, 0.35 - k * 0.08); c.beginPath(); c.arc(x + (k - 1) * s * 0.15, y - s * (0.4 + k * 0.35), s * (0.22 + k * 0.08), 0, Math.PI * 2); c.fill(); } },
    balloon(c, x, y, s, R) { const col = ['#ff7ab6', '#ffd43b', '#7cf7e8', '#b46bff'][(R() * 4) | 0]; c.strokeStyle = '#ffffff'; c.lineWidth = s * 0.03; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.1, y - s * 0.4, x, y - s * 0.7); c.stroke(); c.beginPath(); c.ellipse(x, y - s * 0.95, s * 0.24, s * 0.3, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); outline(c, s * 0.03, shade(col, -0.5)); },
    iceSpike(c, x, y, s) { for (const [dx, h] of [[-0.2, 0.7], [0.08, 1], [0.3, 0.55]]) { c.beginPath(); c.moveTo(x + dx * s - s * 0.12, y); c.lineTo(x + dx * s, y - h * s); c.lineTo(x + dx * s + s * 0.12, y); c.closePath(); c.fillStyle = '#e6f6ff'; c.fill(); outline(c, s * 0.035, '#6a9ac6'); } },
    coral(c, x, y, s, R) { const col = ['#ff7ab6', '#ffb03a', '#b46bff'][(R() * 3) | 0]; c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 0.6); c.moveTo(x, y - s * 0.3); c.lineTo(x - s * 0.25, y - s * 0.6); c.moveTo(x, y - s * 0.4); c.lineTo(x + s * 0.28, y - s * 0.7); c.stroke(); },
    bubbleCluster(c, x, y, s, R) { for (let k = 0; k < 5; k++) { c.strokeStyle = rgba('#dff8ff', 0.7); c.lineWidth = s * 0.03; c.beginPath(); c.arc(x + (R() - 0.5) * s, y - R() * s, s * (0.05 + R() * 0.1), 0, Math.PI * 2); c.stroke(); } },
    shell(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.3, y); c.quadraticCurveTo(x, y - s * 0.6, x + s * 0.3, y); c.closePath(); c.fillStyle = '#ffd6e6'; c.fill(); outline(c, s * 0.035, '#a0607a'); },
    // 1.5: an hourglass of the biome's light (Chrono Rift) and a rock floating over its shadow.
    hourglass(c, x, y, s, R, B) {
      const col = B.featC, wood = shade(B.ground[1], -0.35);
      glowAt(c, x, y - s * 0.45, s * 0.7, col, 0.25);
      c.fillStyle = wood; c.fillRect(x - s * 0.26, y - s * 0.06, s * 0.52, s * 0.06); c.fillRect(x - s * 0.26, y - s * 0.9, s * 0.52, s * 0.06);
      c.beginPath(); c.moveTo(x - s * 0.2, y - s * 0.84); c.lineTo(x + s * 0.2, y - s * 0.84); c.lineTo(x + s * 0.03, y - s * 0.47); c.lineTo(x + s * 0.2, y - s * 0.06); c.lineTo(x - s * 0.2, y - s * 0.06); c.lineTo(x - s * 0.03, y - s * 0.47); c.closePath();
      c.fillStyle = rgba('#ffffff', 0.22); c.fill(); outline(c, s * 0.035, shade(col, -0.5));
      c.beginPath(); c.moveTo(x - s * 0.13, y - s * 0.06); c.lineTo(x, y - s * 0.26); c.lineTo(x + s * 0.13, y - s * 0.06); c.closePath(); c.fillStyle = col; c.fill();
      c.beginPath(); c.moveTo(x - s * 0.1, y - s * 0.7); c.lineTo(x + s * 0.1, y - s * 0.7); c.lineTo(x, y - s * 0.52); c.closePath(); c.fill();
      c.strokeStyle = col; c.lineWidth = s * 0.025; c.beginPath(); c.moveTo(x, y - s * 0.5); c.lineTo(x, y - s * 0.26); c.stroke();
    },
    floatRock(c, x, y, s, R, B) {
      const col = shade(B.ground[1], 0.2), lift = s * (0.45 + R() * 0.25);
      c.fillStyle = rgba('#000000', 0.25); c.beginPath(); c.ellipse(x, y, s * 0.42, s * 0.1, 0, 0, Math.PI * 2); c.fill();
      const cy = y - lift - s * 0.25;
      c.beginPath(); c.moveTo(x - s * 0.46, cy); c.quadraticCurveTo(x - s * 0.3, cy - s * 0.2, x, cy - s * 0.16); c.quadraticCurveTo(x + s * 0.32, cy - s * 0.22, x + s * 0.46, cy); c.lineTo(x + s * 0.1, cy + s * 0.42); c.lineTo(x - s * 0.08, cy + s * 0.3); c.closePath();
      const g = c.createLinearGradient(x, cy - s * 0.2, x, cy + s * 0.4); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(1, shade(col, -0.45)); c.fillStyle = g; c.fill(); outline(c, s * 0.04, shade(col, -0.65));
      c.fillStyle = shade(B.ground[2], 0.1); c.beginPath(); c.ellipse(x, cy - s * 0.08, s * 0.38, s * 0.09, 0, 0, Math.PI * 2); c.fill();
      glowAt(c, x, cy + s * 0.35, s * 0.3, B.featC, 0.35);
    },
  };

  // Taller things that frame the edges of the world.
  const EDGES = {
    tree(c, x, y, s, R, B) { const [leaf, trunk] = B.edgeC; c.beginPath(); c.moveTo(x - s * 0.13, y); c.quadraticCurveTo(x - s * 0.08, y - s * 0.5, x - s * 0.07, y - s * 0.85); c.lineTo(x + s * 0.07, y - s * 0.85); c.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.13, y); c.closePath(); c.fillStyle = trunk; c.fill(); outline(c, s * 0.035, shade(trunk, -0.5)); for (const [dx, dy, r] of [[-0.3, -0.95, 0.32], [0.3, -0.95, 0.32], [0, -1.3, 0.42], [0, -1.0, 0.36]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fillStyle = shade(leaf, R() * 0.15 - 0.05); c.fill(); outline(c, s * 0.04, shade(leaf, -0.6)); } c.fillStyle = rgba('#ffffff', 0.16); c.beginPath(); c.arc(x - s * 0.14, y - s * 1.45, s * 0.14, 0, Math.PI * 2); c.fill(); },
    alienTree(c, x, y, s, R, B) { const [leaf, trunk] = B.edgeC; c.strokeStyle = trunk; c.lineWidth = s * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.2, y - s * 0.5, x - s * 0.05, y - s); c.stroke(); for (let k = 0; k < 3; k++) { glowAt(c, x - s * 0.05 + (k - 1) * s * 0.3, y - s * (0.95 + (k % 2) * 0.2), s * 0.4, leaf, 0.35); c.fillStyle = leaf; c.beginPath(); c.arc(x - s * 0.05 + (k - 1) * s * 0.3, y - s * (0.95 + (k % 2) * 0.2), s * 0.16, 0, Math.PI * 2); c.fill(); } },
    basalt(c, x, y, s, R, B) { const [col, glow] = B.edgeC; for (const [dx, h, w] of [[-0.3, 0.8, 0.22], [0, 1.15, 0.26], [0.3, 0.7, 0.22]]) { c.fillStyle = shade(col, R() * 0.2); c.fillRect(x + dx * s - w * s / 2, y - h * s, w * s, h * s); c.strokeStyle = shade(col, -0.5); c.lineWidth = s * 0.03; c.strokeRect(x + dx * s - w * s / 2, y - h * s, w * s, h * s); } glowAt(c, x, y, s * 0.6, glow, 0.25); },
    crystalSpire(c, x, y, s, R, B) { PROPS.crystal(c, x, y, s * 1.6, R, { featC: B.edgeC[(R() * 2) | 0] }); },
    pillar(c, x, y, s, R, B) { const [col, trim] = B.edgeC; const h = s * (0.9 + R() * 0.5); c.fillStyle = col; c.fillRect(x - s * 0.16, y - h, s * 0.32, h); c.strokeStyle = shade(col, -0.4); c.lineWidth = s * 0.03; c.strokeRect(x - s * 0.16, y - h, s * 0.32, h); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - s * 0.16 + k * s * 0.08, y - h + s * 0.06); c.lineTo(x - s * 0.16 + k * s * 0.08, y - s * 0.06); c.stroke(); } c.fillStyle = trim; c.fillRect(x - s * 0.22, y - h - s * 0.06, s * 0.44, s * 0.08); },
    obelisk(c, x, y, s, R, B) { const [col, glow] = B.edgeC; c.beginPath(); c.moveTo(x - s * 0.16, y); c.lineTo(x - s * 0.1, y - s * 1.2); c.lineTo(x, y - s * 1.35); c.lineTo(x + s * 0.1, y - s * 1.2); c.lineTo(x + s * 0.16, y); c.closePath(); c.fillStyle = col; c.fill(); outline(c, s * 0.03, shade(col, -0.5)); glowAt(c, x, y - s * 0.7, s * 0.3, glow, 0.6); c.fillStyle = glow; c.fillRect(x - s * 0.03, y - s * 0.9, s * 0.06, s * 0.35); },
    thorn(c, x, y, s, R, B) { const [col, glow] = B.edgeC; for (const [dx, h, a] of [[-0.25, 0.9, -0.2], [0.05, 1.3, 0.05], [0.3, 0.8, 0.3]]) { c.save(); c.translate(x + dx * s, y); c.rotate(a); c.beginPath(); c.moveTo(-s * 0.1, 0); c.quadraticCurveTo(-s * 0.02, -h * s * 0.6, s * 0.06, -h * s); c.quadraticCurveTo(s * 0.04, -h * s * 0.5, s * 0.1, 0); c.closePath(); c.fillStyle = col; c.fill(); outline(c, s * 0.03, glow); c.restore(); } },
    pylonTall(c, x, y, s, R, B) { PROPS.pylon(c, x, y, s * 1.4, R, { ground: [null, B.edgeC[0]], featC: B.edgeC[1] }); },
    tentacleTall(c, x, y, s, R, B) { PROPS.tentacle(c, x, y, s * 1.4, R, { ground: [null, null, B.edgeC[0]], featC: B.edgeC[1] }); },
    iceSpire(c, x, y, s) { PROPS.iceSpike(c, x, y, s * 1.5); },
    coralTall(c, x, y, s, R) { PROPS.coral(c, x, y, s * 1.6, R); },
    // 1.5 (Edge of Creation): a pale tree whose leaves are crystals of light.
    crystalTree(c, x, y, s, R, B) {
      const [leaf, trunk] = B.edgeC;
      c.strokeStyle = trunk; c.lineCap = 'round'; c.lineWidth = s * 0.12;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.1, y - s * 0.5, x, y - s * 0.9); c.stroke();
      c.lineWidth = s * 0.06;
      const tips = [[-0.38, -1.05], [0.36, -1.1], [0, -1.32], [-0.2, -0.75], [0.24, -0.8]];
      for (const [dx, dy] of tips) { c.beginPath(); c.moveTo(x, y - s * 0.7); c.lineTo(x + dx * s, y + dy * s); c.stroke(); }
      for (const [dx, dy] of tips) { glowAt(c, x + dx * s, y + dy * s, s * 0.32, leaf, 0.4); PROPS.crystal(c, x + dx * s, y + dy * s + s * 0.12, s * 0.42, R, { featC: leaf }); }
    },
  };

  // ---------------------------------------------------------------- the skyline
  function horizon(c, W, top, B, R) {
    const g = c.createLinearGradient(0, 0, 0, top);
    g.addColorStop(0, B.sky[0]); g.addColorStop(1, B.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, top + 2);
    const [h1, h2] = B.hz;
    const ridge = (y, amp, col, jag) => { c.beginPath(); c.moveTo(0, top); for (let x = 0; x <= W; x += W / 24) c.lineTo(x, y - (jag ? R() : Math.sin(x / W * Math.PI * 3 + R()) * 0.5 + 0.5) * amp); c.lineTo(W, top); c.closePath(); c.fillStyle = col; c.fill(); };
    const stars = (n) => { for (let i = 0; i < n; i++) star4(c, R() * W, R() * top * 0.9, 0.6 + R() * 1.8, rgba('#ffffff', 0.5 + R() * 0.5)); };
    switch (B.horizon) {
      case 'hills': ridge(top * 0.65, top * 0.3, shade(h1, 0.25), false); ridge(top * 0.85, top * 0.3, h1, false); for (let i = 0; i < 4; i++) { c.fillStyle = rgba('#ffffff', 0.8); const x = R() * W, y = R() * top * 0.4; for (const [dx, r] of [[-12, 10], [0, 14], [12, 10]]) { c.beginPath(); c.arc(x + dx, y, r, 0, Math.PI * 2); c.fill(); } } break;
      case 'mountains': ridge(top * 0.55, top * 0.45, shade(h1, 0.1), true); ridge(top * 0.85, top * 0.35, h2, true); break;
      case 'volcanoes': for (let i = 0; i < 3; i++) { const x = (i + 0.5) * W / 3 + (R() - 0.5) * 40, h = top * (0.55 + R() * 0.3); c.beginPath(); c.moveTo(x - h * 0.9, top); c.lineTo(x - h * 0.15, top - h); c.lineTo(x + h * 0.15, top - h); c.lineTo(x + h * 0.9, top); c.closePath(); c.fillStyle = h1; c.fill(); glowAt(c, x, top - h, h * 0.4, '#ff7a1a', 0.6); c.fillStyle = rgba('#555555', 0.35); c.beginPath(); c.arc(x + 10, top - h - 18, 14, 0, Math.PI * 2); c.arc(x + 24, top - h - 34, 18, 0, Math.PI * 2); c.fill(); } ridge(top * 0.92, top * 0.15, h2, true); break;
      case 'stalactites': for (let x = 0; x < W; x += 18 + R() * 20) { const h = top * (0.2 + R() * 0.6); c.beginPath(); c.moveTo(x - 9, 0); c.lineTo(x, h); c.lineTo(x + 9, 0); c.closePath(); c.fillStyle = h1; c.fill(); } ridge(top * 0.95, top * 0.2, h2, true); for (let i = 0; i < 12; i++) glowAt(c, R() * W, R() * top, 6, B.featC, 0.6); break;
      case 'clouds': for (let i = 0; i < 14; i++) { const x = R() * W, y = top * (0.4 + R() * 0.55), r = 16 + R() * 26; c.fillStyle = i % 2 ? h1 : h2; for (const [dx, f] of [[-r, 0.7], [0, 1], [r, 0.7]]) { c.beginPath(); c.arc(x + dx, y, r * f, 0, Math.PI * 2); c.fill(); } } break;
      case 'nebula': stars(80); for (let i = 0; i < 5; i++) glowAt(c, R() * W, R() * top, 60 + R() * 80, i % 2 ? h1 : h2, 0.35); ridge(top * 0.95, top * 0.18, shade(B.ground[0], -0.2), true); break;
      case 'planets': stars(90); { const x = W * (0.2 + R() * 0.6), r = top * 0.45; const g2 = c.createRadialGradient(x - r * 0.3, top * 0.55 - r * 0.3, r * 0.1, x, top * 0.55, r); g2.addColorStop(0, shade(h1, 0.4)); g2.addColorStop(1, shade(h1, -0.4)); c.fillStyle = g2; c.beginPath(); c.arc(x, top * 0.55, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = rgba(h2, 0.8); c.lineWidth = 4; c.beginPath(); c.ellipse(x, top * 0.55, r * 1.6, r * 0.3, -0.2, 0, Math.PI * 2); c.stroke(); c.fillStyle = h2; c.beginPath(); c.arc(W - x * 0.5, top * 0.3, r * 0.2, 0, Math.PI * 2); c.fill(); } break;
      case 'spires': ridge(top * 0.9, top * 0.15, h2, true); for (let i = 0; i < 9; i++) { const x = R() * W, h = top * (0.4 + R() * 0.55); c.beginPath(); c.moveTo(x - 10, top); c.lineTo(x - 3, top - h); c.lineTo(x + 3, top - h); c.lineTo(x + 10, top); c.closePath(); c.fillStyle = h1; c.fill(); glowAt(c, x, top - h, 10, B.featC, 0.7); } break;
      case 'towers': stars(30); for (let i = 0; i < 10; i++) { const x = R() * W, h = top * (0.3 + R() * 0.6), w = 10 + R() * 16; c.fillStyle = h1; c.fillRect(x - w / 2, top - h, w, h); for (let k = 0; k < 4; k++) { c.fillStyle = rgba(B.featC, 0.8); c.fillRect(x - w / 4, top - h + 8 + k * 12, w / 2, 3); } } break;
      case 'blackhole': stars(110); { const x = W * (0.3 + R() * 0.4), y = top * 0.5, r = top * 0.28; glowAt(c, x, y, r * 2.6, h1, 0.55); c.strokeStyle = rgba(h2, 0.9); c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, r * 2, r * 0.45, -0.25, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); } break;
      case 'void': stars(70); for (let i = 0; i < 3; i++) glowAt(c, R() * W, R() * top, 50 + R() * 50, i % 2 ? h1 : h2, 0.3); break;
      case 'waves': for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0, top); const y0 = top * (0.4 + k * 0.17); for (let x = 0; x <= W; x += 20) c.lineTo(x, y0 + Math.sin(x / 40 + k) * 6); c.lineTo(W, top); c.closePath(); c.fillStyle = k % 2 ? h1 : h2; c.globalAlpha = 0.7; c.fill(); c.globalAlpha = 1; } break;
      // 1.5 skylines.
      case 'clockwork': stars(40); for (let i = 0; i < 5; i++) { const x = (i + 0.5) * W / 5 + (R() - 0.5) * 30, r = top * (0.35 + R() * 0.35), cy = top * (0.85 + R() * 0.2); c.save(); c.translate(x, cy); c.rotate(R()); c.fillStyle = h1; c.beginPath(); for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, rr = k % 2 ? r : r * 0.86; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.strokeStyle = rgba(h2, 0.7); c.lineWidth = 2; c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.35, 0, Math.PI * 2); c.strokeStyle = rgba(h2, 0.9); c.lineWidth = 3; c.stroke(); c.restore(); } ridge(top * 0.96, top * 0.12, shade(h1, -0.3), true); break;
      case 'aurora': stars(90); for (let k = 0; k < 3; k++) { const y0 = top * (0.25 + k * 0.17); for (let x = 0; x < W; x += 3) { const y = y0 + Math.sin(x / (60 + k * 25) + k * 2) * top * 0.1, h = top * (0.12 + 0.08 * Math.sin(x / 35 + k)); const g = c.createLinearGradient(0, y - h, 0, y + h * 0.4); g.addColorStop(0, rgba(k % 2 ? h2 : h1, 0)); g.addColorStop(0.7, rgba(k % 2 ? h2 : h1, 0.4)); g.addColorStop(1, rgba(k % 2 ? h2 : h1, 0)); c.fillStyle = g; c.fillRect(x, y - h, 3, h * 1.4); } } ridge(top * 0.95, top * 0.16, shade(B.ground[0], -0.3), true); break;
      case 'islands': stars(30); for (let i = 0; i < 6; i++) { const x = R() * W, y = top * (0.25 + R() * 0.5), w = 26 + R() * 46; c.fillStyle = shade(h1, -0.2); c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.lineTo(x + w * 0.2, y + w * 0.9); c.lineTo(x - w * 0.3, y + w * 0.6); c.closePath(); c.fill(); c.fillStyle = h1; c.fillRect(x - w, y - 5, w * 2, 6); c.strokeStyle = rgba(h2, 0.7); c.lineWidth = 3; c.beginPath(); c.moveTo(x + w * 0.5, y); c.lineTo(x + w * 0.5, Math.min(top, y + w * 1.6)); c.stroke(); glowAt(c, x, y, w * 0.8, h2, 0.15); } break;
      case 'genesis': { const x = W * 0.5, y = top * 0.55; glowAt(c, x, y, top * 1.6, h1, 0.8); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; c.fillStyle = rgba('#ffffff', 0.18); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * W, y + Math.sin(a) * W); c.lineTo(x + Math.cos(a + 0.06) * W, y + Math.sin(a + 0.06) * W); c.closePath(); c.fill(); } for (let k = 1; k <= 3; k++) { c.strokeStyle = rgba(h2, 0.55 - k * 0.12); c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, top * 0.35 * k, top * 0.1 * k, -0.15, 0, Math.PI * 2); c.stroke(); } glowAt(c, x, y, top * 0.25, '#ffffff', 1); ridge(top * 0.95, top * 0.18, shade(B.ground[0], -0.15), false); } break;
      case 'pulsar': stars(120); { const x = W * (0.3 + R() * 0.4), y = top * 0.45; for (const a of [-1.1, 2.04]) { const g = c.createLinearGradient(x, y, x + Math.cos(a) * W * 0.6, y + Math.sin(a) * W * 0.6); g.addColorStop(0, rgba(h1, 0.85)); g.addColorStop(1, rgba(h2, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - 0.06) * W * 0.6, y + Math.sin(a - 0.06) * W * 0.6); c.lineTo(x + Math.cos(a + 0.06) * W * 0.6, y + Math.sin(a + 0.06) * W * 0.6); c.closePath(); c.fill(); } glowAt(c, x, y, top * 0.5, h2, 0.6); glowAt(c, x, y, top * 0.12, '#ffffff', 1); } ridge(top * 0.95, top * 0.15, shade(B.ground[0], -0.25), true); break;
      case 'rings': stars(80); { const x = W * (0.35 + R() * 0.3), y = top * 0.5; for (let k = 7; k >= 1; k--) { c.strokeStyle = rgba(k % 2 ? h1 : h2, 0.25 + 0.08 * (7 - k)); c.lineWidth = 3 + k * 0.6; c.beginPath(); c.ellipse(x, y, top * 0.1 * k, top * 0.06 * k, 0.3, 0, Math.PI * 2); c.stroke(); } c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, top * 0.08, top * 0.05, 0.3, 0, Math.PI * 2); c.fill(); } ridge(top * 0.95, top * 0.18, shade(B.ground[0], -0.2), false); break;
      case 'quasar': stars(110); { const x = W * (0.3 + R() * 0.4), y = top * 0.55, r = top * 0.2; glowAt(c, x, y, r * 3, h2, 0.5); for (const d of [-1, 1]) { const g = c.createLinearGradient(x, y, x, y + d * top); g.addColorStop(0, rgba(h1, 0.95)); g.addColorStop(1, rgba(h1, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(x - r * 0.25, y); c.lineTo(x - r * 0.08, y + d * top * 1.2); c.lineTo(x + r * 0.08, y + d * top * 1.2); c.lineTo(x + r * 0.25, y); c.closePath(); c.fill(); } c.strokeStyle = rgba(h1, 0.9); c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, r * 2.2, r * 0.4, 0.15, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, r * 0.8, 0, Math.PI * 2); c.fill(); } break;
      case 'sunburst': { const x = W / 2, y = top * 0.7; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; c.fillStyle = rgba(h1, 0.25); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * W, y + Math.sin(a) * W); c.lineTo(x + Math.cos(a + 0.12) * W, y + Math.sin(a + 0.12) * W); c.closePath(); c.fill(); } glowAt(c, x, y, top * 0.6, h1, 0.9); ridge(top * 0.95, top * 0.2, shade(h2, -0.3), true); } break;
    }
    // A soft edge where the sky meets the ground.
    const fade = c.createLinearGradient(0, top - 24, 0, top + 30);
    fade.addColorStop(0, rgba(B.ground[0], 0)); fade.addColorStop(1, rgba(B.ground[0], 1));
    c.fillStyle = fade; c.fillRect(0, top - 24, W, 54);
  }

  // ---------------------------------------------------------------- the ground
  function ground(c, W, H, top, B, R, q) {
    const g = c.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, B.ground[0]); g.addColorStop(1, B.ground[1]);
    c.fillStyle = g; c.fillRect(0, top, W, H - top);
    // Big soft patches of lighter and darker ground.
    for (let i = 0; i < 26; i++) glowAt(c, R() * W, top + R() * (H - top), (60 + R() * 140) * q, i % 2 ? B.ground[2] : shade(B.ground[1], -0.2), 0.35);
    // Texture.
    const n = Math.round((W * (H - top)) / (900 * q * q));
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = top + R() * (H - top), s = (2 + R() * 4) * q;
      switch (B.tex) {
        case 'grass': c.strokeStyle = rgba(i % 3 ? shade(B.ground[2], 0.15) : shade(B.ground[1], -0.25), 0.7); c.lineWidth = 1.2 * q; c.beginPath(); c.moveTo(x, y); c.lineTo(x - s * 0.4, y - s); c.moveTo(x, y); c.lineTo(x + s * 0.3, y - s * 1.1); c.stroke(); break;
        case 'ash': c.fillStyle = rgba(i % 4 ? shade(B.ground[1], -0.3) : '#ff7a1a', i % 4 ? 0.5 : 0.35); c.fillRect(x, y, s * 0.6, s * 0.6); break;
        case 'crystal': if (i % 6 === 0) star4(c, x, y, s * 0.7, rgba(B.featC, 0.7)); else { c.fillStyle = rgba(shade(B.ground[2], 0.2), 0.4); c.fillRect(x, y, s * 0.5, s * 0.5); } break;
        case 'cloud': c.fillStyle = rgba('#ffffff', 0.35); c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); break;
        case 'stars': if (i % 3 === 0) star4(c, x, y, s * 0.5, rgba('#ffffff', 0.4 + R() * 0.5)); else { c.fillStyle = rgba(shade(B.ground[2], 0.3), 0.35); c.fillRect(x, y, 1.4 * q, 1.4 * q); } break;
        case 'circuit': if (i % 5 === 0) { c.strokeStyle = rgba(B.featC, 0.35); c.lineWidth = 1.2 * q; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 4, y); c.lineTo(x + s * 4, y + s * 3); c.stroke(); c.fillStyle = rgba(B.featC, 0.6); c.fillRect(x + s * 4 - q, y + s * 3 - q, 2.4 * q, 2.4 * q); } break;
        case 'veins': if (i % 7 === 0) { c.strokeStyle = rgba(B.featC, 0.3); c.lineWidth = 1.4 * q; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 3, y - s * 2, x + s * 6, y + s); c.stroke(); } else { c.fillStyle = rgba(shade(B.ground[2], 0.15), 0.3); c.fillRect(x, y, s * 0.5, s * 0.5); } break;
        case 'metal': c.strokeStyle = rgba(shade(B.ground[2], 0.25), 0.25); c.lineWidth = q; c.strokeRect(x, y, s * 3, s * 2); break;
        case 'ice': c.strokeStyle = rgba('#ffffff', 0.45); c.lineWidth = 1.2 * q; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 2, y + s * 0.6); c.stroke(); break;
        case 'water': c.strokeStyle = rgba('#bdf3ff', 0.3); c.lineWidth = 1.4 * q; c.beginPath(); c.arc(x, y, s * 1.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); break;
        case 'glitter': if (i % 4 === 0) star4(c, x, y, s * 0.6, rgba(i % 8 ? '#ffe066' : '#ffffff', 0.7)); break;
      }
    }
  }

  // A winding band from the top of the ground to the bottom.
  function feature(c, W, H, top, B, R, q) {
    if (B.feat === 'none') return null;
    const pts = [];
    let x = W * (0.25 + R() * 0.5);
    for (let y = top + (H - top) * 0.04; y <= H + 40; y += 70 * q) { pts.push([x, y]); x = Math.max(W * 0.12, Math.min(W * 0.88, x + (R() - 0.5) * 160 * q)); }
    const trace = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); };
    const w = { path: 26, river: 30, lava: 30, chasm: 18 }[B.feat] * q;
    // Points along the curve as it is drawn (the same quadratic pieces as trace()).
    const samples = [];
    let cx0 = pts[0][0], cy0 = pts[0][1];
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      for (let k = 0; k <= 10; k++) { const u = k / 10, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; samples.push([a * cx0 + b * pts[i][0] + d * mx, a * cy0 + b * pts[i][1] + d * my]); }
      cx0 = mx; cy0 = my;
    }
    samples.push(pts[pts.length - 1]);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (B.feat === 'path') {
      trace(); c.strokeStyle = shade(B.featC, -0.35); c.lineWidth = w + 8 * q; c.stroke();
      trace(); c.strokeStyle = B.featC; c.lineWidth = w; c.stroke();
      for (let i = 0; i < pts.length * 6; i++) { const p = pts[(R() * pts.length) | 0]; c.fillStyle = rgba(shade(B.featC, -0.25), 0.6); c.beginPath(); c.ellipse(p[0] + (R() - 0.5) * w * 0.7, p[1] + (R() - 0.5) * 60 * q, 4 * q, 2.6 * q, 0, 0, Math.PI * 2); c.fill(); }
    } else if (B.feat === 'chasm') {
      trace(); c.strokeStyle = rgba(B.featC, 0.35); c.lineWidth = w + 26 * q; c.stroke();
      trace(); c.strokeStyle = '#05000a'; c.lineWidth = w; c.stroke();
      trace(); c.strokeStyle = rgba(B.featC, 0.8); c.lineWidth = 3 * q; c.stroke();
    } else {
      // River or lava: banks, flow, light on the surface.
      trace(); c.strokeStyle = shade(B.ground[1], -0.4); c.lineWidth = w + 14 * q; c.stroke();
      if (B.feat === 'lava') { trace(); c.strokeStyle = rgba(B.featC, 0.35); c.lineWidth = w + 40 * q; c.stroke(); }
      trace(); c.strokeStyle = B.feat === 'lava' ? shade(B.featC, -0.2) : B.featC; c.lineWidth = w; c.stroke();
      trace(); c.strokeStyle = rgba(B.feat === 'lava' ? '#ffe066' : '#ffffff', 0.3); c.lineWidth = w * 0.3; c.stroke();
      for (let i = 0; i < pts.length * 3; i++) { const p = pts[(R() * pts.length) | 0]; c.strokeStyle = rgba(B.feat === 'lava' ? '#fff3a8' : '#ffffff', 0.55); c.lineWidth = 1.6 * q; c.beginPath(); c.arc(p[0] + (R() - 0.5) * w * 0.5, p[1] + (R() - 0.5) * 50 * q, 5 * q, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    }
    // How far its edge reaches either side of the line (banks, glow and all).
    return { samples, half: w / 2 + ({ path: 6, river: 9, lava: 22, chasm: 14 }[B.feat] || 6) * q };
  }

  // ---------------------------------------------------------------- paint
  function paint(B, W, H, q) {
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * q);
    cv.height = Math.round(H * q);
    const c = cv.getContext('2d');
    const R = rng(B.name);
    const CW = cv.width, CH = cv.height;
    const top = CH * 0.085;
    horizon(c, CW, top, B, R);
    ground(c, CW, CH, top, B, R, q);
    const feat = feature(c, CW, CH, top, B, R, q);
    // Every prop is planned first, each only where nothing else is (the path or river and its
    // banks, the edge trees, other props), then all are drawn back to front so nearer things sit in
    // front. Footprints are ellipses a little taller than wide: a prop rises above where it stands.
    // (Props are one size everywhere: the world is seen from above, and when zoomed out a size that
    // grew towards the bottom read as strange, Sam 15 Nov.)
    const persp = () => 1;
    const FOOT = { hourglass: 0.4, floatRock: 0.55, flower: 0.95, bush: 0.85, rock: 0.62, mushroom: 0.55, mushroomGlow: 0.55, pond: 1.55, lavaVent: 0.8, ember: 0.9, crystal: 0.7, cloudPuff: 0.85, feather: 0.4, starCluster: 0.9, rune: 0.65, bones: 0.8, brazier: 0.45, gear: 0.6, pylon: 0.4, tentacle: 0.45, eyeOrb: 0.45, shard: 0.35, geyser: 0.6, balloon: 0.4, iceSpike: 0.55, coral: 0.5, bubbleCluster: 0.6, shell: 0.4 };
    const taken = [];
    const plan = [];
    const path = feat ? feat.samples : [];
    const gap = 4 * q;
    const nearPath = (x, y, r) => { for (const [px, py] of path) { const dx = px - x, dy = py - y; if (Math.abs(dy) > r + feat.half + 40 * q) continue; if (Math.hypot(dx, dy) < feat.half + r + gap) return true; } return false; };
    const free = (x, y, r) => {
      if (x < r || x > CW - r || y < top + r * 0.6 || y > CH - r * 0.5) return false;
      if (path.length && nearPath(x, y, r)) return false;
      for (const o of taken) { const dx = o.x - x, dy = (o.y - y) * 1.35; if (dx * dx + dy * dy < (o.r + r + gap) * (o.r + r + gap)) return false; }
      return true;
    };
    const take = (x, y, r) => taken.push({ x, y, r });
    // The edge things first: they claim the borders.
    const edge = EDGES[B.edge];
    const edgePlan = [];
    if (edge) {
      for (let y = top + 40 * q; y < CH; y += 46 * q) { edgePlan.push([8 * q + R() * 30 * q, y]); edgePlan.push([CW - 8 * q - R() * 30 * q, y]); }
      for (let x = 40 * q; x < CW - 40 * q; x += 50 * q) edgePlan.push([x + R() * 20 * q, CH - 4 * q - R() * 18 * q]);
      for (const e of edgePlan) { e.push((34 + R() * 18) * q); }
      for (let i = edgePlan.length - 1; i >= 0; i--) { const [x, y, s] = edgePlan[i]; if (path.length && nearPath(x, y, s * 0.3)) edgePlan.splice(i, 1); else take(x, y - s * 0.3, s * 0.42); }
    }
    // Patches: clusters of one kind of detail (a flower meadow, a field of stones, a bed of crystals).
    const clusterN = Math.round((CW * CH) / (60000 * q * q));
    for (let i = 0; i < clusterN; i++) {
      const cx = CW * (0.1 + R() * 0.8), cy = top + 50 * q + R() * (CH - top - 80 * q);
      const kind = pick(R, B.low);
      if (!PROPS[kind]) continue;
      if (!path.length || !nearPath(cx, cy, 30 * q)) glowAt(c, cx, cy, 70 * q, i % 2 ? B.ground[2] : shade(B.ground[1], -0.25), 0.4);
      const m = 5 + ((R() * 6) | 0);
      for (let k = 0, tries = 0; k < m && tries < m * 5; tries++) {
        const a = R() * Math.PI * 2, rr = R() * 62 * q;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.6;
        const s = (16 + R() * 14) * q * persp(y), fr = s * (FOOT[kind] || 0.6);
        if (!free(x, y, fr)) continue;
        take(x, y, fr); plan.push([kind, x, y, s]); k++;
      }
    }
    // Single details over the rest of the open ground, larger towards the bottom (nearer).
    const lowN = Math.round((CW * CH) / (6500 * q * q));
    for (let i = 0, tries = 0; i < lowN && tries < lowN * 4; tries++) {
      const x = R() * CW, y = top + 30 * q + R() * (CH - top - 40 * q);
      const kind = pick(R, B.low);
      if (!PROPS[kind]) continue;
      const s = (16 + R() * 16) * q * persp(y), fr = s * (FOOT[kind] || 0.6);
      if (!free(x, y, fr)) continue;
      take(x, y, fr); plan.push([kind, x, y, s]); i++;
    }
    // Ponds and other flat things first (they lie on the ground), then everything by depth.
    const flat = new Set(['pond', 'rune', 'ember', 'starCluster', 'bubbleCluster', 'feather']);
    plan.sort((A, Bp) => (flat.has(A[0]) === flat.has(Bp[0]) ? A[2] - Bp[2] : flat.has(A[0]) ? -1 : 1));
    const all = plan.map(([k, x, y, s]) => ({ y, draw: () => PROPS[k](c, x, y, s, R, B), flat: flat.has(k) }));
    if (edge) for (const [x, y, s] of edgePlan) all.push({ y, draw: () => edge(c, x, y, s, R, B), flat: false });
    all.sort((A, Bp) => (A.flat === Bp.flat ? A.y - Bp.y : A.flat ? -1 : 1));
    for (const o of all) o.draw();
    // Darker corners frame the world.
    const v = c.createRadialGradient(CW / 2, CH * 0.55, Math.min(CW, CH) * 0.35, CW / 2, CH * 0.55, Math.max(CW, CH) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = v; c.fillRect(0, 0, CW, CH);
    return cv;
  }

  const cache = new Map();
  let shown = null;
  // Two copies of the biome: full sharpness for normal and close zoom, and a half-size one smoothed
  // down once, for zoomed out. (Shrinking the sharp copy on the fly made the small flowers, rocks and
  // mushrooms shimmer and lose their shape when zoomed out, Sam 15 Nov.) Both cover the world
  // exactly, so props keep their size against the beasts at every zoom.
  function halfCopy(cv) {
    const h = document.createElement('canvas');
    h.width = Math.max(1, Math.round(cv.width / 2));
    h.height = Math.max(1, Math.round(cv.height / 2));
    const c = h.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(cv, 0, 0, h.width, h.height);
    return h;
  }
  /** Which copy suits this zoom: the half one once the full one would be shrunk to under half. */
  function zoomChanged(z) {
    if (!shown) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const worldW = (typeof WORLD !== 'undefined' ? WORLD.worldSize().w : shown.full.width);
    const scaleOnScreen = (worldW * z * dpr) / shown.full.width;
    const useHalf = scaleOnScreen < 0.5;
    shown.full.style.visibility = useHalf ? 'hidden' : 'visible';
    shown.half.style.visibility = useHalf ? 'visible' : 'hidden';
  }
  /** The canvas for the biome being played, into #meadow-bg (the old CSS layers hidden). */
  function show() {
    const bg = document.getElementById('meadow-bg');
    if (!bg || typeof WORLD === 'undefined') return;
    let B;
    if (state.inBeastHub) B = HUB;
    else {
      const list = state.currentSolarSystem === 'low_gravity' ? LOW : PRIME;
      B = list[Math.min(state.prestigeLevel || 0, list.length - 1)];
    }
    const { w, h } = WORLD.worldSize();
    // Sharp at the closest zoom on the screen's own pixels, within what a phone's canvas allows.
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const q = Math.max(1, Math.min(dpr * 1.25, 4096 / Math.max(w, h), Math.sqrt(1.2e7 / (w * h))));
    const key = `${B.name}|${Math.round(w)}x${Math.round(h)}`;
    let pair = cache.get(key);
    if (!pair) {
      const full = paint(B, w, h, q);
      pair = { full, half: halfCopy(full) };
      cache.clear();
      cache.set(key, pair);
    }
    bg.classList.add('bg-v2');
    bg.querySelectorAll('canvas.biome-canvas').forEach((e) => { if (e !== pair.full && e !== pair.half) e.remove(); });
    for (const cv of [pair.half, pair.full]) if (!cv.parentNode) { cv.className = 'biome-canvas'; bg.prepend(cv); }
    shown = pair;
    zoomChanged(WORLD.zoom());
  }

  return { show, paint, zoomChanged, PRIME, LOW, HUB };
})();

// Every time the game sets the biome's backdrop, paint the new one over it.
if (typeof applyBiomeBg === 'function') {
  const applyBiomeBg0 = applyBiomeBg;
  // eslint-disable-next-line no-global-assign
  let lastPlace = '';
  applyBiomeBg = function (level) {
    applyBiomeBg0(level);
    try { BIOMES.show(); } catch (e) { console.error('Biome paint failed', e); }
    // Somewhere new (a prestige, the other solar system, the hub): the camera starts in the middle,
    // where the game puts the first beasts.
    const place = `${state.inBeastHub ? 'hub' : state.currentSolarSystem}|${level}`;
    if (place !== lastPlace) { if (lastPlace && typeof WORLD !== 'undefined') WORLD.centre(); lastPlace = place; }
  };
}
