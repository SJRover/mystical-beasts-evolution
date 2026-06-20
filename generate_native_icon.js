const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Resvg } = require('@resvg/resvg-js');

// 1. Load beasts.js
const beastsFilePath = path.join(__dirname, 'beasts.js');
if (!fs.existsSync(beastsFilePath)) {
  console.error("Could not find beasts.js at:", beastsFilePath);
  process.exit(1);
}

const beastsCode = fs.readFileSync(beastsFilePath, 'utf8');

// 2. Set up context to evaluate beasts.js
const sandbox = {
  Math,
  console,
  ELEMENTS: null,
  BEAST_TEMPLATES: null,
  getBeastSVG: null
};
sandbox.window = sandbox; // Mock window global
vm.createContext(sandbox);
vm.runInContext(beastsCode, sandbox);

const { BEAST_TEMPLATES, getBeastSVG } = sandbox;
if (!getBeastSVG || !BEAST_TEMPLATES) {
  console.error("Failed to load getBeastSVG or BEAST_TEMPLATES from beasts.js");
  process.exit(1);
}

// Target beast: 'singularity_monarch' (Tier 20 Low Gravity ultimate)
const beastId = 'singularity_monarch';
const template = BEAST_TEMPLATES[beastId];
if (!template) {
  console.error(`Beast template for '${beastId}' not found.`);
  process.exit(1);
}

console.log(`Loaded beast: ${template.name} (Tier ${template.tier}, Rarity ${template.rarity})`);

// 3. Get the SVG from getBeastSVG (evolved: false, infected: false)
// Wait: getBeastSVG returns a complete <svg viewBox="0 0 120 120" ...>...</svg> string
const rawBeastSvg = getBeastSVG(beastId, false, false).trim();

// 4. Extract the inner elements of the beast SVG
// We want to extract everything inside the outer <svg...> and </svg> tags
const svgStartMatch = rawBeastSvg.match(/^<svg[^>]*>/);
const svgEndMatch = rawBeastSvg.match(/<\/svg>$/);

if (!svgStartMatch || !svgEndMatch) {
  console.error("Could not parse outer <svg> tags from getBeastSVG output.");
  process.exit(1);
}

const innerContent = rawBeastSvg
  .substring(svgStartMatch[0].length, rawBeastSvg.length - svgEndMatch[0].length)
  .trim();

// 5. Generate stars for background
let starsSvg = '';
for (let i = 0; i < 60; i++) {
  const cx = Math.floor(Math.random() * 1024);
  const cy = Math.floor(Math.random() * 1024);
  const r = Math.random() * 1.5 + 0.5;
  const opacity = Math.random() * 0.7 + 0.3;
  starsSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${opacity}" />\n`;
}

// 6. Build the final 1024x1024 composite SVG
// We add a dark space gradient background, some starry dots, a glowing nebula orb, and the beast nested in the center.
const finalSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050010" />
      <stop offset="50%" stop-color="#0a001a" />
      <stop offset="100%" stop-color="#140026" />
    </linearGradient>

    <!-- Center Glow -->
    <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.15" />
      <stop offset="50%" stop-color="#7b00ad" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#050010" stop-opacity="0" />
    </radialGradient>
    
    <!-- Deep Outer Border Glow for premium app icon look -->
    <radialGradient id="border-shimmer" cx="50%" cy="50%" r="70%">
      <stop offset="70%" stop-color="#000" stop-opacity="0" />
      <stop offset="100%" stop-color="#7b00ad" stop-opacity="0.25" />
    </radialGradient>
  </defs>

  <!-- Background Base -->
  <rect width="1024" height="1024" fill="url(#bg-grad)" />

  <!-- Stars -->
  <g id="stars-layer">
    ${starsSvg}
  </g>

  <!-- Ambient Glow -->
  <circle cx="512" cy="512" r="480" fill="url(#center-glow)" />

  <!-- The Actual Beast from the Game -->
  <!-- Sized to 780x780 and perfectly centered (1024 - 780)/2 = 122 -->
  <svg x="122" y="122" width="780" height="780" viewBox="0 0 120 120">
    ${innerContent}
  </svg>

  <!-- Premium border overlay -->
  <rect width="1024" height="1024" fill="url(#border-shimmer)" style="pointer-events: none;" />
</svg>
`.trim();

// 7. Render to PNG using Resvg
console.log("Rendering SVG to PNG buffer...");
try {
  const resvg = new Resvg(finalSvg, {
    fitTo: {
      mode: 'width',
      value: 1024,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // 8. Write to destination paths
  const brainPath = "C:\\Users\\Samjo\\.gemini\\antigravity\\brain\\6bcb0e4e-73f4-4bcd-897c-a88d4c34c551\\singularity_monarch_flat_icon.png";
  const projectIconPath = path.join(__dirname, 'icon.png');
  const playtestIconPath = path.join(__dirname, '1.1', 'icon.png');
  const assetsIconPath = path.join(__dirname, 'assets', 'icon.png');
  const iosIconPath = path.join(__dirname, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
  const iosPublicIconPath = path.join(__dirname, 'ios', 'App', 'App', 'public', 'icon.png');
  const wwwIconPath = path.join(__dirname, 'www', 'icon.png');

  fs.writeFileSync(brainPath, pngBuffer);
  console.log(`Saved flat vector icon in brain folder: ${brainPath}`);

  fs.writeFileSync(projectIconPath, pngBuffer);
  fs.writeFileSync(playtestIconPath, pngBuffer);
  fs.writeFileSync(assetsIconPath, pngBuffer);
  fs.writeFileSync(iosIconPath, pngBuffer);
  fs.writeFileSync(iosPublicIconPath, pngBuffer);
  fs.writeFileSync(wwwIconPath, pngBuffer);
  console.log("App icon successfully replaced in all project directories.");

} catch (err) {
  console.error("Error rendering icon:", err);
  process.exit(1);
}
