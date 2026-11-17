/**
 * Merge Beasts battle mode (1.4): one battle, as numbers. Units walk, find the nearest enemy in
 * reach, fight it, and walk on to the other side's coin pile and take from it. No drawing: the
 * screen (battle.js) reads the units and the events, and the balance tool runs whole battles in
 * Node (tools/battle_sim.mjs). The arena is ARENA.w by ARENA.h units; your pile at the bottom.
 */
const BattleEngine = (() => {
  const ARENA = { w: 1000, h: 2000 };
  const PILE_R = 72;
  const PILES = { you: { x: 500, y: 1880 }, foe: { x: 500, y: 120 } };
  /** How far from its own edge the home band runs: past the middle, a unit heads for the pile. */
  const HOME = 520;
  /** A unit this close to its own pile (up the field) guards it: it goes for attackers within ALERT. */
  const GUARD = 460;
  const ALERT = 420;
  /** How far ahead (and to the side) a walking unit notices an enemy and moves across to meet it. */
  const SIGHT = 380;
  const SIGHT_SIDE = 200;
  const MAX_YOURS = 10;
  const DYING = 0.7;
  /** Before the first blow of a fight, a moment to square up. */
  const SQUARE_UP = 0.35;

  let nextId = 1;

  function unitFrom(side, kind, stats, radius, extra = {}) {
    const n = BATTLE_DATA.battleNumbers(stats);
    const hpMul = extra.hpMul || 1;
    return {
      uid: nextId++, side, kind, stats, r: radius,
      maxHp: n.maxHp * hpMul, hp: n.maxHp * hpMul, light: n.light, speed: n.speed, reach: n.reach,
      multi: extra.multi || 1, boss: !!extra.boss,
      x: 0, y: 0, state: 'walk', target: null, swing: 0, swings: 0, age: 0, dyingT: 0,
      lastSwing: -9, lastHeavy: false, lastHurt: -9, capturing: false,
    };
  }

  class Battle {
    /**
     * `level` from BATTLE_DATA.level; `deck` a list of { id, prestige } (up to six). Perks:
     * `opts.fury` makes every third swing heavy (five times the light hit) instead of every fifth,
     * `opts.rest` scales how long cards rest, `opts.pile` is your pile's seconds.
     */
    constructor(level, deck, opts = {}) {
      this.level = level;
      this.cards = deck.map((c) => {
        const stats = BATTLE_DATA.beastStats(c.id, c.prestige || 0);
        return { id: c.id, prestige: c.prestige || 0, stats, cooldown: BATTLE_DATA.cooldownOf(c.id) * (opts.rest || 1), ready: 0 };
      });
      this.heavyEvery = opts.fury ? 3 : 5;
      this.perk = opts.perk || null;
      this.units = [];
      this.time = 0;
      this.piles = { you: opts.pile || level.pile, foe: level.pile };
      this.pileMax = { you: this.piles.you, foe: level.pile };
      this.queue = level.spawns.map((s) => ({ ...s }));
      this.loop = 0;
      this.events = [];
      this.result = null;
      this.endAt = null;
      this.seen = new Set();
      this.deployed = 0;
      this.hurry = 0;
      this.maxTierUsed = 0;
    }

    get yours() { return this.units.filter((u) => u.side === 'you' && u.state !== 'dying'); }
    get foes() { return this.units.filter((u) => u.side === 'foe' && u.state !== 'dying'); }

    /** Whether card `i` can be played now. */
    canDeploy(i) {
      const c = this.cards[i];
      return !this.result && !!c && this.time >= c.ready && this.yours.length < MAX_YOURS;
    }

    /** Play card `i` at `x` across your safe zone (0 to 1). */
    deploy(i, xFrac) {
      if (!this.canDeploy(i)) return null;
      const c = this.cards[i];
      const r = BATTLE_DATA.beastRadius(c.id);
      const u = unitFrom('you', c.id, c.stats, r);
      let x = Math.max(r + 10, Math.min(ARENA.w - r - 10, xFrac * ARENA.w));
      // Not on top of your own coin pile: to whichever side of it was nearer.
      const gap = PILE_R + r + 6;
      if (Math.abs(x - PILES.you.x) < gap) x = PILES.you.x + (x < PILES.you.x ? -gap : gap);
      u.x = x;
      u.y = PILES.you.y - 30;
      this.units.push(u);
      c.ready = this.time + c.cooldown;
      this.deployed++;
      this.maxTierUsed = Math.max(this.maxTierUsed, (BEAST_TEMPLATES[c.id] || { tier: 1 }).tier);
      this.events.push({ type: 'deploy', unit: u });
      return u;
    }

    spawnFoe(s) {
      const e = BATTLE_DATA.ENEMIES[s.foe];
      const role = BATTLE_DATA.ROLES[e.role];
      const u = unitFrom('foe', e.id, BATTLE_DATA.enemyStats(e.id, this.level.points), BATTLE_DATA.enemyRadius(e.id), { hpMul: role.hp || 1, multi: role.multi || 1, boss: e.role === 'boss' });
      // Out of their camp around the pile (the middle half of the width), so it is defended.
      const fx = 0.25 + 0.5 * s.x;
      u.x = Math.max(u.r + 10, Math.min(ARENA.w - u.r - 10, fx * ARENA.w));
      const gap = PILE_R + u.r + 6;
      if (Math.abs(u.x - PILES.foe.x) < gap) u.x = PILES.foe.x + (u.x < PILES.foe.x ? -gap : gap);
      u.y = PILES.foe.y + 50;
      this.units.push(u);
      this.seen.add(e.id);
      this.events.push({ type: 'spawn', unit: u });
    }

    /** The level's defenders, out beside their pile. */
    rally() {
      (this.level.rally || []).forEach((id, i) => this.spawnFoe({ foe: id, x: 0.5 + (i % 2 ? 1 : -1) * (0.12 + 0.05 * i) }));
      this.events.push({ type: 'rally' });
    }

    /** Advance the battle by `dt` seconds (call in steps of a tenth of a second or less). */
    step(dt) {
      if (this.result) {
        for (const u of this.units) if (u.state === 'dying') u.dyingT += dt;
        this.units = this.units.filter((u) => u.state !== 'dying' || u.dyingT < DYING);
        return;
      }
      this.time += dt;
      // Enemies arrive on the level's schedule, when there is room; the schedule repeats (without
      // its boss) for as long as the battle goes on.
      const foeCount = this.foes.length;
      let room = this.level.maxEnemies - foeCount;
      while (this.queue.length && this.queue[0].t + this.loop <= this.time && room > 0) {
        this.spawnFoe(this.queue.shift());
        room--;
      }
      // While their pile is being taken, the next of them comes out at once (every 2.5 s at most).
      if (this.units.some((u) => u.side === 'you' && u.state === 'capture') && this.time >= this.hurry && this.queue.length && room > -2) {
        const s = this.queue.shift();
        this.spawnFoe({ ...s, x: 0.5 + (s.x - 0.5) * 0.4 });
        this.hurry = this.time + 2.5;
      }
      if (!this.queue.length) {
        this.loop = this.time;
        this.queue = this.level.spawns.filter((s) => !s.boss && s.t > 4).map((s) => ({ ...s, t: s.t - 4 }));
      }
      for (const u of this.units) {
        u.age += dt;
        if (u.state === 'dying') { u.dyingT += dt; continue; }
        this.think(u, dt);
      }
      this.units = this.units.filter((u) => u.state !== 'dying' || u.dyingT < DYING);
      this.spread(dt);
      // Coin piles.
      for (const side of ['you', 'foe']) {
        const takers = this.units.filter((u) => u.side !== side && u.state === 'capture').length;
        if (takers) {
          const was = this.piles[side];
          this.piles[side] = Math.max(0, was - takers * dt);
          if (this.piles[side] <= 0) { this.finish(side === 'foe' ? 'won' : 'lost'); return; }
          // Their defenders come out as soon as their pile is touched, and again at 10 s and 5 s.
          if (side === 'foe') for (const mark of [this.level.pile - 0.01, 10, 5]) if (was > mark && this.piles.foe <= mark) this.rally();
        }
      }
    }

    /**
     * Units of one side do not stand inside each other: an overlapping pair eases apart, mostly
     * sideways so the line keeps walking (ten beasts played at one marker stood on one spot).
     */
    spread(dt) {
      const live = this.units.filter((u) => u.state !== 'dying');
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i], b = live[j];
          if (a.side !== b.side) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.8;
          if (d >= min) continue;
          const push = Math.min((min - d) / 2, 90 * dt);
          const nx = d > 0.01 ? dx / d : (a.uid < b.uid ? 1 : -1), ny = d > 0.01 ? dy / d : 0;
          const sideways = Math.abs(nx) < 0.3 ? (a.uid < b.uid ? 1 : -1) * 0.6 : nx;
          a.x -= sideways * push; b.x += sideways * push;
          a.y -= ny * push * 0.4; b.y += ny * push * 0.4;
          for (const u of [a, b]) u.x = Math.max(u.r + 6, Math.min(ARENA.w - u.r - 6, u.x));
        }
      }
    }

    think(u, dt) {
      const foes = this.units.filter((o) => o.side !== u.side && o.state !== 'dying');
      // The nearest enemy within reach (edge to edge).
      let best = null, bd = Infinity;
      for (const o of foes) {
        const d = Math.hypot(o.x - u.x, o.y - u.y) - u.r - o.r;
        if (d <= u.reach && d < bd) { bd = d; best = o; }
      }
      if (best) {
        if (u.state !== 'fight' || u.target !== best) {
          if (u.state !== 'fight') u.swing = Math.max(u.swing, SQUARE_UP);
          u.state = 'fight';
          u.target = best;
        }
        u.capturing = false;
        u.swing -= dt;
        if (u.swing <= 0) {
          u.swing += 1;
          this.attack(u, foes);
        }
        return;
      }
      u.target = null;
      u.swing = Math.max(0, u.swing - dt);
      const pile = u.side === 'you' ? PILES.foe : PILES.you;
      const toPile = Math.hypot(pile.x - u.x, pile.y - u.y);
      if (toPile <= PILE_R + u.r + 8) {
        if (u.state !== 'capture') this.events.push({ type: 'capture', unit: u });
        u.state = 'capture';
        u.capturing = true;
        return;
      }
      u.state = 'walk';
      u.capturing = false;
      // At home, an attacker near your own pile is seen to first (either side, the same rule).
      const own = u.side === 'you' ? PILES.you : PILES.foe;
      if (Math.abs(u.y - own.y) < GUARD) {
        let near = null, nd = ALERT;
        for (const o of foes) {
          if (Math.abs(o.y - own.y) >= GUARD) continue;
          const d = Math.hypot(o.x - u.x, o.y - u.y);
          if (d < nd) { nd = d; near = o; }
        }
        if (near) {
          const dx = near.x - u.x, dy = near.y - u.y, d = Math.hypot(dx, dy) || 1;
          u.x += (dx / d) * u.speed * dt;
          u.y += (dy / d) * u.speed * dt;
          return;
        }
      }
      const dir = u.side === 'you' ? -1 : 1;
      // An enemy just ahead and not far to the side draws a unit across to meet it (a front line
      // forms where the armies meet); far to the side, they pass each other by.
      let ahead = null, ad = Infinity;
      for (const o of foes) {
        const dy = (o.y - u.y) * dir;
        const dx = Math.abs(o.x - u.x);
        if (dy > -u.r && dy < SIGHT && dx < SIGHT_SIDE + o.r && dy + dx < ad) { ad = dy + dx; ahead = o; }
      }
      if (ahead) {
        const step = Math.min(Math.abs(ahead.x - u.x), u.speed * 0.6 * dt);
        u.x += Math.sign(ahead.x - u.x) * step;
      }
      const home = u.side === 'you' ? pile.y + HOME : pile.y - HOME;
      const inHome = u.side === 'you' ? u.y <= home : u.y >= home;
      let vx = 0, vy = dir;
      if (inHome) {
        // In the other side's home band: towards their pile.
        const dx = pile.x - u.x, dy = pile.y - u.y, d = Math.hypot(dx, dy) || 1;
        vx = dx / d; vy = dy / d;
      }
      u.x += vx * u.speed * dt;
      u.y += vy * u.speed * dt;
      u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
    }

    attack(u, foes) {
      u.swings++;
      const heavy = u.swings % this.heavyEvery === 0 || (u.side === 'foe' && u.swings % 5 === 0);
      const dmg = u.light * (heavy ? 5 : 1);
      u.lastSwing = this.time;
      u.lastHeavy = heavy;
      // The target first, then (bosses) the nearest others in reach.
      const hit = [u.target];
      if (u.multi > 1) {
        const others = foes.filter((o) => o !== u.target && Math.hypot(o.x - u.x, o.y - u.y) - u.r - o.r <= u.reach)
          .sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        hit.push(...others.slice(0, u.multi - 1));
      }
      this.events.push({ type: 'swing', unit: u, heavy, targets: hit, ranged: u.reach >= 90 });
      for (const o of hit) this.hurt(o, dmg, u, heavy);
    }

    hurt(o, dmg, by, heavy) {
      if (o.state === 'dying') return;
      o.hp -= dmg;
      o.lastHurt = this.time;
      this.events.push({ type: 'hit', unit: o, by, dmg, heavy });
      if (o.hp <= 0) {
        o.hp = 0;
        o.state = 'dying';
        o.dyingT = 0;
        o.target = null;
        this.events.push({ type: 'death', unit: o, by });
      }
    }

    finish(result) {
      this.result = result;
      this.endAt = this.time;
      const losers = result === 'won' ? 'foe' : 'you';
      for (const u of this.units) {
        if (u.side === losers && u.state !== 'dying') { u.state = 'dying'; u.dyingT = 0; u.hp = 0; this.events.push({ type: 'death', unit: u, blast: true }); }
      }
      this.events.push({ type: 'end', result, side: losers });
    }

    /** Events since the last call (for the screen and the sounds). */
    drain() {
      const e = this.events;
      this.events = [];
      return e;
    }
  }

  return { ARENA, PILE_R, PILES, HOME, MAX_YOURS, DYING, Battle };
})();

if (typeof module !== 'undefined') module.exports = BattleEngine;
