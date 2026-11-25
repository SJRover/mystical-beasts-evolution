# Merge Beasts 1.5: release notes and checklist

## What's New (for the App Store)

The biggest update yet.

THE INTERSTELLAR COMET
Reach prestige 15 in both solar systems and a comet comes into view: a third world with its own essence, its own prestige and fifteen alien beasts, the rarest in the universe. They hatch from comet eggs and grow by fusing in cocoons, from hatchling to ascended, and the rarest of all are Cosmic.

SHARD INCUBATORS
At prestige 15, Prime and Low Gravity each get a Shard Incubator that breaks beasts down into comet shards, which buy comet eggs.

WORLD 7: THE UNIVERSAL MUTANTS
Ten giant bosses, each with its own attacks shown on the ground before they land. They change at a third and two thirds of their health, and they smash your coins if they get close.

WORLD 8: THE APEX MUTANTS
Beat World 7 and reach the comet to open it. Eleven even bigger giants, two or three at a time, with acid, void, sonic and gravity attacks, and the World-Eater at the end. Bring comet beasts: their passives and specials are made for these fights.

LIMITED: THE ABOMINABLE SNOWMAN
Win him before the end of 6 January by finishing four challenges. After that he is gone for good.

ALSO
- Prestige now goes up to 15 in each solar system, with four new biomes each.
- New achievements, including a Comet tab, rewarding comet eggs, shards, boosts and comet beasts.
- Bosses and champions in Worlds 1 to 6 are bigger and stronger.
- More area attackers among the beasts.
- No more black bars beside the battlefield on phones.
- Higher prestiges need less essence, now that evolutions take longer.
- Every beast shows its element, and the battle picker filters by element, marking what the giants are weak to.
- New battle music for Worlds 4 to 6 and a new comet track.

## App Store description (1.5)

Merge mystical beasts, grow them into legends, and lead them into battle against giants.

Collect cute beasts, drag matching ones together and watch them evolve into rarer, stronger forms, from Common all the way to Dark Matter. Every beast earns essence for you, even while you are away, so your meadow keeps growing. Ascend through sixteen biomes in each of two solar systems, Prime and Low Gravity, and discover more than 170 beasts across the game.

THE INTERSTELLAR COMET
Reach the top of both solar systems and a comet comes into view: a third world with fifteen alien beasts, the rarest in the universe. Hatch them from comet eggs, fuse them in cocoons from hatchling to ascended, and chase the Cosmic ones.

BATTLE MODE
Build a team of six and fight across eight worlds. Play cheap, fast beasts as tanks up front and long-range beasts behind them, fire specials at the right moment, and use each enemy's weakness. Face snipers, bomb-lobbers, splitting swarms and huge bosses.

GIANT MUTANT BOSSES
Worlds 7 and 8 are full of giants with attacks you can see coming: the Omega Chimera, the World-Eater, and two or three titans at once. Find their weak elements and bring the right beasts.

LIMITED BEASTS
Win rare limited beasts by finishing challenges before time runs out, then they are gone for good.

ALSO
Daily spins, premium crates, achievements with real rewards, origami Folded Legends, stained-glass Relics and a Beastopedia to complete.

## Before release (checked 24 Nov)

- [x] MARKETING_VERSION 1.5 (ios/App/App.xcodeproj); build numbers come from Codemagic.
- [x] The build copies every top-level .js, .css, .html, .png, .mp3 and .json into www, so the new
  files (comet.js, comet_art.js, mutants8.js, mutants8_art.js, limited.js, battle_hard.js) ship.
- [x] A real 1.4.1 save (made by the released code) loads into 1.5: prestige above 15 comes down to
  15, everything else carries over.
- [x] Comet playtested end to end (headless): eggs, hatching odds, fusion rules and cocoon slots,
  cocoons through a reload and while away, upgrades, egg shop, prestige, offline earnings, the
  spin, premium eggs, achievements, Shard Incubators, comet beasts only in World 7 and 8 decks.
- [x] Worlds 7 and 8 tuned level by level to be super hard (tools/harden.mjs, battle_hard.js).
- [x] No native confirm boxes in the new code (they freeze the page): askConfirm instead.
- [x] The Snowman's deadline uses the latest time the game has seen, so turning the phone's clock
  back does not keep the event open.
- [ ] Sam: play on the phone (TestFlight), above all World 8's busiest levels for frame rate.
- [ ] Sam: App Store screenshots (App Store 1.5/World 8 giants.jpg, the comet and World 7 sheets
  in App Store 1.4), and the What's New text above.
- [ ] Merge update-1.5 into main and push (that starts the Codemagic build). Do it early in
  December so players have time for the Snowman before 6 January.
- [ ] Not in 1.5: buying a missed limited beast (£6.99), for after 6 January.
