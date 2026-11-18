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
| Speed s | 62 + 18 × √(s − 1) units a second (the arena is 1000 wide by 2000 tall; a Speed 1 beast takes about 28 s from pile to pile) |
| Range r | reaches 40 + 26 × √(r − 1) units beyond the target's edge; 90 or more fights from afar with a shot |

Speed and Range grow more slowly the higher they go, so a beast with huge stats does not race
across the map or hit from the other end of it.

## A battle

- You pick six beasts (your deck; one per beast, only beasts you have discovered, only from the
  world's own solar system, plus any Folded Legends you have won) on the level's screen, which
  shows each one's four stats. The list sorts by tier, rarity or any stat, high to low or low to
  high, and filters by rarity. A level with a rule (below) keeps its own six.
- The level's screen shows its enemies as "???" until you have played that level once (won, lost
  or retreated), then the ones you have met.
- The arena is the size of the meadow's world, with pinch to zoom and drag to look around. It opens
  on nearly the whole field (the full width on a phone); the ⤢ button goes in close on your half
  and back out. The look of the map stays the same within a world and varies from level to level
  (props, paths, colours); a new world has a new look.
- A three-second countdown (3, 2, 1, Fight!) before anything moves. You can choose your spot
  during it.
- Your six cards sit along the bottom, each with its four stats underneath when the screen is tall
  enough. Tap a spot in your blue zone, then tap a card: the beast comes out at that spot and walks
  up. Or drag a card onto the zone. Each card then recharges for as many seconds as its tier
  (Tier 1, 1 s; Tier 20, 20 s). At most ten of your beasts on the field (five under the Small
  band rule); trying for one more says so, as does a card that is still recharging. Each card and
  its four stats sit framed together as one tile, with a gap between tiles.
- Enemies appear at the top on the level's schedule (its pattern, below) and walk down. There is
  no longer a cap of about ten of them on the field (Sam, 18 Nov: "there can be more leeway
  there"): from six on the first level to twelve or so by the end of a world, more where they come
  in crowds, up to 28 in a late horde.
- Everyone has a body: nobody stands inside anybody else, beast or enemy. A unit fighting or taking
  coins holds its ground and the other is moved.
- Anything that has an enemy within its range stops and fights the nearest one, one target at a
  time (bosses hit several). So two enemies can gang up on one beast.
- Your coin pile has 15 seconds. Every enemy standing at it and not fighting takes one second a
  second: two at once, twice as fast. It never fills back up. At zero it explodes, every beast of
  yours on the field dies, and you lose. Theirs works the same way for your beasts: empty it to win.
  Spreading your beasts across the width can tie their enemies up in one place while one of yours
  slips past to their pile.
- Every unit wears a heart that follows it and empties as it is hurt: red with a white rim for
  yours; for enemies a white heart with a dark rim and an angry face, the white draining as it is
  hurt (the black one was hard to see on dark ground). An elite's rim is gold. It goes when the
  unit dies.
- Range is how far a unit hits from: anything reaching 90 units or more fights from afar with a
  shot. Beasts shoot by element (a fireball, a bubble, a gust, a rock, a beam of light, a void
  orb, a spinning star, a holy orb); enemies by weapon (arrows, crossbow bolts, bullets, a laser,
  a cannonball, a sling stone, a thrown potion, music notes, magic).
- How beasts move (18 Nov, fourth round: "unique and varied ... depending on their stats or who
  they are"). Walkers by their best stat: quick ones trot up on their toes, tough ones waddle
  side to side with a thud of dust each step, strong ones stride with a nod. Hoppers bound,
  squashing on landing; fliers beat their wings; floaters drift with sparkles; swimmers undulate
  with a bubble now and then; the higher one is, the smaller its shadow. Up close, by how it moves,
  its best stat and a fixed pick of its own (so two alike still differ): sluggers slam down or
  chomp twice, quick ones pounce or strike three times in a flurry, tough ones ram or rear up and
  stomp a ring into the ground, fliers swoop, floaters swoop or twirl, swimmers roll. Ranged beasts
  whose best stat is Range rise over a glowing ring to channel the shot; the rest rise and kick back.
- How enemies move. Each person walks by who it is: thieves, ninjas and cloakers sneak low with
  their arms swept back; soldiers, knights and guards march with high knees and stiff arms;
  pirates, vikings and gladiators swagger with a rolling sway; scarecrows, farmers and grave
  diggers shamble, dragging a leg with the head lolling; robots clank in steps with a twitching
  head; jesters, imps and goblins skip; the Moon Hollows' people bound in low gravity, legs tucked
  at the top of each leap; the big and heavy stomp; other runners sprint; casters glide; swarms
  scurry. Each steps at its own pace, so a crowd is not in step. Hounds gallop, crawlers skitter,
  serpents slither, blobs travel in squashy hops.
- How enemies attack: by weapon (blades slash with a swoosh, heavy tools come down from overhead,
  spears lunge, daggers jab twice, claws rake, bows are drawn and loosed, guns kick with a muzzle
  flash, staffs are raised over a glowing ring, slings whirl, potions are thrown, instruments are
  played), and on top of that by who they are: runners leap in at their target; quick blades
  slash and backhand; spinning weapons (double axes, mantis blades, scythes, laser swords) whirl
  the whole body on a heavy blow; the heavy jump and pound a ring of dust into the ground; shield
  bearers shove with the shield on light blows; marksmen kneel to shoot; staffs with orbs spin
  them up before they fly; bosses roar with their arms flung wide before a heavy blow. Hounds
  pounce, or shake a bite on a heavy blow; crawlers rear up and strike down, spitters spit;
  serpents coil back and strike; blobs stretch tall and slam flat. Hits look like the attacker
  (embers, splashes, rock chips, sparkles, slash marks, claw marks, dust rings).
- Light and heavy attacks, getting hit, dying and taking coins all have their own sound, chosen by
  what the beast or enemy looks like (a stone thud, a fire whoosh, a sword clang, a zap).
- The clock is battle time: at 2× it runs twice as fast, and says "2×" beside it. Star times are
  in battle time, so playing at 2× does not make a star harder.
- The coin pile is an open chest behind a heap of coins, with stacks, gems and, while full, a
  crown. Yours is wood lined blue; theirs iron lined red. It shrinks in eight steps as it empties.

## Stars and rewards

- A star for clearing a level under its target time (shown before and during the battle; never
  more than four minutes).
- First clear: essence (a few minutes of your current income in that solar system, more for later
  levels) and, on a boss level, a premium crate.
- Premium crates won in battle wait in the spawner bar with any bought ones and are used first.
  Each holds a beast up to a top tier: Tier 15 for the early achievements and the boss crates of
  Worlds 1, 2 and 4; Tier 18 for the middle ones and Worlds 3 and 5; any tier for the late ones
  and World 6.
- Crates from achievements drop in the meadow; if it already holds its five, each one left over is
  paid as essence instead, scaled to the level.
- Every 5 stars: a free spin of the wheel (kept until used, alongside the daily one). The Battle
  tab shows how many you have and opens the wheel; the wheel says when a spin is a battle one.
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
| 4 Moon Hollows, 5 Ring Pirates, 6 Eclipse Court | Low Gravity | the moon, a ringed planet, a dark court | see below |

40 levels each, a boss every tenth level (a huge, tough enemy that can hit several of your beasts
at once). Over 100 enemy kinds across the first three worlds, each with its own walk, attack,
death and coin taking. The first levels of World 1 can be won with Tier 1 and 2 beasts before any
prestige; World 3's last levels need high tiers and prestige.

Each world has a painted card on the Battle tab (its sky and ground, its place, three of its
people with the boss behind). Each level's tile shows its boss or the enemy that first appears in
it (a silhouette until played), its number, a rule badge if it has one, and a green tick when
won, with a star beside it when the star is earned. Won levels can always be played again.

### How enemies come (patterns, 18 Nov)

Sam: levels "seem to just add one more enemy per level", and "like Battle Cats, they could all
spawn at once"; then (fourth round) "some levels may be only 1 or 2 enemies but they're buffed
or there's a lot of them at once". Each level has one of ten patterns, dealt from level 4 like
cards from a shuffled pack (a fresh pack every ten, so each world gets every pattern three or four
times), never the same twice running:

| Pattern | What comes |
|---|---|
| Patrol | a steady stream of ones and twos |
| Rush | a whole line at once across the field (three at first, up to nine later), a trickle, then a second rush |
| Waves | quiet, then a wave; each wave bigger |
| Ambush | a trickle of ones, then a crowd from both edges at once |
| Flanks | pairs down both edges, the middle left open |
| Escort | a tough one in front with shooters walking behind it (up to three) |
| Champion 👑 | one huge enemy (two side by side from level 15) and nothing else for over a minute; a champion has three times the stats (2.3 times when there are two), stands half as big again, hits two at once, glows red-gold with a ring round it and a crown on its heart; the same one or two kinds all level, and they are its only defenders |
| Horde 👥 | a crowd of 8 to 22 weak enemies at once in rows across the whole width (each a little under half as strong), a lull, then a bigger crowd |
| Fortress 🏰 | a quiet trickle, but when your beasts touch their pile its whole garrison comes out at once (5 to 14, with a champion from level 15) |
| Rising tide 🌊 | slow at first, then faster and faster in bigger groups |
| Boss | a thin stream, the boss at 20 s with a guard either side |

Levels 1 and 2 are patrols and level 3 a small rush. Rushes, waves, ambushes, champions, hordes,
garrisons and the tide are called out across the top of the field (a champion's in red with a
crown either side). The four unlike the rest have a badge on their level's tile, with a key under
the grid. From level 6, now and then an enemy comes as an elite: a size up,
1.8 times the health, 1.4 times the hit, with a gold glow and a gold rim on its heart.

### Rule levels and themed waves (17 Nov)

So the strongest six does not win everything: every tenth level from 4 allows only quick cards
(recharging in half the tier a player would have by then); every tenth from 7 sets, in turn, a
long reach (Range at least the third best of the expected collection), swift (Speed, likewise),
plain stock (Commons and Rares) or three beasts only. Where a rule could not bite yet it becomes
three only. From level 12, every tenth level from 2 sets, in turn, slow orders (every card
recharges twice as long), a small band (five of yours on the field at most) or thick skin (Health
at least the third best of the expected collection). Slow orders and a small band change the
battle, not your six, so they use your usual six. Every tenth level from 5 is themed: snipers, a
swarm, runners or heavies.

## Foe wiki

Every enemy you meet is added (win or lose) with its picture, its stats, a short note on what it
is, a difficulty from half a star to five in half stars, and how many you have defeated. Unmet ones
show as silhouettes. Pictures are drawn at twice the size they show, five or more to a row.

## Folded Legends (17 and 18 Nov)

Sam: "whole new looking beasts ... unlock as a reward for certain achievements ... really rogue
stats ... scale so not OP ... add them to the Beastopedia ... can't get them from spins or premium
loot boxes". Fifteen paper characters of folded facets (`legends_art.js`), nothing like the
meadow's round beasts. Sam (fourth round): "so they actually look like origami characters, like
they're supposed to be someone or something". Each is a character with a face, an outfit and a
prop: the crane a courier (red cap and sash, a sealed letter in its beak), the fox a scout (a blue
scarf streaming), the frog a samurai (helmet with a gold crest, a sword), the turtle an old sage
(straw hat, beard, a bundle), the ray a sky pilot (goggles, ribbons, a kite tail with bows), the
tiger a brawler (red headband, a roar), the koi a lantern bearer, the stag a shrine guardian
(sacred rope and paper streamers), the bat a night count (cape lined red, collar, bow tie, fangs),
the serpent a scholar (its body a written scroll, a scholar's hat, a brush), the owl a professor
(spectacles, mortarboard, a book), the dragon a warlord (gold horns, fire), the phoenix a firebird
(flame plumes with eyes, a crest), the Thousand Cranes a crowned crane queen with her flock and
strings of cranes, the Kirin a dark sovereign (black paper edged pink, flame mane, brow gem, on
clouds). Folded paper with prints (dots, waves, scales, brush writing), light from above and a
bright fold on each facet. `tools/legends.html` shows them all. Their stats add up to what any
beast of their tier and rarity has (tier + 3 + the rarity bonus), but lopsided. They battle in
every world, Prime and Low Gravity (Sam agreed, 18 Nov).

| Legend | Tier, rarity | ATK/HP/SPD/RNG | Won by |
|---|---|---|---|
| Paper Crane | 4 Rare | 1/1/2/4 | 10 stars |
| Fold Fox | 5 Rare | 2/1/5/1 | 15 levels won |
| Origami Frog | 3 Super Rare | 4/2/1/1 | 150 swarm enemies defeated |
| Origami Turtle | 6 Super Rare | 1/8/1/1 | a win from level 5 on with no beast above Tier 3 (level 10 until the harder curve made that impossible) |
| Kite Ray | 7 Ultra Rare | 2/2/5/4 | 5 wins with your pile full |
| Paper Tiger | 8 Super Rare | 9/1/2/1 | 3 bosses |
| Lantern Koi | 9 Ultra Rare | 3/2/2/8 | 75 kinds of enemy met |
| Folded Stag | 10 Ultra Rare | 6/8/1/1 | 400 shadow folk defeated |
| Paper Bat | 11 Legendary | 5/3/8/2 | 400 invaders defeated |
| Scroll Serpent | 12 Legendary | 5/1/2/11 | 40 stars |
| Paper Owl | 13 Legendary | 6/5/3/6 | the Shade King defeated 3 times |
| Origami Dragon | 16 Godly | 9/5/2/8 | 12 bosses |
| Fold Phoenix | 18 Godly | 10/4/9/3 | 120 levels won |
| The Thousand Cranes | 20 Dark Matter | 8/4/5/12 | 200 stars |
| The Paper Kirin | 20 Dark Matter | 9/9/5/6 | every other battle achievement (the Grand Master achievement) |

They have their own sheet on the Battle tab (silhouette and progress until won), a section in the
Beastopedia after the two solar systems, and a reveal in the results when one is won.

## Achievements

28, in groups (battles won, stars, bosses, worlds, feats, foes met, Grand Master). Each shows a
medal that stays a dark silhouette until earned, a progress bar, and its reward as pictures
(crates, premium crates with their top tier, spins, the legend it gives).

## Music (Sam's to make)

Put the MP3s at the root of the project, beside the solar system music, with "Battle",
"Victory" or "Defeat" in the name; build.js lists them in `battle_music.json` (also run `node
build.js` after adding one while testing in the browser). It sorts them by the words in the name:

- "LowGravity" (or "Low Gravity") anywhere in the name: a Low Gravity battle track; otherwise Prime.
- "Boss": a boss level's track; otherwise a casual track for the other levels (several are
  played in turn: `...Variant1`, `...Variant2` and so on).
- "Victory" or "Defeat": the music at the end of a battle, for example
  `PrimeSolarSystemVictoryMusic.mp3`. A battle picks one from its own solar system ("LowGravity"
  in the name for the Low Gravity worlds) at random, or any if its system has none.

When a battle ends its music fades out over a second and a half while the victory or defeat music
comes in. Until there are files for those, the game plays its own: a five-second brass fanfare
rising to a held chord with a drum roll and a cymbal, or a slow minor fall to a low held chord.
The solar system's music comes back when you leave the results.

Sam's first two (17 Nov): `PrimeSolarSystemCasualBattleMusicVariant1.mp3` (Prime levels) and
`LowGravityBattleBossLevelMusic.mp3` (Low Gravity boss levels). Then (18 Nov) Prime casual
variants 2 to 4 and `PrimeSolarSystemVictoryMusic.mp3` and `PrimeSolarSystemDefeatMusic.mp3`
(the list first needed "Battle" in a name; it now takes "Victory" or "Defeat" alone too). Still
to come if Sam wants them: Low Gravity casual tracks, a Prime boss track, Low Gravity victory and
defeat music (until then those use the Prime ones). A
Prime boss track would be, for example, `PrimeSolarSystemBattleBossLevelMusic.mp3`; until there
is one, Prime boss levels play the casual tracks. With no battle music at all, a battle keeps the
solar system's own music.

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

## Rules added in testing (Sam agreed, 18 Nov: "yes but keep testing")

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
- **Bodies.** Nobody stands inside anybody else (Sam asked for this on 17 Nov).
- **Anywhere in your zone.** A beast comes out where you tapped in the zone, not only along the
  bottom edge.
- **Legends everywhere.** Folded Legends battle in the Low Gravity worlds too, although those are
  otherwise for Low Gravity beasts only.

## Balance (tools/battle_sim.mjs)

`node tools/battle_sim.mjs --calibrate` plays every level with five ways of playing and the deck
a player would have by then, finds the strongest enemies that deck can beat, smooths that along
each world, sets each level a little below it (kind early on, tough on boss levels), checks three
of the five ways still win (or eases the level), and writes `battle_levels.js` (each level's enemy
points and star time). Without `--calibrate` it plays each level with that deck and one three
tiers weaker. Re-run after any change to the rules or numbers (`--calibrate N` for each world in
parallel, logs kept out of tools/calib, then `--merge`; about half an hour).

The deck a player would have (`expect` in battle_data.js). Sam (fourth round): "a bit harder,
like tier 10 beasts by level 10". So a tier a level up to Tier 10 at level 10, then a fifth of a
tier a level: Tier 16 at the end of World 1 before any prestige, Tier 20 by the middle of World 2,
then a prestige every six levels. Rarities come a little sooner (Super Rare from level 8, Ultra
Rare from 20, Legendary from 35). It was Tier 4 at level 10 and Tier 13 at the end of World 1.
The Low Gravity worlds climb the same way from Tier 1.

Each pattern is harder or easier at the same points (a champion's stats are three times the
level's, a horde's under half), so the smoothing takes out each pattern's own lean, measured per
world, and puts it back after: champions came out at 0.54 to 0.91 of the climb, hordes at 1.0 to
1.6, rushes 0.9 to 1.3. Levels with a rule are left out of the smoothing and kept at or under what
their own six can beat. Margins under the most the deck beats: 0.55 on levels 1 to 3, 0.75 to
level 8, then 0.82 rising to 0.9, bosses 0.92 (they were 0.5, 0.7, 0.78 to 0.86 and 0.9). The
search for the most starts just under the level before's.

What that gives in World 1 (the bot, playing simply): the expected deck wins every level in at
least three of five ways (World 1 level 37, three only, is lost one way of five); a deck three
tiers weaker wins 21 of 40, slowly, and stalls on most of the rest (it was 33 of 40 before). A
Tier 3 deck can still win level 5 (so the Origami Turtle's challenge moved there) but nothing from
level 10. A Tier 8 deck beats the bosses of levels 10, 20 and 30 (Underdog stays possible). Many
star times reach the four-minute cap on champion, fortress and horde levels, where the bot is slow.

Stalemates: a deck that is too weak often neither wins nor loses (the bot holds its half and never
breaks through). An overtime rule was tried and taken out (see Bugs found); a person can change
their six, their lanes, or retreat.

Health is 60 a point (it was 24: fights were over in two seconds). Speed and Range take half
their share of a beast's extra points, Attack and Health the rest (a Tier 13 cosmic beast had
Attack 2 and was useless).

## Tools

- `tools/foes.html?world=1&pose=walk|atk|heavy|hurt|die` all the enemies, moving;
  `node tools/foes_sheet.mjs out.png 1 heavy 0.6` the same as one picture.
- `node tools/battle_check.mjs out-dir [world] [level] [seconds]` (TIER=2 for a newer player's
  beasts): the tab, the world, the level, a battle, screenshots, frame rate, page errors.
- `tools/hold_lag.mjs`, `tools/prestige_hub_check.mjs` for the two fixes.

## Low Gravity worlds (built 17 Nov)

Worlds 4 to 6 (Moon Hollows, Ring Pirates, Eclipse Court), 40 levels each, 24 new enemies each
(72; 192 in all): lost astronauts and moon ghosts; space pirates and hired guns; void knights,
star mages and dark seraphs. Low Gravity beasts only, the same climb as Worlds 1 to 3 starting
from Tier 1 again. World 4 opens once you have reached the Low Gravity system (its warp opens at
Prime prestige 9) and won World 1, not after World 3: waiting for World 3's end would keep most
players out (Sam agreed, 18 Nov). Achievements for clearing them, all 240 levels, all 24 bosses
and meeting every enemy.

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

- 17 Nov (second round, Sam's notes): collisions; enemy hearts white with an angry face; rule
  levels and themed waves; the Folded Legends; bigger units drawn to their footprints; shots for
  ranged units; the detailed coin pile; tap a spot then a card; the meadow's camera may go past
  the bars so no beast is stuck under them.
- 18 Nov (third round, Sam's notes): world art and level tiles with ticks and stars; level
  patterns and elites; sorting and filtering the deck; tidier perks; the countdown; messages for a
  full field or a recharging card; synthesised victory and defeat music with the battle music
  fading out; crates paid as essence when the meadow is full; enemies hidden until a level is
  played; attack styles for beasts and enemies, enemy walks by role and more detail on the
  people; sharper foe wiki; short "How to play"; achievements redesigned; the Paper Kirin for
  every achievement; opening on the whole field; "Ready to Ascend!" opens the prestige screen; the
  free spin button; "up to Dark Matter" on the wheel; stats under the battle cards; premium crates
  fixed and capped. All six worlds recalibrated after the patterns.
- 18 Nov (fourth round, Sam's notes): harder (Tier 10 by level 10); three more rules (slow
  orders, small band, thick skin); four more patterns (champion, horde, fortress, rising tide)
  dealt from a shuffled pack; many more enemies allowed on the field; card and stats framed as one
  tile; the Folded Legends redrawn as origami characters; walks by who an enemy is (sneak, march,
  swagger, shamble, clank, skip, bound, stomp) and attacks by who it is (leap, double slash, whirl,
  pound, shield bash, kneel, roar, orbs); hounds, crawlers, serpents and blobs given their own
  moves; beasts given walks and attacks by stat and a pick of their own (trot, waddle, stride;
  flurry, chomp, stomp, twirl; channelling over a ring). The Origami Turtle's challenge moved to
  level 5. Sam agreed to the rules added in testing, legends in the Low Gravity worlds and World
  4's unlock. All six worlds recalibrated.

## Reviewer playtest 1 (17 Nov, a new player with Tier 1 to 3 beasts, 375 by 812)

Levels 1 and 2 played (1 won with the star; 2 lost once, the second try cut off). No console
errors. What it found, and what was done:

- Units about 25 px tall and enemies dark on a dark wood, hearts overlapping in clumps: units are
  drawn 30% bigger (their footprint for fighting unchanged), the battle opens at the meadow's own
  zoom on your half with a button (⤢) for the whole field, World 1's ground is lighter and shadow
  folk have a brighter rim, hearts are bigger.
- The sixth deck slot was cut off at the right edge: fixed. The tip covered your pile and came back
  every battle: now once ever, under the top bar. The pile's seconds hid under the card bar or the
  title: now beside the ring. The world chest's wording read as a chest a star: reworded.
- Reinforcements slow at 1×: units walk 13% faster (62 a second at Speed 1).
- Level 2's star time 4:15 against 1:05 at level 1: those were the old levels; recalibrated with
  all six worlds.
- The page reloaded mid-battle: that was the dev server reloading as I edited files; a battle now
  also pauses itself if the app goes to the background.
- Kept as Sam asked: the Sanctuary and the rarity collection sit under the battle section.
- Not changed: a player with fewer than six beasts can battle with what they have (World 1 level 1
  is made to be won with Sparky alone).

## Reviewer playtest 2 (18 Nov, a Tier 8 player, World 1 levels 9 to 15, 375 by 812)

Won every level first try (0:42 to 1:32), pile never touched; only level 14 (quick cards) felt
like a fight. No game errors. What it found, and what was done:

- Their pile and the boss were under the top bar in the opening view, so battles ended out of
  sight: the battle opens on the whole field, and zoomed in the camera may go a little past the
  ends. Hearts never go under the top bar (the boss's was under the clock).
- No one shot in World 1 (the Dusk Archer's reach was under the 90 needed): blows are drawn as
  shots from Range 3 up, and every shooter or caster enemy shoots. Drawing only; damage unchanged.
- Warnings were hidden under the battle sheets (not allowed, locked level, locked perk, seven
  beasts): the game's toasts now show over them (not over a battle).
- The meadow's plague ran unseen during battles and killed most of the field, and income fell
  with it: the meadow now stands still during a battle (no wandering, plague or shadow attacks);
  income carries on.
- The stats under the cards were 24 numbers in a row: each card has a small plate, A H / S R.
- The blue zone was not blue: it is tinted, edged and labelled "YOUR ZONE".
- Fights at their pile were murky: shadow folk arrive in purple smoke, not black; damage numbers
  sit beside the target, not on its heart; an emptied enemy heart is slate, not red-brown.
- Results: each achievement now lists its own rewards; new perks are announced; new foes are
  named; a legend says what won it; a retreat says "Retreated"; Levels goes back to the grid.
- World achievements counted worlds ("0/2" for one world): they count that world's levels won.
- The Hollow Giant looked like the Shadow Brute: horns, a cape, a hammer and a hollow, glowing
  chest. A boss level hides its boss's name until played.
- The world chest is a drawn chest; the rule badges have a key under the grid; unknown enemies'
  silhouettes are lighter so they show on dark tiles.
- Legend tiles in the Beastopedia: the rarity alone at the top (the number ran into it).
- Terrapin (a turtle) had Speed as its best stat because a tie went to a random stat: ties now go
  to the stat the beast's look leans to (only an all-equal beast is random). Terrapin is 2/4/2/1.
  Aeris (a bird) with Health 6 is the rule as written (its rarity bonus goes to its highest
  stat, Health), so left.
- Too easy for a Tier 8 player: World 1 was balanced for Tier 3 to 4 at level 10. Sam decided
  (fourth round): "a bit harder, like tier 10 beasts by level 10". Done; see Balance.

## Bugs found

- Ten beasts played at one marker stood on one spot (looked like three): fixed, they ease apart.
- The enemy hit flash whitened the ground behind them on the battle canvas: fixed (drawn apart).
- Pointer capture threw for touches the page did not see start: guarded.
- Premium crates could not be used after a restart: the button was never refreshed on load, so it
  stayed greyed out at "Premium: 0" until a crate was bought. Fixed (18 Nov).
- "Ten beasts is the most on the field" never showed: the tip was hidden again on the next frame.
  Fixed with its own timer.
- Worlds 1 and 4 level 2 could not be won by the bot even at the weakest enemies: wisp swarms came
  three at a time from level 2. Swarms come in twos for the first three levels.
- The balance tool's merge read every file in tools/calib (my logs too) and stopped; it reads only
  the world files now.
- Long star times (the bot took six or seven minutes on some levels): stars are capped at four
  minutes.
- The Low Gravity worlds were paced as worlds 4 to 6 (bigger crowds, faster spawns) although
  their players start again from Tier 1: they are now paced by their place in their own system,
  World 4 like World 1. Recalibrated.
- Still open: World 4 level 2 is won by the bot only two times in five with a lone Tier 1 beast
  at the weakest enemies. No real player meets it that way (World 4 needs World 1 won, which
  earns several Folded Legends that battle there), so it is left; watch it in playtests.
- The battle's pile seconds sat on top of the spawn marker's first spot: the marker starts higher.
- A champion level listed six kinds of enemy (each champion picked afresh, and three defenders
  besides): now the same one or two kinds all level, and they are its only defenders.
- A Folded Legend floated a little above its shadow in battle (its picture stands on a higher
  line than a beast's): drawn on its own line.
- Tried and taken out: an overtime at three minutes (cards and their schedule twice as fast) to
  end stalemates where neither side breaks through. Their doubled schedule outweighed your doubled
  cards (you are capped at ten on the field), so the reference decks won fewer levels, not more.
  A stalled battle is left to the player to break (or retreat), as in Battle Cats.
- Pattern picks by chance gave World 1 five fortresses and no flanks: dealt from a shuffled pack.

## To do

- Reviewer playtests on the phone layout (Sam asked for them).
- Fine-tune the long World 1 levels (the bot takes three to six minutes on a few).

### Sam's notes of 17 Nov (second round)

- [x] Collisions between all units, beasts and enemies alike.
- [x] Enemy hearts easier to see: white, with an angry face, the white draining as they lose health.
- [x] Dark Matter beasts count in battle like every other rarity.
- [x] Some levels need a plan, not just the strongest six: rule levels (quick cards, long reach,
  swift, plain stock, three only) and themed waves.
- [x] A more detailed coin pile.
- [x] Victory and defeat music.
- [x] Tap a spot in your zone, then a card, and the beast comes out there.
- [x] Beasts and enemies bigger on the field.
- [x] Ranged attacks shown as shots (Range is how far a unit hits from).
- [x] The clock question: it shows battle time, so at 2× it runs twice as fast.
- [x] Meadow beasts never stuck behind the top bar or the spawner bar, at any zoom.
- [x] Reward beasts with a completely new look (the Folded Legends), won by challenges only, with
  odd but fair stats, in the Beastopedia, never from spins or crates.

### Sam's notes of 18 Nov (third round)

- [x] New art for each world's card on the Battle tab, and level tiles that show more than a
  number: a green tick when won, a tick and a star when the star is earned.
- [x] Any won level can be replayed (for challenges that need its enemies).
- [x] Tidier perks, without the "once earned" line.
- [x] Sorting and filtering when choosing beasts: tier, rarity, or any stat, high to low or low to
  high.
- [x] A three-second countdown before a battle starts.
- [x] A message when you try to play a card with ten beasts on the field (it was hidden at once).
- [x] Longer victory and defeat music, and the battle music fading into it instead of stopping.
- [x] When the meadow already has its most crates, crate rewards are paid as essence for the level.
- [x] A level's enemies stay unknown until you have played that level.
- [x] More kinds of attack animation for beasts and enemies, by range, kind and stats.
- [x] Foe wiki pictures sharper, more of them to a row.
- [x] "How battles work" cut down to the basic rules.
- [x] Achievements with more design: reward shown, a silhouette until it is earned.
- [x] An achievement for earning every other one, giving a unique Dark Matter beast.
- [x] More variety in levels: rushes where many come at once, waves, ambushes, flanks, elites,
  not one more enemy each level.
- [x] The battle opened too far zoomed in: open on the whole field.
- [x] "Ready to Ascend!" at the top opens the prestige screen when tapped.
- [x] More detail on the enemies, above all their walking and attacks, with more variety by range,
  attack style and world.
- [x] Free spins earned in battle could not be found: a button for them on the Battle tab.
- [x] The wheel says "up to Dark Matter", not "up to Godly/Dark Matter".
- [x] Each card in battle shows its beast's stats underneath when there is room.
- [x] Premium crates earned in battle could not be used; early ones are capped at Tier 15.

### Sam's notes of 18 Nov (fourth round)

- [x] A bit harder: Tier 10 beasts by level 10, remembering strategy matters (more rules that keep
  the strongest six from always working: slow orders, a small band, thick skin).
- [x] Rules added in testing: agreed; keep testing.
- [x] Legends in the Low Gravity worlds: agreed.
- [x] World 4's unlock: agreed.
- [x] Not merged to main yet: keep testing.
- [x] More detail and better animation on the enemies; more variety in battles.
- [x] More than about ten enemies on the field when a level calls for it.
- [x] Not one more enemy each level: champion levels (one or two, much stronger), hordes (a crowd
  at once), fortresses (a garrison when you touch their pile), a rising tide.
- [x] The stats under each battle card bordered off from the next card's.
- [x] Folded Legends that look like origami characters, someone or something, not just folded paper.
- [x] Better walking and running animations, and attacks unique to an enemy's stats or who it is.
- [x] The same for beasts.

## Ideas for later

- Knockback on heavy hits, as in Battle Cats, to make fights swing back and forth.
- Enemy traits (armoured: half damage from light attacks; flying: only Range 3 and up can hit it).
- Daily or weekly challenge levels.
