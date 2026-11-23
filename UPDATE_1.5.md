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

Still open:
6. Does the comet meadow earn essence and have prestige like the others, or is it a collection and
   hatchery only?
7. The automatic Shard Incubator upgrade: in, out, or slow and late as proposed?
