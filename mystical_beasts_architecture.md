# Mystic Beasts Evolution - Core Architecture & Game Mechanics

This document serves as a reference for any future agent or developer to understand the architecture, systems, and mechanics built for **Mystic Beasts Evolution**. It can be read by a new agent in a new chat to instantly understand how this codebase is structured.

---

## 1. Core Stack
* **Frontend**: Vanilla HTML5, CSS3, and Javascript (ES6). No complex bundlers or frameworks are used.
* **Native Wrapper**: Capacitor (iOS) to wrap the web asset directory (`www/`) into a native iOS project.
* **Deployment/CI**: Codemagic (automatic signing, compilation, and TestFlight deployment on push to `main`).

---

## 2. Key Systems & Files

### A. Game Engine (`game.js`)
Handles the central loop, state management, UI rendering, drag-and-drop merging, and time-based progression.
* **Game Loop**: runs at 60fps via `requestAnimationFrame`. To prevent layout thrashing, playground dimensions are cached in a self-healing `playgroundRect` that updates once every 30 frames (or on resize/drag start).
* **State Management**: Saved in a global `state` object and persisted to `localStorage` (via `saveGame()` and `loadGame()`). Saves are automatically triggered every 10 seconds and upon critical actions (merges, prestiges, purchases).

### B. Beast Database (`beasts.js`)
Contains the `BEAST_TEMPLATES` configuration mapping beast IDs to their statistics and visual representations.
* **Attributes**: Tier, Element (Light, Fire, Water, Wind, Earth, Cosmic, Void, Deity, Dark Matter), Rarity (Common, Rare, Super Rare, Ultra Rare, Legendary, Godly, Dark Matter), base CPS value, and SVG render definitions.
* **Vector Render**: All beast icons are dynamically generated inline SVGs. There are no static image files for the characters, keeping the bundle size extremely small.

### C. Sound Synthesizer (`audio.js`)
A Web Audio API synthesizer that dynamically generates ambient music and sound effects in real-time.
* **Generative Music**: Synthesizes notes using FM oscillators, LFOs, and custom gains. It dynamically updates its scale, rhythm, and progression depending on the player's active biome.
* **Dynamic SFX**: Synthesizes custom clicks, merges, crate drops, and crystal collections on the fly.

### D. Particle System (`particles.js`)
A lightweight HTML5 Canvas particle renderer.
* **Animations**: Spawns glow paths, merge explosions, click bursts, and float-up text. Uses GPU-friendly canvas drawings layered on top of the DOM elements.

---

## 3. Game Mechanics Reference

### Merging & Evolution
* Match two beasts of the same **Tier** and **Evolution state** to merge them.
* Merges have mutation chances (enhanced by upgrades) resulting in higher rarities (Rare, Super Rare, etc.).
* At Tier 15 (Solaris Sovereign), merges trigger **Godly evolution checks**. A successful roll creates the Tier 15 evolved beast; a failed roll produces a Tier 16 beast.
* In the Demonic Abyss (Biome 9+) and above, merging Tier 19 beasts unlocks **Tier 20 (Dark Matter Devourer)**. Collecting 1000 Tier 20 merges triggers the final game event.

### Dual/Triple Incubators
* Drag a beast to one of the unlocked pedestals to start an incubator cycle.
* Normal beasts are evolved into their **Evolved Form** (yielding a 3x multiplier to their base CPS).
* Infected beasts are cured of the plague.
* Shadow Fiends are purified.

### Outbreak & Plague Systems
* Starting at Biome 4 (Prestige 3), there is an 8% chance (scaling up by 2% per biome) that crates hatch infected beasts.
* **Infected Beasts**: Produce 0 CPS, have a countdown timer (death in 45s), and spread the infection to nearby healthy beasts every few seconds.
* **Shadow Breaches**: In Biome 6+ (Prestige 5+), opening a crate has a small chance to spawn a hostile **Shadow Fiend**. It wanders around and devours friendly beasts on the field. It must be dragged to the Trash Bin or the Gamma Incubator for containment.

### Prestige Ascent
* When the player's essence reaches the target milestone, the HUD displays **Ready to Ascend!**.
* Prestiging resets the meadow and active beasts but unlocks higher allowed tiers, new biomes (12 total), and lets the player choose up to 3 beasts to preserve in the **Sanctuary** as permanent multipliers.
