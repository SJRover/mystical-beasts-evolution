# Merge Beasts 1.4: Battle mode

**Released:** merged into main for the 1.4 build on 22 Nov 2026, after reviewer playtests 4 and 5, the
release checks (tools/native_check.mjs, tools/upgrade14_check.mjs on a clean profile) and the App Store
trailer and screenshots ("App Store 1.4/").

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
| Speed s | 70 + 16 × (s − 1) units a second, at most 260 (the arena is 1000 wide by 2000 tall; a Speed 1 beast takes about 25 s from pile to pile, a Speed 8 one about 10 s) |
| Range r | reaches 34 + 20 × (r − 1) units beyond the target's edge, at most 340; 74 or more (Range 3 and up) fights from afar with a shot |

Seventh round (Sam, 19 Nov: high and low Range, Health, Speed and Attack felt alike): Speed and
Range now count in a straight line, point for point (they had a square root). A Range 6 beast now
shoots from about four times as far as a Range 1 one, and a Speed 8 runner is two and a half
times as fast as a Speed 1 tank, so levels can ask for reach, speed or something tough at the
front. (For a while they also took their full share of a beast's points; high tiers came out
frail, a Tier 15 Legendary flier with Health 2 for 13 mana, so they are back to half.)

## A battle

- You pick six beasts (your deck; one per beast, only beasts you have discovered, only from the
  world's own solar system, plus any Folded Legends and Relics you have won) on the level's
  screen, which shows each one's four stats, its mana cost and how it fights. The list sorts by
  tier, rarity or any stat, high to low or low to high, and filters by rarity. A level with a rule
  (below) that limits who may come keeps its own six.
- **Mana** (fifth round, Sam's idea, like Clash Royale's elixir and Battle Cats' wallet, so the
  best cards cannot just be played over and over): a bar over the cards; you hold at most 50,
  start with 25, and it fills 10 every 5 seconds. A beast costs 2 plus three quarters of its tier,
  rounded (Tier 1 three, Tier 5 six, Tier 10 ten, Tier 20 seventeen), shown on its card and in the
  Beastopedia; cards also still recharge. (Half its tier until Sam, 18 Nov, found it too cheap,
  then 0.7 × tier until he found spamming all ten still too easy, 19 Nov. With the expected six
  played as fast as mana allows, beasts out averaged 6.3 with the field full a third of the time
  at 0.7 × tier, and 4.3 with it full 14% of the time now. The flat 2 makes cheap spam dearest,
  so merging up is worth more.) Sam suggested a
  beast's whole tier; tested that way a Tier 6 six beat as strong enemies as a Tier 14 one, so
  merging up would not have helped (at half, Tier 14 and up beat about 40% more). The Wellspring
  perk fills mana a quarter faster, Deep Pool holds 65, and Mana spring levels (9, 19, 29, 39 of
  each world) fill it half as fast again.
- **How beasts fight** (fifth round): Single (one enemy up close), Area (the big-bodied: titans,
  giants, krakens, hydras, slimes, colossi; the blow also lands at half strength on everything
  near the target, with no extra reach or attack) or Ranged (Range 3 and up, one enemy from afar).
  Shown on the level screen, a mark on each card, and in the Rules. Enemies too: shooters and
  casters ranged, heavy hammers and clubs area, bosses three at once.
- **Evolved forms** (fifth round): the same stats as the beast, plus a special, once a battle for
  each evolved card. Seventh round (Sam, 19 Nov): the left three slots of the six, on a violet
  plate, are the special slots; a beast you have evolved has its special only there (in the
  right three it battles without one, and nothing about specials shows). Drag a slot onto
  another to swap them. The card plays copies like any other; Sam (18 Nov): tap one of them on
  the field and it does its special there. A gold ring pulses round them while it is ready, and the card names it.
  (It was first a second tap on the card with one copy out at a time; the strategy bots won fewer
  levels with evolved forms that way, as fewer beasts were out.) The special comes from how it is built and its best stat, else its element:
  Leap (foxes, cats, wolves, lions, dinosaurs: onto the nearest enemy ahead, stunning those it
  lands among), Dash (Speed: three times as fast, the first blow heavy), Shield (Health: a fifth of
  the damage for five seconds), Volley (Range: the five nearest enemies), or by element Blast
  (fire), Freeze (water, two and a half seconds), Gust (wind, blown back up the field), Quake
  (earth, hurt and stunned), Heal (light, two fifths), Gravity well (void, pulled in and held),
  Starfall (cosmic, four enemies) and War cry (deity, half as hard again for five seconds). Kept
  small, a few seconds or a few light hits' worth; the levels are balanced without them.
- The level's screen shows its enemies as "???" until you have played that level once (won, lost
  or retreated), then the ones you have met.
- The arena is the size of the meadow's world, with pinch to zoom and drag to look around. It opens
  on nearly the whole field (the full width on a phone); the ⤢ button goes in close on your half
  and back out. The look of the map stays the same within a world and varies from level to level
  (props, paths, colours); a new world has a new look.
- A three-second countdown (3, 2, 1, Fight!) before anything moves. You can choose your spot
  during it.
- Your six cards sit along the bottom, each with its four stats underneath when the screen is tall
  enough, its mana cost (top left, red when you cannot afford it) and how it fights (top right). Tap a spot in your blue zone, then tap a card: the beast comes out at that spot and walks
  up. Or drag a card onto the zone. Zoomed in at the top with your zone off the screen, a tap
  anywhere on the field chooses the lane: a line flashes down it and an arrow at the bottom shows
  where beasts will come out (fifth round). Each card then recharges for as many seconds as its tier
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

- **Sync down** (seventh round, Sam's idea): on a Quick cards or Plain stock level that leaves you
  fewer allowed beasts than the six, a Sync down button under the slots lets every beast come as
  the rule's own version (no higher than its tier, no rarer than Rare, no prestige), so a player
  far along can still fill a six. It only shows when it is needed. The other rules ask for at
  least so much Range, Speed or Health, which prestige only helps with, so they never need it.
- **Enemy abilities** (seventh round, Sam: "jumping abilities or abilities where they bypass
  some enemies, go invisible for a few seconds", from Clash Royale and Battle Cats). By who they
  are (battle_data.js TRAITS): Leaps (goblins, imps, ninjas: over your front line once), Cloaks
  (thieves, wraiths: invisible three seconds in nine; nothing can target them; a blow shows them),
  Burrows (crawlers, serpents: underground to the middle of the field, a moving mound), Heals
  (priests, monks: 12% to those round them every 4 s), Shields (captains, paladins: those near
  them take a quarter less), Summons (warlocks, brood mothers: two small ones every 10 s), Charges
  (cavaliers, minotaurs: rush the first target, a heavy blow), Slows (witches, frost: what they hit
  moves and strikes slower for 2 s) and Knocks back (heavy hammers and clubs: push a beast back).
  Shown on the enemy's card in the level screen and Foe wiki, and in Battle Rules.
- **Where enemies come from** (seventh round, Sam: battles were clumps by their pile): every level
  but hordes and champions opens with a group at once across their camp, so the first clash is in
  the middle; from level 4, runners, swarms and fliers now and then come in from a side half way
  down, and shooters and casters now and then step out of a portal in the middle of the field.
- **Each enemy role itself from the start** (seventh round): enemy stats come from a level's
  points, so at World 1's first levels every enemy was 1/1/1/1 and "fast" thieves walked. Now a
  role has a floor in its own stat whatever the level: runners Speed 3, shooters and casters
  Range 3 (so they really shoot), tanks Health 3, brutes Attack 3, swarms Speed 2.
- **Room to attack** (Sam, 18 and 19 Nov): a unit heads for the free spot round its enemy or the
  next two nearest; a fighter at arm's length steps in close so there is room behind it; and a
  unit that has hardly moved for half a second with an enemy close squeezes past its own side for
  a second and looks wider for a free spot. On six test levels, beasts stood stuck near an enemy
  for 281 s before slot-seeking, 23 s after it and the stat change, 8.6 s now.

## Stars and rewards

- A star for clearing a level under its target time (shown before and during the battle). Sam
  (fifth round): stars should be hard to earn. The time is nine tenths of the fastest win of the
  balance bot's five ways of playing, never more than two and a half minutes.
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

33 battle achievements, in groups (battles won, stars, bosses, worlds, feats, foes met, perks,
Grand Master), and 16 merge achievements (below), on one sheet with a Battle and Merge switch. Each
shows a medal that stays a dark silhouette until earned, a progress bar, and its reward as pictures
(crates, premium crates with their top tier, spins, the perk, legend or Relic it gives).

Seventh round (Sam, 19 Nov: the first level gave too much, two free spins among it): winning
World 1 level 1 fast and untouched used to earn First Blood (2 crates), Blitz (2 spins, any level
under 40 s) and Untouched (5 crates, and the Fortify perk) at once. Now First Blood gives 1 crate,
Blitz needs a level from 10 on, and Untouched (3 crates) and Fortress count only levels from 5 on.

**Perks** (seventh round, Sam: they came too easily and should be won "in obscure ways, like with
one type of beast only"). Each is an achievement in the Perks group, with its own drawn icon (a
flame, an hourglass with arrows, a shield with a coin, a fountain, a deep drop):

| Perk | What it does | Won by |
|---|---|---|
| Fury | every third swing heavy | Purebred: a win from level 5 on with beasts of one element (three or more) |
| Rally | cards rest a quarter less | Trio: a win from level 10 on bringing only three beasts (on a level that allows six) |
| Fortify | your pile holds 20 s | Iron Vault: beat a boss with your coin pile full |
| Wellspring | mana fills a quarter faster | Never Idle: a win from level 10 on without your mana ever filling up |
| Deep Pool | hold 65 mana | Patience: a win from level 10 on playing nothing in the first 20 seconds |

(They were: beat a boss, 25 stars, win with your pile full, 12 wins, 15 stars.) The engine records
when you first play a beast and whether mana ever filled (battle_engine.js firstDeployAt,
manaFilled).

## Freezes (seventh round)

Sam (19 Nov): the game froze for a while opening a level, swapping a beast, mid battle, on Next
level and leaving battle mode. Profiled in Edge at 375 by 812 with the full Prime collection
(a throwaway CDP script: a CPU profile and long tasks per step):

- Every beast picture is an SVG drawn onto a canvas with a blurred glow and encoded as a PNG, on
  the main thread. A level screen asked for all of them at once (72 Prime beasts: 0.6 s of
  encoding on a fast PC, several times that on a phone), and the ones still coming in landed
  during the countdown and battle. Now pictures are drawn a few at a time between frames
  (art.js queuePaint, about 8 ms a turn, battle sprites first), encoded with toBlob where the
  browser can, and the level screen's list only asks for the ones on screen or nearly. Enemy
  pictures on the world sheet, a level's enemies and the Foe Wiki (192) do the same.
- The meadow's crystal magnet looked up every crystal in the page every frame, and in battle,
  where the page changes every frame, that meant a search of the whole page each time (about 10%
  of the time in battle). Now the game keeps its own list of crystals and sweeps only when the
  pointer, the view, the magnet or the crystals have changed (853 ms per 8 s of battle to 4 ms).

## Relics and the merge achievements (fifth round)

Sam: achievements for the merge part of the game (merges of one beast or in all, evolving,
discovering, mutations, cures), some giving unique high-tier beasts, "automatically evolved unless
they're two part achievements ... the second achievement unlocks the evolved form". Six Relics
(`relics.js`), stained glass: jewel-coloured panes in dark lead, glowing; evolved, the lead is
gold with a halo. `tools/relics.html` shows them. They wander and make essence like any beast and
battle in every world, but never merge, never go in an incubator, and never come from crates,
spins or the shop (their solar system is 'relic', which every random pool leaves out). They have
their own section at the end of the Beastopedia.

| Relic | Tier, rarity | Won by |
|---|---|---|
| Glasswing (moth) | 9 Super Rare | 500 merges (evolved) |
| Prism Wolf | 11 Ultra Rare | cure 25 plagued beasts; evolved at 100 cures |
| Rosette Whale | 13 Legendary | 50 rare mutations (evolved) |
| Cathedral Peacock | 15 Godly | discover 60 beasts; evolved for every beast in both systems |
| Sunwindow Lion | 17 Godly | evolve 3 beasts (evolved) |
| The Rose Window (dragon) | 20 Dark Matter | 20,000 merges (evolved) |

The other ten pay crates, premium crates (up to Tier 15 or 18) or spins: 25 and 2,000 merges, 100
Sparky merges, 20 discoveries, 10 mutations, the first evolution, prestige 3 and 9. Counted from
1.4 on (merges, mutations, cures, evolutions); discoveries and prestige count what a save already
has, so those are earned on opening 1.4. A rare mutation is a merge giving anything but its usual
result (a rarer branch, a Legendary or a Godly).

## The meadow in 1.4 (fifth round)

- Evolving takes 100 incubations of a species (Sam: evolved beasts were too easy). Each
  incubation still takes its time and gives the beast up towards it; the hundredth brings out an
  evolved one, and the count starts again. The Beastopedia shows each species' count under its
  card and in its details. Cures are as before.
- One finger on open ground drags the map (after a few pixels, so taps still tap); one finger on a
  beast drags the beast; two pinch.
- Beasts walk out from under the top bar and the bottom bar (spawner, incubators, crates) when
  they wander under them.
- Upgrade buttons: every quick tap counts (a second tap within about a third of a second was lost,
  and each purchase rebuilt the whole shop under the finger).
- Merging high tiers: the drop now counts anywhere on the target's body (big beasts were often
  missed: the distance allowed did not grow with the beast); the nearest match wins; an evolved
  (or infected) beast dropped on a plain one says it only merges with its own kind.
- The two-Tier-7s-into-Aurelion merge Sam saw is an existing rule: any merge under Tier 14 has a
  0.1% chance of Aurelion (1% if the beasts are evolved). Evolved beasts being rarer now makes it
  rarer too.
- Sound comes back after the phone is locked or the app was in the background (iOS left the audio
  interrupted).
- The Beastopedia and the other sidebar pages scroll only up and down (they swayed sideways).
- The tutorial's text is plain ("Welcome! Want a quick look at the basics?").
- Beast and enemy descriptions rewritten in plain, short lines (Sam: they read as AI).

## Music (Sam's to make)

Put the MP3s at the root of the project, beside the solar system music, with "Battle",
"Victory" or "Defeat" in the name; build.js lists them in `battle_music.json` (also run `node
build.js` after adding one while testing in the browser). It sorts them by the words in the name:

- "LowGravity" (or "Low Gravity") anywhere in the name: a Low Gravity battle track; otherwise Prime.
- "Boss": a boss level's track; otherwise a casual track for the other levels (`...Variant1`,
  `...Variant2` and so on, spread over the levels: each stretch of ten levels has its own track,
  and the next world starts one track on, so with four tracks World 1 plays 1, 2, 3, 4 and World 2
  plays 2, 3, 4, 1).
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
to come if Sam wants them: more Low Gravity casual tracks (the first, `LowGravityBattleLevelMusicVariant1.mp3`, came in on 18 Nov), a Prime boss track, Low Gravity victory and
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
their own six can beat. Margins under the most the deck beats (fifth round, the first levels were
too easy): 0.65 on levels 1 to 3, 0.82 to level 8, then 0.85 rising to 0.92, bosses 0.93. The
search for the most starts just under the level before's. The bot plays with mana like anyone.

The reference six (seventh round) is the one Best six gives (battle.js powerOf: Attack × Health ×
(1 + 0.12 × (Speed + Range))) among the beasts the player is expected to have, not simply the
highest tiers. The highest Low Gravity tiers were fast, frail fliers, and a six of them lost to
anything, so calibration had taken late World 4 levels down to the fewest, weakest enemies there
can be, which a player pressing Best six walked through.

What that gives in World 1 (the bot, playing simply), after the fifth round (mana, faster units,
sidestepping): the expected deck wins every level, each in at least three of five ways; a deck
three tiers weaker wins 16 of 40 (21 before mana, 33 before the fourth round). Star times run from
40 seconds to the cap of 2:30.

After the seventh round (dearer mana, straight-line Speed and Range, enemy abilities and role
floors, the opening group, side entries and portals, room to attack, the Best six reference),
six ways of playing (tools/strategies.mjs: spam everything, cheapest first, save mana for a
wave, defend then push, spam with specials used on crowds, sneak down the emptier lane), wins of
40 with the expected six and with one three tiers weaker:

| World | spam | cheap | save | defend | evolved | lane | three tiers weaker (best way) |
|---|---|---|---|---|---|---|---|
| 1 | 35 | 32 | 40 | 37 | 37 | 14 | 32 |
| 2 | 35 | 38 | 39 | 40 | 37 | 9 | 39 |
| 3 | 34 | 32 | 39 | 38 | 39 | 11 | 39 |
| 4 | 35 | 33 | 39 | 38 | 37 | 12 | 32 |
| 5 | 34 | 34 | 37 | 36 | 35 | 15 | 36 |
| 6 | 34 | 35 | 37 | 37 | 37 | 10 | 38 |

(After reviewer 4's fixes: hurried enemies never champions, every other one from a side; home
guard; specials kept when nothing is in reach; more World 1 abilities. Before them the same
sweep had eased nine levels; this time one, 4-31. After reviewer 5's fixes, 4-21, 5-33 and 6-17 were
eased, and the Quick cards levels from World 2 on as described there.)

Saving mana for a wave and defending then pushing win the most; spamming does well but not
best; slipping down an empty lane mostly fails. In Worlds 2, 3, 5 and 6 a six three tiers weaker
does about as well, as the expected six there is already Tier 20 and prestige counts for more.
Levels fewer than two ways won (1-6, 1-35, 4-30, 5-33), or only in over two and a half minutes
(1-2, 1-22, 2-36, 4-14, 5-9), were eased 8% at a time (tools/ease.mjs) and their
stars set at nine tenths of the fastest win. The fastest wins average 58 to 69 seconds a world.

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

## Reviewer playtest 4 (19 Nov, after the seventh round, 375 by 812)

Two players: a new one (Tier 3, rising) through World 1 levels 1 to 8, and a Tier 11 player with
three evolved beasts through levels 14 to 22 and a synced replay of level 4; about 35 battles, no
page errors. No freezes: the longest task anywhere was 168 ms, at four times CPU slowdown (the
first Battle tab after a load). Frame rate 79 fps on average at that slowdown on a horde. Melee
beasts hardly moving near an enemy 9.5% of the time, the longest 3.5 s. Level 1 gave essence and
one crate. All five perks were won on purpose and announced. Fixed from it:

- **Champion levels became a stream of champions** (32 in four and a half minutes): while your
  beasts took coins, the "hurry" rule brought the next queued enemy every 2.5 s, and a champion
  level's queue holds only champions. Now it brings only ordinary enemies, never champions or
  bosses.
- **Battles ended in a scrum at their pile** (71% of blows in the top third): every
  reinforcement came out on their pile. Now every other hurried one comes round from a side half
  way down, towards your coins.
- **Home guard:** with ten up at their pile an Imp took your coins and no card could be played.
  While an enemy takes your coins you may now play two over the limit (the count shows "home
  guard").
- **Patience** could only be won on champion levels (opening groups reach your pile within 20 s):
  now a win from level 10 on playing twelve beasts or fewer.
- **Sync down:** pressing it fills the six; Best six ranks beasts as they will battle; the list
  shows synced tier, cost, rest and stats (⇩ T2); Quick cards syncs rarity too (no rarer than
  Rare), as the rules say.
- **Call-outs:** banners shrink to fit and sit a third of the way down the field (they ran off
  the screen and covered their camp); call-outs near one another stack upwards.
- **A special with nothing in its reach is not used up** ("Nothing in reach"); cards show ✦ and
  the special's icon (its name was cut off).
- The world chest says it is for every star in the world; slowed beasts get a stronger blue and
  a snowflake; portals swirl for a second with "🌀 Portal!"; the Beastopedia's rarity stays on one
  line; Try again no longer starts the meadow's music; Rally reads "Cards rest 25% less"; Long
  reach asks for Range 3 or more (where beasts shoot), else the level is Three only.
- World 1 gets every ability before level 20: Night Hounds charge (7), Black Knights and War
  Drummers shield (13, 17), Lantern Ghosts heal (14), Scarecrows summon (15).

Not changed: stars stay tight (missed by 1 to 9 s; Sam wants them hard); spamming still wins
some levels, as it does for the bots; cheap Tier 1 to 4 cards still fill the field in early
levels, where the enemies are weak.

## Reviewer playtest 5 (19 to 22 Nov, Worlds 2 to 6, 375 by 812)

Three players: Prime at prestige 2 through late World 2 and World 3, Low Gravity up to Tier 15
through late World 4 and World 5, and every Low Gravity beast at prestige 2 through the end of
World 6; 55 battles, no page errors, nothing over 0.3 s even at four times CPU slowdown. Champions
never came as a stream; specials with nothing in reach stayed ready; Sync down, drag to swap and
home guard worked; all nine enemy abilities were seen and read clearly; Low Gravity's green stars
and music were right; eight levels were lost one way and won another. Fixed from it:

- **Quick cards levels were walls for players behind on prestige** (3-34 lost three ways at
  prestige 2, between levels they won): with tiers capped, prestige is all a six has. Every Quick
  cards level from World 2 on is now eased until a six at half the expected prestige wins two
  ways (PMUL=0.5 in tools/strategies.mjs and tools/ease.mjs).
- **6-35 was a spike** (points 11.2 against 9.4 around it): brought to its neighbours and checked
  the same way.
- **Best six chose glass cannons late on**, and three near-identical jellyfish in Low Gravity. It
  now picks a balanced six: the two toughest of the strongest fourteen (Health × √Attack) to hold
  the front, two shooters (Range 3 or more) behind, then the strongest, with no more than two of
  one body. (Calibration still uses the plain strongest six, so levels are if anything a little
  easier with the button.)
- **Champions are never burrowers or cloakers** (the field looked empty after "Two champions!").
- **Stars are at least 40 seconds** (0:30 and 0:35 targets, when emptying a pile alone takes 15).
- The special's mark on a slot sits bottom right, clear of the prestige badge; the coin piles'
  seconds are drawn over the hearts; the enemy list on a level is one line that scrolls sideways
  (late levels listed 26 and pushed the six below the button); warnings in battle show just
  above the cards, by your pile; Dash checks its reach; beating 3-40 or 6-40 the first time says
  you have beaten every world of that solar system.

Not changed: Folded Legends can join after a defeat (their challenges count kills, which a lost
battle still makes); portals come more often once a long battle's schedule repeats; frame rate
dips to about 48 fps at four times slowdown in the busiest World 6 battles.

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

### Sam's notes of 18 Nov (fifth round)

- [x] Less text: the rules key under the levels moved to Settings, under Battle Rules (with the
  basics, mana, how beasts fight, the specials, the level types and the perks); explanations on
  the level screen, the world and the legends cut; the tutorial's "interactive tour" gone.
- [x] Sam's music variants spread over the levels: each stretch of ten levels has its own track,
  the next world starting one on; his victory and defeat music plays at the end.
- [x] Ranged attacks for beasts: a burst at the beast's mouth by element as the shot leaves, and a
  heavy shot is a volley of three.
- [x] Beast and enemy descriptions rewritten in plain words.
- [x] Evolved forms with a special, once a battle, up to three in a six, tapped again to use.
- [x] The first levels were easy and slow: everyone walks about a third faster, enemies come
  sooner, the early margins are tighter, and mana makes spamming cost.
- [x] Units stuck behind their own side step round to find a space to attack.
- [x] Stars harder: nine tenths of the bot's fastest win, at most 2:30.
- [x] Mana, capped at 50, 10 every 5 seconds, with perks and Mana spring levels.
- [x] More attack and death sounds (two or three of each voice; poofs, clatters, power-downs,
  groans and a boss's boom).
- [x] Zoomed in, a tap anywhere on the field chooses the lane.
- [x] The Aurelion from two Tier 7s explained; high tiers that would not merge fixed.
- [x] Single, area and ranged attack shown for beasts and enemies; area kept modest.
- [x] Merge achievements with Relics, auto-evolved or two-part.
- [x] Upgrade taps, 100 incubations to evolve, sound after locking the phone, beasts under the
  bars, the Beastopedia's sway, one-finger panning.
- [x] The 30-second App Store trailer and new iPhone and iPad screenshots of battle mode (22 Nov,
  after reviewers 4 and 5). In "App Store 1.4/" (not in git): `App Preview iPhone 886x1920.mp4`
  (29.4 s, H.264 High@4.0, 30 fps, about 10.4 Mbps, AAC 256k stereo 48 kHz) and five screenshots
  each for iPhone 1206x2622 and iPad 2064x2752 (battle, specials, the Eclipse Emperor, six
  worlds, Folded Legends), captions in a band above the game so they cover nothing.
  - Trailer: collect, merge, a premium crate, the Beastopedia, the six worlds ("Battle mode is
    here!"), then World 1, the Iron Kingdom (foes that charge and heal), the Moon Hollows (Low
    Gravity), the Eclipse Court with specials, the Hive Empress and the Eclipse Emperor, and an
    end card. Music: Sam's PrimeSolarSystemCasualBattleMusicVariant3 from 47.04 s, the bar where
    the full band comes in (it started at 35.1 s, which Sam found awkward); every cut on a bar.
    The camera follows the thickest knot of fighting units (it had sat on a stray beast).
  - Rebuild: `node tools/trailer/record.mjs [shot ...]` (frame-exact on tw.js's clock), then
    `py tools/trailer/build.py`; screenshots `node tools/store_shots.mjs --battle`, then
    `py tools/flatten.py "App Store 1.4"`.

### Sam's notes of 19 Nov (seventh round)

- [x] Beasts make space so everyone finds a spot to attack (squeezing past their own side when
  stuck, stepping in close, a wider search).
- [x] Tapping a beast in the Beastopedia opens its card again.
- [x] The left three slots are the special slots; evolved beasts in the right three have none.
- [x] Bigger steps per point for Speed and Range, so stats feel different.
- [x] An opening group, side entries and portals, and enemy abilities.
- [x] The meadow's music no longer starts again on a tap in battle.
- [x] Battle Rules in Settings folded behind an arrow, each part opening on its own.
- [x] Low Gravity stars green.
- [x] Drag to swap slots in the six.
- [x] Sync down on rule levels that leave too few beasts.

## Ideas for later

- Armoured enemies (half damage from light attacks) and fliers only Range 3 and up can hit.
- Daily or weekly challenge levels.
