# Merge Beasts 1.5: the late game (design, not built yet)

Sam's brief of 23 Nov 2026, set out with what the code does today, proposals of mine marked as
such, and the questions to settle before building. 1.5 is not urgent; 1.4.1 (bug fixes) comes
first.

## 1. Prestige stops at 15 in each solar system

Sam: prestige 15 is the most a solar system and its beasts can reach.

Today (checked 23 Nov): each system has 12 biomes (prestige 0 to 11) and 12 prestige costs. There
is no cap: past prestige 11 the button keeps working at the last cost, the meadow stays in the
last biome, and each prestige still adds a battle point to every beast on the field.

To build:
- The prestige button stops at 15 in each system (it says so instead of offering more).
- Biomes for prestige 12 to 15 in each system (four new Prime, four new Low Gravity), and costs
  for 12 to 14 (the curve so far roughly multiplies by 40 a level).
- Battle points from prestige capped at 15 (battle_data.js beastStats).
- Saves already past 15 come down to 15 (nothing lost but the extra prestige; say so once).

Decided (Sam, 23 Nov): 15 ascents, so 16 biomes in each system (prestige 0 to 15): four new
biomes each.

Built (23 Nov, branch update-1.5):
- PRESTIGE_MAX 15 (game.js). The last three costs carry on the climb: 500Oc, 25No, 1Dc (5e29,
  2.5e31, 1e33); numbers now have names to 1e45 (No, Dc, UDc, DDc, TDc). At 15 the bar reads
  "Final Biome / Prestige 15" and the button "Prestige 15, the highest", disabled.
- Four new biomes in each system, painted like the others (biomes.js), with new skylines
  (clockwork, aurora, islands, genesis, pulsar, rings, quasar), two new props (hourglass, floating
  rock) and a new edge (crystal tree). Prime: Chrono Rift, Astral Throne, Shattered Heavens, Edge of
  Creation. Low Gravity: Pulsar Fields, Magnetar Storm, Wormhole Reef, Event Horizon.
- A save past 15 loads at 15, with a one-time note. Battle points from prestige stop at 15.
- A merge achievement, Pinnacle (reach prestige 15): 8 premium crates up to Tier 20.

## 2. World 7, Universal Mutants (battle mode)

Sam's brief:
- Opens once Worlds 1, 2, 4 and 5 are won in full. Both solar systems' beasts may battle there
  (and the comet's, section 3).
- Much harder than any world before: late game, needing high-prestige beasts and real strategy.
- Fewer enemies, much bigger on screen, each with several attacks, unique looks and animations,
  sound effects and damage types. Nearly every level is a boss level; some have peons (healers that
  mend the boss, for instance), some few or none. Many enemies use companions and peons as
  abilities.
- Its own cover art with its bosses. Stars there are blue. The Foe Wiki rates World 7's enemies
  with one to five bleeding, dripping red stars instead of the usual stars, relative to World 7
  only. Sam will make new music for it.

Sam's three example bosses:
- **The Hulk Goblin.** A giant goblin carrying smaller goblins on its shoulders. About every 8
  seconds it throws one high over your defence straight at your coin pile, to catch you out. It
  slams as a normal attack, and every few seconds leaps and lands with a huge, wide slam.
- **The Dragon.** Breathes fire across the field, sweeping from 45 degrees one side of the line to
  your coin pile to 45 degrees the other, hitting every beast in it; fire leaves a burn that keeps
  hurting for a few seconds. Beasts that flank it are hit by a tail swipe behind it.
- **The Three-Headed Serpent.** Each head picks its own target. Its tail hits too; it is fast; it
  births rapid baby serpents that run round your line for your coin pile. (Design it with care: the
  serpent body has been hard to get right before. Proposal: draw it from segments along a spline,
  each segment its own shape, the three necks branching from one shoulder; test it in
  tools/foes.html from every pose before it goes in a level.)

Proposals of mine for World 7 (say which to keep):
- **Telegraphed attacks.** The big attacks show their area on the ground a moment before they land
  (a glowing ring for a slam, a cone for the breath), so moving beasts out, or sending a tank in,
  is the strategy. Without warnings huge damage is just luck.
- **Phases.** At two thirds and one third of its health a boss changes: a new attack, faster, or
  calls its peons. The fight changes shape as it goes.
- **Weak points and armour.** Some bosses take less from the front (shields, scales) and more from
  the side or behind, so flanking matters, which the dragon's tail then punishes.
- **Damage types.** Fire (burns), frost (slows), poison (lasts), crushing (knocks back),
  piercing (ignores armour). Beasts' elements resist or suffer some; comet beasts' passives
  (section 3) build on this.
- **Enrage.** After about three minutes a boss grows stronger, so stalling does not win.
- **Twenty levels, not forty**, every one built by hand: ten bosses, each met first alone and
  later with companions, peons or a second boss. Hand-made fits giant enemies better than the
  dealt patterns of Worlds 1 to 6.

Decided (Sam, 23 Nov): twenty levels for now; he likes the proposals above (telegraphs, phases,
weak points and armour, damage types, enrage) and the extra bosses below, and leaves the details
to me.

Built (23 Nov, branch update-1.5): mutants.js (numbers, moves, levels), mutants_art.js (drawing),
battle.js (screens), battle_engine.js (hooks), battle_audio.js (sounds), tools/battle_sim.mjs.
- Opens when Worlds 1, 2, 4 and 5 are won in full; beasts of every system battle there. A level is
  won by beating its bosses (their camp has no coin pile) and lost if they take yours. Beasts go
  for the nearest enemy wherever it is (nothing waits for them at the top).
- Ten bosses, each with its own moves, phases at two thirds and one third, rage at three minutes
  (the Chimera at two and a half): Gorrak the Hulk Goblin (throws his goblin riders over your line,
  leaps, slams), the Walking Hive (swarms, poison stings; fire makes it burn and let out fewer),
  Rime the Frost Giant (frost lanes that freeze and leave ice, ice boulders), Trisskar the
  Three-Headed Serpent (three heads with their own targets and damage types, tail lash,
  hatchlings down the flanks, a lunge), Vitriel the Mirror Witch (copies your last special,
  glass doubles, blinks away), the Twin Titans Sol and Luna (mend each other close together, and
  one fallen rises again unless both fall within six seconds), the Rot Behemoth (lingering poison
  clouds, plague rats, bursting blisters), the Colossus (footsteps knock back, core beam at your
  shooters, only shots hurt its core), Pyraxis the Dragon (fire breath sweeping 45 degrees either
  side of your pile, armour in front, tail for flankers, wing gust, dive), the Omega Chimera
  (lion, then goat and frost, then wings and fire).
- Every big attack is telegraphed on the ground true to where it hits; a stun in a wind-up
  interrupts it. Damage types: fire burns, frost slows and freezes, poison lingers, crushing
  knocks back, shock stuns; beasts' elements resist some. Each boss is weak to an element and
  resists another (shown on the level and in the Foe Wiki).
- Sam (23 Nov): they hit your coin pile directly. An attack whose area covers the pile takes
  seconds off it (a slam 3, a leap 4, a frost lane 2.5, a beam 3, breath 0.35 a tick), a giant
  within reach of the pile strikes it every swing whoever is fighting it, and giants shoulder on
  towards the pile while they fight.
- Peons: goblin runts (the riders he throws, drawn exactly as on his shoulders), brutes and
  shamans (who mend him), hive drones, frost sprites, hatchlings, glass doubles, plague rats,
  mutant medics (mend bosses, a quarter as much on a giant), stone sentries, wyrmlings.
- Twenty hand-made levels (below), calibrated by the bot with the best six of both systems at
  prestige 15, from 95% of the most it beats at level 1 to 110% at level 20 (the bot never uses a
  special or plays to a weakness, so the last ones need both).
- Blue stars; the Foe Wiki rates World 7 in one to five bleeding, dripping red stars against
  World 7 only; a cover painting with Pyraxis, Gorrak and Trisskar; Sam's three World 7 tracks
  (BattleWorld7Music, 2 and 3), one a level in turn (build.js files names with "world7" as
  mutants). Achievements: Mutation Ended (clear it), Monster Hunter (beat all ten bosses).
- Art (Sam, 23 Nov: more detail, legs above all; nothing should look unjoined): every limb, neck
  and tail is one shape (all outlines drawn first, then the fills), roots tucked behind bodies or
  under shoulders; feet with toes, paws with claws, scales, stitches, runes.

Levels: 1 Gorrak; 2 the Walking Hive; 3 Rime; 4 Trisskar; 5 Vitriel; 6 the Twin Titans; 7 the Rot
Behemoth (medics); 8 the Colossus; 9 Pyraxis; 10 Gorrak's War Band (brutes, shamans); 11 Frost on
the Hive (two bosses); 12 the Serpent's Nest (medics, hatchlings); 13 Glass and Stone (Colossus and
Witch); 14 Dragonfire (wyrmlings); 15 the Plague Twins (rats, a medic); 16 the Long Winter (Colossus
and Rime); 17 Fire and Fang (Trisskar and Pyraxis); 18 the Swarm Queen's Mirror (Hive and Witch);
19 the Gauntlet (Gorrak, then the Twins, then Pyraxis, each after the last falls); 20 the Omega
Chimera.

More boss ideas of mine, in the same spirit: a hive that walks (its back opens and lets out
swarms; burn the hive to stop them); a frost giant who freezes the ground in lanes; a mirror witch
who copies your last special back at you; a pair of twins who heal each other unless killed close
together; a colossus whose footsteps knock everything back and whose weak point is a glowing core
that only ranged beasts can reach.

## 3. The Interstellar Comet (a third world for beasts)

Sam's brief:
- Opens once both Prime and Low Gravity are at prestige 15. Switch between all three in Settings,
  as now.
- "An artefact of time": only the most unique, evolutionarily dominant beasts of the universe live
  on it. Entirely new designs: larger, more alien, mutant, evolved, intelligent. All Super Rare or
  rarer. Very hard to find.
- Each has a passive ability that helps in World 7, working by itself: fire resistance, parrying
  one lethal blow, and so on; more area attackers among them. Evolved forms have their own new
  specials, separate from the passives, and evolving them is very hard.
- Getting them must not be as easy as merging two of a tier. How exactly is still open.

Proposals of mine for how comet beasts are got (any mix):
- **Comet shards.** World 7's stars and bosses drop shards; shards buy a comet egg, which hatches
  slowly in the comet's incubator into a random comet beast of a given rarity.
- **Splicing.** Two Dark Matter beasts, one Prime and one Low Gravity, fused at the comet's altar
  (with shards) make a comet beast of a matching element. It uses the two systems' top beasts up.
- **Trials.** Each comet beast is shown, locked, with a trial to tame it: a World 7 level won a
  certain way. Fits "earned, not merged".
- **Meteor showers.** Now and then a shower crosses the comet meadow; tapping falling stones in
  time catches fragments, and enough fragments of one kind make that beast.
- Merging on the comet: two of a kind make the same beast one rank stronger (its passive better),
  never a new beast, so getting each one stays special.

Passive ideas: fire-proof (no burn, half fire damage), parry (survives one blow that would kill it,
once a battle), thorns (hurts melee attackers), lifesteal, aura of haste for beasts near it,
reflect ranged shots, immune to knock-back, splits into two smaller copies on death, slow-proof,
revives once after ten seconds.

### Decided so far (Sam, 23 Nov), and the plan for getting comet beasts

- Comet beasts battle only in World 7 (and any world after it), never in Worlds 1 to 6.
- **Eggs, with a low chance of the rarest.** Comet beasts hatch from comet eggs.
- **Shards from the old worlds.** At prestige 15 (and only then) each of Prime and Low Gravity
  gets a **Shard Incubator**: drag a beast into it and it is broken down into comet shards over a
  while (not at once). The higher its tier and the rarer it is, the more shards. This gives the
  two old meadows a use once they are finished.
- Shards buy comet eggs; an egg hatches over time in the comet's hatchery.

Proposal of mine for the numbers (to tune once built):
- Shards for a beast: about 2 to the power (tier / 3), times its rarity (Common 1, Rare 1.5, Super
  Rare 2, Ultra Rare 3, Legendary 5, Godly 8, Dark Matter 13), times 2 if evolved. A Tier 20 Dark
  Matter is worth about a thousand times a Tier 1 Common.
- The Shard Incubator takes one beast at a time, a minute or so per beast (longer for big ones),
  like the evolution incubators.
- An egg costs a fixed number of shards and hatches in about an hour. What comes out: Super Rare
  55%, Ultra Rare 27%, Legendary 12%, Godly 5%, Dark Matter 1%.
- A second copy of a comet beast is not wasted: it ranks the first one up (a stronger passive), up
  to rank 5. Evolving one needs rank 5 and a rare evolution egg.
- Sam's idea of an upgrade that sends beasts into the Shard Incubator by itself: could get out of
  hand, so if it comes, it should be slow (only the beasts below a tier you choose, a few an hour)
  and bought late at prestige 15.
- Still open: whether the comet meadow itself earns essence and has its own prestige (question 6).

## 4. Questions for Sam

Answered (23 Nov): 1 sixteen biomes; 2 twenty levels; 3 all of them, details to me; 4 eggs bought
with shards from a prestige-15 Shard Incubator (numbers above to tune); 5 World 7 onward only.

Answered (23 Nov, evening): 6 the comet has its own prestige and earns essence, and its shop drops
the upgrades that only mattered in the early Prime and Low Gravity worlds; 7 yes, slow and late.

## 5. Sam's brief of 23 Nov (evening), and the plan

### Art, for everything from now on
The World 7 bosses' level of detail is the bare minimum for any design: every limb and part joined,
legs, feet and claws drawn properly, several animations each.

### World 7 changes
- A giant too close to your coin pile could flatten it: at each of its thirds (its phase changes)
  it is knocked hard back up the field, staggered for a moment. Still very hard.
- Better rewards, including new beasts: a Tier 20 comet beast for the blue star on every one of
  World 7's twenty levels (the world chest), and comet shards and eggs for its bosses.

### The Interstellar Comet
Sam: comet beasts as detailed and animated as World 7's bosses; true alien beasts. His ideas:
emerald green serpents, onyx serpents, some glowing with constantly changing colours (never
clashing with the rarity glow), alien concepts of all kinds, golden-leaf miniature dragons, aliens,
humans from the future with extreme intelligence and extraterrestrial companions; creative freedom.
Merging must be rewarding but super hard and long; base stats already very high; abilities and
animations aimed at World 7's bosses, with more strategy.

A new rarity, **Cosmic**, for the rarest few comet beasts: its colour a reflecting, starry black
that sweeps across the name from left to right, and round the beast a black hole with flashing
stars of different colours circling it. Tier 20 at most, as everywhere; super stats and abilities;
extremely hard to get even on the comet.

My plan for how the comet works (Sam left it to me):
- Its own meadow, essence and prestige (0 to 10, eleven comet biomes). Its shop: Meadow Expansion,
  Egg Speed, Egg Quality, Auto Collector, Essence Magnet and a new Fusion Speed; Luck Charms,
  Active Clicks, Crate Auto-Opener and Double Merge are gone.
- Comet eggs instead of crates: they fall slowly, and shards from the Shard Incubators (Prime and
  Low Gravity at prestige 15) buy more. An egg hatches Super Rare 55%, Ultra Rare 27%, Legendary 12%,
  Godly 5%, Dark Matter 0.8%, Cosmic 0.2%, at a low tier (higher with Egg Quality and prestige).
- Each comet species is one creature that grows through Tiers 1 to 20, its look growing with it in
  four stages (hatchling, young, adult, ascended: bigger, more horns, crests, wings, light).
- **Fusion, not merging:** two comet beasts of the same tier fuse into one a tier up, taking the
  form of the rarer of the two. The pair wraps itself in a glowing cocoon on the meadow for a
  while (longer each tier), and only a few cocoons can grow at once (more with prestige). So a
  rare one can climb by feeding it common ones of its tier, but every tier takes twice the beasts
  and longer. Cosmic beasts never come from fusion of lesser ones, except two Tier 20 Dark Matter
  comet beasts, which fuse into a Cosmic.
- In battle (World 7 onward only): more points than any other beast of their tier, a passive from
  the start (fireproof, parry, thorns, lifesteal, haste aura, reflect, unshakeable, split, frostproof,
  revive) and a special from Tier 10, many of them made for giants: stagger (a big knockback),
  anchor (a boss cannot start a move), dispel (cancels a telegraphed attack), ward (a shield over
  beasts against the next big attack), sunder (ignores armour).
- First designs (originals; nothing copied from other games): Emerald Serpent, Onyx Wyrm,
  Gilded Leafwing (a golden-leaf miniature dragon), Grey Envoy (an alien with a psionic orb), Void
  Stalker, Nebula Jelly (colours always shifting), Prism Stag, Mind Leviathan, Quasar Phoenix,
  Chrononaut (a human from the future with a little alien companion drone), Astral Sage (a future
  scholar with an alien familiar on her shoulder); Cosmic: the Singularity Dragon, the Ouroboros
  (a serpent eating its tail round a galaxy), the Architect (a being of light with three moons).

### Built so far (23 Nov, late)
- World 7: at each phase change a giant is hurled about 380 back up the field and staggered (its
  wind-up stopped); recalibrated.
- comet_art.js: all fifteen species drawn in four stages, each with a blow and a special pose, the
  Cosmic three with the black-hole aura and circling stars (sheet: App Store 1.4/Comet beasts.jpg).
  Waiting on Sam's look at the designs before the comet's systems are built.
- New reward kinds (battle.js grant): `boost: { mult, minutes }` (an essence boost, stacks with the
  bought x2, saved as rewardBoostUntil/rewardBoostMult, its own badge) and `income: minutes` (that
  much of your current income at once). Pinnacle, Mutation Ended and Monster Hunter now pay these
  instead of premium crates (Sam: premium crates mean nothing late on). Comet eggs join them once
  the comet exists. Achievement progress is always counted from saved totals, so a changed
  achievement picks up where a player already is.
- Sam's answer on timing (23 Nov): the Snowman was only an idea; finish 1.5's ideas first.

### Built on 24 Nov (branch update-1.5, all [skip ci])
- **The comet's meadow** (9c203e6). Warp buttons for every world you can reach (two in Settings).
  Its own essence and prestige (up to 10, keeping its beasts; essence and upgrades restart), eleven
  biomes (Comet Crust to The Origin), Sam's two comet tracks. Comet eggs fall instead of crates
  (2.5 times slower) and hatch a comet beast; two of one tier fuse in a cocoon (20 seconds a tier,
  less with Fusion Speed, a few at once). The shop sells comet eggs for essence (dearer each time)
  or 120 shards. A premium crate opened there is a premium egg (Ultra Rare or better, Tier 3 to 10,
  odds shown in the shop for Apple's rule 3.1.1). The daily spin there gives a comet beast at a third
  of the tier. No evolution incubators on the comet. The details card shows a comet beast's stage,
  passive and special; Cosmic has a starry badge and a black name outlined in starlight.
- **Shard Incubators** (5f60f2c). Prime and Low Gravity at prestige 15, above Incubator Alpha on
  phones. Shards for a beast: 2^(tier/3) x rarity (Common 1 to Dark Matter 13) x2 if evolved;
  30 + 6 x tier seconds each. Legendary and rarer ask first. Shard Feeder upgrade (prestige 15,
  from 2Dc, five levels): Common to Super Rare, not evolved, up to Tier 6 (+2 a level), one every
  25 minutes (5 sooner a level).
- **Comet beasts in battle** (0654eef). World 7 only. Passives always on; specials from Tier 10
  in the three left slots (Stagger, Anchor 6 s, Dispel, Ward 10 s, Sunder 10 s). A comet beast
  always has the full fifteen prestige points in battle, plus one per comet prestige (without this
  a Tier 20 comet beast was weaker than the Dark Matter beasts players bring). Simulator, Dragonfire:
  reference deck 1 win in 3, with three Tier 20 comet beasts 3 in 3. Also fixed Gust (it blew
  enemies towards your own pile). The battle simulator does not load comet.js, so calibration is
  unchanged.
- **World 7's rewards** (ad71b9e). Its chest is now The Singularity Dragon (Tier 20 Cosmic), which
  waits on the comet. (The commit says the old chest was empty; it was not: it always gave the Rose
  Window relic, the only Tier 20 Dark Matter beast of system "any".) Comet shards for first clears
  (20 + 5 x level) and stars (60); Mutation Ended +600 shards, Monster Hunter +360.
- Still to do (then): the Beastopedia's comet section; comet beasts animated in the meadow; limited-time beasts.

### Built on 24 Nov, later (8756029 to 8865574)
- World 7 a tenth harder (battle.js FOE_MUL, applied at battle start, after calibration). Comet
  beasts cost a fifth more mana and rest a quarter longer, and are half as big again in battle.
- **World 8, the Apex Mutants** (mutants8.js, mutants8_art.js; 16ca6d5): opened by beating World 7.
  Eleven giants, four new damage types (acid, void, sonic, gravity), seventeen new moves through
  extension points in mutants.js (EXT, STEP/DEATH/POSE hooks), twenty levels, up to 24 enemies at
  once. Calibrated (tools/battle_sim.mjs --calibrate 8) against three comet beasts (Tier 12 rising to
  20) and three of the best old beasts, from the most the bot beats to 115% of it. Each giant has a
  `top` line it keeps below so it shows whole. Chest: the Ouroboros. Achievements Apex Predator and
  Giant Slayer.
- Comet beasts move on the meadow (field.js draws them live). Comet section always at the bottom
  of the Beastopedia.
- Battle: scenery fills the black bars beside the field on phones (the field is unchanged); the
  first drop spot is centred; Worlds 1 to 6 bosses (+60% health, +30% blows, drawn 40% bigger) and
  champions (+50%, +25%, 25% bigger), applied at battle start.
- Achievements, Comet tab (comet.js COMET.ACH): twelve for the comet, eight hardest in the Mutant
  Worlds (all stars in 7, in 8, in both; the Old Ways: beating five giants with no comet beasts).
  New rewards: comet eggs (state.cometEggBank) and comet beasts. Crate queues are per world now.
- Area attackers: Low Gravity's sharks and gargoyles and five comet kinds; an area beast that shoots
  bursts for 35%.
- Comet prestige targets made steeper with a model of an active player (scratchpad cometecon.mjs):
  prestige 1 about an hour, 5 about a day, 8 about 200 hours of play; adult 7.5 h, ascended 29 h,
  Tier 20 about 225 h.
- **Limited-time beasts** (limited.js; 8865574): the Abominable Snowman, rarity Limited (silver),
  Tier 18, Blizzard special, until the end of 6 January 2027: merge 1,000 beasts above Tier 5, earn 100
  battle stars, trash 100 beasts of Tier 15+, evolve a beast above Tier 5. Banner on opening, a Limited
  tab in Achievements, a Limited section in the Beastopedia. The £6.99 purchase for a missed one is
  not built.

### Limited-time beasts (after World 7 and the comet, Sam said)
- A shiny silver theme: the name with a metallic shine sweeping left to right, a reflective
  metallic glow round the beast.
- Won by several hard challenges within a time window; once the window closes it can never be
  won by challenges (Sam may later sell a missed one for 6.99, within its window only).
- Their own Beastopedia section in silver: how to unlock each; won ones in colour; ones whose time
  ran out as silhouettes with what it took.
- On opening the game while one is live, a bright banner with the beast popping out: "Limited now:
  see Limited Achievements for how to unlock it", a close button top right.
- The first: an Abominable Snowman, Tier 18 with specials, before 27 December. Challenges like:
  merge 1,000 beasts above Tier 5; earn 100 stars in different levels (a counter that remembers;
  levels already starred count when you beat them under the star time again, and the challenge
  lists the levels still open to you); throw 100 beasts of Tier 15 or higher in the trash; evolve a
  beast above Tier 5.
- **Timing:** for the Snowman to be won before 27 December, a build with it has to be on the App
  Store early in December. Suggestion: 1.5 = prestige 15, World 7 and the Snowman event (early
  December); 1.6 = the comet (it is the biggest piece by far).
