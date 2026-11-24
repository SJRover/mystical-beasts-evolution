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
