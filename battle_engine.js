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
      baseSpeed: n.speed, slowUntil: -1,
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
        // Synced down: as a beast no higher than the rule's tier and no rarer than it lets in.
        const sync = c.sync || null;
        const stats = sync ? BATTLE_DATA.syncStats(c.id, sync) : BATTLE_DATA.beastStats(c.id, c.prestige || 0);
        const tier = sync && sync.tier ? Math.min(sync.tier, BATTLE_DATA.T(c.id).tier) : BATTLE_DATA.T(c.id).tier;
        return {
          id: c.id, prestige: c.prestige || 0, stats, sync, cooldown: ((BATTLE_DATA.T(c.id) || {}).comet ? Math.round(tier * BATTLE_DATA.COMET_REST) : tier) * (opts.rest || 1) * (kind === 'slow' ? 2 : 1), ready: 0,
          cost: (BATTLE_DATA.T(c.id) || {}).comet ? BATTLE_DATA.cometCost(tier) : BATTLE_DATA.costOfTier(tier),
          // An evolved form: its special, once a battle, and one of it on the field at a time.
          evolved: !!c.evolved, ability: c.evolved ? BATTLE_DATA.abilityOf(c.id) : null, abilityUsed: false, unit: null,
          // (by look; a synced one keeps its kind. 1.5: an area beast that shoots bursts for a third.)
          area: BATTLE_DATA.attackKind(c.id, c.prestige || 0) === 'area' ? (BATTLE_DATA.battleNumbers(stats).reach >= SHOT_REACH ? 0.35 : 0.5) : 0,
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
      // 1.5, World 7: the bosses' telegraphed moves (mutants.js), their areas on the ground, and a
      // level won by beating its bosses (no coin pile at their end).
      this.zones = [];
      this.mut = typeof MUTANTS !== 'undefined' && level.world >= 7;
      this.bossFight = level.win === 'bosses';
      this.deployed = 0;
      this.hurry = 0;
      this.maxTierUsed = 0;
      // 1.5 (Sam, 24 Nov): Worlds 1 to 6 vary from play to play: an enemy now and then swapped for a
      // random one of its kind from the same world, and a few of them giants, runts, long-armed or
      // swift. Chance from here (a seed can be given, so the balance tools play the same each time).
      this.rng = BATTLE_DATA.seeded(opts.seed != null ? opts.seed : opts.variant != null ? 7919 * (opts.variant + 1) : (Math.random() * 4294967295) >>> 0);
      this.wild = !this.mut && level.world <= 6;
      // Bombs lobbed and on their way down (the Lobs bombs trait): where, when, how hard.
      this.shells = [];
    }

    get yours() { return this.units.filter((u) => u.side === 'you' && u.state !== 'dying'); }
    /** How many of yours may be out now: the limit, two more while an enemy takes your coins. */
    get cap() { return this.maxYours + (this.units.some((u) => u.side === 'foe' && u.state === 'capture') ? 2 : 0); }
    get foes() { return this.units.filter((u) => u.side === 'foe' && u.state !== 'dying'); }

    /** Whether card `i` can be played now. */
    canDeploy(i) {
      const c = this.cards[i];
      return !this.result && !!c && this.time >= c.ready && this.yours.length < this.cap && this.mana >= c.cost;
    }

    /** Card `i`'s beasts on the field now. */
    onField(i) {
      return this.units.filter((u) => u.side === 'you' && u.card === i && u.state !== 'dying' && u.hp > 0);
    }
    /** Whether card `i`'s special can be set off now (an evolved form with one of it on the field). */
    canSpecial(i) {
      const c = this.cards[i];
      return !this.result && !!c && c.evolved && !c.abilityUsed && !(c.silencedUntil > this.time) && this.onField(i).length > 0;
    }

    /**
     * An evolved form's special (battle_data.js ABILITIES), once a battle for each evolved card:
     * Sam (18 Nov), tap one of that beast on the field and it does its special there. Without a
     * beast given, its newest one on the field.
     */
    special(i, who = null) {
      if (!this.canSpecial(i)) return false;
      const c = this.cards[i];
      const u = who && who.card === i && this.onField(i).includes(who) ? who : this.onField(i).slice(-1)[0];
      const foes = this.units.filter((o) => o.side !== u.side && o.state !== 'dying' && !o.burrowed && !o.airborne && !(o.cloakUntil > this.time));
      const friends = this.units.filter((o) => o.side === u.side && o.state !== 'dying');
      const near = (list, R, x = u.x, y = u.y) => list.filter((o) => Math.hypot(o.x - x, o.y - y) - o.r <= R);
      const reach = { blast: 190, freeze: 200, gust: 230, quake: 210, gravity: 220, starfall: 450, volley: u.reach * 1.6 + 120, leap: 480, dash: 520, stagger: u.reach + 140, anchor: 700, blizzard: 260 }[c.ability];
      if (reach && !near(foes, reach).length) { this.events.push({ type: 'special-miss', unit: u }); return false; }
      // (Dispel needs a boss winding up a move within 800, or an enemy near it with a shield or a war cry.)
      const winding = foes.filter((f) => f.cast && f.cast.stage === 'wind' && Math.hypot(f.x - u.x, f.y - u.y) - f.r <= 800);
      if (c.ability === 'dispel' && !winding.length && !near(foes, 300).some((f) => f.buffUntil > this.time || f.shieldUntil > this.time || f.mirrorShield > this.time || f.hardenUntil > this.time)) { this.events.push({ type: 'special-miss', unit: u }); return false; }
      c.abilityUsed = true;
      // The Mirror Witch copies the last special used (mutants.js).
      this.lastSpecial = { ability: c.ability, t: this.time };
      const nearest = (list, R, k) => near(list, R).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)).slice(0, k);
      const L = u.light, now = this.time, dir = u.side === 'you' ? -1 : 1;
      const hit = [];
      let at = null;
      switch (c.ability) {
        case 'blast': for (const o of near(foes, 190)) { this.hurt(o, L * 4, u, true); hit.push(o); } break;
        case 'freeze': for (const o of nearest(foes, 200, 5)) { o.stunUntil = Math.max(o.stunUntil, now + 2.5); o.frozen = true; hit.push(o); } break;
        case 'gust': for (const o of near(foes, 230)) { if (!o.mutant) o.y = Math.max(PILES.foe.y - 40, Math.min(PILES.you.y + 40, o.y + dir * 170)); o.stunUntil = Math.max(o.stunUntil, now + 0.6); o.frozen = false; hit.push(o); } break;
        case 'quake': for (const o of near(foes, 210)) { this.hurt(o, L * 2, u, true); o.stunUntil = Math.max(o.stunUntil, now + 1.6); o.frozen = false; hit.push(o); } break;
        case 'heal': for (const o of near(friends, 240)) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.4); hit.push(o); } break;
        case 'gravity': for (const o of nearest(foes, 220, 5)) { if (!o.mutant) { o.x += (u.x - o.x) * 0.6; o.y += (u.y - o.y) * 0.6; } this.hurt(o, L * 1.2, u, false); o.stunUntil = Math.max(o.stunUntil, now + 1); o.frozen = false; hit.push(o); } break;
        case 'starfall': for (const o of nearest(foes, 450, 4)) { this.hurt(o, L * 3, u, true); hit.push(o); } break;
        case 'rally': for (const o of near(friends, 280)) { o.buffUntil = now + 5; o.buff = 1.5; hit.push(o); } break;
        case 'dash': u.dashUntil = now + 1.8; u.forceHeavy = true; break;
        case 'shield': u.shieldUntil = now + 5; break;
        case 'volley': for (const o of nearest(foes, u.reach * 1.6 + 120, 5)) { this.hurt(o, L * 2, u, false); hit.push(o); } break;
        // 1.5: the comet beasts' specials (comet.js), made for World 7's giants.
        case 'stagger': {
          const o = nearest(foes, u.reach + 140, 1)[0];
          if (o) {
            this.hurt(o, L * 3, u, true);
            if (o.mutant && typeof MUTANTS !== 'undefined') MUTANTS.stagger(this, o, 240);
            else if (!o.boss) o.y = Math.max(PILES.foe.y - 40, Math.min(PILES.you.y + 40, o.y + dir * 200));
            o.stunUntil = Math.max(o.stunUntil, now + 1.2); o.frozen = false; hit.push(o);
          }
          break;
        }
        case 'anchor': {
          const o = foes.filter((f) => f.boss && Math.hypot(f.x - u.x, f.y - u.y) - f.r <= 700)[0] || nearest(foes, 700, 1)[0];
          if (o) { o.anchorUntil = now + 6; o.slowUntil = Math.max(o.slowUntil, now + 6); hit.push(o); }
          break;
        }
        case 'dispel':
          for (const o of winding) { if (typeof MUTANTS !== 'undefined') MUTANTS.dispel(this, o); hit.push(o); }
          for (const o of near(foes, 300)) { o.buffUntil = -1; o.shieldUntil = -1; o.mirrorShield = -1; o.hardenUntil = -1; if (!hit.includes(o)) hit.push(o); }
          break;
        case 'ward': for (const o of near(friends, 260)) { o.wardUntil = now + 10; hit.push(o); } break;
        case 'blizzard': for (const o of near(foes, 260)) { this.hurt(o, L * 2.5, u, true, 'frost'); o.stunUntil = Math.max(o.stunUntil, now + 3); o.frozen = true; hit.push(o); } break;
        case 'sunder': u.sunderUntil = now + 10; u.forceHeavy = true; break;
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
      if (!Number.isFinite(xFrac)) xFrac = 0.5;
      if (yAt != null && !Number.isFinite(yAt)) yAt = null;
      const c = this.cards[i];
      const r = BATTLE_DATA.beastRadius(c.id);
      const u = unitFrom('you', c.id, c.stats, r, { area: c.area });
      u.evolved = c.evolved;
      u.card = i;
      c.unit = u;
      // 1.5: a comet beast's passive, always on (comet.js).
      const ct = (BATTLE_DATA.T(c.id) || {}).comet;
      if (ct && typeof COMET !== 'undefined') u.passives = { [COMET.BY_ID[ct.species].passive]: true };
      this.mana -= c.cost;
      if (this.firstDeployAt == null) this.firstDeployAt = this.time;
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
      // (1.5, Worlds 1 to 6: one in nine is a wildcard, another of its kind from anywhere in the world
      // up to a few levels ahead; never a boss, a champion, an elite or a garrison.)
      if (this.wild && !s.boss && !s.champ && !s.elite && !s.child && !s.row && this.rng() < 0.11) {
        const was = BATTLE_DATA.ENEMIES[s.foe];
        const pool = was && was.role !== 'boss' ? BATTLE_DATA.ENEMY_LIST.filter((x) => x.world === this.level.world && x.role === was.role && x.id !== was.id && x.debut <= this.level.n + 8) : [];
        if (pool.length) s = { ...s, foe: pool[Math.floor(this.rng() * pool.length)].id };
      }
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
      // Its ability (battle_data.js TRAITS), on a clock of its own.
      u.trait = BATTLE_DATA.traitOf(e.id);
      if (u.trait === 'burrow') u.burrowed = true;
      if (u.trait === 'cloak') u.cloakAt = this.time + 2 + s.x * 3;
      if (u.trait === 'heal') u.healAt = this.time + 3;
      if (u.trait === 'summon') u.summonAt = this.time + 6;
      // 1.5: snipers and bomb-lobbers camp back by their own coins (campY) and fire from far away,
      // slowly; snipers hit hard. Bombers run in; blinkers jump on now and then.
      if (u.trait === 'snipe') { u.reach = Math.max(u.reach, 600); u.baseSpeed *= 0.45; u.campY = PILES.foe.y + 250 + this.rng() * 130; u.swingRate = 0.5; u.shotMul = 1.9; u.shooter = true; }
      if (u.trait === 'mortar') { u.reach = Math.max(u.reach, 470); u.baseSpeed *= 0.6; u.campY = PILES.foe.y + 400 + this.rng() * 180; u.swingRate = 0.55; u.lob = true; u.shooter = true; }
      if (u.trait === 'bomb') u.baseSpeed *= 1.25;
      if (u.trait === 'blink') u.blinkAt = this.time + 2.5 + this.rng() * 3;
      u.speed = u.baseSpeed;
      // (1.5, Worlds 1 to 6, from level 3: one in five comes as a giant, a runt, long-armed or swift.)
      if (this.wild && !s.child && e.role !== 'boss' && !champ && this.level.n >= 3 && this.rng() < 0.2) {
        const v = ['giant', 'giant', 'runt', 'long', 'swift'][Math.floor(this.rng() * 5)];
        u.variant = v;
        if (v === 'giant') { u.maxHp *= 1.7; u.light *= 1.25; u.baseSpeed *= 0.8; u.r = Math.min(110, u.r * 1.3); u.drawK = 1.3; }
        if (v === 'runt') { u.maxHp *= 0.55; u.light *= 0.85; u.baseSpeed *= 1.35; u.r *= 0.75; u.drawK = 0.75; }
        if (v === 'long') u.reach = u.reach < SHOT_REACH ? u.reach + 45 : u.reach * 1.35;
        if (v === 'swift') { u.baseSpeed *= 1.5; u.swingRate = (u.swingRate || 1) * 1.25; }
        u.hp = u.maxHp; u.speed = u.baseSpeed;
      }
      // (A half of a split one: smaller, and it does not split again.)
      if (s.child) { u.splitChild = true; u.r *= 0.75; u.drawK = 0.75; }
      if (this.mut && e.look && e.look.plan === 'mutant') MUTANTS.setup(this, u);
      // A level made harder after calibration (battle.js: World 7 +10%, Sam 24 Nov): health, blows, speed.
      const fm = this.level.foeMul || 1;
      if (fm !== 1) { u.maxHp *= fm; u.hp = u.maxHp; u.light *= fm; u.baseSpeed *= fm; u.speed = u.baseSpeed; }
      // Bosses and champions made bigger and stronger after calibration (battle.js: Worlds 1 to 6,
      // Sam 24 Nov): health, blows, their size on the field (u.drawK for the drawing).
      const big = this.level.bigFoes && (e.role === 'boss' ? this.level.bigFoes.boss : champ ? this.level.bigFoes.champ : null);
      if (big) { u.maxHp *= big.hp; u.hp = u.maxHp; u.light *= big.atk; u.r = Math.min(130, u.r * big.r); u.drawK = big.draw; }
      if (s.announce) this.events.push({ type: 'wave', text: s.announce, champ });
      // Out of their camp around the pile (the middle half of the width), so it is defended; a
      // horde or a garrison across the whole width, in rows.
      const fx = s.wide ? s.x : 0.25 + 0.5 * s.x;
      u.x = Math.max(u.r + 10, Math.min(ARENA.w - u.r - 10, fx * ARENA.w));
      const gap = PILE_R + u.r + 6;
      if (!s.row && Math.abs(u.x - PILES.foe.x) < gap) u.x = PILES.foe.x + (u.x < PILES.foe.x ? -gap : gap);
      u.y = PILES.foe.y + 50 + (s.row || 0) * 58;
      // In from a side half way down, or out of a portal in the middle of the field.
      if (s.side) { u.x = s.side === 'L' ? u.r + 12 : ARENA.w - u.r - 12; u.y = 640 + s.x * 360; }
      else if (s.portal) { u.y = 640 + s.x * 300; this.events.push({ type: 'portal', unit: u }); }
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
      if (this.mana >= this.manaMax) this.manaFilled = true;
      // Enemies arrive on the level's schedule, when there is room; the schedule repeats (without
      // its boss) for as long as the battle goes on.
      const foeCount = this.foes.length;
      let room = this.level.maxEnemies - foeCount;
      // (A boss that comes in turn waits for the one before it to fall: World 7's Gauntlet.)
      while (this.queue.length && this.queue[0].t + this.loop <= this.time && room > 0 && !(this.queue[0].afterBoss && this.units.some((x) => x.boss && x.side === 'foe' && x.state !== 'dying'))) {
        this.spawnFoe(this.queue.shift());
        room--;
      }
      // While their pile is being taken, the next of them comes out at once (every 2.5 s at most).
      if (this.units.some((u) => u.side === 'you' && u.state === 'capture') && this.time >= this.hurry && room > -2) {
        const k = this.queue.findIndex((q) => !q.champ && !q.boss);
        if (k >= 0) {
          const s = this.queue.splice(k, 1)[0];
          this.hurryN = (this.hurryN || 0) + 1;
          if (this.hurryN % 2 === 0) this.spawnFoe({ ...s, side: this.hurryN % 4 === 0 ? 'L' : 'R' });
          else this.spawnFoe({ ...s, x: 0.5 + (s.x - 0.5) * 0.4 });
          this.hurry = this.time + 2.5;
        }
      }
      if (!this.queue.length && this.level.loop !== false) {
        this.loop = this.time;
        this.queue = this.level.spawns.filter((s) => !s.boss && s.t > 4).map((s) => ({ ...s, t: s.t - 4 }));
      }
      // 1.5: a comet beast with Revive rises again ten seconds after it fell, once, at half health.
      if (this.cometRevives && this.cometRevives.length) {
        for (const rv of this.cometRevives.filter((q) => q.at <= this.time)) {
          const c = this.cards[rv.card] || {};
          const u = unitFrom('you', rv.kind, rv.stats, rv.r, { area: c.area || 0 });
          Object.assign(u, { card: rv.card, evolved: c.evolved, x: rv.x, y: rv.y, hp: u.maxHp * 0.5, revived: true, passives: { revive: true } });
          this.units.push(u);
          this.events.push({ type: 'deploy', unit: u, revive: true });
        }
        this.cometRevives = this.cometRevives.filter((q) => q.at > this.time);
      }
      for (const u of this.units) {
        u.age += dt;
        if (u.state === 'dying') { u.dyingT += dt; continue; }
        this.think(u, dt);
      }
      this.units = this.units.filter((u) => u.state !== 'dying' || u.dyingT < DYING);
      if (this.shells.length) {
        for (const sh of this.shells.filter((q) => q.at <= this.time)) {
          this.events.push({ type: 'boom', x: sh.x, y: sh.y, r: sh.r });
          for (const o of this.units) if (o.side !== sh.side && o.state !== 'dying' && !o.burrowed && Math.hypot(o.x - sh.x, o.y - sh.y) - o.r <= sh.r) this.hurt(o, sh.dmg, sh.by, sh.heavy);
        }
        this.shells = this.shells.filter((q) => q.at > this.time);
      }
      if (this.mut) MUTANTS.step(this, dt);
      if (this.result) return;
      if (this.bossFight && this.mut && MUTANTS.won(this)) { this.finish('won'); return; }
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
      const live = this.units.filter((u) => u.state !== 'dying' && !u.burrowed && !u.airborne);
      const planted = (u) => u.state === 'fight' || u.state === 'capture';
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const a = live[i], b = live[j];
            const same = a.side === b.side;
            const dx = b.x - a.x, dy = b.y - a.y;
            const squeeze = same && (a.squeezeUntil > this.time || b.squeezeUntil > this.time);
            const d = Math.hypot(dx, dy), min = (a.r + b.r) * (same ? (squeeze ? 0.45 : 0.95) : 0.9);
            if (d >= min) continue;
            const push = Math.min(min - d, 300 * dt);
            let nx = d > 0.01 ? dx / d : (a.uid < b.uid ? 1 : -1), ny = d > 0.01 ? dy / d : 0;
            if (same && Math.abs(nx) < 0.35) { nx = (nx >= 0 ? 1 : -1) * 0.7; ny *= 0.6; }
            let wa = 0.5;
            if (planted(a) && !planted(b)) wa = 0.12;
            else if (planted(b) && !planted(a)) wa = 0.88;
            // A giant is not shoved about by beasts.
            if (a.mutant && !b.mutant) wa = 0.03;
            else if (b.mutant && !a.mutant) wa = 0.97;
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

    /** Whether a unit can be seen and hit: not underground, not invisible. */
    visible(o) { return !o.burrowed && !o.airborne && !(o.cloakUntil > this.time); }

    /** An enemy's ability on its clock: cloaking, healing, summoning. */
    traitTick(u) {
      const now = this.time;
      // (1.5: Blinks: a jump of 220 on, every six seconds, while walking; never onto your coins.)
      if (u.trait === 'blink' && now >= u.blinkAt && u.state === 'walk' && !u.burrowed) {
        u.blinkAt = now + 6;
        const from = { x: u.x, y: u.y };
        const dir = u.side === 'you' ? -1 : 1;
        u.y = Math.max(PILES.foe.y + 60, Math.min(ZONE_Y - 90, u.y + dir * 220));
        this.events.push({ type: 'trait', kind: 'blink', unit: u, from });
      }
      if (u.trait === 'cloak' && now >= u.cloakAt) { u.cloakUntil = now + 3; u.cloakAt = now + 9; this.events.push({ type: 'trait', kind: 'cloak', unit: u }); }
      if (u.trait === 'heal' && now >= u.healAt) {
        u.healAt = now + 4;
        const mended = this.units.filter((o) => o.side === u.side && o.state !== 'dying' && o.hp < o.maxHp && Math.hypot(o.x - u.x, o.y - u.y) < 220);
        // (A World 7 giant takes a quarter as much: a medic must not out-mend a whole army.)
        for (const o of mended) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * (o.mutant ? 0.03 : 0.12));
        if (mended.length) this.events.push({ type: 'trait', kind: 'heal', unit: u, targets: mended });
      }
      if (u.trait === 'summon' && now >= u.summonAt) {
        u.summonAt = now + 10;
        const small = BATTLE_DATA.ENEMY_LIST.filter((x) => x.world === this.level.world && x.role === 'swarm' && x.debut <= this.level.n);
        if (small.length && this.foes.length < this.level.maxEnemies + 4) {
          const kind = small[(u.uid + Math.floor(now)) % small.length];
          for (const sd of [-1, 1]) {
            this.spawnFoe({ foe: kind.id, x: 0.5, mul: 0.6 });
            const m = this.units[this.units.length - 1];
            m.x = Math.max(m.r + 10, Math.min(ARENA.w - m.r - 10, u.x + sd * (u.r + m.r + 6)));
            m.y = u.y + 10;
          }
          this.events.push({ type: 'trait', kind: 'summon', unit: u });
        }
      }
    }

    think(u, dt) {
      // A World 7 boss: its moves first (mutants.js); while one is under way it does nothing else.
      if (u.mutant && MUTANTS.think(this, u, dt)) return;
      // (1.5: comet passives. Unshakeable is never stunned; Frostproof is never frozen or slowed.)
      if (u.passives) {
        if (u.passives.unshakeable) { u.stunUntil = -1; u.frozen = false; }
        if (u.passives.frostproof) { u.slowUntil = -1; if (u.frozen) { u.frozen = false; u.stunUntil = -1; } }
      }
      // Stunned or frozen: nothing until it wears off (the blow it was winding up waits too).
      if (u.stunUntil > this.time) return;
      u.frozen = false;
      if (u.trait) this.traitTick(u);
      // (1.5: Regrows, when nothing has hit it for two seconds.)
      if (u.trait === 'regen' && u.hp < u.maxHp && this.time - u.lastHurt > 2) {
        u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.05 * dt);
        if (!u.regrew) { u.regrew = true; this.events.push({ type: 'trait', kind: 'regen', unit: u }); }
      }
      // Slowed, or charging (a rush of 1.2 seconds): its speed for now.
      if (u.charging && !(u.chargeUntil > this.time)) u.charging = false;
      u.speed = u.baseSpeed * (u.slowUntil > this.time ? 0.6 : 1) * (u.charging ? 2.5 : 1);
      // Underground: on to the middle of the field, then up.
      if (u.burrowed) {
        const dir0 = u.side === 'you' ? -1 : 1;
        u.y += dir0 * u.speed * 1.2 * dt;
        if ((u.side === 'foe' && u.y > 1050) || (u.side === 'you' && u.y < 950)) { u.burrowed = false; this.events.push({ type: 'trait', kind: 'surface', unit: u }); }
        return;
      }
      const foes = this.units.filter((o) => o.side !== u.side && o.state !== 'dying' && this.visible(o));
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
        u.charging = false;
        // (1.5: Explodes: on reaching a beast it blows up, a heavy blow on every beast near it.)
        if (u.trait === 'bomb' && u.side === 'foe') {
          const dmg = u.light * 5;
          this.events.push({ type: 'trait', kind: 'bomb', unit: u });
          for (const o of foes) if (Math.hypot(o.x - u.x, o.y - u.y) - o.r <= 125) this.hurt(o, dmg, u, true);
          this.hurt(u, u.hp + 1, null, false);
          return;
        }
        if (u.reach < SHOT_REACH && bd > 6 && !best.boss) {
          const dx = best.x - u.x, dy = best.y - u.y, dd = Math.hypot(dx, dy) || 1, st = Math.min(bd - 4, u.baseSpeed * 0.5 * dt);
          u.x += (dx / dd) * st; u.y += (dy / dd) * st;
        }
        u.swing -= dt * (u.slowUntil > this.time ? 0.6 : 1) * (u.side === 'you' && this.hasteNear(u) ? 1.3 : 1) * (u.swingRate || 1);
        if (u.swing <= 0) {
          u.swing += 1;
          if (!u.noBasic) this.attack(u, foes);
        }
        return;
      }
      u.target = null;
      u.swing = Math.max(0, u.swing - dt);
      // (1.5: a sniper or a bomb-lobber stays at its camp by its own coins, waiting for something in range.)
      if (u.campY && u.side === 'foe' && u.y >= u.campY) { u.state = 'walk'; u.capturing = false; return; }
      const pile = u.side === 'you' ? PILES.foe : PILES.you;
      const toPile = Math.hypot(pile.x - u.x, pile.y - u.y);
      if (toPile <= PILE_R + u.r + 8) {
        // World 7: no coin pile at their end; your beasts wait there for what comes.
        if (u.side === 'you' && this.bossFight) { u.state = 'walk'; u.capturing = false; return; }
        if (u.state !== 'capture') this.events.push({ type: 'capture', unit: u });
        u.state = 'capture';
        u.capturing = true;
        return;
      }
      u.state = 'walk';
      u.capturing = false;
      const dir = u.side === 'you' ? -1 : 1;
      if (!(u.checkAt > this.time)) {
        if (u.checkAt !== undefined && Math.hypot(u.x - u.checkX, u.y - u.checkY) < 12 && foes.some((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r - u.r < 220)) u.squeezeUntil = this.time + 1.2;
        u.checkAt = this.time + 0.5; u.checkX = u.x; u.checkY = u.y;
      }
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
        if (near) { this.approach(u, near, dt, foes); return; }
      }
      // An enemy just ahead and not far to the side draws a unit across to meet it (a front line
      // forms where the armies meet); far to the side, they pass each other by.
      let ahead = null, ad = Infinity;
      for (const o of foes) {
        const dy = (o.y - u.y) * dir;
        const dx = Math.abs(o.x - u.x);
        if (dy > -u.r && dy < SIGHT && dx < SIGHT_SIDE + o.r && dy + dx < ad) { ad = dy + dx; ahead = o; }
      }
      if (ahead && u.trait === 'leap' && !u.leapt && Math.hypot(ahead.x - u.x, ahead.y - u.y) < u.r + ahead.r + 80) {
        const from = { x: u.x, y: u.y };
        u.leapt = true;
        u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y - 160, u.y + dir * (ahead.r * 2 + u.r + 150)));
        this.events.push({ type: 'trait', kind: 'leap', unit: u, from });
        return;
      }
      if (ahead && u.trait === 'charge' && !u.charged) { u.charged = true; u.charging = true; u.chargeUntil = this.time + 1.2; u.forceHeavy = true; this.events.push({ type: 'trait', kind: 'charge', unit: u }); }
      if (ahead) {
        this.approach(u, ahead, dt, foes);
        u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
        return;
      }
      // World 7: nothing to walk to at their end, so a beast goes for the nearest enemy wherever it
      // is (beasts passing beside a giant walked on to the empty top and waited there).
      if (this.bossFight && u.side === 'you' && foes.length) {
        let tg = null, td = Infinity;
        for (const o of foes) { const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < td) { td = d; tg = o; } }
        this.approach(u, tg, dt, foes);
        u.y = Math.max(PILES.foe.y - 60, Math.min(PILES.you.y + 60, u.y));
        return;
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

    /**
     * Go for an enemy by the clearest spot round it, so a unit comes in beside its own side's
     * fighters instead of queuing behind them (Sam, 18 Nov: units got stuck behind each other and
     * could not attack): spots round the enemy facing the unit, the nearest with none of its own
     * side standing in it.
     */
    approach(u, tgt, dt, foes = []) {
      // This enemy and the next two nearest: whichever has a free spot nearest wins, so a unit
      // whose enemy is surrounded by its own side goes for another instead of waiting behind them.
      const wide = u.squeezeUntil > this.time;
      const near3 = foes.filter((o) => o !== tgt && Math.hypot(o.x - u.x, o.y - u.y) < SIGHT + (wide ? 260 : 120)).sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y)).slice(0, wide ? 4 : 2);
      let bx = tgt.x, by = tgt.y, best = Infinity;
      for (const [k, e] of [tgt, ...near3].entries()) {
        const ring = e.r + u.r + Math.min(u.reach, 40) * 0.6;
        const base = Math.atan2(u.y - e.y, u.x - e.x);
        for (const off of [0, 0.55, -0.55, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2]) {
          const a = base + off;
          const px = e.x + Math.cos(a) * ring, py = e.y + Math.sin(a) * ring;
          if (px < u.r + 6 || px > ARENA.w - u.r - 6) continue;
          let crowd = 0;
          for (const o of this.units) if (o !== u && o.state !== 'dying' && o !== e && Math.hypot(o.x - px, o.y - py) < o.r + u.r * 0.8) crowd++;
          const score = crowd * 10000 + Math.hypot(px - u.x, py - u.y) + Math.abs(off) * 20 + k * 60;
          if (score < best) { best = score; bx = px; by = py; }
        }
      }
      const dx = bx - u.x, dy = by - u.y, d = Math.hypot(dx, dy) || 1;
      const step = Math.min(d, u.speed * dt);
      u.x = Math.max(u.r + 4, Math.min(ARENA.w - u.r - 4, u.x + (dx / d) * step));
      u.y += (dy / d) * step;
    }

    /** 1.5: whether a comet beast with Haste aura is near one of yours (its swings come 30% faster). */
    hasteNear(u) {
      return this.units.some((a) => a.passives && a.passives.haste && a.side === u.side && a.state !== 'dying' && Math.hypot(a.x - u.x, a.y - u.y) < 220);
    }

    attack(u, foes) {
      u.swings++;
      const heavy = u.forceHeavy || u.swings % this.heavyEvery === 0 || (u.side === 'foe' && u.swings % 5 === 0);
      u.forceHeavy = false;
      const dmg = u.light * (heavy ? 5 : 1) * (u.buffUntil > this.time ? u.buff : 1) * (u.sapUntil > this.time ? 0.67 : 1) * (u.shotMul || 1);
      u.lastSwing = this.time;
      u.lastHeavy = heavy;
      // (1.5: Lobs bombs: the bomb lands where its target stood 1.2 seconds later, on everything there.)
      if (u.lob && u.target) {
        const shell = { x: u.target.x, y: u.target.y, at: this.time + 1.2, dmg: dmg * 0.9, by: u, side: u.side, r: 95, heavy };
        this.shells.push(shell);
        this.events.push({ type: 'lob', unit: u, shell, dur: 1.2 });
        if (u.cloakUntil > this.time) u.cloakUntil = this.time;
        return;
      }
      // The target first, then (bosses) the nearest others in reach.
      const hit = [u.target];
      if (u.multi > 1) {
        const others = foes.filter((o) => o !== u.target && this.visible(o) && Math.hypot(o.x - u.x, o.y - u.y) - u.r - o.r <= u.reach)
          .sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        hit.push(...others.slice(0, u.multi - 1));
      }
      // An area blow: everything near the target takes part of it too.
      let splash = [];
      if (u.area) splash = foes.filter((o) => !hit.includes(o) && this.visible(o) && Math.hypot(o.x - u.target.x, o.y - u.target.y) - o.r <= 70);
      this.events.push({ type: 'swing', unit: u, heavy, targets: hit, ranged: u.reach >= SHOT_REACH || u.shooter, splash });
      if (u.cloakUntil > this.time) u.cloakUntil = this.time;
      for (const o of hit) this.hurt(o, dmg, u, heavy, u.dmgType);
      for (const o of splash) this.hurt(o, dmg * u.area, u, false, u.dmgType);
      if (u.trait === 'slow') for (const o of hit) o.slowUntil = this.time + 2;
      if (u.trait === 'knock' && heavy) for (const o of [...hit, ...splash]) {
        if (o.state === 'dying' || o.boss || (o.passives && o.passives.unshakeable)) continue;
        o.y = Math.max(PILES.foe.y - 40, Math.min(PILES.you.y + 40, o.y + (o.side === 'you' ? 90 : -90)));
        o.stunUntil = Math.max(o.stunUntil, this.time + 0.3);
      }
    }

    /** `type`: World 7's damage types (fire, frost, poison, crush, shock), or 'dot' for a burn's tick. */
    hurt(o, dmg, by, heavy, type = null) {
      if (o.state === 'dying') return;
      if (o.shieldUntil > this.time && !(by && by.sunderUntil > this.time)) dmg *= 0.2;
      if (o.side === 'foe' && this.units.some((a) => a.trait === 'aura' && a !== o && a.state !== 'dying' && a.side === 'foe' && Math.hypot(a.x - o.x, a.y - o.y) < 180)) dmg *= 0.75;
      let tag = null;
      if (this.mut) { const m = MUTANTS.modify(this, o, dmg, by, heavy, type); dmg = m.dmg; tag = m.tag; }
      // 1.5: a Ward takes the next big blow (nine tenths of it); Parry survives one that would kill.
      if (o.wardUntil > this.time && (heavy || dmg >= o.maxHp * 0.2)) { dmg *= 0.1; o.wardUntil = -1; tag = 'ward'; }
      if (o.passives && o.passives.parry && !o.parried && type !== 'dot' && o.hp - dmg <= 0) { o.parried = true; dmg = Math.max(0, o.hp - 1); tag = 'parry'; }
      o.hp -= dmg;
      // (1.5: Spiked: a beast hitting it up close takes a quarter back.)
      if (o.trait === 'thorns' && by && by.side !== o.side && by.state !== 'dying' && type !== 'dot' && type !== 'thorns' && !(by.reach >= SHOT_REACH || by.shooter)) this.hurt(by, dmg * 0.25, o, false, 'thorns');
      // (1.5: Enrages: under half health, once: bigger, half as hard again, a third faster.)
      if (o.trait === 'enrage' && !o.enraged && o.hp > 0 && o.hp < o.maxHp * 0.5) {
        o.enraged = true; o.light *= 1.5; o.baseSpeed *= 1.3; o.speed = o.baseSpeed; o.r = Math.min(120, o.r * 1.12); o.drawK = (o.drawK || 1) * 1.12;
        this.events.push({ type: 'trait', kind: 'enrage', unit: o });
      }
      if (by && by.passives && by.passives.lifesteal && by.state !== 'dying' && type !== 'dot' && type !== 'thorns') by.hp = Math.min(by.maxHp, by.hp + dmg * 0.25);
      if (o.passives && by && by.side !== o.side && by.state !== 'dying' && type !== 'dot' && type !== 'thorns') {
        const ranged = by.reach >= SHOT_REACH || by.shooter;
        if (o.passives.thorns && !ranged) this.hurt(by, dmg * 0.2, o, false, 'thorns');
        if (o.passives.reflect && ranged) this.hurt(by, dmg * 0.3, o, false, 'thorns');
      }
      o.lastHurt = this.time;
      this.events.push({ type: 'hit', unit: o, by, dmg, heavy, tag, dot: type === 'dot' });
      if (o.hp <= 0) {
        o.hp = 0;
        o.state = 'dying';
        o.dyingT = 0;
        o.target = null;
        if (this.mut) MUTANTS.onDeath(this, o);
        // (1.5: Splits: two smaller halves where it fell, once.)
        if (o.trait === 'split' && !o.splitChild && o.side === 'foe' && this.foes.length < this.level.maxEnemies + 6) {
          for (const sd of [-1, 1]) {
            this.spawnFoe({ foe: o.kind, x: 0.5, mul: 0.45, child: true });
            const h = this.units[this.units.length - 1];
            h.x = Math.max(h.r + 10, Math.min(ARENA.w - h.r - 10, o.x + sd * (o.r * 0.7 + h.r)));
            h.y = o.y;
          }
          this.events.push({ type: 'trait', kind: 'split', unit: o });
        }
        if (o.passives && o.passives.revive && !o.revived && o.side === 'you') (this.cometRevives || (this.cometRevives = [])).push({ card: o.card, kind: o.kind, stats: o.stats, r: o.r, x: o.x, y: o.y, at: this.time + 10 });
        this.events.push({ type: 'death', unit: o, by });
      } else if (o.mutant) MUTANTS.onHurt(this, o);
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
