# Merge Beasts 1.3: graphics overhaul and lag fix (in progress)

Sam's brief (14 Nov 2026): a graphics overhaul and less lag, with the concept and game design
exactly as they are (every number, mechanic, beast, biome, upgrade, purchase and save key). Then,
after seeing the first art: more detail, livelier movement (speeding up and slowing down, hops,
swirls, bursts, particles), stronger rarity glows, a much bigger field to roam with two-finger zoom
and pan, beasts that bump off each other (merging still only by dragging one onto a match), and a
detailed, unique background for every biome.

## Why it lagged (measured)

19 fps with 24 beasts on a desktop browser. Each beast was live inline SVG with blur and glow
filters, and wings, tails and orbit rings animated *inside* those filtered SVGs, so every flap
repainted the whole filtered drawing. 96 essence crystals each ran their own CSS animation, and the
background clouds were blurred and animated. With filters and animations off it reached 44 fps.

## What is built (local, not pushed)

- `art.js`: the beast artwork. 33 body types with real silhouettes (droplet, stone, dragon, bird,
  golem, shark, cobra, ...), outline, shading, texture patterns, glossy eyes; features attach at
  anchors (wings x10 kinds, tails x10, crowns, halos, horns, orbiting moons split behind/in front,
  void cores, ...). Rarity glows are a separate picture (rays from Legendary up). `getBeastSVG` is
  overridden, so every menu shows the new art. `ART.picture` draws a beast or glow once into a PNG.
- `field.js`: beasts on the field. `dress` puts the picture, glow and ground shadow in the
  container; `speed` (eased speed changes averaging 1, smooth steering); `animate` (walk, hop, fly,
  float, swim body language plus random actions with particles); `collide` (soft push-apart, not the
  dragged beast nor shadow enemies).
- `world.js`: the field as a world 2.2 screens wide and tall in `#world` (background + playground),
  camera pan/zoom by two fingers, mouse wheel and right-drag. Movement and local positions use the
  world's own pixels; `playgroundRect` (the on-screen box) stays for touches. Distance rules in
  game.js are divided by `WORLD_SCALE` (merge 7.5, infection 10, shadow attack 6), so they cover the
  same ground. Crates, purchases and hub beasts appear where the camera looks (`WORLD.viewPct`).
- `particles.js`: dust, trails, burst rings, swirls, bubbles.
- `tools/`: galleries and close-ups for checking art (not shipped: build.js copies root files only).

- `biomes.js`: every biome painted once into the world (24 plus the hub): sky and skyline, textured
  ground, a winding path / river / lava / chasm, clustered patches and scattered low details, taller
  props framing the edges (so beasts never walk through a tree). Seeded: a biome always looks the
  same. Hooked by wrapping `applyBiomeBg`. `tools/biomes.html` shows them all.

Measured after: 51 fps with 22 beasts in the bigger world (19 fps before, with 24, on the old
field). Beasts stay below the sky band (top 6% of the world).

## Second round (Sam, 14 Nov)

- World 1.8 screens (was 2.2), starting zoom 0.74. Sizes now read by tier: 56 px at Tier 1, +10.5% a
  tier to Tier 12, +5% after (Tier 14 about 207 px); rarity only nudges size; evolved +10%.
- Rarity is a glow, no rings anywhere: the rarity colour glows off each beast's own outline (baked
  into its picture with canvas shadowBlur, padded 25%), plus a radiating glow behind with rays from
  Super Rare up, slowly turning. Evolved is gold, infected purple, shadows red. Orbit ring lines and
  the evolved double ring are gone (the moons stay).
- While dragging: a pill at the top points to the nearest beast it can merge with ("Sparky: 10 steps"
  or "is here", green when on screen; "No match on the field" otherwise), and holding a beast near a
  screen edge moves the map that way with the beast staying under the finger (world.js `assist`).
- Coins: a gold coin with an essence gem (cyan for evolved drops), and each coin flies to the counter
  by itself after 8 s if not tapped (`autoCollectCrystal`, silent, same value).
- Crates: banded chests with a rune seal; premium in magenta and gold. Incubators: stone pedestal,
  glass dome, gold label. Menus, HUD, dock, pop-ups: solid navy panels with gold trim and chunky gold
  buttons; every backdrop blur removed. 58 fps with 22 beasts, no drop with the menu open.
- Map props redrawn standing up: bushes (three domes), mushrooms (domed caps), trees (tapered trunk,
  four-lobed crown), rocks (rounded standing stones; they read as flat leaves before).

## Third round and playtest (15 Nov)

- Map: every prop is planned against what is already there (the path or river and its banks, the
  edge trees, other props) and drawn back to front, so nothing overlaps. Props are one size
  everywhere (the old fake perspective made them grow towards the bottom, which looked strange
  zoomed out). The map is painted at the screen's pixel density; the world is redrawn sharp when a
  pinch ends (`#world.moving` holds will-change only while moving); beast pictures have room to
  zoom in.
- Balance in the bigger world: beasts are about ten times more spread out than on the old field
  (and collisions stop bodies overlapping), so shadow enemies hunt the nearest beast and infected
  beasts drift towards the nearest healthy one; the infection range is its original value again.
  Measured: first spread at 10 s (the spread timer), 3 of 6 infected by 25 s; a fiend eats at 6,
  13 and 20 s (its 6 s cooldown). Same as the old crowded field.
- Bug fix (live in 1.2.2): `saveGame` wrote the Beast Hub's beasts over the solar system's field
  while in the hub (on entering and every 10 s), so leaving the hub replaced the player's field
  with the hub's beasts. Now the field is kept and the hub's beasts are saved as the hub's.
- Top bar fits 375-point phones (the ascent panel had a fixed width and ran off the edge).
- Playtested in the browser at phone size (tools/playtest.js drives the game's own input):
  finger-drag merges (same tier merges, different tiers and bumping do not), crates, shop, coins
  (tap and auto-collect), trash bin, incubator start / finish / collect, the drag arrow and edge
  pan, infection, shadow fiends, all 11 prestiges with each biome painting, the plague arriving at
  biome 4, the low-gravity system (warp, merges, discovery pop-up), the Beast Hub, save and reload.
  No errors.
- Version 1.3 (MARKETING_VERSION) and pushed on branch graphics-1.3 for a TestFlight build.

## Fourth round (15 Nov): purchases, coins, zoom, playtest

- Real App Store purchases only. 1.2.2 fell back to a made-up Apple Pay / Face ID sheet that
  gave the 2x boost and the premium crates away free whenever the store was not ready (including
  while the products did not exist in App Store Connect), and its real path read
  `receipt.transactions` from cordova-plugin-purchase 13's VerifiedReceipt, which has no such
  field: a paid purchase would have thrown before delivering or finishing. Now (game.js
  `IAP_PRODUCTS`, `initStoreKit`, `triggerIosPurchase`): consumables `boost_2x` and
  `crates_premium_3x`; delivered in `approved`, once per transaction id (kept in localStorage
  `mystic_beasts_iap_granted`), then `finish()`; `offer.order()`; cancel shows nothing, failure and
  an unreachable store show a message; outside the iOS app a message says to buy in the app. Price
  badges show the App Store's localized price (`iap-price-<id>`). Tested against a stand-in shaped
  like the plugin: buy, replayed transaction (not delivered twice), cancel, failure, store down.
- Premium crate card: real drop rates per rarity (`premiumCrateOdds`, computed from the same pool
  openPremiumCrate draws from, so always right; Apple guideline 3.1.1), honest description.
- Coins 44 px (were 28). Map and beasts measured to scale by the same factor at every zoom (map to
  beast width 5.488 at zoom 0.56, 0.74 and 1.6); a smoothed half-size copy of the map is used when
  well zoomed out (no shimmer); iOS's own pinch gesture is blocked.
- Released (incubators) and restored (trash undo) beasts appear on screen beside where they came
  from; moving to a new biome, system or the hub centres the camera. The 2x timer wraps in the top
  bar instead of overlapping.
- Playtested also: premium crate on the field, trash undo, incubators 1-3 (evolve, cure, purify
  10%/90% as designed), daily spin, Beastopedia details, Sanctuary, crate auto-opener, the T15
  Godly gamble. No errors.

## Fifth round (15 Nov): crates, premium moments, spin, incubators

- Crates: an unopened crate counts towards the meadow's space (`fieldHasRoom`), at most
  `MAX_FIELD_CRATES` (5) on the field (enforced in `spawnCrateOnField` itself; extras queue as
  before, up to 5), and every crate opens by itself after 30 s before any upgrade (the Auto-Opener
  still takes it from 20 s to 5 s); never while the meadow is full or during the tutorial, and never
  a paid premium crate. 1.2.2 let crates pile up without limit while beasts were under the cap.
  Measured: one crate every 15 s, each open 30 s later, about 2 on the field at a time.
- fx.js: every crate opening bursts in the hatched beast's rarity colour (rings, stars, glitter;
  a ring of light from Super Rare, a screen flash from Legendary). Buying premium crates: three
  chests drop in over rays and fly to the tray. Opening one: it moves to the middle and shakes harder
  and harder while glowing in the colour of what is inside, bursts with rays and a flash, and the
  beast pops up with "LEGENDARY!" (or its rarity), name and tier, then lands on the field.
- Daily spin: a jewelled gold wheel (rim, rivets, a gem per rarity, shaded segments, gloss, hub),
  bulbs on the rim that chase while it spins, and the prize taking over the window with rays and a
  glow in its rarity's colour. Claimed beasts land in view.
- Incubators: one row above the beast-count pill and the dock (Alpha left, Gamma middle, Beta
  right), one-line labels (the gold labels wrapped into the dock; Gamma sat on the pill).

## The purchases in App Store Connect

Both already exist and are Approved (Sam checked, 15 Nov 2026), with exactly the IDs the code
uses, so nothing needs attaching to the 1.3 version page:
- `boost_2x`, "1-Hour 2x Essence Boost", Apple ID 6782213692.
- `crates_premium_3x`, "3x Premium Crates", Apple ID 6782215479.
The code treats both as Consumable (each can be bought again). On TestFlight, purchases go
through Apple's sandbox and are not charged.

## App icon

New icon (15 Nov 2026, Sam chose option 4 of six): two Sparkys merging in a burst on the Forest
Meadow, drawn from the 1.3 art by tools/icon.html and captured by tools/make_icons.mjs, flattened to
RGB (Apple rejects icons with transparency). It is in assets/icon.png (Codemagic's
`@capacitor/assets generate --ios` builds the iOS icons from it), icon.png and the iOS
AppIcon-512@2x.png.

## App Store images

Made from the real game by scripts in tools/ (dev server on port 5410, hidden Edge over CDP):
- Screenshots: `node tools/store_shots.mjs [iphone ipad duo_inner duo_outer]` stages seven scenes
  (tools/store_scenes.js: field, merge, premium crate, biomes, zoomed out, daily spin, Beastopedia),
  each with a short caption, at iPhone 1206x2622, iPad 2064x2752 and iPhone Duo 2007x2853 / 1398x2034.
- Header 3840x1646, search results 3840x2560 and the universal 5244x2950: `node tools/make_store_art.mjs`
  (tools/store_art.html; the key beasts sit inside Apple's art safe area for each).
- Then `py tools/flatten.py "App Store 1.3"`: Apple rejects images with an alpha channel.
Output goes to "App Store 1.3/", which is not in git.

## Release

1.3 is finished and merged into main. Every push starts a Codemagic build that goes to TestFlight.
Before submitting for review: install the newest 1.3 build from TestFlight, play it, and buy each
purchase once in the sandbox (not charged), because the real StoreKit path has only been tested
against a stand-in. Then in App Store Connect: the 1.3 version page, choose that build, What's New,
Submit for Review.

Open, Sam's decision: server-side receipt validation (needs a paid service; not required by Apple).
