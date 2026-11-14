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

## Still to do

1. Backgrounds: first pass done; refine per biome after Sam sees them.
2. Crates, incubators, crystals and merge effects refreshed; menus restyled (same layout).
3. Check every body type again close up (Sam flagged beaks, mouths, eye areas, orbit rings, sharks
   and the snake; fixed, snake redesigned twice).
4. Menus and pop-ups use backdrop-filter blur over the moving world (37 fps with the welcome-back
   pop-up open, 51 without): swap for solid translucent panels. Performance pass on a phone-sized view; then version 1.3 (MARKETING_VERSION) and a push.
   Every push to GitHub starts a Codemagic TestFlight build, so push only finished versions.
