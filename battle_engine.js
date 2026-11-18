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
  /** From this reach (Range 3 and up) a unit's blows are drawn as shots. */
  const SHOT_REACH = 74;
  /** The top of your safe zone, where beasts can be placed. */
  const ZONE_Y = 1600;
  const DYING = 0.7;
  /** Before the first blow of a fight, a moment to square up. */
  const SQUARE_UP = 0.35;

  let nextId = 1;

  function unitFrom(side, kind, stats, radius, extra = {}) {
    const n = BATTLE_DATA.battleNumbers(stats);
    const hpMul = (extra.hpMul || 1) * (extra.elite ? 1.8 : 1);
    if (extra.elite) n.light *= 1.4;
    return {
      uid: nextId++, side, kind, stats, r: radius,
      maxHp: n.maxHp * hpMul, hp: n.maxHp * hpMul, light: n.light, speed: n.speed, reach: n.reach,
      multi: extra.multi || 1, boss: !!extra.boss,
      x: 0, y: 0, state: 'walk', target: null, swing: 0, swings: 0, age: 0, dyingT: 0,
      lastSwing: -9, lastHeavy: false, lastHurt: -9, capturing: false, elite: !!extra.elite,
      // An area attacker's blow also lands at this fraction on everything near its target.
      area: extra.area || 0,
      // Specials and their effects: stunned or frozen until, shielded until, dashing until, a
      // war cry's boost until (and how much), a heavy first blow owed.
      stunUntil: -1, frozen: false, shieldUntil: -1, dashUntil: -1, buffUntil: -1, buff: 1, forceHeavy: false,
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
      // Two rules change the battle itself: slow orders (cards recharge twice as long) and a small
      // band (five of yours on the field at most).
      const kind = (level.rule || {}).kind;
      this.cards = deck.map((c) => {
        const stats = BATTLE_DATA.beastStats(c.id, c.prestige || 0);
        return {
          id: c.id, prestige: c.prestige || 0, stats, cooldown: BATTLE_DATA.cooldownOf(c.id) * (opts.rest || 1) * (kind === 'slow' ? 2 : 1), ready: 0,
          cost: BATTLE_DATA.costOf(c.id),
          // An evolved form: its special, once a battle, and one of it on the field at a time.
          evolved: !!c.evolved, ability: c.evolved ? BATTLE_DATA.abilityOf(c.id) : null, abilityUsed: false, unit: null,
          area: BATTLE_DATA.attackKind(c.id, c.prestige || 0) === 'area' ? 0.5 : 0,
        };
      });
      this.maxYours = kind === 'few' ? 5 : MAX_YOURS;
      // Mana: each card costs its tier; it fills over time up to a cap (perks and a Mana spring
      // level fill it faster or hold more).
      const M = BATTLE_DATA.MANA;
      this.manaMax = opts.manaMax || M.max;
      this.manaRegen = M.regen * (opts.manaRegen || 1) * (kind === 'spring' ? 1.5 : 1);
      this.mana = Math.min(this.manaMax, M.start);
      this.garrisoned = false;
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
      return !this.result && !!c && this.time >= c.ready && this.yours.length < this.maxYours && this.mana >= c.cost && !(c.evolved && this.inPlay(i));
    }

    /** Whether card `i`'s beast is on the field now (an evolved form's, for its special). */
    inPlay(i) {
      const u = this.cards[i] && this.cards[i].unit;
      return !!u && u.state !== 'dying' && u.hp > 0 && this.units.includes(u);
    }
    /** Whether card `i`'s special can be set off now. */
    canSpecial(i) {
      const c = this.cards[i];
      return !this.result && !!c && c.evolved && !c.abilityUsed && this.inPlay(i);
    }

    /**
     * An evolved form's special (battle_data.js ABILITIES), once a battle: tap its card again while
     * it is on the field.
     */
    special(i) {
      if (!this.canSpecial(i)) return false;
      const c = this.cards[i], u = c.unit;
      c.abilityUsed = true;
      const foes = this.units.filter((o) => o.side !== u.side && o.state !== 'dying');
      const friends = this.units.filter((o) => o.side === u.side && o.state !== 'dying');
      const near = (list, R, x = u.x, y = u.y) => list.filter((o) => Math.hypot(o.x - x, o.y - y) - o.r <= R);
      const nearest = (list, R, k) => near(list, R).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)).slice(0, k);
      const L = u.light, now = this.time, dir = u.side === 'you' ? -1 : 1;
      const hit = [];
      let at = null;
      switch (c.ability) {
        case 'blast': for (const o of near(foes, 190)) { this.hurt(o, L * 4, u, true); hit.push(o); } break;
        case 'freeze': for (const o of near(foes, 210)) { o.stunUntil = Math.max(o.stunUntil, now + 2.5); o.frozen = true; hit.push(o); } break;
        case 'gust': for (const o of near(foes, 230)) { o.y = Math.max(PILES.foe.y - 40, Math.min(PILES.you.y + 40, o.y - dir * 170)); o.stunUntil = Math.max(o.stunUntil, now + 0.6); o.frozen = false; hit.push(o); } break;
        case 'quake': for (const o of near(foes, 210)) { this.hurt(o, L * 2, u, true); o.stunUntil = Math.max(o.stunUntil, now + 1.6); o.frozen = false; hit.push(o); } break;
        case 'heal': for (const o of near(friends, 240)) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.4); hit.push(o); } break;
        case 'gravity': for (const o of near(foes, 280)) { o.x += (u.x - o.x) * 0.6; o.y += (u.y - o.y) * 0.6; this.hurt(o, L * 1.5, u, false); o.stunUntil = Math.max(o.stunUntil, now + 1); o.frozen = false; hit.push(o); } break;
        case 'starfall': for (const o of nearest(foes, 450, 4)) { this.hurt(o, L * 3, u, true); hit.push(o); } break;
        case 'rally': for (const o of near(friends, 280)) { o.buffUntil = now + 5; o.buff = 1.5; hit.push(o); } break;
        case 'dash': u.dashUntil = now + 1.8; u.forceHeavy = true; break;
        case 'shield': u.shieldUntil = now + 5; break;
        case 'volley': for (const o of nearest(foes, u.reach * 1.6 + 120, 5)) { this.hurt(o, L * 2, u, false); hit.push(o); } break;
        case 'leap': {
          const ahead = foes.filter((o) => (o.y - u.y) * dir > -u.r && Math.hypot(o.x - u.x, o.y - u.y) < 480).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y))[0];
          if (ahead) {
            const d = Math.hypot(ahead.x - u.x, ahead.y - u.y) || 1;
            const gap = ahead.r + u.r + 4;
            at = { x: u.x, y: u.y };
            u.x = ahead.x - ((ahead.x - u.x) / d) * gap;
            u.y = ahead.y - ((ahead.y - u.y) / d) * gap;
          } else u.y += dir * 220;
          for (const o of near(foes, 130)) { this.hurt(o, L * 2.5, u, true); o.stunUntil = Math.max(o.stunUntil, now + 0.8); o.frozen = false; hit.push(o); }
          break;
        }
      }
      this.events.push({ type: 'special', unit: u, ability: c.ability, targets: hit, from: at });
      return true;
    }

    /**
     * Play card `i` at `x` across your safe zone (0 to 1), and at `yAt` up it if given (arena
     * units, kept inside the zone; by default just above your pile).
     */
    deploy(i, xFrac, yAt) {
      if (!this.canDeploy(i)) return null;
      const c = this.cards[i];
      const r = BATTLE_DATA.beastRadius(c.id);
      const u = unitFrom('you', c.id, c.stats, r, { area: c.area });
      u.evolved = c.evolved;
      u.card = i;
      c.unit = u;
      this.mana -= c.cost;
      let x = Math.max(r + 10, Math.min(ARENA.w - r - 10, xFrac * ARENA.w));
      const y = yAt == null ? PILES.you.y - 30 : Math.max(ZONE_Y + r * 0.5, Math.min(ARENA.h - r - 8, yAt));
      // Not on top of your own coin pile: to whichever side of it was nearer.
      const gap = PILE_R + r + 6;
      if (Math.abs(x - PILES.you.x) < gap && Math.abs(y - PILES.you.y) < gap) x = PILES.you.x + (x < PILES.you.x ? -gap : gap);
      u.x = x;
      u.y = y;
      this.units.push(u);
      c.ready = this.time + c.cooldown;
      this.deployed++;
      this.maxTierUsed = Math.max(this.maxTierUsed, (BATTLE_DATA.T(c.id) || { tier: 1 }).tier);
      this.events.push({ type: 'deploy', unit: u });
      return u;
    }

    spawnFoe(s) {
      const e = BATTLE_DATA.ENEMIES[s.foe];
      const role = BATTLE_DATA.ROLES[e.role];
      const elite = !!s.elite && e.role !== 'boss';
      // A champion (battle_data.js, the Champion pattern): its stats from several times the level's
      // points (`mul`), a size and a half up, hitting two at once. A horde's are weaker (mul < 1).
      const champ = !!s.champ && e.role !== 'boss';
      const area = BATTLE_DATA.enemyAttackKind(e.id) === 'area' && e.role !== 'boss' ? 0.5 : 0;
      const u = unitFrom('foe', e.id, BATTLE_DATA.enemyStats(e.id, this.level.points * (s.mul || 1)), Math.min(110, BATTLE_DATA.enemyRadius(e.id) * (elite ? 1.15 : 1) * (champ ? 1.45 : 1)), { hpMul: role.hp || 1, multi: champ ? 2 : role.multi || 1, boss: e.role === 'boss', elite, area });
      u.shooter = e.role === 'ranged' || e.role === 'caster';
      u.champ = champ;
      u.weak = (s.mul || 1) < 1;
      if (s.announce) this.events.push({ type: 'wave', text: s.announce, champ });
      // Out of their camp around the pile (the middle half of the width), so it is defended; a
      // horde or a garrison across the whole width, in rows.
      const fx = s.wide ? s.x : 0.25 + 0.5 * s.x;
      u.x = Math.max(u.r + 10, Math.min(ARENA.w - u.r - 10, fx * ARENA.w));
      const gap = PILE_R + u.r + 6;
      if (!s.row && Math.abs(u.x - PILES.foe.x) < gap) u.x = PILES.foe.x + (u.x < PILES.foe.x ? -gap : gap);
      u.y = PILES.foe.y + 50 + (s.row || 0) * 58;
      this.units.push(u);
      this.seen.add(e.id);
      this.events.push({ type: 'spawn', unit: u });
    }

    /** The level's defenders, out beside their pile; the first time, a fortress's whole garrison. */
    rally() {
      (this.level.rally || []).forEach((id, i) => this.spawnFoe({ foe: id, x: 0.5 + (i % 2 ? 1 : -1) * (0.12 + 0.05 * i) }));
      if (!this.garrisoned && (this.level.garrison || []).length) {
        this.garrisoned = true;
        this.level.garrison.forEach((s, i) => this.spawnFoe(i ? s : { ...s, announce: 'The garrison comes out!' }));
      }
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
      this.mana = Math.min(this.manaMax, this.mana + this.manaRegen * dt);
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
     * Collisions: nobody stands inside anybody else, beast or enemy (Sam, 17 Nov: they overlapped).
     * Radii are bodies as drawn (battle_data.js). An overlapping pair is pushed apart, a pair on one
     * side mostly sideways so a line keeps walking; someone fighting or taking coins stands its
     * ground and the other is moved. Two passes a step.
     */
    spread(dt) {
      const live = this.units.filter((u) => u.state !== 'dying');
      const planted = (u) => u.state === 'fight' || u.state === 'capture';
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const a = live[i], b = live[j];
            const same = a.side === b.side;
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.hypot(dx, dy), min = (a.r + b.r) * (same ? 0.95 : 0.9);
            if (d >= min) continue;
            const push = Math.min(min - d, 300 * dt);
            let nx = d > 0.01 ? dx / d : (a.uid < b.uid ? 1 : -1), ny = d > 0.01 ? dy / d : 0;
            if (same && Math.abs(nx) < 0.35) { nx = (nx >= 0 ? 1 : -1) * 0.7; ny *= 0.6; }
            let wa = 0.5;
            if (planted(a) && !planted(b)) wa = 0.12;
            else if (planted(b) && !planted(a)) wa = 0.88;
            a.x -= nx * push * wa; a.y -= ny * push * wa;
            b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
            for (const u of [a, b]) {
              u.x = Math.max(u.r + 4, Math.min(ARENA.w - u.r - 4, u.x));
              u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
            }
          }
        }
      }
    }

    think(u, dt) {
      // Stunned or frozen: nothing until it wears off (the blow it was winding up waits too).
      if (u.stunUntil > this.time) return;
      u.frozen = false;
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
      const dir = u.side === 'you' ? -1 : 1;
      // 1.4 (Sam, 18 Nov: units got stuck behind their own side and could not get at the enemy):
      // one of our own just in front, fighting or slower, is stepped round, to the side with the
      // enemy (or the more room), so it finds a space to attack from.
      let block = null;
      for (const o of this.units) {
        if (o === u || o.side !== u.side || o.state === 'dying') continue;
        const ady = (o.y - u.y) * dir, adx = o.x - u.x, touch = u.r + o.r + 10;
        if (ady > -4 && ady < touch && Math.abs(adx) < touch * 0.85 && (o.state !== 'walk' || o.speed < u.speed * 0.95 || o.stunUntil > this.time)) { block = o; break; }
      }
      let slow = 1;
      if (block) {
        if (u.blocker !== block.uid) {
          u.blocker = block.uid;
          const foeNear = foes.reduce((m, o) => (!m || Math.hypot(o.x - u.x, o.y - u.y) < Math.hypot(m.x - u.x, m.y - u.y) ? o : m), null);
          let side = foeNear && Math.abs(foeNear.x - block.x) > 8 ? Math.sign(foeNear.x - block.x) : u.x < block.x ? -1 : 1;
          if (u.x + side * (block.r + u.r) < u.r + 10 || u.x + side * (block.r + u.r) > ARENA.w - u.r - 10) side = -side;
          u.sidestep = side || (u.uid % 2 ? 1 : -1);
        }
        u.x = Math.max(u.r + 4, Math.min(ARENA.w - u.r - 4, u.x + u.sidestep * u.speed * 0.9 * dt));
        slow = 0.3;
      } else u.blocker = null;
      // Dashing (a special): straight on at three times the speed until something is in reach.
      if (u.dashUntil > this.time) {
        u.y += dir * u.speed * 3 * dt;
        u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
        return;
      }
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
          u.x += (dx / d) * u.speed * dt * slow;
          u.y += (dy / d) * u.speed * dt * slow;
          return;
        }
      }
      // An enemy just ahead and not far to the side draws a unit across to meet it (a front line
      // forms where the armies meet); far to the side, they pass each other by.
      let ahead = null, ad = Infinity;
      for (const o of foes) {
        const dy = (o.y - u.y) * dir;
        const dx = Math.abs(o.x - u.x);
        if (dy > -u.r && dy < SIGHT && dx < SIGHT_SIDE + o.r && dy + dx < ad) { ad = dy + dx; ahead = o; }
      }
      if (ahead && !block) {
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
      u.x += vx * u.speed * dt * slow;
      u.y += vy * u.speed * dt * slow;
      u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
    }

    attack(u, foes) {
      u.swings++;
      const heavy = u.forceHeavy || u.swings % this.heavyEvery === 0 || (u.side === 'foe' && u.swings % 5 === 0);
      u.forceHeavy = false;
      const dmg = u.light * (heavy ? 5 : 1) * (u.buffUntil > this.time ? u.buff : 1);
      u.lastSwing = this.time;
      u.lastHeavy = heavy;
      // The target first, then (bosses) the nearest others in reach.
      const hit = [u.target];
      if (u.multi > 1) {
        const others = foes.filter((o) => o !== u.target && Math.hypot(o.x - u.x, o.y - u.y) - u.r - o.r <= u.reach)
          .sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        hit.push(...others.slice(0, u.multi - 1));
      }
      // An area blow: everything near the target takes part of it too.
      let splash = [];
      if (u.area) splash = foes.filter((o) => !hit.includes(o) && Math.hypot(o.x - u.target.x, o.y - u.target.y) - o.r <= 70);
      this.events.push({ type: 'swing', unit: u, heavy, targets: hit, ranged: u.reach >= SHOT_REACH || u.shooter, splash });
      for (const o of hit) this.hurt(o, dmg, u, heavy);
      for (const o of splash) this.hurt(o, dmg * u.area, u, false);
    }

    hurt(o, dmg, by, heavy) {
      if (o.state === 'dying') return;
      if (o.shieldUntil > this.time) dmg *= 0.2;
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

  return { ARENA, PILE_R, PILES, HOME, MAX_YOURS, ZONE_Y, SHOT_REACH, DYING, Battle };
})();

if (typeof module !== 'undefined') module.exports = BattleEngine;
