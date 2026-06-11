/**
 * Mystic Beasts Evolution - Main Game Logic (Polish & Outbreak Version)
 * Implements biomes, locked Incubators, infected plague loops, and unmirroring text offsets.
 */

// Global state
const state = {
  essence: 0,
  prestigeLevel: 0,
  unlockedBeasts: ['sparky'],
  unlockedEvolved: [],
  beastsOnField: [],
  shopPurchases: {}, // { beastId: count }
  unlockedIncubators: [false, false, false], // [Alpha, Beta, Gamma] buy flags
  upgrades: {
    meadowCapacity: 0,
    crateSpeed: 0,
    crateQuality: 0,
    luckCharms: 0,
    autoCollector: 0,
    activeClicks: 0,
    crateAutoOpener: 0,
    essenceMagnet: 0,
    doubleMergeChance: 0
  },
  sanctuaryBeasts: [],
  trophyCounts: { sparky: 1 },
  // Dual/Triple Incubators
  incubators: [
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }, // Alpha
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }, // Beta
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }  // Gamma
  ],
  t20MergesCount: 0,
  lastTrashedBeast: null,
  lastSaved: Date.now()
};

// Exponential Prestige targets: 5B, 250B, 10T, 500T, 25Qa, 1Qi
const PRESTIGE_TARGETS = [
  5000000000,              // lvl 0 -> 1 (5B)
  250000000000,            // lvl 1 -> 2 (250B)
  10000000000000,          // lvl 2 -> 3 (10T)
  500000000000000,         // lvl 3 -> 4 (500T)
  25000000000000000,       // lvl 4 -> 5 (25Qa)
  1000000000000000000,     // lvl 5 -> 6 (1Qi)
  50000000000000000000,    // lvl 6 -> 7 (50Qi)
  2500000000000000000000,  // lvl 7 -> 8 (2.5Sx)
  125000000000000000000000, // lvl 8 -> 9 (125Sx)
  5000000000000000000000000, // lvl 9 -> 10 (5Sp)
  250000000000000000000000000, // lvl 10 -> 11 (250Sp)
  10000000000000000000000000000 // lvl 11 -> 12 (10Oc)
];

// Upgrade details
const UPGRADE_CONFIGS = {
  meadowCapacity: {
    name: 'Meadow Expansion',
    desc: 'Increases the maximum number of beasts on the field (+3 per level).',
    baseCost: 1000,
    costMultiplier: 3.5,
    maxLevel: 5,
    getValue: (lvl) => 10 + lvl * 3
  },
  crateSpeed: {
    name: 'Crate Drop Rate',
    desc: 'Reduces the time between free crate spawns (-1.5s per level).',
    baseCost: 500,
    costMultiplier: 3.0,
    maxLevel: 6,
    getValue: (lvl) => 15 - lvl * 1.5
  },
  crateQuality: {
    name: 'Crate Enchantment',
    desc: 'Crates have a chance to contain higher-tier beasts (T2 or T3).',
    baseCost: 10000,
    costMultiplier: 5.0,
    maxLevel: 3,
    getValue: (lvl) => lvl
  },
  luckCharms: {
    name: 'Mutation Luck Charms',
    desc: 'Increases the chance of Rare, Super, and Ultra mutations (+15% per level).',
    baseCost: 5000,
    costMultiplier: 4.0,
    maxLevel: 5,
    getValue: (lvl) => 1.0 + lvl * 0.15
  },
  autoCollector: {
    name: 'Essence Vacuum',
    desc: 'Automatically sweeps essence crystals from the ground instantly and silently.',
    baseCost: 2500,
    costMultiplier: 4.5,
    maxLevel: 3,
    getValue: (lvl) => [Infinity, 4000, 2500, 1000][lvl] // ms intervals
  },
  activeClicks: {
    name: 'Active Core Click',
    desc: 'Increases the essence generated when tapping beasts directly.',
    baseCost: 300,
    costMultiplier: 3.5,
    maxLevel: 5,
    getValue: (lvl) => [1, 3, 8, 20, 50, 150][lvl]
  },
  crateAutoOpener: {
    name: 'Crate Auto-Opener',
    desc: 'Crates open automatically after sitting on the field (20s down to 5s).',
    baseCost: 3000,
    costMultiplier: 3.5,
    maxLevel: 3,
    getValue: (lvl) => [20, 15, 10, 5][lvl]
  },
  essenceMagnet: {
    name: 'Essence Magnet',
    desc: 'Expands the hover detection radius for vacuuming essence crystals.',
    baseCost: 1500,
    costMultiplier: 3.0,
    maxLevel: 3,
    getValue: (lvl) => [40, 80, 140, 220][lvl] // pixels radius
  },
  doubleMergeChance: {
    name: 'Double Evolution',
    desc: 'Merged beasts have a chance to evolve two tiers up at once (+5% per level).',
    baseCost: 8000,
    costMultiplier: 4.5,
    maxLevel: 5,
    getValue: (lvl) => lvl * 0.05 // chance 0% to 25%
  }
};

// Biome settings
const BIOME_CONFIGS = [
  { name: 'Forest Meadow', theme: 'biome-0' },
  { name: 'Volcanic Canyon', theme: 'biome-1' },
  { name: 'Crystal Cavern', theme: 'biome-2' },
  { name: 'Sky Sanctuary', theme: 'biome-3' },
  { name: 'Cosmic Nebula', theme: 'biome-4' },
  { name: 'Celestial Cosmos', theme: 'biome-5' },
  { name: 'Demonic Abyss', theme: 'biome-6' },
  { name: 'Omega Nexus', theme: 'biome-7' },
  { name: 'Eldritch Spire', theme: 'biome-8' },
  { name: 'Singularity Void', theme: 'biome-9' },
  { name: 'Glittery Lava Plains', theme: 'biome-10' },
  { name: 'Dark Matter Core', theme: 'biome-11' }
];

// Game engines
let audio = null;
let particles = null;

// UI variables
let activeTab = 'shop';
let draggedBeast = null;
let dragElement = null;
let dragStartedMoving = false;
let dragStartX = 0;
let dragStartY = 0;
let detailsBeastId = 'sparky';
let detailsStateEvolved = false;
let lastClickedOrbTime = 0;
let consecutiveOrbsClicked = 0;

// Spawner loops variables
let crateTimer = 15;
let crateQueue = 0;
let lastFrameTime = Date.now();
let autoCollectTimer = 0;
let mouseX = 0;
let mouseY = 0;

// Init game
window.addEventListener('DOMContentLoaded', () => {
  // Disable pinch-zoom and double-tap zoom on iOS completely
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  audio = new AudioEngine();
  particles = new ParticleSystem(document.getElementById('particles-canvas'));
  particles.loop();

  // Load save data
  loadGame();

  // Mobile drawer listeners
  const menuBtn = document.getElementById('menu-toggle-btn');
  const sidebar = document.getElementById('sidebar-panel');
  const backdrop = document.getElementById('sidebar-backdrop');
  
  if (menuBtn && sidebar && backdrop) {
    const toggleMenu = () => {
      sidebar.classList.toggle('active');
      backdrop.classList.toggle('active');
      if (audio) audio.playClick();
    };
    menuBtn.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', toggleMenu);
  }

  // Setup UI components
  setupSidebarTabs();
  setupSettingsListeners();
  setupPlaygroundListeners();
  setupSpawnerListeners();
  setupModals();
  setupIncubatorListeners();
  
  // Render tabs
  renderShop();
  renderBeastopedia();
  renderSanctuary();
  
  // Start background timers
  setInterval(tickGameSeconds, 1000);
  requestAnimationFrame(gameLoop);

  // Click starts audio
  document.body.addEventListener('click', () => {
    if (audio && !audio.musicPlaying) {
      audio.startMusic();
    }
  });
});

// Get dynamic target
function getPrestigeTarget() {
  const idx = Math.min(state.prestigeLevel, PRESTIGE_TARGETS.length - 1);
  return PRESTIGE_TARGETS[idx];
}

// Save game
function saveGame() {
  state.lastSaved = Date.now();
  const savedBeasts = state.beastsOnField.map(b => ({
    type: b.type,
    x: b.x,
    y: b.y,
    evolved: b.evolved || false,
    infected: b.infected || false,
    deathTimer: b.deathTimer || 45.0
  }));
  
  const saveData = {
    essence: state.essence,
    prestigeLevel: state.prestigeLevel,
    unlockedBeasts: state.unlockedBeasts,
    unlockedEvolved: state.unlockedEvolved || [],
    beastsOnField: savedBeasts,
    shopPurchases: state.shopPurchases,
    unlockedIncubators: state.unlockedIncubators,
    upgrades: state.upgrades,
    sanctuaryBeasts: state.sanctuaryBeasts,
    trophyCounts: state.trophyCounts,
    incubators: state.incubators,
    lastTrashedBeast: state.lastTrashedBeast,
    t20MergesCount: state.t20MergesCount || 0,
    lastSaved: state.lastSaved
  };

  localStorage.setItem('mystic_beasts_evolution_save', JSON.stringify(saveData));
}

// Load game
function loadGame() {
  const data = localStorage.getItem('mystic_beasts_evolution_save');
  applyBiomeBg(state.prestigeLevel);

  if (!data) {
    spawnBeastOnField('sparky', 30, 50, false, false);
    spawnBeastOnField('sparky', 60, 50, false, false);
    return;
  }

  try {
    const saveData = JSON.parse(data);
    state.essence = saveData.essence || 0;
    state.prestigeLevel = saveData.prestigeLevel || 0;
    state.unlockedBeasts = saveData.unlockedBeasts || ['sparky'];
    state.unlockedEvolved = saveData.unlockedEvolved || [];
    state.shopPurchases = saveData.shopPurchases || {};
    state.lastTrashedBeast = saveData.lastTrashedBeast || null;
    state.t20MergesCount = saveData.t20MergesCount || 0;
    
    // Legacy support for boolean unlockedIncubators
    if (Array.isArray(saveData.unlockedIncubators)) {
      state.unlockedIncubators = saveData.unlockedIncubators;
      while (state.unlockedIncubators.length < 3) {
        state.unlockedIncubators.push(false);
      }
    } else {
      state.unlockedIncubators = [!!saveData.unlockedIncubators, false, false];
    }
    
    const savedUpgrades = saveData.upgrades || {};
    Object.keys(state.upgrades).forEach(key => {
      state.upgrades[key] = savedUpgrades[key] || 0;
    });

    state.sanctuaryBeasts = saveData.sanctuaryBeasts || [];
    state.trophyCounts = saveData.trophyCounts || { sparky: 1 };
    
    // Legacy support for object or missing incubators
    if (Array.isArray(saveData.incubators)) {
      state.incubators = saveData.incubators;
      while (state.incubators.length < 3) {
        state.incubators.push({ active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false });
      }
    } else {
      state.incubators = [
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
      ];
    }
    
    state.lastSaved = saveData.lastSaved || Date.now();

    applyBiomeBg(state.prestigeLevel);

    // Spawn saved beasts
    if (saveData.beastsOnField && saveData.beastsOnField.length > 0) {
      saveData.beastsOnField.forEach(b => {
        spawnBeastOnField(b.type, b.x, b.y, b.evolved || false, b.infected || false, b.deathTimer || 45.0);
      });
    } else {
      spawnBeastOnField('sparky', 30, 50, false, false);
    }

    // Refresh locks
    updateIncubatorsVisibility();
    restoreIncubatorSlotUI(0);
    restoreIncubatorSlotUI(1);
    restoreIncubatorSlotUI(2);
    
    // Refresh trash UI
    updateTrashBinUI();
    updateBeastopediaProgressBar();

    // Offline progress
    const timePassedMs = Date.now() - state.lastSaved;
    const timePassedSec = Math.floor(timePassedMs / 1000);
    
    if (timePassedSec > 30) {
      const baseCps = calculateTotalCps();
      const offlineSec = Math.min(timePassedSec, 12 * 3600);
      const earned = baseCps * offlineSec;

      if (earned > 0) {
        state.essence += earned;
        setTimeout(() => {
          showOfflineEarningsPopup(earned, offlineSec);
        }, 800);
      }
    }
  } catch (e) {
    console.error("Failed to load save:", e);
    spawnBeastOnField('sparky', 30, 50, false, false);
  }
}

// Updates locks in HTML
function updateIncubatorsVisibility() {
  const lock1 = document.getElementById('incubator-1-lock');
  const lock2 = document.getElementById('incubator-2-lock');
  const lock3 = document.getElementById('incubator-3-lock');
  const ped2 = document.getElementById('incubator-pedestal-2');
  const ped3 = document.getElementById('incubator-pedestal-3');

  // Alpha
  if (state.unlockedIncubators[0]) {
    lock1.style.display = 'none';
  } else {
    lock1.style.display = 'flex';
  }

  // Beta unlocked at prestige 3+
  if (state.prestigeLevel >= 3) {
    if (ped2) ped2.style.display = 'flex';
    if (state.unlockedIncubators[1]) {
      if (lock2) lock2.style.display = 'none';
    } else {
      if (lock2) lock2.style.display = 'flex';
    }
  } else {
    if (ped2) ped2.style.display = 'none';
  }

  // Gamma unlocked at prestige 5+
  if (state.prestigeLevel >= 5) {
    if (ped3) ped3.style.display = 'flex';
    if (state.unlockedIncubators[2]) {
      if (lock3) lock3.style.display = 'none';
    } else {
      if (lock3) lock3.style.display = 'flex';
    }
  } else {
    if (ped3) ped3.style.display = 'none';
  }
}

// Restores slot SVG and rings on load
function restoreIncubatorSlotUI(slotNum) {
  const inc = state.incubators[slotNum];
  let suffix = '';
  if (slotNum === 1) suffix = '-2';
  if (slotNum === 2) suffix = '-3';
  const pedestal = document.getElementById(`incubator-pedestal${suffix}`);
  const slot = document.getElementById(`incubator-slot-render${suffix}`);
  const overlay = document.getElementById(`incubator-progress-overlay${suffix}`);
  const ring = document.getElementById(`incubator-progress-ring${suffix}`);
  const label = document.getElementById(`incubator-countdown${suffix}`);

  if (inc && inc.active) {
    if (slot) slot.innerHTML = getBeastSVG(inc.beastType, inc.evolvedState, inc.isInfected);
    if (overlay) overlay.style.display = 'flex';
    if (inc.complete) {
      if (slotNum === 2) {
        if (label) label.innerText = 'Purified!';
      } else {
        if (label) label.innerText = inc.isInfected ? 'Cured!' : 'Evolved!';
      }
      if (ring) ring.style.strokeDashoffset = 0;
      if (pedestal) pedestal.classList.add('hovering-compatible');
    } else {
      if (slotNum === 2) {
        if (label) label.innerText = `Purifying: ${Math.ceil(inc.timer)}s`;
      } else {
        if (label) label.innerText = inc.isInfected ? `Curing: ${Math.ceil(inc.timer)}s` : `${Math.ceil(inc.timer)}s`;
      }
      const offset = 263.89 - (inc.timer / inc.maxTime) * 263.89;
      if (ring) ring.style.strokeDashoffset = offset;
    }
  } else {
    if (slot) slot.innerHTML = '';
    if (overlay) overlay.style.display = 'none';
    if (pedestal) pedestal.classList.remove('hovering-compatible');
  }
}

// Applies dynamic biome themes
function applyBiomeBg(prestigeLevel) {
  const bg = document.getElementById('meadow-bg');
  if (!bg) return;
  bg.className = '';
  const idx = Math.min(prestigeLevel, BIOME_CONFIGS.length - 1);
  bg.classList.add(BIOME_CONFIGS[idx].theme);

  // Update generative music dynamically to match the theme of the new biome
  if (audio) {
    try {
      audio.changeBiomeMusic(idx);
    } catch (e) {
      console.error('Audio biome transition failed:', e);
    }
  }
}

// Calculates the sanctuary perk multiplier based on beast tier and rarity
function getBeastPerkScale(template) {
  if (!template) return 1.0;
  const tier = template.tier || 1;
  const tierMult = 1.0 + (tier - 1) * 0.10;
  let rarityMult = 1.0;
  switch (template.rarity) {
    case 'COMMON': rarityMult = 1.0; break;
    case 'RARE': rarityMult = 1.4; break;
    case 'SUPER_RARE': rarityMult = 1.8; break;
    case 'ULTRA_RARE': rarityMult = 2.2; break;
    case 'LEGENDARY': rarityMult = 2.6; break;
    case 'GODLY': rarityMult = 3.0; break;
  }
  return tierMult * rarityMult;
}

// Calculate passive income
function calculateTotalCps() {
  let fieldCps = 0;
  state.beastsOnField.forEach(b => {
    // Infected beasts generate 0 CPS!
    if (b.infected) return;

    const template = BEAST_TEMPLATES[b.type];
    if (template) {
      const evolvedMultiplier = b.evolved ? 3.0 : 1.0;
      fieldCps += template.baseCps * evolvedMultiplier;
    }
  });

  const prestigeMult = 1.0 + state.prestigeLevel * 1.0;

  let sanctuaryPassiveMult = 1.0;
  state.sanctuaryBeasts.forEach(beastId => {
    const template = BEAST_TEMPLATES[beastId];
    if (template) {
      const scale = getBeastPerkScale(template);
      if (template.element === 'EARTH') {
        sanctuaryPassiveMult += 0.25 * scale;
      } else if (['COSMIC', 'VOID', 'DEITY'].includes(template.element)) {
        sanctuaryPassiveMult += 0.15 * scale;
      } else if (template.element === 'LIGHT') {
        sanctuaryPassiveMult += 0.15 * scale;
      }
    }
  });

  return fieldCps * prestigeMult * sanctuaryPassiveMult;
}

// Calculate active clicker values
function getClickMultiplier() {
  let clickUpgradeVal = UPGRADE_CONFIGS.activeClicks.getValue(state.upgrades.activeClicks);
  let clickMultiplier = 1.0;
  state.sanctuaryBeasts.forEach(beastId => {
    const template = BEAST_TEMPLATES[beastId];
    if (template) {
      const scale = getBeastPerkScale(template);
      if (template.element === 'FIRE') {
        clickMultiplier += 0.25 * scale;
      } else if (template.element === 'LIGHT') {
        clickMultiplier += 0.10 * scale;
      }
    }
  });
  return clickUpgradeVal * clickMultiplier;
}

// Calculate crate drop speed cooldown
function getCrateCooldown() {
  const baseVal = UPGRADE_CONFIGS.crateSpeed.getValue(state.upgrades.crateSpeed);
  let speedMultiplier = 1.0;
  state.sanctuaryBeasts.forEach(beastId => {
    const template = BEAST_TEMPLATES[beastId];
    if (template && template.element === 'WATER') {
      const scale = getBeastPerkScale(template);
      speedMultiplier += 0.25 * scale;
    }
  });
  return baseVal / speedMultiplier;
}

// Spawns a beast object on field
function spawnBeastOnField(beastId, x, y, evolved = false, infected = false, deathTimer = 45.0) {
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return null;

  const instanceId = 'beast-' + Math.random().toString(36).substr(2, 9);
  
  const container = document.createElement('div');
  container.className = 'beast-container';
  container.id = instanceId;
  container.style.left = `${x}%`;
  container.style.top = `${y}%`;

  // Dynamic scaling based on tier, rarity, and evolution
  let baseSize = 75; // base Sparky size
  let tierBonus = (template.tier - 1) * 6; // +6px per tier (up to +72px for T13)
  
  let rarityScale = 1.0;
  if (template.rarity === 'RARE') rarityScale = 1.12;
  else if (template.rarity === 'SUPER_RARE') rarityScale = 1.25;
  else if (template.rarity === 'ULTRA_RARE') rarityScale = 1.38;
  else if (template.rarity === 'LEGENDARY') rarityScale = 1.45;
  else if (template.rarity === 'GODLY') rarityScale = 1.55;
  else if (template.rarity === 'DARK_MATTER') rarityScale = 1.65;
  
  let evolvedScale = evolved ? 1.18 : 1.0;
  let tierScale = 1.0;
  if (template.tier > 15) {
    tierScale = 1.0 + (template.tier - 15) * 0.08; // T16: 1.08x, T17: 1.16x, T18: 1.24x, T19: 1.32x, T20: 1.40x
  }
  const finalSize = Math.round((baseSize + tierBonus) * rarityScale * evolvedScale * tierScale);

  container.style.width = `${finalSize}px`;
  container.style.height = `${finalSize}px`;

  container.innerHTML = getBeastSVG(beastId, evolved, infected);

  // Add tag
  const tag = document.createElement('div');
  tag.className = `beast-tag ${evolved ? 'evolved-tag' : ''} ${infected ? 'infected-tag' : ''}`;
  
  let tagColor = '#b0c4de';
  if (template.rarity === 'RARE') tagColor = 'var(--rarity-rare)';
  else if (template.rarity === 'SUPER_RARE') tagColor = 'var(--rarity-super-rare)';
  else if (template.rarity === 'ULTRA_RARE') tagColor = 'var(--rarity-ultra-rare)';
  else if (template.rarity === 'LEGENDARY') tagColor = 'var(--rarity-legendary)';
  else if (template.rarity === 'GODLY') tagColor = 'var(--rarity-godly)';
  else if (template.rarity === 'DARK_MATTER') tagColor = 'var(--rarity-dark-matter)';
  
  if (beastId === 'shadow_fiend' || beastId === 'shadow_fiend_evolved') {
    tag.innerHTML = `<span style="color:#ff3333">☠</span> ${template.name}`;
    tag.style.background = 'rgba(0, 0, 0, 0.7)';
    tag.style.borderColor = '#ff3333';
  } else {
    const star = evolved ? '<span style="color:#ffd700">✦</span>' : `<span style="color:${tagColor}">★</span>`;
    tag.innerHTML = `${star} T${template.tier}${evolved ? ' Ev' : ''}`;
  }
  container.appendChild(tag);

  // If infected, draw death timer label capsules
  if (infected) {
    const dTag = document.createElement('div');
    dTag.className = 'death-timer-label';
    dTag.innerHTML = `☠ <span class="death-time-num">${Math.ceil(deathTimer)}</span>s`;
    container.appendChild(dTag);
  }

  document.getElementById('beast-playground').appendChild(container);

  // Wandering angles
  const angle = Math.random() * Math.PI * 2;
  
  let windSpeedMult = 1.0;
  state.sanctuaryBeasts.forEach(sBeast => {
    const sTemplate = BEAST_TEMPLATES[sBeast];
    if (sTemplate && sTemplate.element === 'WIND') {
      const scale = getBeastPerkScale(sTemplate);
      windSpeedMult += 0.25 * scale;
    }
  });

  let speed = (0.2 + Math.random() * 0.4) * windSpeedMult;
  if (beastId === 'shadow_fiend') {
    speed = 0.8 + Math.random() * 0.4;
  } else if (beastId === 'shadow_fiend_evolved') {
    speed = 1.4 + Math.random() * 0.4;
  }

  const beast = {
    id: instanceId,
    type: beastId,
    dom: container,
    x: x,
    y: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed: speed,
    direction: Math.cos(angle) > 0 ? 1 : -1,
    lastWalkChange: Date.now() + Math.random() * 2000,
    evolved: evolved,
    infected: infected,
    deathTimer: deathTimer,
    spreadTimer: (state.prestigeLevel >= 5) ? 5.0 : 10.0,
    orbTimer: Math.random() * 5000
  };

  // Flip unmirroring
  container.style.transform = beast.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
  tag.style.transform = beast.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';

  state.beastsOnField.push(beast);
  updateHUD();
  
  return beast;
}

// Spawns a physical Crate on the field
function spawnCrateOnField() {
  const playground = document.getElementById('beast-playground');
  
  const instanceId = 'crate-' + Math.random().toString(36).substr(2, 9);
  const landX = 10 + Math.random() * 75;
  const landY = 40 + Math.random() * 32;

  const container = document.createElement('div');
  container.className = 'crate-container';
  container.id = instanceId;
  container.style.left = `${landX}%`;
  
  container.setAttribute('data-spawned-at', Date.now());
  container.setAttribute('data-land-x', landX);
  container.setAttribute('data-land-y', landY);

  let currentY = -20;
  container.style.top = `${currentY}%`;

  container.innerHTML = `
    <svg class="crate-sprite" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" rx="8" fill="#8d6e63" stroke="#5d4037" stroke-width="6"/>
      <line x1="10" y1="10" x2="90" y2="90" stroke="#5d4037" stroke-width="8" />
      <line x1="90" y1="10" x2="10" y2="90" stroke="#5d4037" stroke-width="8" />
      <rect x="22" y="22" width="56" height="56" rx="4" fill="none" stroke="#5d4037" stroke-width="4"/>
      <circle cx="50" cy="50" r="12" fill="#d7ccc8" stroke="#8d6e63" stroke-width="3"/>
    </svg>
  `;

  playground.appendChild(container);

  if (audio) audio.playCrateDrop();

  const fallSpeed = 2.0;
  function fall() {
    if (currentY >= landY) {
      container.style.top = `${landY}%`;
      container.classList.add('shake');
      if (particles) {
        const absolutePos = getAbsolutePosition(landX, landY);
        particles.spawnClick(absolutePos.x, absolutePos.y);
      }
    } else {
      currentY += fallSpeed;
      container.style.top = `${currentY}%`;
      requestAnimationFrame(fall);
    }
  }
  
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    openCrate(instanceId, landX, landY);
  });

  fall();
}

// Helper to calculate the mean tier of active beasts on the field
function getMeanTierOnField() {
  if (state.beastsOnField.length === 0) return 1;
  let sum = 0;
  state.beastsOnField.forEach(b => {
    const template = BEAST_TEMPLATES[b.type];
    if (template) sum += template.tier;
  });
  return sum / state.beastsOnField.length;
}

// Opens crate (with 8% plague infection chance starting at prestige 3)
function openCrate(crateId, x, y) {
  const dom = document.getElementById(crateId);
  if (!dom) return;

  dom.remove();

  // Shadow enemy spawn check (Biome 6+)
  if (state.prestigeLevel >= 5) {
    const enemyChance = 0.01 + (state.prestigeLevel - 5) * 0.005;
    if (Math.random() <= enemyChance) {
      spawnBeastOnField('shadow_fiend', x, y, false, false);
      if (audio) audio.playUnlock('ULTRA_RARE');
      spawnToastNotification(
        '🚨 SHADOW BREED!',
        `A corrupted <b>Shadow Fiend</b> has breached the meadow! Drag it to the Trash Bin or Containment Chamber!`,
        getBeastSVG('shadow_fiend', false, false)
      );
      saveGame();
      return;
    }
  }

  const abs = getAbsolutePosition(x, y);
  if (particles) particles.spawnMerge(abs.x, abs.y, '#e8a710');
  if (audio) audio.playCrateOpen();

  // Decide beast tier inside crate
  const roll = Math.random();
  const lvl = state.upgrades.crateQuality;
  
  let targetTier = 1;
  if (lvl === 1) {
    if (roll < 0.3) targetTier = 2;
  } else if (lvl === 2) {
    if (roll < 0.1) targetTier = 3;
    else if (roll < 0.4) targetTier = 2;
  } else if (lvl === 3) {
    if (roll < 0.25) targetTier = 3;
    else if (roll < 0.6) targetTier = 2;
    
    // Scale minimum drop: 3 tiers below rounded mean tier
    const roundedMean = Math.round(getMeanTierOnField());
    const minCrateTier = Math.max(1, roundedMean - 3);
    targetTier = minCrateTier + (targetTier - 1);
  }

  const allowedMaxTier = getMaxAllowedTier();
  const actualTier = Math.min(targetTier, allowedMaxTier);
  
  const possibilities = Object.values(BEAST_TEMPLATES).filter(b => b.tier === actualTier && b.rarity === 'COMMON');
  const chosenTemplate = possibilities[Math.floor(Math.random() * possibilities.length)] || BEAST_TEMPLATES.sparky;

  // LUCK-BASED EVOLVED HATCH (0.1% chance)
  const evolvedHatchRoll = Math.random();
  const isEvolvedHatch = evolvedHatchRoll <= 0.001;

  // OUTBREAK PLAGUE MUTATION ROLL (starts at 8% at Prestige 3, scales up by 2% per biome)
  let isInfected = false;
  if (state.prestigeLevel >= 3 && !isEvolvedHatch) {
    const plagueChance = 0.08 + (state.prestigeLevel - 3) * 0.02;
    isInfected = Math.random() <= plagueChance;
  }

  spawnBeastOnField(chosenTemplate.id, x, y, isEvolvedHatch, isInfected);

  if (isEvolvedHatch) {
    if (audio) audio.playUnlock('ULTRA_RARE');
    spawnToastNotification(
      '🏆 LUCKY HATCH!', 
      `Directly hatched an Evolved <b>${chosenTemplate.name}</b> (0.1% chance)!`, 
      getBeastSVG(chosenTemplate.id, true)
    );
    if (!state.unlockedEvolved.includes(chosenTemplate.id)) {
      state.unlockedEvolved.push(chosenTemplate.id);
    }
  }

  if (isInfected) {
    spawnToastNotification(
      '☣ PLAGUE OUTBREAK!', 
      `An infected <b>${chosenTemplate.name}</b> was hatched! Drag to an Incubator to cure it before it spreads or dies!`, 
      getBeastSVG(chosenTemplate.id, false, true)
    );
  }

  checkDiscovery(chosenTemplate.id);
}

// Toast notification
function spawnToastNotification(title, desc, iconSvg) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-alert';
  let color = '#ffd700';
  if (title.includes('PLAGUE')) color = '#a800ff';
  else if (title.includes('SHADOW') || title.includes('BREACH') || title.includes('DEVOUR') || title.includes('OUTBREAK') || title.includes('PURIFICATION')) color = '#ff3333';
  toast.style.borderColor = color;
  
  toast.innerHTML = `
    <div class="toast-icon">
      ${iconSvg}
    </div>
    <div>
      <div class="toast-title" style="color: ${color}">${title}</div>
      <div style="margin-top:2px">${desc}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

// Convert coordinates pct to absolute px
function getAbsolutePosition(pctX, pctY) {
  const playground = document.getElementById('beast-playground');
  const rect = playground.getBoundingClientRect();
  return {
    x: rect.left + (pctX / 100) * rect.width,
    y: rect.top + (pctY / 100) * rect.height
  };
}

// Main 60fps Game Loop
function gameLoop() {
  const now = Date.now();
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  const playground = document.getElementById('beast-playground');
  const rect = playground.getBoundingClientRect();

  // 1. Move and update active beasts on field
  for (let i = state.beastsOnField.length - 1; i >= 0; i--) {
    const b = state.beastsOnField[i];
    
    // Wander direction changes
    if (now > b.lastWalkChange) {
      const angle = Math.random() * Math.PI * 2;
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      b.direction = b.vx > 0 ? 1 : -1;
      
      // Flip unmirroring
      b.dom.style.transform = b.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) {
        tagEl.style.transform = b.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      }
      
      b.lastWalkChange = now + 1500 + Math.random() * 3000;
    }

    // Move in percentage space
    const pctVx = (b.vx / rect.width) * 100 * 60 * dt;
    const pctVy = (b.vy / rect.height) * 100 * 60 * dt;

    b.x += pctVx;
    b.y += pctVy;

    // Expanded boundaries (beasts can roam further vertically and horizontally)
    const paddingXMin = 3;
    const paddingXMax = 94;
    const paddingYMin = 10;
    const paddingYMax = 68;

    if (b.x < paddingXMin) { 
      b.x = paddingXMin; b.vx *= -1; b.direction = 1; 
      b.dom.style.transform = 'scaleX(1)';
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) tagEl.style.transform = 'scaleX(1)';
    }
    if (b.x > paddingXMax) { 
      b.x = paddingXMax; b.vx *= -1; b.direction = -1; 
      b.dom.style.transform = 'scaleX(-1)';
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) tagEl.style.transform = 'scaleX(-1)';
    }
    if (b.y < paddingYMin) { b.y = paddingYMin; b.vy *= -1; }
    if (b.y > paddingYMax) { b.y = paddingYMax; b.vy *= -1; }

    if (draggedBeast !== b) {
      b.dom.style.left = `${b.x}%`;
      b.dom.style.top = `${b.y}%`;
    }

    // Drop crystals (Infected beasts and shadow enemies drop nothing!)
    if (!b.infected && b.type !== 'shadow_fiend' && b.type !== 'shadow_fiend_evolved') {
      b.orbTimer += dt * 1000;
      if (b.orbTimer >= 12000) {
        b.orbTimer = 0;
        dropEssenceCrystalOnGround(b.type, b.x, b.y, b.evolved);
      }
    }

    // SHADOW ENEMY ATTACK & DEVOUR TICK
    if (b.type === 'shadow_fiend' || b.type === 'shadow_fiend_evolved') {
      if (typeof b.attackCooldown === 'undefined') {
        b.attackCooldown = b.type === 'shadow_fiend' ? 6.0 : 3.0;
      }
      b.attackCooldown -= dt;
      if (b.attackCooldown <= 0) {
        let closestFriendly = null;
        let minDist = Infinity;
        
        state.beastsOnField.forEach(other => {
          if (other.id !== b.id && other.type !== 'shadow_fiend' && other.type !== 'shadow_fiend_evolved') {
            const dx = other.x - b.x;
            const dy = other.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              closestFriendly = other;
            }
          }
        });
        
        if (closestFriendly && minDist < 6.0) {
          const victimIdx = state.beastsOnField.findIndex(other => other.id === closestFriendly.id);
          if (victimIdx !== -1) {
            const victimName = BEAST_TEMPLATES[closestFriendly.type].name;
            const abs = getAbsolutePosition(closestFriendly.x, closestFriendly.y);
            
            if (particles) particles.spawnMerge(abs.x, abs.y, '#ff0000');
            if (audio) audio.playMerge();
            
            removeBeastFromField(closestFriendly.id);
            if (victimIdx < i) {
              i--;
            }
            
            spawnToastNotification(
              '⚠️ BEAST DEVOUR!',
              `A <b>${b.type === 'shadow_fiend' ? 'Shadow Fiend' : 'Evolved Shadow Fiend'}</b> devoured your friendly <b>${victimName}</b>!`,
              getBeastSVG(b.type, false, false)
            );
            saveGame();
          }
          b.attackCooldown = b.type === 'shadow_fiend' ? 6.0 : 3.0;
        }
      }
    }

    // PLAGUE INFECTION OUTBREAK CLOCK TICK
    if (b.infected) {
      b.deathTimer -= dt;
      const tLabel = b.dom.querySelector('.death-time-num');
      if (tLabel) tLabel.innerText = Math.ceil(b.deathTimer);

      if (b.deathTimer <= 0) {
        // Die and delete!
        const abs = getAbsolutePosition(b.x, b.y);
        if (particles) particles.spawnMerge(abs.x, abs.y, '#a800ff');
        
        spawnToastNotification(
          '☠ BEAST DIED!', 
          `An infected <b>${BEAST_TEMPLATES[b.type].name}</b> has succumbed to the plague!`, 
          getBeastSVG(b.type, false, true)
        );

        b.dom.remove();
        state.beastsOnField.splice(i, 1);
        updateHUD();
        saveGame();
        continue; // skip other loops
      }

      // Plague spread logic: only spread to the nearest healthy beast within 10% distance range after cooldown
      if (!b.spreadTimer) {
        b.spreadTimer = (state.prestigeLevel >= 5) ? 5.0 : 10.0;
      }
      b.spreadTimer -= dt;
      if (b.spreadTimer <= 0) {
        let closestBeast = null;
        let minDist = Infinity;
        state.beastsOnField.forEach(other => {
          if (other.id !== b.id && !other.infected && other.type !== 'shadow_fiend' && other.type !== 'shadow_fiend_evolved') {
            const dx = other.x - b.x;
            const dy = other.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              closestBeast = other;
            }
          }
        });
        if (closestBeast && minDist < 10.0) {
          infectBeast(closestBeast);
          b.spreadTimer = (state.prestigeLevel >= 5) ? 5.0 : 10.0;
        } else {
          // If no healthy beast in range, wait 1 second before checking again
          b.spreadTimer = 1.0;
        }
      }
    }

    // Ambient glow particles
    if (particles && now % 5 === 0) {
      const abs = getAbsolutePosition(b.x, b.y);
      if (b.infected) {
        particles.spawnAmbient(abs.x, abs.y, 'ULTRA_RARE'); // toxic purple glow trails
      } else {
        particles.spawnAmbient(abs.x, abs.y, BEAST_TEMPLATES[b.type].rarity);
        if (b.evolved) {
          particles.spawnAmbient(abs.x, abs.y, 'ULTRA_RARE');
        }
      }
    }
  }

  // 2. Autocollector timers
  if (state.upgrades.autoCollector > 0) {
    autoCollectTimer += dt * 1000;
    const interval = UPGRADE_CONFIGS.autoCollector.getValue(state.upgrades.autoCollector);
    if (autoCollectTimer >= interval) {
      autoCollectTimer = 0;
      autoVacuumCrystals();
    }
  }

  // 3. Magnet hover collection
  sweepMagnetCrystals();

  // 4. Dual/Triple Incubator progress ticker
  tickIncubatorFrames(0, dt);
  tickIncubatorFrames(1, dt);
  tickIncubatorFrames(2, dt);

  requestAnimationFrame(gameLoop);
}

// Infects healthy beast
function infectBeast(beast) {
  beast.infected = true;
  beast.deathTimer = 45.0;
  beast.spreadTimer = (state.prestigeLevel >= 5) ? 5.0 : 10.0;
  
  const template = BEAST_TEMPLATES[beast.type];
  if (!template) return;

  // Re-draw SVG (this wipes out all child elements, so we must recreate tag and labels)
  beast.dom.innerHTML = getBeastSVG(beast.type, beast.evolved, true);
  
  // Re-create the level/rarity tag
  const tag = document.createElement('div');
  tag.className = `beast-tag ${beast.evolved ? 'evolved-tag' : ''} infected-tag`;
  
  let tagColor = '#b0c4de';
  if (template.rarity === 'RARE') tagColor = 'var(--rarity-rare)';
  else if (template.rarity === 'SUPER_RARE') tagColor = 'var(--rarity-super-rare)';
  else if (template.rarity === 'ULTRA_RARE') tagColor = 'var(--rarity-ultra-rare)';
  else if (template.rarity === 'LEGENDARY') tagColor = 'var(--rarity-legendary)';
  else if (template.rarity === 'GODLY') tagColor = 'var(--rarity-godly)';
  else if (template.rarity === 'DARK_MATTER') tagColor = 'var(--rarity-dark-matter)';
  
  const star = beast.evolved ? '<span style="color:#ffd700">✦</span>' : `<span style="color:${tagColor}">★</span>`;
  tag.innerHTML = `${star} T${template.tier}${beast.evolved ? ' Ev' : ''}`;
  beast.dom.appendChild(tag);

  // Add the capsule clock label for death timer
  const dTag = document.createElement('div');
  dTag.className = 'death-timer-label';
  dTag.innerHTML = `☠ <span class="death-time-num">45</span>s`;
  beast.dom.appendChild(dTag);

  // Flip unmirroring logic
  beast.dom.style.transform = beast.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
  tag.style.transform = beast.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';

  spawnToastNotification(
    '☣ INFECTION SPREAD!', 
    `Plague spread to <b>${template.name}</b>!`, 
    getBeastSVG(beast.type, beast.evolved, true)
  );

  updateHUD();
  saveGame();
}

// Drops a physical crystal DOM element on the ground
function dropEssenceCrystalOnGround(beastId, pctX, pctY, evolved = false) {
  const playground = document.getElementById('beast-playground');
  const crystal = document.createElement('div');
  
  crystal.className = 'essence-crystal anim-float';
  
  const landX = Math.max(5, Math.min(pctX + (Math.random() * 8 - 4), 90));
  const landY = Math.max(30, Math.min(pctY + (Math.random() * 10 - 5), 75));
  
  const template = BEAST_TEMPLATES[beastId];
  const mult = evolved ? 3.0 : 1.0;
  const value = template.baseCps * mult * (1.0 + state.prestigeLevel * 1.0) * 3;

  crystal.style.left = `${landX}%`;
  crystal.style.top = `${landY}%`;
  crystal.style.position = 'absolute';
  crystal.style.width = '24px';
  crystal.style.height = '24px';
  crystal.style.cursor = 'pointer';
  crystal.style.zIndex = '4';
  
  const crystalId = 'crystal-' + Math.random().toString(36).substr(2, 9);
  crystal.id = crystalId;
  crystal.setAttribute('data-value', value);
  crystal.setAttribute('data-pct-x', landX);
  crystal.setAttribute('data-pct-y', landY);

  crystal.innerHTML = `
    <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="${evolved ? '#ffd700' : '#ffd43b'}" stroke="#fff" stroke-width="1.0" />
      <circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.8" />
    </svg>
  `;

  playground.appendChild(crystal);

  crystal.addEventListener('mouseenter', () => collectCrystal(crystalId));
  crystal.addEventListener('click', () => collectCrystal(crystalId));
}

// Collect crystal
function collectCrystal(crystalId) {
  const crystal = document.getElementById(crystalId);
  if (!crystal) return;

  const value = parseFloat(crystal.getAttribute('data-value'));
  const pctX = parseFloat(crystal.getAttribute('data-pct-x'));
  const pctY = parseFloat(crystal.getAttribute('data-pct-y'));

  crystal.remove();

  const abs = getAbsolutePosition(pctX, pctY);
  const hudPos = document.querySelector('.essence-icon').getBoundingClientRect();
  const hudCenter = {
    x: hudPos.left + hudPos.width/2,
    y: hudPos.top + hudPos.height/2
  };

  const now = Date.now();
  if (now - lastClickedOrbTime < 300) {
    consecutiveOrbsClicked++;
  } else {
    consecutiveOrbsClicked = 0;
  }
  lastClickedOrbTime = now;
  if (audio) audio.playOrbCollect(consecutiveOrbsClicked);

  if (particles) {
    particles.spawnOrb(abs.x, abs.y, hudCenter.x, hudCenter.y, value, (val) => {
      state.essence += val;
      spawnFloatingText(`+${formatNumber(val)}`, hudCenter.x, hudCenter.y);
      updateHUD();
    });
  } else {
    state.essence += value;
    updateHUD();
  }
}

// Auto vacuum crystals - QUIET AND INSTANT collection Y Y
function autoVacuumCrystals() {
  const crystals = document.querySelectorAll('.essence-crystal');
  let totalCollectedValue = 0;

  crystals.forEach(c => {
    const val = parseFloat(c.getAttribute('data-value'));
    totalCollectedValue += val;
    c.remove();
  });

  if (totalCollectedValue > 0) {
    state.essence += totalCollectedValue;
    updateHUD();
  }
}

// Magnet sweeps
function sweepMagnetCrystals() {
  const crystals = document.querySelectorAll('.essence-crystal');
  const magnetRadius = UPGRADE_CONFIGS.essenceMagnet.getValue(state.upgrades.essenceMagnet);

  crystals.forEach(c => {
    const pctX = parseFloat(c.getAttribute('data-pct-x'));
    const pctY = parseFloat(c.getAttribute('data-pct-y'));
    
    const abs = getAbsolutePosition(pctX, pctY);
    
    const dx = abs.x - mouseX;
    const dy = abs.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < magnetRadius) {
      collectCrystal(c.id);
    }
  });
}

// Tracks cursor position
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }
});

// 1-second clock loop
function tickGameSeconds() {
  const cps = calculateTotalCps();
  state.essence += cps;

  if (Math.floor(Date.now() / 1000) % 10 === 0) {
    saveGame();
  }

  // Crate timers
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  const currentCount = state.beastsOnField.length;

  if (currentCount < maxCap) {
    crateTimer--;
    if (crateTimer <= 0) {
      if (crateQueue < 5) {
        crateQueue++;
        updateCrateQueueBadge();
        if (audio) audio.playClick();
      }
      crateTimer = Math.round(getCrateCooldown());
    }
  } else {
    crateTimer = Math.round(getCrateCooldown());
  }

  checkAutoOpenCrates();
  updateHUD();
  updateCrateSpawnerDisplay();
  
  // Re-enable/disable buy buttons
  const buyButtons = document.querySelectorAll('.shop-buy-btn');
  buyButtons.forEach(btn => {
    const cost = parseFloat(btn.getAttribute('data-cost'));
    btn.disabled = state.essence < cost;
  });
}

// Auto open crates check
function checkAutoOpenCrates() {
  const crates = document.querySelectorAll('.crate-container');
  const openDelay = UPGRADE_CONFIGS.crateAutoOpener.getValue(state.upgrades.crateAutoOpener);

  crates.forEach(crate => {
    const spawnedAt = parseFloat(crate.getAttribute('data-spawned-at'));
    const elapsed = (Date.now() - spawnedAt) / 1000;
    
    if (elapsed >= openDelay) {
      const id = crate.id;
      const x = parseFloat(crate.getAttribute('data-land-x'));
      const y = parseFloat(crate.getAttribute('data-land-y'));
      openCrate(id, x, y);
    }
  });
}

// Update HUD texts
function updateHUD() {
  const display = document.getElementById('essence-display');
  display.innerText = formatNumber(state.essence);

  const cpsDisplay = document.getElementById('cps-display');
  cpsDisplay.innerText = formatNumber(calculateTotalCps());

  const countDisplay = document.getElementById('beast-count');
  countDisplay.innerText = state.beastsOnField.length;

  const capDisplay = document.getElementById('max-capacity');
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  capDisplay.innerText = maxCap;

  const target = getPrestigeTarget();
  const progressPercent = Math.min((state.essence / target) * 100, 100);
  document.getElementById('prestige-progress-pct').innerText = `${Math.floor(progressPercent)}%`;
  document.getElementById('prestige-progress-bar').style.width = `${progressPercent}%`;

  const prestigeBtn = document.getElementById('prestige-btn');
  if (prestigeBtn) {
    prestigeBtn.disabled = state.essence < target;
  }

  const multDisplay = document.getElementById('multiplier-display');
  const prestigeMult = 1.0 + state.prestigeLevel * 1.0;
  multDisplay.innerText = `Essence Multiplier: ${prestigeMult.toFixed(1)}x`;
}

// Crate Spawner UI elements
function updateCrateSpawnerDisplay() {
  const timerLabel = document.getElementById('crate-timer');
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  const currentCount = state.beastsOnField.length;

  if (currentCount >= maxCap) {
    timerLabel.innerText = "Meadow Full!";
    timerLabel.style.color = '#ff6b6b';
  } else {
    timerLabel.innerText = `Next Crate: ${crateTimer}s`;
    timerLabel.style.color = 'var(--color-text-dim)';
  }
}

// Format numbers
function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const i = Math.floor(Math.log10(num) / 3);
  const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
  return `${formatted}${suffixes[i] || ''}`;
}

// --- MERGING DRAG & DROP LOGIC ---

function setupPlaygroundListeners() {
  const playground = document.getElementById('beast-playground');

  playground.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);

  playground.addEventListener('touchstart', dragStart, { passive: false });
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('touchend', dragEnd);

  playground.addEventListener('click', (e) => {
    if (e.target === playground || e.target.id === 'particles-canvas') {
      if (particles) particles.spawnClick(e.clientX, e.clientY);
      if (audio) audio.playClick();
    }
  });
}

function dragStart(e) {
  const pageX = e.touches ? e.touches[0].clientX : e.clientX;
  const pageY = e.touches ? e.touches[0].clientY : e.clientY;
  
  let target = e.target;
  while (target && target !== document.body && !target.classList.contains('beast-container')) {
    target = target.parentElement;
  }

  if (!target || !target.classList.contains('beast-container')) return;

  e.preventDefault();

  const beast = state.beastsOnField.find(b => b.id === target.id);
  if (!beast) return;

  harvestBeastDirectClick(beast, pageX, pageY);

  draggedBeast = beast;
  dragElement = target;
  
  const rect = target.getBoundingClientRect();
  dragStartX = rect.width / 2;
  dragStartY = rect.height / 2;

  dragStartedMoving = false;
}

function dragMove(e) {
  if (!draggedBeast || !dragElement) return;

  const pageX = e.touches ? e.touches[0].clientX : e.clientX;
  const pageY = e.touches ? e.touches[0].clientY : e.clientY;

  e.preventDefault();

  const playground = document.getElementById('beast-playground');
  const rect = playground.getBoundingClientRect();

  const pctX = ((pageX - rect.left - dragStartX) / rect.width) * 100;
  const pctY = ((pageY - rect.top - dragStartY) / rect.height) * 100;

  // Only trigger highlights and dragging state once movement starts to prevent tap flashes
  if (!dragStartedMoving) {
    dragStartedMoving = true;
    dragElement.classList.add('dragging');

    // Highlight merge candidates
    const beastTemplate = BEAST_TEMPLATES[draggedBeast.type];
    if (draggedBeast.type !== 'shadow_fiend' && draggedBeast.type !== 'shadow_fiend_evolved') {
      state.beastsOnField.forEach(b => {
        const bTemplate = BEAST_TEMPLATES[b.type];
        const isBothT13 = (beastTemplate && bTemplate && beastTemplate.tier === 13 && bTemplate.tier === 13);
        const isBothLegendary = (beastTemplate && bTemplate && beastTemplate.rarity === 'LEGENDARY' && bTemplate.rarity === 'LEGENDARY');
        const isBothT15 = (beastTemplate && bTemplate && beastTemplate.tier === 15 && bTemplate.tier === 15);
        if (b.id !== draggedBeast.id && 
            (b.type === draggedBeast.type || isBothT13 || isBothLegendary || isBothT15) && 
            b.evolved === draggedBeast.evolved && 
            b.infected === draggedBeast.infected) {
          b.dom.classList.add('hovering-compatible');
        }
      });
    }

    // Highlight Incubators (if unlocked and vacant)
    if (draggedBeast.type === 'shadow_fiend') {
      if (state.unlockedIncubators[2] && !state.incubators[2].active) {
        const ped3 = document.getElementById('incubator-pedestal-3');
        if (ped3) ped3.classList.add('hovering-compatible');
      }
    } else if (draggedBeast.type !== 'shadow_fiend_evolved') {
      if (state.unlockedIncubators[0] && !state.incubators[0].active) {
        document.getElementById('incubator-pedestal').classList.add('hovering-compatible');
      }
      if (state.unlockedIncubators[1] && !state.incubators[1].active) {
        document.getElementById('incubator-pedestal-2').classList.add('hovering-compatible');
      }
    }

    // Highlight Trash Bin
    const trashBin = document.getElementById('trash-bin');
    if (trashBin) {
      trashBin.classList.add('hovering-compatible');
    }
  }

  // Constrained Y coordinates (10%-80%) to prevent dragging behind HUD/spawner menu
  draggedBeast.x = Math.max(1, Math.min(pctX, 96));
  draggedBeast.y = Math.max(10, Math.min(pctY, 80));

  dragElement.style.left = `${draggedBeast.x}%`;
  dragElement.style.top = `${draggedBeast.y}%`;
}

function dragEnd(e) {
  if (!draggedBeast) return;

  if (dragElement) {
    dragElement.classList.remove('dragging');
  }
  dragStartedMoving = false;
  
  state.beastsOnField.forEach(b => b.dom.classList.remove('hovering-compatible'));
  document.getElementById('incubator-pedestal').classList.remove('hovering-compatible');
  document.getElementById('incubator-pedestal-2').classList.remove('hovering-compatible');
  const ped3 = document.getElementById('incubator-pedestal-3');
  if (ped3) ped3.classList.remove('hovering-compatible');
  
  const trashBin = document.getElementById('trash-bin');
  if (trashBin) {
    trashBin.classList.remove('hovering-compatible');
  }

  const bRect = dragElement.getBoundingClientRect();

  // Check drop collisions with Trash Bin
  if (trashBin) {
    const tRect = trashBin.getBoundingClientRect();
    const dTrash = Math.sqrt(
      Math.pow((tRect.left + tRect.width/2) - (bRect.left + bRect.width/2), 2) +
      Math.pow((tRect.top + tRect.height/2) - (bRect.top + bRect.height/2), 2)
    );

    if (dTrash < 65) {
      trashBeast(draggedBeast);
      draggedBeast = null;
      dragElement = null;
      return;
    }
  }

  // Check drop Y collisions with Incubator 1 (Alpha)
  const ped1 = document.getElementById('incubator-pedestal');
  const pRect1 = ped1.getBoundingClientRect();
  
  const dPed1 = Math.sqrt(
    Math.pow((pRect1.left + pRect1.width/2) - (bRect.left + bRect.width/2), 2) +
    Math.pow((pRect1.top + pRect1.height/2) - (bRect.top + bRect.height/2), 2)
  );

  if (dPed1 < 75) {
    if (draggedBeast.type === 'shadow_fiend' || draggedBeast.type === 'shadow_fiend_evolved') {
      showWarning("Incompatible", "Shadow Fiends cannot be placed in Incubator Alpha!");
    } else if (!state.unlockedIncubators[0]) {
      showWarning("Slot Locked", "Unlock Incubator Alpha in the shop first!");
    } else if (state.incubators[0].active) {
      showWarning("Slot Busy", "Incubator Alpha is currently busy!");
    } else if (draggedBeast.evolved && !draggedBeast.infected) {
      showWarning("Already Evolved", "This beast is already evolved!");
    } else {
      startBeastIncubatorCycle(0, draggedBeast);
      draggedBeast = null;
      dragElement = null;
      return;
    }
  }

  // Check drop Y collisions with Incubator 2 (Beta)
  const ped2 = document.getElementById('incubator-pedestal-2');
  if (state.prestigeLevel >= 3) {
    const pRect2 = ped2.getBoundingClientRect();
    const dPed2 = Math.sqrt(
      Math.pow((pRect2.left + pRect2.width/2) - (bRect.left + bRect.width/2), 2) +
      Math.pow((pRect2.top + pRect2.height/2) - (bRect.top + bRect.height/2), 2)
    );

    if (dPed2 < 75) {
      if (draggedBeast.type === 'shadow_fiend' || draggedBeast.type === 'shadow_fiend_evolved') {
        showWarning("Incompatible", "Shadow Fiends cannot be placed in Incubator Beta!");
      } else if (!state.unlockedIncubators[1]) {
        showWarning("Slot Locked", "Unlock Incubator Beta in the shop first!");
      } else if (state.incubators[1].active) {
        showWarning("Slot Busy", "Incubator Beta is currently busy!");
      } else if (draggedBeast.evolved && !draggedBeast.infected) {
        showWarning("Already Evolved", "This beast is already evolved!");
      } else {
        startBeastIncubatorCycle(1, draggedBeast);
        draggedBeast = null;
        dragElement = null;
        return;
      }
    }
  }

  // Check drop Y collisions with Incubator 3 (Gamma)
  if (ped3 && state.prestigeLevel >= 5) {
    const pRect3 = ped3.getBoundingClientRect();
    const dPed3 = Math.sqrt(
      Math.pow((pRect3.left + pRect3.width/2) - (bRect.left + bRect.width/2), 2) +
      Math.pow((pRect3.top + pRect3.height/2) - (bRect.top + bRect.height/2), 2)
    );

    if (dPed3 < 75) {
      if (draggedBeast.type !== 'shadow_fiend') {
        showWarning("Incompatible", "Incubator Gamma is only for base Shadow Fiends!");
      } else if (!state.unlockedIncubators[2]) {
        showWarning("Slot Locked", "Unlock Incubator Gamma in the shop first!");
      } else if (state.incubators[2].active) {
        showWarning("Slot Busy", "Incubator Gamma is currently busy!");
      } else {
        startBeastIncubatorCycle(2, draggedBeast);
        draggedBeast = null;
        dragElement = null;
        return;
      }
    }
  }

  // Normal merges
  let mergeTarget = null;
  const draggedTemplate = BEAST_TEMPLATES[draggedBeast.type];
  if (draggedBeast.type !== 'shadow_fiend' && draggedBeast.type !== 'shadow_fiend_evolved') {
    for (let b of state.beastsOnField) {
      if (b.id === draggedBeast.id) continue;
      
      const bTemplate = BEAST_TEMPLATES[b.type];
      const isBothT13 = (draggedTemplate && bTemplate && draggedTemplate.tier === 13 && bTemplate.tier === 13);
      const isBothLegendary = (draggedTemplate && bTemplate && draggedTemplate.rarity === 'LEGENDARY' && bTemplate.rarity === 'LEGENDARY');
      const isBothT15 = (draggedTemplate && bTemplate && draggedTemplate.tier === 15 && bTemplate.tier === 15);
      if (b.type !== draggedBeast.type && !isBothT13 && !isBothLegendary && !isBothT15) continue;
    if (b.evolved !== draggedBeast.evolved) continue;
    if (b.infected !== draggedBeast.infected) continue;
      if (b.evolved !== draggedBeast.evolved) continue;
      if (b.infected !== draggedBeast.infected) continue;

      const dx = b.x - draggedBeast.x;
      const dy = b.y - draggedBeast.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 7.5) {
        mergeTarget = b;
        break;
      }
    }
  }

  if (mergeTarget) {
    executeMerge(draggedBeast, mergeTarget);
  } else {
    if (audio) audio.playClick();
  }

  draggedBeast = null;
  dragElement = null;
}

// Executes merger mutation
function executeMerge(beastA, beastB) {
  const template = BEAST_TEMPLATES[beastA.type];
  const targetTemplate = BEAST_TEMPLATES[beastB.type];
  if (!template || !targetTemplate) {
    if (audio) audio.playClick();
    return;
  }

  const isBothLegendary = (template.rarity === 'LEGENDARY' && targetTemplate.rarity === 'LEGENDARY');
  const isBothT15 = (template.tier === 15 && targetTemplate.tier === 15);
  const isBothT19 = (template.tier === 19 && targetTemplate.tier === 19);

  if (template.evolutions.length === 0 && !isBothLegendary && !isBothT15 && !isBothT19) {
    if (audio) audio.playClick();
    return;
  }

  const mergeX = (beastA.x + beastB.x) / 2;
  const mergeY = (beastA.y + beastB.y) / 2;
  const isEvolved = beastA.evolved;
  
  // MERGE PLAGUE SPREAD
  const isInfected = beastA.infected || beastB.infected;

  removeBeastFromField(beastA.id);
  removeBeastFromField(beastB.id);

  const abs = getAbsolutePosition(mergeX, mergeY);
  const elementColor = ELEMENTS[template.element].color;
  if (particles) particles.spawnMerge(abs.x, abs.y, elementColor);
  if (audio) audio.playMerge();

  // 1. If BOTH are Legendary, handle Godly roll
  if (isBothLegendary) {
    const isBiome5Plus = (state.prestigeLevel >= 4); // Biome 5 or higher
    
    if (isBiome5Plus && Math.random() < 0.10) {
      // 10% chance to yield a random Godly beast
      const godlyPool = ['infinity', 'abyssus', 'solaris'];
      const resultType = godlyPool[Math.floor(Math.random() * godlyPool.length)];
      
      spawnToastNotification(
        '🌌 GODLY MUTATION!',
        `Legendary elements converged into the Godly <b>${BEAST_TEMPLATES[resultType].name}</b> (10% chance)!`,
        getBeastSVG(resultType, false)
      );
      if (audio) audio.playUnlock('GODLY');
      
      spawnBeastOnField(resultType, mergeX, mergeY, false, isInfected);
      checkDiscovery(resultType);
    } else {
      // 90% chance (or 100% in biomes below 5) to yield same Legendary but tier 15 (Prime)
      const primeMapping = {
        aurelion: 'aurelion_prime',
        voidwalker: 'voidwalker_prime',
        ragnarok: 'ragnarok_prime'
      };
      
      // Fallback in case they merge prime legendaries
      const resultType = primeMapping[beastA.type] || beastA.type;
      
      spawnToastNotification(
        '🌟 LEGENDARY ASCENSION!',
        `Legendary elements fused into <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
      
      spawnBeastOnField(resultType, mergeX, mergeY, isEvolved, isInfected);
      checkDiscovery(resultType);
    }
    return;
  }

  // 1b. If BOTH are Tier 15, handle Godly merge gamble
  if (isBothT15) {
    const isSuccess = Math.random() < 0.10; // small chance (10%)
    
    if (isSuccess) {
      const godlyPool = ['infinity', 'abyssus', 'solaris'];
      const resultType = godlyPool[Math.floor(Math.random() * godlyPool.length)];
      
      spawnToastNotification(
        '🌌 GODLY CONVERGENCE!',
        `Merging Tier 15 elements converged into the Godly <b>${BEAST_TEMPLATES[resultType].name}</b> (10% chance)!`,
        getBeastSVG(resultType, false)
      );
      if (audio) audio.playUnlock('GODLY');
      
      spawnBeastOnField(resultType, mergeX, mergeY, false, isInfected);
      checkDiscovery(resultType);
      return;
    } else if (state.prestigeLevel < 8) {
      // Unsuccessful in biomes below 9: spawn one of them back, meaning they net lost exactly 1 Tier 15 beast!
      spawnBeastOnField(beastA.type, mergeX, mergeY, beastA.evolved, beastA.infected);
      
      spawnToastNotification(
        '💥 MERGE FAILURE!',
        `Tier 15 merge failed. One <b>Beast</b> was lost in the attempt.`,
        getBeastSVG(beastA.type, beastA.evolved, beastA.infected)
      );
      if (audio) audio.playClick();
      return;
    } else {
      // Biome 9 onwards: failed Godly roll produces its evolution (e.g. Tier 16) successfully!
      let resultType;
      if (template.evolutions && template.evolutions.length > 0) {
        resultType = rollMutation(template.evolutions);
      } else {
        const t16Pool = ['arachnomorph', 'scarab'];
        resultType = t16Pool[Math.floor(Math.random() * t16Pool.length)];
      }
      
      spawnToastNotification(
        '🧬 EVOLUTION SUCCESS!',
        `Tier 15 merge succeeded! Evolved into <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
        getBeastSVG(resultType, isEvolved, isInfected)
      );
      if (audio) audio.playUnlock('ULTRA_RARE');
      
      spawnBeastOnField(resultType, mergeX, mergeY, isEvolved, isInfected);
      checkDiscovery(resultType);
      return;
    }
  }

  // 1c. If BOTH are Tier 19, handle T20 / Dark Matter merges count
  if (isBothT19) {
    state.t20MergesCount = (state.t20MergesCount || 0) + 1;
    saveGame();
    
    let resultType;
    if (state.t20MergesCount >= 1000) {
      resultType = 'dark_matter_leviathan';
      spawnBeastOnField(resultType, mergeX, mergeY, false, isInfected);
      checkDiscovery(resultType);
      
      spawnToastNotification(
        '🌌 COSMIC CONVERGENCE!',
        `Your 1000th Tier 20 merge has opened a rift! The supreme <b>Singularity Devourer</b> has materialized!`,
        getBeastSVG(resultType, false)
      );
      if (audio) audio.playUnlock('GODLY');
    } else {
      resultType = 'void_monarch';
      spawnBeastOnField(resultType, mergeX, mergeY, isEvolved, isInfected);
      checkDiscovery(resultType);
      
      const left = 1000 - state.t20MergesCount;
      spawnToastNotification(
        '👑 VOID MONARCH MERGED!',
        `Void Monarch materialized! <b>${state.t20MergesCount}/1000</b> merges toward the Dark Matter rift (${left} left).`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
    updateBeastopediaProgressBar();
    return;
  }

  // 2. Normal fusions
  // Legendary rates:
  // - Ragnarok: T13 merges. 5% if base, 25% if evolved.
  // - Voidwalker: T12+ merges. 1.5% if base, 10% if evolved.
  // - Aurelion: Any merge. 0.1% if base, 1.0% if evolved.
  let resultType = null;
  let isLegendarySuccess = false;
  const roll = Math.random();
  const isT13Merge = (template.tier === 13);
  
  // Ragnarok check (T13 merges)
  if (isT13Merge) {
    const ragnarokChance = isEvolved ? 0.25 : 0.05;
    if (roll < ragnarokChance) {
      resultType = 'ragnarok';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Fusing Tier 13 elements transcended into the Legendary <b>Ragnarok</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
  }
  
  // Voidwalker check (T12+ merges)
  if (!isLegendarySuccess && template.tier >= 12) {
    const voidwalkerChance = isEvolved ? 0.10 : 0.015;
    if (Math.random() < voidwalkerChance) {
      resultType = 'voidwalker';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Deep elemental fusion collapsed space into the Legendary <b>Voidwalker</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
  }

  // Aurelion check (Any merge)
  if (!isLegendarySuccess) {
    const aurelionChance = isEvolved ? 0.01 : 0.001;
    if (Math.random() < aurelionChance) {
      resultType = 'aurelion';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Fusing elements resonated with the stars into the Legendary <b>Aurelion</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
  }

  // If no legendary success, roll standard mutation
  if (!isLegendarySuccess) {
    resultType = rollMutation(template.evolutions);
  }

  // Double Evolve Upgrade (not applicable to T13 or legendary results)
  const doubleChance = UPGRADE_CONFIGS.doubleMergeChance.getValue(state.upgrades.doubleMergeChance);
  const isDoubleMerge = Math.random() < doubleChance && !isInfected && !isT13Merge && !isLegendarySuccess;

  if (isDoubleMerge) {
    const firstResultTemplate = BEAST_TEMPLATES[resultType];
    if (firstResultTemplate && firstResultTemplate.evolutions && firstResultTemplate.evolutions.length > 0) {
      resultType = rollMutation(firstResultTemplate.evolutions);
      spawnToastNotification(
        '⚡ DOUBLE EVOLUTION!', 
        `Triggered a tier skip! Mutated directly to <b>${BEAST_TEMPLATES[resultType].name}</b>!`, 
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('SUPER_RARE');
    }
  }

  // Spawn resulting mutated beast, transferring evolved and infected states
  spawnBeastOnField(resultType, mergeX, mergeY, isEvolved, isInfected);

  if (isInfected && !isLegendarySuccess) {
    spawnToastNotification(
      '☣ PLAGUE TRANSFERRED!', 
      `Merged with infected elements! Mutated <b>${BEAST_TEMPLATES[resultType].name}</b> is infected!`, 
      getBeastSVG(resultType, isEvolved, true)
    );
  }

  checkDiscovery(resultType);
}

// Weighted mutation roll helper
function rollMutation(evolutions) {
  if (evolutions.length === 1) return evolutions[0].to;

  const luckFactor = UPGRADE_CONFIGS.luckCharms.getValue(state.upgrades.luckCharms);
  
  let sanctuaryBuff = 1.0;
  state.sanctuaryBeasts.forEach(beastId => {
    const template = BEAST_TEMPLATES[beastId];
    if (template && ['COSMIC', 'VOID', 'DEITY'].includes(template.element)) {
      const scale = getBeastPerkScale(template);
      sanctuaryBuff += 0.1 * scale;
    }
  });

  const rarityMultiplier = luckFactor * sanctuaryBuff;

  const adjustedEvos = evolutions.map((evo, idx) => {
    if (idx === 0) return { to: evo.to, weight: evo.weight };
    return { to: evo.to, weight: evo.weight * rarityMultiplier };
  });

  let rareSum = 0;
  for (let i = 1; i < adjustedEvos.length; i++) {
    rareSum += adjustedEvos[i].weight;
  }

  adjustedEvos[0].weight = Math.max(100 - rareSum, 1);

  let sum = 0;
  adjustedEvos.forEach(e => sum += e.weight);
  
  const roll = Math.random() * sum;
  let currentSum = 0;
  for (let evo of adjustedEvos) {
    currentSum += evo.weight;
    if (roll <= currentSum) {
      return evo.to;
    }
  }
  return adjustedEvos[0].to;
}

// Check discovery
function checkDiscovery(beastId) {
  state.trophyCounts[beastId] = (state.trophyCounts[beastId] || 0) + 1;

  if (state.unlockedBeasts.includes(beastId)) {
    saveGame();
    return;
  }

  state.unlockedBeasts.push(beastId);
  saveGame();

  renderBeastopedia();
  renderShop();
  renderSanctuary();

  triggerDiscoveryModal(beastId);
}

// Discovery modal
function triggerDiscoveryModal(beastId) {
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return;

  const rarityLabel = document.getElementById('discovery-beast-rarity');
  rarityLabel.innerText = RARITIES[template.rarity].name;
  rarityLabel.className = `unlock-beast-rarity ${template.rarity.toLowerCase()}`;

  document.getElementById('discovery-beast-name').innerText = template.name;
  document.getElementById('discovery-beast-lore').innerText = template.lore;
  
  const svgContainer = document.getElementById('discovery-beast-svg-container');
  svgContainer.innerHTML = getBeastSVG(beastId, false);

  if (audio) audio.playUnlock(template.rarity);

  const modal = document.getElementById('discovery-modal');
  modal.classList.add('active');
}

// Spawn floating text
function spawnFloatingText(text, x, y) {
  const parent = document.body;
  const container = document.createElement('div');
  container.className = 'floating-text';
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  container.innerText = text;
  parent.appendChild(container);
  
  setTimeout(() => container.remove(), 1200);
}

// --- INCUBATOR SYSTEM LOGIC (DUAL SLOTS) ---

function setupIncubatorListeners() {
  document.getElementById('incubator-pedestal').addEventListener('click', () => {
    // If locked, click to buy
    if (!state.unlockedIncubators[0]) {
      buyIncubatorAlphaFromPedestal();
    } else if (state.incubators[0].active && state.incubators[0].complete) {
      retrieveBeastFromIncubatorSlot(0);
    }
  });

  document.getElementById('incubator-pedestal-2').addEventListener('click', () => {
    // If locked, click to buy
    if (!state.unlockedIncubators[1]) {
      buyIncubatorBetaFromPedestal();
    } else if (state.incubators[1].active && state.incubators[1].complete) {
      retrieveBeastFromIncubatorSlot(1);
    }
  });

  const ped3 = document.getElementById('incubator-pedestal-3');
  if (ped3) {
    ped3.addEventListener('click', () => {
      // If locked, click to buy
      if (!state.unlockedIncubators[2]) {
        buyIncubatorGammaFromPedestal();
      } else if (state.incubators[2].active && state.incubators[2].complete) {
        retrieveBeastFromIncubatorSlot(2);
      }
    });
  }
}

function buyIncubatorAlphaFromPedestal() {
  const cost = 100000;
  if (state.essence >= cost) {
    state.essence -= cost;
    state.unlockedIncubators[0] = true;
    if (audio) audio.playUnlock('COMMON');
    updateIncubatorsVisibility();
    renderShop();
    updateHUD();
    saveGame();
  } else {
    showWarning("Locked Pedestal", "Requires 100,000 essence to unlock Incubator Alpha!");
  }
}

function buyIncubatorBetaFromPedestal() {
  const cost = 50000000;
  if (state.essence >= cost) {
    state.essence -= cost;
    state.unlockedIncubators[1] = true;
    if (audio) audio.playUnlock('COMMON');
    updateIncubatorsVisibility();
    renderShop();
    updateHUD();
    saveGame();
  } else {
    showWarning("Locked Pedestal", "Requires 50,000,000 essence to unlock Incubator Beta!");
  }
}

function buyIncubatorGammaFromPedestal() {
  const cost = 10000000000;
  if (state.essence >= cost) {
    state.essence -= cost;
    state.unlockedIncubators[2] = true;
    if (audio) audio.playUnlock('COMMON');
    updateIncubatorsVisibility();
    renderShop();
    updateHUD();
    saveGame();
  } else {
    showWarning("Locked Pedestal", "Requires 10,000,000,000 essence to unlock Incubator Gamma!");
  }
}

// Starts beast incubation/curing cycle
function startBeastIncubatorCycle(slotNum, beast) {
  const inc = state.incubators[slotNum];
  let suffix = '';
  if (slotNum === 1) suffix = '-2';
  if (slotNum === 2) suffix = '-3';

  // Cure takes 10s; Evolve takes 15s; Containment takes 15s. Godly evolution takes twice as long (30s).
  let duration = slotNum === 2 ? 15.0 : (beast.infected ? 10.0 : 15.0);
  const template = BEAST_TEMPLATES[beast.type];
  if (template && template.rarity === 'GODLY' && !beast.infected && slotNum !== 2) {
    duration = 30.0;
  }

  state.incubators[slotNum] = {
    active: true,
    beastType: beast.type,
    timer: duration,
    maxTime: duration,
    complete: false,
    isInfected: beast.infected,
    evolvedState: beast.evolved
  };

  removeBeastFromField(beast.id);

  if (audio) audio.playCrateOpen();

  // Render beast inside glass container
  const slot = document.getElementById(`incubator-slot-render${suffix}`);
  if (slot) slot.innerHTML = getBeastSVG(beast.type, beast.evolved, beast.infected);

  // Show timer overlay ring
  const overlay = document.getElementById(`incubator-progress-overlay${suffix}`);
  if (overlay) overlay.style.display = 'flex';
  
  const ring = document.getElementById(`incubator-progress-ring${suffix}`);
  if (ring) ring.style.strokeDashoffset = 263.89;
  
  const label = document.getElementById(`incubator-countdown${suffix}`);
  if (slotNum === 2) {
    if (label) label.innerText = `Purifying: ${Math.ceil(duration)}s`;
    if (ring) ring.setAttribute('stroke', '#ff3333');
    if (label) label.style.color = '#ff3333';
  } else {
    if (label) label.innerText = beast.infected ? `Curing: ${Math.ceil(duration)}s` : `${Math.ceil(duration)}s`;
    if (ring) ring.setAttribute('stroke', beast.infected ? '#a800ff' : '#ffd700');
    if (label) label.style.color = beast.infected ? '#a800ff' : '#ffd700';
  }

  saveGame();
}

// Progress timer inside game loop
function tickIncubatorFrames(slotNum, dt) {
  const inc = state.incubators[slotNum];
  if (!inc || !inc.active || inc.complete) return;

  inc.timer -= dt;

  let suffix = '';
  if (slotNum === 1) suffix = '-2';
  if (slotNum === 2) suffix = '-3';
  const ring = document.getElementById(`incubator-progress-ring${suffix}`);
  const label = document.getElementById(`incubator-countdown${suffix}`);

  if (inc.timer <= 0) {
    inc.timer = 0;
    inc.complete = true;
    
    if (slotNum === 2) {
      if (label) label.innerText = 'Purified!';
    } else {
      if (label) label.innerText = inc.isInfected ? 'Cured!' : 'Evolved!';
    }
    if (ring) ring.style.strokeDashoffset = 0;

    // Glowing outline
    const pedestal = document.getElementById(`incubator-pedestal${suffix}`);
    if (pedestal) pedestal.classList.add('hovering-compatible');

    if (audio) audio.playUnlock('RARE');
    saveGame();
  } else {
    if (slotNum === 2) {
      if (label) label.innerText = `Purifying: ${Math.ceil(inc.timer)}s`;
    } else {
      if (label) label.innerText = inc.isInfected ? `Curing: ${Math.ceil(inc.timer)}s` : `${Math.ceil(inc.timer)}s`;
    }
    const offset = 263.89 - (inc.timer / inc.maxTime) * 263.89;
    if (ring) ring.style.strokeDashoffset = offset;
  }
}

// Retrieves the cured/evolved beast from the pedestal
function retrieveBeastFromIncubatorSlot(slotNum) {
  const inc = state.incubators[slotNum];
  if (!inc || !inc.active || !inc.complete) return;

  let suffix = '';
  if (slotNum === 1) suffix = '-2';
  if (slotNum === 2) suffix = '-3';

  if (slotNum === 2) {
    // Gamma purification outcome (10% random T14/T15 friendly, 90% evolved enemy)
    const isSuccess = Math.random() < 0.10;
    let resultType = '';
    
    if (isSuccess) {
      const highTierKeys = Object.keys(BEAST_TEMPLATES).filter(key => {
        const t = BEAST_TEMPLATES[key];
        return (t.tier === 14 || t.tier === 15) && key !== 'shadow_fiend' && key !== 'shadow_fiend_evolved';
      });
      resultType = highTierKeys[Math.floor(Math.random() * highTierKeys.length)];
      
      const x = 75;
      spawnBeastOnField(resultType, x, 70, false, false);
      if (audio) audio.playCrateOpen();
      
      spawnToastNotification(
        '🌟 PURIFICATION!',
        `Shadow Fiend has been purified into a friendly <b>${BEAST_TEMPLATES[resultType].name}</b> (10% chance)!`,
        getBeastSVG(resultType, false, false)
      );
      checkDiscovery(resultType);
    } else {
      resultType = 'shadow_fiend_evolved';
      
      const x = 75;
      spawnBeastOnField(resultType, x, 70, false, false);
      if (audio) audio.playCrateOpen();
      
      spawnToastNotification(
        '🚨 CONTAINMENT BREACH!',
        `Purification failed! The Shadow Fiend has mutated into an <b>Evolved Shadow Fiend</b>!`,
        getBeastSVG(resultType, false, false)
      );
    }
  } else {
    // If cured: spawns normal beast. If evolved: spawns evolved beast.
    const isEvolvedResult = inc.isInfected ? inc.evolvedState : true; // evolve completes base form
    const isInfectedResult = false; // cured cured cured!

    // Spawn back on field
    const x = slotNum === 0 ? 20 : 75;
    spawnBeastOnField(inc.beastType, x, 70, isEvolvedResult, isInfectedResult);

    if (audio) audio.playCrateOpen();

    // Add evolved lock check
    if (isEvolvedResult && !state.unlockedEvolved.includes(inc.beastType)) {
      state.unlockedEvolved.push(inc.beastType);
    }
  }

  // Clear slots
  state.incubators[slotNum] = {
    active: false,
    beastType: null,
    timer: 0,
    maxTime: 15,
    complete: false,
    isInfected: false,
    evolvedState: false
  };

  const renderSlot = document.getElementById(`incubator-slot-render${suffix}`);
  if (renderSlot) renderSlot.innerHTML = '';
  const progressOverlay = document.getElementById(`incubator-progress-overlay${suffix}`);
  if (progressOverlay) progressOverlay.style.display = 'none';
  const pedestal = document.getElementById(`incubator-pedestal${suffix}`);
  if (pedestal) pedestal.classList.remove('hovering-compatible');

  saveGame();
  renderBeastopedia();
  renderShop();
  renderSanctuary();
}

// --- SHOP & UPGRADES UI ---

function renderShop() {
  const beastList = document.getElementById('shop-beast-list');
  beastList.innerHTML = '';

  const maxAllowedTier = getMaxAllowedTier();

  const purchaseableTemplates = Object.values(BEAST_TEMPLATES).filter(b => {
    return b.tier <= maxAllowedTier && 
           b.rarity === 'COMMON' && 
           state.unlockedBeasts.includes(b.id);
  });

  purchaseableTemplates.sort((a, b) => a.tier - b.tier);

  purchaseableTemplates.forEach(template => {
    const buyCount = state.shopPurchases[template.id] || 0;
    const cost = Math.round(template.cost * Math.pow(1.18, buyCount));
    
    const card = document.createElement('div');
    card.className = 'shop-card';
    
    card.innerHTML = `
      <div class="shop-card-icon" style="width: 50px; height: 50px;">
        ${getBeastSVG(template.id, false, false)}
      </div>
      <div class="shop-card-info">
        <div class="shop-card-name">${template.name}</div>
        <div class="shop-card-desc">Tier ${template.tier} | Base +${template.baseCps}/s</div>
        <div class="shop-card-meta">
          <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          Cost: ${formatNumber(cost)}
        </div>
      </div>
      <button class="shop-buy-btn" data-id="${template.id}" data-cost="${cost}" ${state.essence < cost ? 'disabled' : ''}>
        Buy
      </button>
    `;
    beastList.appendChild(card);
  });

  const buyButtons = beastList.querySelectorAll('.shop-buy-btn');
  buyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cost = parseFloat(btn.getAttribute('data-cost'));
      buyBeastFromShop(id, cost);
    });
  });

  renderUpgrades();
}

function buyBeastFromShop(beastId, cost) {
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Meadow Full", "Meadow is full! Clear some space by merging beasts first.");
    return;
  }

  if (state.essence >= cost) {
    state.essence -= cost;
    state.shopPurchases[beastId] = (state.shopPurchases[beastId] || 0) + 1;
    
    const x = 30 + Math.random() * 40;
    const y = 45 + Math.random() * 25;
    
    spawnBeastOnField(beastId, x, y, false, false);
    if (audio) audio.playCrateOpen();

    saveGame();
    renderShop();
    updateHUD();
  }
}

function renderUpgrades() {
  const upgradesList = document.getElementById('shop-upgrades-list');
  upgradesList.innerHTML = '';

  // 1. Add Incubator 1 buy card (if locked)
  if (!state.unlockedIncubators[0]) {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-info" style="margin-left: 5px;">
        <div class="shop-card-name" style="color:#ffd700">Unlock Incubator Alpha</div>
        <div class="shop-card-desc">Unlocks the bottom-left pedestal to evolve healthy beasts or cure infected ones.</div>
        <div class="shop-card-meta">
          <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          Cost: 100K
        </div>
      </div>
      <button class="shop-buy-btn" data-buy-inc="0" data-cost="100000" ${state.essence < 100000 ? 'disabled' : ''}>
        Unlock
      </button>
    `;
    upgradesList.appendChild(card);
  }

  // 2. Add Incubator 2 buy card (Prestige 3+ and Alpha unlocked and Beta locked)
  if (state.prestigeLevel >= 3 && state.unlockedIncubators[0] && !state.unlockedIncubators[1]) {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-info" style="margin-left: 5px;">
        <div class="shop-card-name" style="color:#a800ff">Unlock Incubator Beta</div>
        <div class="shop-card-desc">Unlocks the bottom-right pedestal. Essential for managing double curing outbreaks!</div>
        <div class="shop-card-meta">
          <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          Cost: 50M
        </div>
      </div>
      <button class="shop-buy-btn" data-buy-inc="1" data-cost="50000000" ${state.essence < 50000000 ? 'disabled' : ''}>
        Unlock
      </button>
    `;
    upgradesList.appendChild(card);
  }

  // 3. Add Incubator 3 buy card (Prestige 5+ and Beta unlocked and Gamma locked)
  if (state.prestigeLevel >= 5 && state.unlockedIncubators[1] && !state.unlockedIncubators[2]) {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-info" style="margin-left: 5px;">
        <div class="shop-card-name" style="color:#ff3333">Unlock Incubator Gamma</div>
        <div class="shop-card-desc">Unlocks the Containment Chamber to purify corrupted Shadow Fiends. Cycle: 15s.</div>
        <div class="shop-card-meta">
          <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          Cost: 10B
        </div>
      </div>
      <button class="shop-buy-btn" data-buy-inc="2" data-cost="10000000000" ${state.essence < 10000000000 ? 'disabled' : ''}>
        Unlock
      </button>
    `;
    upgradesList.appendChild(card);
  }

  // Add normal upgrades
  Object.entries(UPGRADE_CONFIGS).forEach(([upgradeId, config]) => {
    const currentLvl = state.upgrades[upgradeId] || 0;
    const isMax = currentLvl >= config.maxLevel;
    const cost = Math.round(config.baseCost * Math.pow(config.costMultiplier, currentLvl));
    
    const card = document.createElement('div');
    card.className = 'shop-card';
    
    card.innerHTML = `
      <div class="shop-card-info" style="margin-left: 5px;">
        <div class="shop-card-name">${config.name} (${isMax ? 'MAX' : 'Lvl ' + currentLvl})</div>
        <div class="shop-card-desc" style="font-size:11px">${config.desc}</div>
        ${!isMax ? `
        <div class="shop-card-meta">
          <svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
          Upgrade: ${formatNumber(cost)}
        </div>` : '<div class="shop-card-meta" style="color:#4ebc5b">Maximum Level Reached</div>'}
      </div>
      ${!isMax ? `
      <button class="shop-buy-btn" data-upgrade="${upgradeId}" data-cost="${cost}" ${state.essence < cost ? 'disabled' : ''}>
        Level Up
      </button>` : ''}
    `;
    upgradesList.appendChild(card);
  });

  // Re-bind click listeners
  const buyUpgradesButtons = upgradesList.querySelectorAll('.shop-buy-btn');
  buyUpgradesButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const upgradeId = btn.getAttribute('data-upgrade');
      const incSlot = btn.getAttribute('data-buy-inc');
      const cost = parseFloat(btn.getAttribute('data-cost'));
      
      if (incSlot !== null) {
        if (incSlot === '0') buyIncubatorAlphaFromPedestal();
        else if (incSlot === '1') buyIncubatorBetaFromPedestal();
        else if (incSlot === '2') buyIncubatorGammaFromPedestal();
      } else {
        buyUpgrade(upgradeId, cost);
      }
    });
  });
}

function buyUpgrade(upgradeId, cost) {
  if (state.essence >= cost) {
    state.essence -= cost;
    state.upgrades[upgradeId] = (state.upgrades[upgradeId] || 0) + 1;
    
    if (audio) audio.playUnlock('COMMON');

    saveGame();
    renderShop();
    updateHUD();
  }
}

// --- BEASTOPEDIA TAB ---

function renderBeastopedia() {
  updateBeastopediaProgressBar();
  const grid = document.getElementById('beastopedia-grid');
  grid.innerHTML = '';

  const totalBeasts = Object.keys(BEAST_TEMPLATES).length;
  const unlockedCount = state.unlockedBeasts.length;
  
  document.getElementById('beastopedia-pct').innerText = `${unlockedCount} / ${totalBeasts} (${Math.round((unlockedCount/totalBeasts)*100)}%)`;

  const templates = Object.values(BEAST_TEMPLATES);
  templates.sort((a, b) => a.tier - b.tier || a.rarity.localeCompare(b.rarity));

  templates.forEach((template, index) => {
    const isUnlocked = state.unlockedBeasts.includes(template.id);
    const card = document.createElement('div');
    card.className = `beastopedia-card ${isUnlocked ? '' : 'locked'}`;
    card.setAttribute('data-id', template.id);
    
    const rarityInfo = RARITIES[template.rarity];
    const rarityColor = rarityInfo ? rarityInfo.color : '#b0c4de';
    const rarityName = rarityInfo ? rarityInfo.name : 'Common';
    
    card.innerHTML = `
      <div class="beastopedia-card-num">
        <span>#${(index + 1).toString().padStart(2, '0')}</span>
        <span class="beastopedia-card-rarity rarity-${template.rarity.toLowerCase()}" style="${template.rarity !== 'DARK_MATTER' ? `color: ${rarityColor};` : ''} font-weight: bold; font-size: 8px; text-transform: uppercase; ${isUnlocked ? '' : 'opacity: 0.45;'}">
          ${rarityName}
        </span>
      </div>
      <div class="beastopedia-card-icon">
        ${isUnlocked ? getBeastSVG(template.id, false, false) : `
          <svg viewBox="0 0 100 100" style="width:50%;height:50%">
            <text x="50" y="65" font-size="50" font-weight="bold" fill="rgba(255,255,255,0.15)" text-anchor="middle">?</text>
          </svg>
        `}
      </div>
      <div class="beastopedia-card-name">${isUnlocked ? template.name : 'Unknown'}</div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.beastopedia-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      showBeastDetailsModal(id);
    });
  });
}

function showBeastDetailsModal(beastId) {
  detailsBeastId = beastId;
  detailsStateEvolved = false;

  document.getElementById('details-toggle-base').classList.add('active');
  document.getElementById('details-toggle-evolved').classList.remove('active');

  updateDetailsModalContent();

  if (audio) audio.playClick();
  document.getElementById('details-modal').classList.add('active');
}

function updateDetailsModalContent() {
  const template = BEAST_TEMPLATES[detailsBeastId];
  if (!template) return;

  const isEvoUnlocked = state.unlockedEvolved.includes(detailsBeastId);

  const evoBtn = document.getElementById('details-toggle-evolved');
  if (isEvoUnlocked) {
    evoBtn.innerText = 'Evolved Form';
    evoBtn.disabled = false;
    evoBtn.style.opacity = '1.0';
  } else {
    evoBtn.innerText = 'Evolved (Locked)';
    evoBtn.disabled = true;
    evoBtn.style.opacity = '0.4';
    if (detailsStateEvolved) {
      detailsStateEvolved = false;
      document.getElementById('details-toggle-base').classList.add('active');
      evoBtn.classList.remove('active');
    }
  }

  const rarityLabel = document.getElementById('details-beast-rarity');
  rarityLabel.innerText = `${RARITIES[template.rarity].name} ${detailsStateEvolved ? '(Evolved)' : ''}`;
  rarityLabel.className = `unlock-beast-rarity ${template.rarity.toLowerCase()}`;

  document.getElementById('details-beast-name').innerText = `${template.name}${detailsStateEvolved ? ' (Evolved)' : ''}`;
  
  const elementLabel = ELEMENTS[template.element].name;
  const mult = detailsStateEvolved ? 3.0 : 1.0;
  const cpsText = formatNumber(template.baseCps * mult * (1.0 + state.prestigeLevel * 1.0));
  const merges = state.trophyCounts[detailsBeastId] || 0;
  
  document.getElementById('details-beast-info').innerText = 
    `Tier ${template.tier} | ${elementLabel} Element | Produces +${cpsText}/s | Merged: ${merges} times`;

  document.getElementById('details-beast-lore').innerText = template.lore;
  document.getElementById('details-beast-svg-container').innerHTML = getBeastSVG(detailsBeastId, detailsStateEvolved, false);
}

// --- SANCTUARY & TROPHY ROOMS ---

function renderSanctuary() {
  const slots = document.querySelectorAll('.sanctuary-slot-card');
  
  slots.forEach((slot, index) => {
    const beastId = state.sanctuaryBeasts[index];
    const iconContainer = slot.querySelector('.sanctuary-slot-icon');
    const emptyText = slot.querySelector('.sanctuary-slot-empty-text');
    
    if (beastId) {
      const template = BEAST_TEMPLATES[beastId];
      slot.classList.add('filled');
      emptyText.style.display = 'none';
      iconContainer.innerHTML = getBeastSVG(beastId, false, false);

      let buffDesc = getBeastPerkDescription(template);

      let nameLabel = slot.querySelector('.sanctuary-slot-name');
      if (!nameLabel) {
        nameLabel = document.createElement('div');
        nameLabel.className = 'sanctuary-slot-name';
        slot.appendChild(nameLabel);
      }
      nameLabel.innerText = template.name;

      let buffLabel = slot.querySelector('.sanctuary-slot-buff');
      if (!buffLabel) {
        buffLabel = document.createElement('div');
        buffLabel.className = 'sanctuary-slot-buff';
        slot.appendChild(buffLabel);
      }
      buffLabel.innerText = buffDesc;
    } else {
      slot.classList.remove('filled');
      emptyText.style.display = 'block';
      iconContainer.innerHTML = '';
      
      const name = slot.querySelector('.sanctuary-slot-name');
      if (name) name.remove();
      const buff = slot.querySelector('.sanctuary-slot-buff');
      if (buff) buff.remove();
    }
  });

  const trophyGrid = document.getElementById('trophy-collection-grid');
  trophyGrid.innerHTML = '';

  const rareTemplates = Object.values(BEAST_TEMPLATES).filter(b => b.rarity !== 'COMMON');
  
  rareTemplates.forEach(template => {
    const isUnlocked = state.unlockedBeasts.includes(template.id);
    if (!isUnlocked) return;

    const merges = state.trophyCounts[template.id] || 0;
    const card = document.createElement('div');
    card.className = 'trophy-card';
    
    card.innerHTML = `
      <div class="trophy-icon">
        ${getBeastSVG(template.id, false, false)}
      </div>
      <div class="trophy-name">${template.name}</div>
      <div class="trophy-rarity ${template.rarity.toLowerCase()}">${RARITIES[template.rarity].name}</div>
      <div class="trophy-stats">Collected: ${merges}</div>
    `;
    trophyGrid.appendChild(card);
  });

  if (trophyGrid.children.length === 0) {
    trophyGrid.innerHTML = `<div class="sanctuary-intro" style="grid-column: 1/-1; text-align: center; opacity: 0.5; margin-top:10px;">No rare trophies collected yet. Merge beasts to trigger mutations!</div>`;
  }
}

// --- PRESTIGE RESET LOGIC ---

function setupSettingsListeners() {
  const volRange = document.getElementById('volume-range');
  volRange.addEventListener('input', (e) => {
    if (audio) audio.setVolume(e.target.value);
  });

  const musicToggle = document.getElementById('toggle-music');
  musicToggle.addEventListener('change', (e) => {
    if (audio) audio.toggleMusic(e.target.checked);
  });

  const sfxToggle = document.getElementById('toggle-sfx');
  sfxToggle.addEventListener('change', (e) => {
    if (audio) audio.toggleSfx(e.target.checked);
  });

  const prestigeBtn = document.getElementById('prestige-btn');
  prestigeBtn.addEventListener('click', () => {
    const target = getPrestigeTarget();
    if (state.essence >= target) {
      openPrestigeSelectorModal();
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("WARNING: This will delete ALL progress, save data, unlocked beasts, and upgrades permanently. Are you sure you want to reset?")) {
      localStorage.removeItem('mystic_beasts_evolution_save');
      location.reload();
    }
  });
}

let selectedSanctuaryIds = [];

function openPrestigeSelectorModal() {
  const grid = document.getElementById('prestige-selector-grid');
  grid.innerHTML = '';
  selectedSanctuaryIds = [];

  if (state.beastsOnField.length === 0) {
    grid.innerHTML = `<div class="sanctuary-intro" style="color:#ff6b6b">You must have at least one beast on your field to ascend.</div>`;
  } else {
    const uniqueBeastTypes = [...new Set(state.beastsOnField.map(b => b.type))];

    uniqueBeastTypes.forEach(beastId => {
      const template = BEAST_TEMPLATES[beastId];
      const card = document.createElement('div');
      card.className = 'selector-card';
      card.setAttribute('data-id', beastId);
      
      card.innerHTML = `
        <div style="width: 50px; height: 50px;">
          ${getBeastSVG(beastId, false, false)}
        </div>
        <div class="selector-card-check">✓</div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.selector-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        toggleSanctuarySelector(card, id);
      });
    });
  }

  updatePrestigeConfirmBtn();

  if (audio) audio.playClick();
  document.getElementById('prestige-modal').classList.add('active');
}

function toggleSanctuarySelector(card, beastId) {
  const idx = selectedSanctuaryIds.indexOf(beastId);
  if (idx !== -1) {
    selectedSanctuaryIds.splice(idx, 1);
    card.classList.remove('selected');
  } else {
    if (selectedSanctuaryIds.length >= 3) {
      showWarning("Sanctuary Full", "You can only keep a maximum of 3 beasts in your Sanctuary!");
      return;
    }
    selectedSanctuaryIds.push(beastId);
    card.classList.add('selected');
  }

  const template = BEAST_TEMPLATES[beastId];
  if (template) {
    const infoDisplay = document.getElementById('prestige-beast-info-display');
    if (infoDisplay) {
      const rarityName = RARITIES[template.rarity].name;
      const rarityColor = RARITIES[template.rarity].color;
      const perkDesc = getBeastPerkDescription(template);
      infoDisplay.innerHTML = `
        <div style="font-weight: bold; font-size: 14px; color: ${rarityColor}; margin-bottom: 4px;">${template.name} (${rarityName})</div>
        <div style="color: #ffd43b; font-weight: 600;">Perk: ${perkDesc}</div>
      `;
    }
  }

  updatePrestigeConfirmBtn();
}

function updatePrestigeConfirmBtn() {
  const confirmBtn = document.getElementById('prestige-confirm-btn');
  const preview = document.getElementById('prestige-buff-preview');

  confirmBtn.disabled = selectedSanctuaryIds.length === 0;

  if (selectedSanctuaryIds.length === 0) {
    preview.innerText = "Select at least 1 beast to preserve in the Sanctuary";
    preview.style.color = '#ff6b6b';
  } else {
    let clickPower = 0;
    let crateSpeed = 0;
    let passiveCps = 0;
    let walkSpeed = 0;
    let rareLuck = 0;

    selectedSanctuaryIds.forEach(id => {
      const template = BEAST_TEMPLATES[id];
      if (template) {
        if (template.element === 'FIRE') clickPower += 25;
        else if (template.element === 'WATER') crateSpeed += 25;
        else if (template.element === 'EARTH') passiveCps += 25;
        else if (template.element === 'WIND') walkSpeed += 25;
        else if (['COSMIC', 'VOID', 'DEITY'].includes(template.element)) {
          rareLuck += 10;
          passiveCps += 15;
        }
      }
    });

    let buffStrings = [];
    if (clickPower > 0) buffStrings.push(`+${clickPower}% click yield`);
    if (crateSpeed > 0) buffStrings.push(`+${crateSpeed}% crate speed`);
    if (passiveCps > 0) buffStrings.push(`+${passiveCps}% passive CPS`);
    if (walkSpeed > 0) buffStrings.push(`+${walkSpeed}% walk speed`);
    if (rareLuck > 0) buffStrings.push(`+${rareLuck}% rare mutation luck`);

    preview.innerText = `Preserved Buffs: ${buffStrings.join(', ')}`;
    preview.style.color = '#4ebc5b';
  }
}

function executePrestigeAscent() {
  const target = getPrestigeTarget();
  if (state.essence < target) return;

  if (audio) audio.playPrestige();

  state.sanctuaryBeasts = [...selectedSanctuaryIds];
  state.prestigeLevel++;

  applyBiomeBg(state.prestigeLevel);

  // Clean field
  state.beastsOnField.forEach(b => b.dom.remove());
  state.beastsOnField = [];
  
  document.querySelectorAll('.essence-crystal').forEach(c => c.remove());

  state.essence = 0;

  // Reset upgrades to balance
  state.upgrades = {
    meadowCapacity: 0,
    crateSpeed: 0,
    crateQuality: 0,
    luckCharms: 0,
    autoCollector: 0,
    activeClicks: 0,
    crateAutoOpener: 0,
    essenceMagnet: 0,
    doubleMergeChance: 0
  };

  state.shopPurchases = {};
  state.lastTrashedBeast = null;
  updateTrashBinUI();

  if (particles) particles.clear();

  spawnBeastOnField('sparky', 30, 50, false, false);
  spawnBeastOnField('sparky', 60, 50, false, false);

  // Lock Incubators back to default on prestige to maintain progression cycle
  state.unlockedIncubators = [false, false, false];
  state.incubators = [
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
  ];
  
  updateIncubatorsVisibility();
  restoreIncubatorSlotUI(0);
  restoreIncubatorSlotUI(1);
  restoreIncubatorSlotUI(2);

  document.getElementById('prestige-modal').classList.remove('active');

  autoCollectTimer = 0;

  saveGame();
  renderShop();
  renderSanctuary();
  renderBeastopedia();
  updateHUD();

  // Success green checkmark icon
  const successIcon = `
    <svg viewBox="0 0 24 24" style="width:100%;height:100%;fill:#4ebc5b">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `;
  spawnToastNotification(
    "🏆 ASCENSION SUCCESSFUL!", 
    `You have ascended to Prestige Level ${state.prestigeLevel} (${BIOME_CONFIGS[Math.min(state.prestigeLevel, BIOME_CONFIGS.length-1)].name}). Permanent +100% production multiplier applied!`, 
    successIcon
  );
}

// --- HUD SPINNER TIMERS & UI ---

function setupSpawnerListeners() {
  const spawnBtn = document.getElementById('spawn-crate-btn');
  spawnBtn.addEventListener('click', () => {
    const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
    if (state.beastsOnField.length >= maxCap) {
      showWarning("Meadow Full", "Meadow is full! Clear some space first.");
      return;
    }

    if (crateQueue > 0) {
      crateQueue--;
      spawnCrateOnField();
      updateCrateQueueBadge();
    } else {
      const left = crateTimer;
      showWarning("Delivery Pending", `Waiting for crate delivery! Next free crate arrives in ${left}s.`);
    }
  });

  const trashBin = document.getElementById('trash-bin');
  if (trashBin) {
    trashBin.addEventListener('mousedown', retrieveBeastFromTrash);
    trashBin.addEventListener('touchstart', retrieveBeastFromTrash, { passive: false });
  }
}

function updateCrateQueueBadge() {
  const badge = document.getElementById('crate-badge');
  if (crateQueue > 0) {
    badge.innerText = crateQueue;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// --- SIDEBAR TAB NAVIGATORS ---

function setupSidebarTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(`content-${target}`).classList.add('active');

      if (audio) audio.playClick();
    });
  });
}

function setupModals() {
  document.getElementById('discovery-close-btn').addEventListener('click', () => {
    document.getElementById('discovery-modal').classList.remove('active');
    if (audio) audio.playClick();
  });

  document.getElementById('details-close-btn').addEventListener('click', () => {
    document.getElementById('details-modal').classList.remove('active');
    if (audio) audio.playClick();
  });

  document.getElementById('prestige-cancel-btn').addEventListener('click', () => {
    document.getElementById('prestige-modal').classList.remove('active');
    if (audio) audio.playClick();
  });

  document.getElementById('prestige-confirm-btn').addEventListener('click', () => {
    executePrestigeAscent();
  });

  document.getElementById('details-toggle-base').addEventListener('click', () => {
    detailsStateEvolved = false;
    document.getElementById('details-toggle-base').classList.add('active');
    document.getElementById('details-toggle-evolved').classList.remove('active');
    updateDetailsModalContent();
    if (audio) audio.playClick();
  });

  document.getElementById('details-toggle-evolved').addEventListener('click', () => {
    detailsStateEvolved = true;
    document.getElementById('details-toggle-evolved').classList.add('active');
    document.getElementById('details-toggle-base').classList.remove('active');
    updateDetailsModalContent();
    if (audio) audio.playClick();
  });
}

// Click-to-harvest essence from beast directly
function harvestBeastDirectClick(beast, pageX, pageY) {
  const template = BEAST_TEMPLATES[beast.type];
  if (!template || beast.infected) return;

  const evolvedMult = beast.evolved ? 3.0 : 1.0;
  const clickBaseVal = getClickMultiplier();
  // Click yield scales with click multiplier and beast's tier value
  const clickPower = Math.round(clickBaseVal * evolvedMult * Math.max(1, template.baseCps * 0.15));

  state.essence += clickPower;
  
  if (audio) audio.playClick();
  if (particles) {
    particles.spawnClick(pageX, pageY);
    // Spawn float text at click location
    spawnFloatingText(`+${formatNumber(clickPower)}`, pageX, pageY);
  }

  updateHUD();
}

// Show a beautiful modal popup summarizing offline earnings
function showOfflineEarningsPopup(earned, offlineSec) {
  const hours = Math.floor(offlineSec / 3600);
  const minutes = Math.floor((offlineSec % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Create overlay modal dynamically
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '999';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 400px; border-color: #ffd700;">
      <div class="modal-title" style="color: #ffd700; font-size: 26px;">Welcome Back!</div>
      <div class="unlock-beast-showcase" style="width: 100px; height: 100px; margin-bottom: 5px;">
        <svg viewBox="0 0 24 24" style="width: 70px; height: 70px; fill: #ffd700; filter: drop-shadow(0 0 8px rgba(255,215,0,0.6));">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
        </svg>
      </div>
      <div class="modal-desc" style="font-size: 15px; margin-bottom: 15px;">
        While you were away for <b>${timeStr}</b>,<br>your mystical beasts gathered:
      </div>
      <div style="font-family: var(--font-stats); font-size: 28px; font-weight: 800; color: #ffd43b; margin-bottom: 25px; text-shadow: 0 0 8px rgba(255, 212, 59, 0.4);">
        +${formatNumber(earned)} Essence
      </div>
      <button class="modal-btn" style="width: 100%;" id="offline-close-btn">Collect Earnings</button>
    </div>
  `;

  document.body.appendChild(overlay);

  if (audio) audio.playUnlock('RARE');

  overlay.querySelector('#offline-close-btn').addEventListener('click', () => {
    overlay.remove();
    if (audio) audio.playClick();
  });
}

// Safely removes a beast from the active field array and DOM
function removeBeastFromField(beastId) {
  const idx = state.beastsOnField.findIndex(b => b.id === beastId);
  if (idx !== -1) {
    const beast = state.beastsOnField[idx];
    if (beast.dom) {
      beast.dom.remove();
    }
    state.beastsOnField.splice(idx, 1);
  }
}

// Shows a clean inline warning toast instead of standard browser alert popup
function showWarning(title, desc) {
  const warningIcon = `
    <svg viewBox="0 0 24 24" style="width:100%;height:100%;fill:#ff6b6b;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  `;
  
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-alert';
  toast.style.borderColor = '#ff6b6b'; // Red alert border
  
  toast.innerHTML = `
    <div class="toast-icon">
      ${warningIcon}
    </div>
    <div>
      <div class="toast-title" style="color: #ff6b6b">${title}</div>
      <div style="margin-top:2px">${desc}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Returns description of a beast's sanctuary passive perk
function getBeastPerkDescription(template) {
  if (!template) return "";
  const scale = getBeastPerkScale(template);
  const fmt = val => (val * scale).toFixed(1).replace(/\.0$/, '') + '%';
  
  if (template.element === 'FIRE') return `+${fmt(25)} Click Power`;
  if (template.element === 'WATER') return `+${fmt(25)} Crate speed`;
  if (template.element === 'EARTH') return `+${fmt(25)} Passive Essence`;
  if (template.element === 'WIND') return `+${fmt(25)} Beast walk speed`;
  if (['COSMIC', 'VOID', 'DEITY'].includes(template.element)) {
    return `+${fmt(10)} Rare Mutation Luck & +${fmt(15)} Passive Essence`;
  }
  if (template.element === 'LIGHT') {
    return `+${fmt(15)} Passive Essence & +${fmt(10)} Click Power`;
  }
  return `+${fmt(25)} Element Buff`;
}

// Trashes a beast, saving it for potential undo
function trashBeast(beast) {
  const template = BEAST_TEMPLATES[beast.type];
  if (!template) return;

  state.lastTrashedBeast = {
    type: beast.type,
    evolved: beast.evolved,
    infected: beast.infected,
    deathTimer: beast.deathTimer
  };

  if (audio) audio.playClick();

  removeBeastFromField(beast.id);
  updateTrashBinUI();
  saveGame();

  showWarning("Beast Released", `Released ${template.name} into the wild! Click or drag from the bin to undo.`);
}

// Updates the trash bin UI badge and title
function updateTrashBinUI() {
  const badge = document.getElementById('trash-badge');
  const bin = document.getElementById('trash-bin');
  if (!badge || !bin) return;

  if (state.lastTrashedBeast) {
    const template = BEAST_TEMPLATES[state.lastTrashedBeast.type];
    badge.innerText = "1";
    badge.style.display = 'flex';
    bin.setAttribute('title', `Click/drag to retrieve your last trashed beast: ${template ? template.name : 'Beast'}.`);
    bin.style.borderColor = "#ff6b6b";
  } else {
    badge.style.display = 'none';
    bin.setAttribute('title', "Drag a beast here to trash it! (Bin empty)");
    bin.style.borderColor = "";
  }
}

// Retrieve a beast from the trash
function retrieveBeastFromTrash(e) {
  if (!state.lastTrashedBeast) return;

  // Verify meadow capacity
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Meadow Full", "Clear space before retrieving your beast!");
    return;
  }

  e.preventDefault();

  const restored = state.lastTrashedBeast;
  state.lastTrashedBeast = null;
  updateTrashBinUI();

  // Spawn the beast back on field. We spawn it near the bottom-center of the playground
  const beast = spawnBeastOnField(restored.type, 50, 65, restored.evolved, restored.infected, restored.deathTimer);
  if (!beast) return;

  if (audio) audio.playUnlock('COMMON');
  
  spawnToastNotification(
    "Undo Success", 
    `Retrieved your <b>${BEAST_TEMPLATES[beast.type].name}</b> from the trash!`, 
    getBeastSVG(beast.type, beast.evolved, beast.infected)
  );

  // Set as dragged beast immediately so player can drag it out
  draggedBeast = beast;
  dragElement = beast.dom;
  dragElement.classList.add('dragging');

  const rect = dragElement.getBoundingClientRect();
  dragStartX = rect.width / 2;
  dragStartY = rect.height / 2;

  // Move the beast immediately to follow pointer
  dragMove(e);
  saveGame();
}

function getMaxAllowedTier() {
  if (state.prestigeLevel >= 8) return 20; // Biome 9+ unlocks up to Tier 20
  return 6 + state.prestigeLevel;
}

function updateBeastopediaProgressBar() {
  const container = document.getElementById('dark-matter-progress-container');
  const valLabel = document.getElementById('dark-matter-progress-val');
  const bar = document.getElementById('dark-matter-progress-bar');
  
  if (!container) return;
  
  if (state.prestigeLevel >= 8) {
    container.style.display = 'flex';
    const count = state.t20MergesCount || 0;
    valLabel.innerText = `${count} / 1000 Merges`;
    const pct = Math.min((count / 1000) * 100, 100);
    bar.style.width = `${pct}%`;
  } else {
    container.style.display = 'none';
  }
}
