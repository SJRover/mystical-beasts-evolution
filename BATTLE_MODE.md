# Merge Beasts 1.4: Battle mode

Sam's brief (17 Nov 2026), so the beasts you merge are not only a collection: a battle mode in
the spirit of Battle Cats for the pace, the strategy and the variety of enemies, laid out like
Clash Royale (your coin pile at the bottom, theirs at the top). Every enemy, world and picture
here is our own; only the kind of game is borrowed. This file is the plan, the log of what is
built, and the list of bugs and ideas. Read it first when picking the work up.

Also in 1.4 (done, e67a6cd): prestiging from the Beast Hub cleared the hub's showcase and left
the field from before the prestige to come back on leaving the hub; the game now leaves the hub
first. Holding a beast on a crowded field fell to 30 fps from a no-op animation on every match's
highlight; now 85 fps on the iPhone 14 Plus stand-in.

## Where it lives

The Sanctuary tab is renamed Battle. At its top is the battle section: the Prime Solar System's
three worlds (World 1 open, the next unlocked by clearing the last level of the one before), then
the Low Gravity system's worlds once the Prime ones are done. Under them sit the foe wiki and the
battle achievements, and under those, unchanged, the Mystical Sanctuary and the Rarity Collection
Achievements.

## The four stats

Every beast that can battle has Attack, Health, Speed and Range, as whole points.

- A Tier 1 Common has 1 in each. Each tier above adds one point, so a Tier T beast has T + 3
  points before anything else. Where the extra points go depends on the beast's look: stone,
  golem and shell bodies lean to Health, dragons, bulls and fire to Attack, birds, wind and rays
  to Speed, light, cosmic and deity casters to Range. The split is 45, 30, 15 and 10 per cent of
  the extra points over its four stats in that beast's order, rounded so they add up (a Tier 2
  Common is 2/1/1/1, a Tier 3 is 2/2/1/1, a Tier 4 is 3/2/2/1).
- Rarity adds to the beast's highest stat: Rare +1, Super Rare +2, Ultra Rare +3, Legendary +4,
  Godly +5, Dark Matter +6. Where two stats tie for highest, which one gets it is a fixed random
  choice for that beast (the same every time).
- Prestige adds one point to a random stat (again fixed for that beast and that prestige) for
  every prestige level you have owned that beast in. The game remembers, per beast, the highest
  prestige it has been on your field at (new in 1.4; the beasts on your field when you first open
  1.4 count from your prestige then). In battle you always get your best version of a beast.
- Evolved and infected forms battle as their beast. Shadow bosses cannot be picked.

From points to the battle:

| Stat | In battle |
|---|---|
| Health h | 60 × h hit points (fights between equals last about ten seconds) |
| Attack a | a light attack of 3 × a every second; every fifth swing is a heavy attack of five times that (with the Fury perk, every third) |
| Speed s | 55 + 18 × √(s − 1) units a second (the arena is 1000 wide by 2000 tall; a Speed 1 beast takes about 30 s from pile to pile) |
| Range r | reaches 40 + 26 × √(r − 1) units beyond the target's edge; 90 or more fights from afar with a shot |

Speed and Range grow more slowly the higher they go, so a beast with huge stats does not race
across the map or hit from the other end of it.

## A battle

- You pick six beasts (your deck; one per beast, only beasts you have discovered, only from the
  world's own solar system) on the level's screen, which shows each one's four stats.
- The arena is the size of the meadow's world, with pinch to zoom and drag to look around; it
  opens zoomed out to show the whole of it. The look of the map stays the same within a world and
  varies from level to level (props, paths, colours); a new world has a new look.
- Your six cards sit along the bottom. Tap one and it appears in your safe zone at the last place
  you touched there (or drag a card to the spot), then walks straight up. Each card then rests for
  as many seconds as its tier (Tier 1, 1 s; Tier 20, 20 s). At most ten of your beasts on the field.
- Enemies appear at the top on the level's schedule and walk straight down.
- Anything that has an enemy within its range stops and fights the nearest one, one target at a
  time (bosses hit several). So two enemies can gang up on one beast.
- Your coin pile has 15 seconds. Every enemy standing at it and not fighting takes one second a
  second: two at once, twice as fast. It never fills back up. At zero it explodes, every beast of
  yours on the field dies, and you lose. Theirs works the same way for your beasts: empty it to win.
  Spreading your beasts across the width can tie their enemies up in one place while one of yours
  slips past to their pile.
- Every unit wears a heart that follows it and empties as it is hurt: red for yours, black with a
  white outline for enemies. It goes when the unit dies.
- Light and heavy attacks, getting hit, dying and taking coins all have their own animation and
  sound, chosen by what the beast or enemy looks like (a stone thud, a fire whoosh, a sword clang,
  a zap).

## Stars and rewards

- A star for clearing a level under its target time (shown before and during the battle).
- First clear: essence (a few minutes of your current income in that solar system, more for later
  levels) and, on a boss level, a premium crate.
- Every 5 stars: a free spin of the wheel (kept until used, alongside the daily one).
- Every star in a world: that world's chest. World 1, a guaranteed Legendary or better from Tier
  10 up; World 2, Godly or better from Tier 12 up; World 3, Godly or better from Tier 15 up; the Low
  Gravity worlds the same from their own beasts.
- Achievements: stars collected, levels and worlds cleared, bosses beaten, very fast clears of
  certain levels, wins with only low tiers. Each pays essence, crates or spins.

## Worlds and enemies

| World | System | Theme | Enemies |
|---|---|---|---|
| 1 Shadow Wilds | Prime | a dark wood at dusk | shadow folk: wholly black, glowing eyes (thieves, knights, wisps, giants, witches) |
| 2 Iron Kingdom | Prime | castle roads and fields | people of many kinds and creatures of myth (soldiers, archers, mages, dwarves, orcs, minotaurs, cyclopes, centaurs) |
| 3 Star Invasion | Prime | a crashed fleet on scorched land | aliens and their machines (greys, blobs, insectoids, tripods, drones) |
| 4 to 6 | Low Gravity | to come after 1 to 3 are played | |

40 levels each, a boss every tenth level (a huge, tough enemy that can hit several of your beasts
at once). Over 100 enemy kinds across the first three worlds, each with its own walk, attack,
death and coin taking. The first levels of World 1 can be won with Tier 1 and 2 beasts before any
prestige; World 3's last levels need high tiers and prestige.

## Foe wiki

Every enemy you meet is added (win or lose) with its picture, its stats, a short note on what it
is, and a difficulty from half a star to five in half stars. Unmet ones show as silhouettes.

## Music (Sam's to make)

Put these at the root of the project, beside the solar system music, as MP3:

- `Battle Music 1.mp3`, `Battle Music 2.mp3`, ... (as many as you like): played in turn in battles.
- `Battle Boss Music.mp3`: boss levels.
- `Battle Victory.mp3` and `Battle Defeat.mp3`: short stings for the end of a battle (optional).

Until they exist, battles play the solar system's own music.

## Build plan

1. `battle_data.js`: stats from a beast (pure functions, tested in Node), enemy roster, worlds and
   levels, rewards and achievements.
2. `battle.js`: the simulation (pure, runs in Node for balance), the canvas renderer and camera,
   the battle screen, the Battle tab, level and deck screens, results, the foe wiki, saving.
3. `enemies.js`: enemy art, drawn on the canvas from parts with poses (walk, light and heavy
   attack, hit, death, taking coins).
4. Sounds in `audio.js` (made in Web Audio like the rest), music hook for the files above.
5. Balance: a bot plays every level in Node with the deck a player would have by then; every level
   must be winnable and the curve must climb. Then reviewers play it in the browser on the phone
   layout.

## Rules added in testing (Sam to agree or not)

Your brief had units walk dead straight and fight only what comes into reach. Played that way
by a bot, a swarm of Tier 1 Sparkys (one second's rest each, ten at once) slipped down an empty
lane and emptied the enemy pile in two seconds, at every level: strength never mattered. So:

- **Short sight.** A walking unit drifts sideways towards an enemy just ahead (within about a
  fifth of the field's width) to meet it; anything further to the side it still walks past. Your
  idea of tying their enemies up in one place while one of yours slips by still works, from far
  apart.
- **Home defence.** A unit near its own pile goes for an attacker there rather than walking past
  it. The same rule for both sides: your newly played beasts defend your pile too.
- **Their defenders.** When your beasts start taking their pile, a small group of their enemies
  comes out beside it, and again at 10 s and 5 s left; while their pile is being taken, their next
  enemy comes out at once.
- **Their camp.** Enemies come out around their pile (the middle half of the width), not anywhere
  along the top, so the pile is guarded.
- Units of one side ease apart instead of standing on one spot.

## Balance (tools/battle_sim.mjs)

`node tools/battle_sim.mjs --calibrate` plays every level with five ways of playing and the deck
a player would have by then (`progress` in the tool: Tier 1 at World 1 level 1 to Tier 13 or so
by its end before any prestige, Tier 20 by the middle of World 2, then prestige), finds the
strongest enemies that deck can beat, smooths that along each world, sets each level a little
below it (kind early on, tough on boss levels), checks three of the five ways still win (or eases
the level), and writes `battle_levels.js` (each level's enemy points and star time). Without
`--calibrate` it plays each level with that deck and one three tiers weaker. Change the progress
model there if the assumed collection is wrong; re-run after any change to the rules or numbers.

Health is 60 a point (it was 24: fights were over in two seconds). Speed and Range take half
their share of a beast's extra points, Attack and Health the rest (a Tier 13 cosmic beast had
Attack 2 and was useless).

## Tools

- `tools/foes.html?world=1&pose=walk|atk|heavy|hurt|die` all the enemies, moving;
  `node tools/foes_sheet.mjs out.png 1 heavy 0.6` the same as one picture.
- `node tools/battle_check.mjs out-dir [world] [level] [seconds]` (TIER=2 for a newer player's
  beasts): the tab, the world, the level, a battle, screenshots, frame rate, page errors.
- `tools/hold_lag.mjs`, `tools/prestige_hub_check.mjs` for the two fixes.

## Log

- 17 Nov: plan written; the two fixes above shipped (e67a6cd). battle_data.js (stats, 120
  enemies, levels, rewards, achievements), battle_engine.js, enemies.js (all 120 drawn: shadow folk;
  people and creatures of myth; aliens and machines), battle_audio.js, battle.js, battle.css. The
  Sanctuary tab is Battle; Beastopedia details show battle stats; the wheel takes earned free
  spins; the meadow carries on but is not drawn during a battle. Calibrated. Perks (one per
  battle once earned: Fury, heavy every third swing, for beating a boss; Rally, cards rest a
  quarter less, for 25 stars; Fortify, your pile 20 s, for a win with your pile full). A "How
  battles work" panel, shown before the first battle and from the tab. Glows on the battle canvas
  are stamped from one small picture per colour (a dozen enemies made fifty gradients a frame).

## Bugs found

- Ten beasts played at one marker stood on one spot (looked like three): fixed, they ease apart.
- The enemy hit flash whitened the ground behind them on the battle canvas: fixed (drawn apart).
- Pointer capture threw for touches the page did not see start: guarded.

## To do

- Reviewer playtests on the phone layout (Sam asked for them).
- Low Gravity worlds (4 to 6) with their own enemies.
- Fine-tune the long World 1 levels (the bot takes three to six minutes on a few).

## Ideas for later

- Knockback on heavy hits, as in Battle Cats, to make fights swing back and forth.
- Enemy traits (armoured: half damage from light attacks; flying: only Range 3 and up can hit it).
- Daily or weekly challenge levels.
