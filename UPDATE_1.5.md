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
