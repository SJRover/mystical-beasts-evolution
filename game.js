/**
 * Mystic Beasts Evolution - Main Game Logic (Polish & Outbreak Version)
 * Implements biomes, locked Incubators, infected plague loops, and unmirroring text offsets.
 */

// Global state
const state = {
  currentSolarSystem: 'prime', // 'prime' or 'low_gravity'
  autoOpenCrates: true,
  autoCrateDrops: true,
  doubleEssenceEndTime: 0,
  premiumCratesCount: 0,
  inBeastHub: false,
  beastHubBeasts: [],
  lastDailySpinDate: '',
  maxTimeSeen: 0,
  isTutorialCompleted: false,
  tutorialStage: 0,
  isResetting: false,

  essence: 0,
  prestigeLevel: 0,
  unlockedBeasts: ['sparky', 'floaty_ray'],
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
  trophyCounts: { sparky: 1, floaty_ray: 1 },
  // Dual/Triple Incubators
  incubators: [
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }, // Alpha
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }, // Beta
    { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }  // Gamma
  ],
  t20MergesCount: 0,
  lastTrashedBeast: null,
  lastSaved: Date.now(),

  primeSystem: null,
  lowGravitySystem: null
};
window.state = state;

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
    baseCost: 5000000,
    costMultiplier: 11.5,
    maxLevel: 5,
    getValue: (lvl) => 10 + lvl * 3
  },
  crateSpeed: {
    name: 'Crate Drop Rate',
    desc: 'Reduces the time between free crate spawns (-1.5s per level).',
    baseCost: 2000000,
    costMultiplier: 11.0,
    maxLevel: 6,
    getValue: (lvl) => 15 - lvl * 1.5
  },
  crateQuality: {
    name: 'Crate Enchantment',
    desc: 'Crates have a chance to contain higher-tier beasts (T2 or T3).',
    baseCost: 50000000,
    costMultiplier: 13.5,
    maxLevel: 3,
    getValue: (lvl) => lvl
  },
  luckCharms: {
    name: 'Mutation Luck Charms',
    desc: 'Increases the chance of Rare, Super, and Ultra mutations (+15% per level).',
    baseCost: 25000000,
    costMultiplier: 12.5,
    maxLevel: 5,
    getValue: (lvl) => 1.0 + lvl * 0.15
  },
  autoCollector: {
    name: 'Essence Vacuum',
    desc: 'Automatically sweeps essence crystals from the ground instantly and silently.',
    baseCost: 12000000,
    costMultiplier: 12.5,
    maxLevel: 3,
    getValue: (lvl) => [Infinity, 4000, 2500, 1000][lvl] // ms intervals
  },
  activeClicks: {
    name: 'Active Core Click',
    desc: 'Increases the essence generated when tapping beasts directly.',
    baseCost: 1200000,
    costMultiplier: 11.5,
    maxLevel: 5,
    getValue: (lvl) => [1, 3, 8, 20, 50, 150][lvl]
  },
  crateAutoOpener: {
    name: 'Crate Auto-Opener',
    desc: 'Crates open automatically after sitting on the field (20s down to 5s).',
    baseCost: 15000000,
    costMultiplier: 12.0,
    maxLevel: 3,
    getValue: (lvl) => [20, 15, 10, 5][lvl]
  },
  essenceMagnet: {
    name: 'Essence Magnet',
    desc: 'Expands the hover detection radius for vacuuming essence crystals.',
    baseCost: 6000000,
    costMultiplier: 11.5,
    maxLevel: 3,
    getValue: (lvl) => [40, 80, 140, 220][lvl] // pixels radius
  },
  doubleMergeChance: {
    name: 'Double Evolution',
    desc: 'Merged beasts have a chance to evolve two tiers up at once (+5% per level).',
    baseCost: 35000000,
    costMultiplier: 13.5,
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

const LOW_GRAVITY_BIOME_CONFIGS = [
  { name: 'Methane River', theme: 'biome-0' },
  { name: 'Iron Core', theme: 'biome-1' },
  { name: 'Helium Canopy', theme: 'biome-2' },
  { name: 'Ammonia Clouds', theme: 'biome-3' },
  { name: 'Carbon Frost', theme: 'biome-4' },
  { name: 'Nebula Shroud', theme: 'biome-5' },
  { name: 'Plasma Ocean', theme: 'biome-6' },
  { name: 'Dark Energy Void', theme: 'biome-7' },
  { name: 'Antimatter Abyss', theme: 'biome-8' },
  { name: 'Gravitational Core', theme: 'biome-9' },
  { name: 'Hypernova Plain', theme: 'biome-10' },
  { name: 'Quantum Singularity', theme: 'biome-11' }
];

function getActiveBiomes() {
  return state.currentSolarSystem === 'low_gravity' ? LOW_GRAVITY_BIOME_CONFIGS : BIOME_CONFIGS;
}

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

// Cached playground dimensions to prevent layout thrashing inside gameLoop
let playgroundRect = { left: 0, top: 0, width: 0, height: 0 };
let gameLoopFrameCount = 0;

function updatePlaygroundRect() {
  const playground = document.getElementById('beast-playground');
  if (playground) {
    const rect = playground.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      playgroundRect = rect;
    }
  }
}

// Init game
window.addEventListener('DOMContentLoaded', () => {
  updatePlaygroundRect();
  window.addEventListener('resize', updatePlaygroundRect);

  // Initialize App Store purchases if on mobile native platform
  document.addEventListener('deviceready', () => {
    console.log("StoreKit: deviceready event received");
    initStoreKit();
  });

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
  setupDailySpin();
  setupBeastHub();
  setupSanctuaryFilters();
  
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
  if (state.isResetting) return;
  state.maxTimeSeen = Math.max(state.maxTimeSeen || 0, Date.now());
  state.lastSaved = Date.now();
  
  // Serialize active beasts
  const savedBeasts = state.beastsOnField.map(b => ({
    type: b.type,
    x: b.x,
    y: b.y,
    evolved: b.evolved || false,
    infected: b.infected || false,
    deathTimer: b.deathTimer || 45.0
  }));

  const activeBranch = {
    essence: state.essence,
    prestigeLevel: state.prestigeLevel,
    shopPurchases: state.shopPurchases,
    unlockedIncubators: state.unlockedIncubators,
    upgrades: state.upgrades,
    incubators: state.incubators,
    beastsOnField: savedBeasts
  };

  if (state.currentSolarSystem === 'prime') {
    state.primeSystem = activeBranch;
  } else {
    state.lowGravitySystem = activeBranch;
  }

  const saveData = {
    currentSolarSystem: state.currentSolarSystem,
    autoOpenCrates: state.autoOpenCrates,
    autoCrateDrops: state.autoCrateDrops,
    doubleEssenceEndTime: state.doubleEssenceEndTime,
    premiumCratesCount: state.premiumCratesCount,
    unlockedBeasts: state.unlockedBeasts,
    unlockedEvolved: state.unlockedEvolved || [],
    sanctuaryBeasts: state.sanctuaryBeasts,
    trophyCounts: state.trophyCounts,
    t20MergesCount: state.t20MergesCount || 0,
    lastTrashedBeast: state.lastTrashedBeast,
    lastSaved: state.lastSaved,
    primeSystem: state.primeSystem,
    lowGravitySystem: state.lowGravitySystem,
    inBeastHub: state.inBeastHub,
    beastHubBeasts: state.beastHubBeasts,
    lastDailySpinDate: state.lastDailySpinDate,
    maxTimeSeen: state.maxTimeSeen,
    isTutorialCompleted: state.isTutorialCompleted
  };

  localStorage.setItem('mystic_beasts_evolution_save', JSON.stringify(saveData));
}

// Load game
function loadGame() {
  const data = localStorage.getItem('mystic_beasts_evolution_save');

  if (!data) {
    state.currentSolarSystem = 'prime';
    state.primeSystem = {
      essence: 0,
      prestigeLevel: 0,
      shopPurchases: {},
      unlockedIncubators: [false, false, false],
      upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
      incubators: [
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
      ],
      beastsOnField: [
        { type: 'sparky', x: 30, y: 50, evolved: false, infected: false, deathTimer: 45.0 },
        { type: 'sparky', x: 60, y: 50, evolved: false, infected: false, deathTimer: 45.0 }
      ]
    };
    state.lowGravitySystem = {
      essence: 0,
      prestigeLevel: 0,
      shopPurchases: {},
      unlockedIncubators: [false, false, false],
      upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
      incubators: [
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
        { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
      ],
      beastsOnField: [
        { type: 'floaty_ray', x: 30, y: 50, evolved: false, infected: false, deathTimer: 45.0 },
        { type: 'floaty_ray', x: 60, y: 50, evolved: false, infected: false, deathTimer: 45.0 }
      ]
    };
    
    // Load defaults to active
    state.essence = state.primeSystem.essence;
    state.prestigeLevel = state.primeSystem.prestigeLevel;
    state.shopPurchases = state.primeSystem.shopPurchases;
    state.unlockedIncubators = state.primeSystem.unlockedIncubators;
    state.upgrades = state.primeSystem.upgrades;
    state.incubators = state.primeSystem.incubators;
    
    applyBiomeBg(state.prestigeLevel);
    
    if (!state.isTutorialCompleted) {
      state.beastsOnField = [];
      setTimeout(() => {
        showTutorialStep(0);
      }, 1000);
    } else {
      state.primeSystem.beastsOnField.forEach(b => {
        spawnBeastOnField(b.type, b.x, b.y, b.evolved, b.infected, b.deathTimer);
      });
    }
    return;
  }

  try {
    const saveData = JSON.parse(data);
    state.currentSolarSystem = saveData.currentSolarSystem || 'prime';
    state.autoOpenCrates = typeof saveData.autoOpenCrates !== 'undefined' ? saveData.autoOpenCrates : true;
    state.autoCrateDrops = typeof saveData.autoCrateDrops !== 'undefined' ? saveData.autoCrateDrops : true;
    state.doubleEssenceEndTime = saveData.doubleEssenceEndTime || 0;
    state.premiumCratesCount = saveData.premiumCratesCount || 0;
    state.unlockedBeasts = saveData.unlockedBeasts || ['sparky', 'floaty_ray'];
    state.unlockedEvolved = saveData.unlockedEvolved || [];
    state.sanctuaryBeasts = saveData.sanctuaryBeasts || [];
    state.trophyCounts = saveData.trophyCounts || { sparky: 1, floaty_ray: 1 };
    state.t20MergesCount = saveData.t20MergesCount || 0;
    state.lastTrashedBeast = saveData.lastTrashedBeast || null;
    state.lastSaved = saveData.lastSaved || Date.now();
    state.inBeastHub = saveData.inBeastHub || false;
    state.beastHubBeasts = saveData.beastHubBeasts || [];
    state.lastDailySpinDate = saveData.lastDailySpinDate || '';
    state.maxTimeSeen = saveData.maxTimeSeen || 0;
    state.isTutorialCompleted = typeof saveData.isTutorialCompleted !== 'undefined' ? saveData.isTutorialCompleted : false;

    // Map Prime System
    if (saveData.primeSystem) {
      state.primeSystem = saveData.primeSystem;
    } else {
      state.primeSystem = {
        essence: saveData.essence || 0,
        prestigeLevel: saveData.prestigeLevel || 0,
        shopPurchases: saveData.shopPurchases || {},
        unlockedIncubators: Array.isArray(saveData.unlockedIncubators) ? saveData.unlockedIncubators : [!!saveData.unlockedIncubators, false, false],
        upgrades: saveData.upgrades || {},
        incubators: saveData.incubators || [],
        beastsOnField: saveData.beastsOnField || []
      };
    }

    // Map Low Gravity System
    if (saveData.lowGravitySystem) {
      state.lowGravitySystem = saveData.lowGravitySystem;
    } else {
      state.lowGravitySystem = {
        essence: 0,
        prestigeLevel: 0,
        shopPurchases: {},
        unlockedIncubators: [false, false, false],
        upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
        incubators: [
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
        ],
        beastsOnField: [
          { type: 'floaty_ray', x: 30, y: 50, evolved: false, infected: false, deathTimer: 45.0 },
          { type: 'floaty_ray', x: 60, y: 50, evolved: false, infected: false, deathTimer: 45.0 }
        ]
      };
    }

    // Load active variables
    const activeSys = state.currentSolarSystem === 'prime' ? state.primeSystem : state.lowGravitySystem;
    state.essence = activeSys.essence;
    state.prestigeLevel = activeSys.prestigeLevel;
    state.shopPurchases = activeSys.shopPurchases;
    state.unlockedIncubators = activeSys.unlockedIncubators;
    state.upgrades = activeSys.upgrades;
    state.incubators = activeSys.incubators;

    applyBiomeBg(state.prestigeLevel);

    // Spawn saved active beasts or Hub beasts
    if (state.inBeastHub) {
      if (state.beastHubBeasts && state.beastHubBeasts.length > 0) {
        state.beastHubBeasts.forEach(b => {
          spawnBeastOnField(b.type, b.x, b.y, b.evolved || false, b.infected || false);
        });
      } else {
        spawnBeastOnField(state.currentSolarSystem === 'prime' ? 'sparky' : 'floaty_ray', 50, 50, false, false);
      }
      document.getElementById('game-container').className = 'game-container biome-hub';
      const hubControls = document.getElementById('hub-controls');
      if (hubControls) hubControls.style.display = 'flex';
    } else {
      if (!state.isTutorialCompleted) {
        state.beastsOnField = [];
      } else if (activeSys.beastsOnField && activeSys.beastsOnField.length > 0) {
        activeSys.beastsOnField.forEach(b => {
          spawnBeastOnField(b.type, b.x, b.y, b.evolved, b.infected, b.deathTimer);
        });
      } else {
        if (state.currentSolarSystem === 'prime') {
          spawnBeastOnField('sparky', 30, 50, false, false);
        } else {
          spawnBeastOnField('floaty_ray', 30, 50, false, false);
        }
      }
    }

    // Refresh UI checkboxes
    const autoOpenToggle = document.getElementById('toggle-auto-open');
    if (autoOpenToggle) autoOpenToggle.checked = state.autoOpenCrates;
    const autoDropsToggle = document.getElementById('toggle-auto-drops');
    if (autoDropsToggle) autoDropsToggle.checked = state.autoCrateDrops;

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
      
      let boostedSeconds = 0;
      const boostTimeRemaining = Math.max(0, state.doubleEssenceEndTime - state.lastSaved);
      if (boostTimeRemaining > 0) {
        boostedSeconds = Math.min(offlineSec, Math.floor(boostTimeRemaining / 1000));
      }
      const unboostedSeconds = offlineSec - boostedSeconds;
      const earned = baseCps * unboostedSeconds + (baseCps * boostedSeconds * 2);

      if (earned > 0) {
        state.essence += earned;
        setTimeout(() => {
          showOfflineEarningsPopup(earned, offlineSec);
        }, 800);
      }
    }
    if (!state.isTutorialCompleted) {
      state.essence = 0;
      state.prestigeLevel = 0;
      state.shopPurchases = {};
      state.unlockedIncubators = [false, false, false];
      state.upgrades = { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 };
      state.unlockedBeasts = ['sparky', 'floaty_ray'];
      state.unlockedEvolved = [];
      state.sanctuaryBeasts = [];
      state.trophyCounts = { sparky: 1, floaty_ray: 1 };
      state.t20MergesCount = 0;
      state.premiumCratesCount = 0;
      state.doubleEssenceEndTime = 0;
      state.beastsOnField = [];

      state.primeSystem = {
        essence: 0,
        prestigeLevel: 0,
        shopPurchases: {},
        unlockedIncubators: [false, false, false],
        upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
        incubators: [
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
        ],
        beastsOnField: []
      };
      state.lowGravitySystem = {
        essence: 0,
        prestigeLevel: 0,
        shopPurchases: {},
        unlockedIncubators: [false, false, false],
        upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
        incubators: [
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
        ],
        beastsOnField: []
      };

      updateHUD();
      renderShop();
      renderBeastopedia();
      renderSanctuary();

      setTimeout(() => {
        showTutorialStep(0);
      }, 1000);
    }
  } catch (e) {
    console.error("Failed to load save:", e);
    spawnBeastOnField(state.currentSolarSystem === 'prime' ? 'sparky' : 'floaty_ray', 30, 50, false, false);
  }
}

// Updates locks in HTML
function updateIncubatorsVisibility() {
  const ped1 = document.getElementById('incubator-pedestal');
  const ped2 = document.getElementById('incubator-pedestal-2');
  const ped3 = document.getElementById('incubator-pedestal-3');

  if (state.inBeastHub) {
    if (ped1) ped1.style.display = 'none';
    if (ped2) ped2.style.display = 'none';
    if (ped3) ped3.style.display = 'none';
    return;
  }

  if (ped1) ped1.style.display = 'flex';
  const lock1 = document.getElementById('incubator-1-lock');
  const lock2 = document.getElementById('incubator-2-lock');
  const lock3 = document.getElementById('incubator-3-lock');

  // Alpha
  if (state.unlockedIncubators[0]) {
    if (lock1) lock1.style.display = 'none';
  } else {
    if (lock1) lock1.style.display = 'flex';
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
// Applies dynamic biome themes
function applyBiomeBg(prestigeLevel) {
  const bg = document.getElementById('meadow-bg');
  if (!bg) return;
  bg.className = '';

  if (state.inBeastHub) {
    bg.classList.add('biome-hub');
    if (audio) {
      try {
        audio.changeBiomeMusic(4); // Play space music (Cosmic track)
      } catch (e) {
        console.error('Audio hub transition failed:', e);
      }
    }
    // Clear space background decorations
    const container = document.getElementById('biome-decoration-layer');
    if (container) container.innerHTML = '';
    return;
  }

  const activeBiomes = getActiveBiomes();
  const idx = Math.min(prestigeLevel, activeBiomes.length - 1);
  bg.classList.add(activeBiomes[idx].theme);

  if (state.currentSolarSystem === 'low_gravity') {
    bg.classList.add('low-gravity');
  }

  // Update generative music dynamically to match the theme of the new biome
  if (audio) {
    try {
      audio.changeBiomeMusic(idx);
    } catch (e) {
      console.error('Audio biome transition failed:', e);
    }
  }

  // Render space background decorations if in low_gravity system
  renderSpaceBackground(idx);
}

// Renders GPU-accelerated stars, galaxies, and meteorites in the background
function renderSpaceBackground(biomeIndex) {
  const container = document.getElementById('biome-decoration-layer');
  if (!container) return;
  container.innerHTML = '';

  if (state.currentSolarSystem !== 'low_gravity') {
    return; // Only space biomes get this night sky
  }

  let html = '';

  // Twinkling stars
  const starsCount = 35;
  for (let i = 0; i < starsCount; i++) {
    const left = (Math.random() * 100).toFixed(2);
    const top = (Math.random() * 70).toFixed(2);
    const size = (Math.random() * 2 + 1).toFixed(1);
    const delay = (Math.random() * 5).toFixed(2);
    const duration = (Math.random() * 3 + 2).toFixed(2);
    const op = (Math.random() * 0.4 + 0.4).toFixed(2);
    html += `<div class="space-star" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; opacity: ${op}; animation: space-twinkle ${duration}s ease-in-out infinite alternate; animation-delay: ${delay}s;"></div>`;
  }

  // Shooting stars
  const shootingStarsCount = 3;
  for (let i = 0; i < shootingStarsCount; i++) {
    const left = (Math.random() * 60 + 20).toFixed(2);
    const top = (Math.random() * 30 + 5).toFixed(2);
    const delay = (Math.random() * 15).toFixed(2);
    const duration = (Math.random() * 4 + 3).toFixed(2);
    html += `<div class="space-shooting-star" style="left: ${left}%; top: ${top}%; animation: space-shooting ${duration}s linear infinite; animation-delay: ${delay}s;"></div>`;
  }

  // Meteorites
  const meteoritesCount = 2;
  for (let i = 0; i < meteoritesCount; i++) {
    const left = (Math.random() * 90).toFixed(2);
    const top = (Math.random() * 40 + 10).toFixed(2);
    const size = (Math.random() * 15 + 10).toFixed(0);
    const delay = (Math.random() * -20).toFixed(2); // Negative delay to start immediately
    const duration = (Math.random() * 40 + 40).toFixed(0);
    html += `
      <div class="space-meteorite" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation: space-meteor-drift ${duration}s linear infinite; animation-delay: ${delay}s;">
        <svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#2d2d35; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <path d="M12 2L4 6l-2 6 3 7 7 3 8-4 2-6-3-8z" fill="#202025" />
          <path d="M12 2l4 2 2 6-3 8-7 3-3-7-2-6z" fill="#2d2d35" />
          <circle cx="8" cy="8" r="1.5" fill="#1b1b22" />
          <circle cx="15" cy="12" r="2" fill="#1b1b22" />
          <circle cx="11" cy="16" r="1.2" fill="#1b1b22" />
        </svg>
      </div>
    `;
  }

  // Spinning galaxies
  const galaxiesCount = 2;
  for (let i = 0; i < galaxiesCount; i++) {
    const left = (i === 0 ? Math.random() * 25 + 10 : Math.random() * 25 + 65).toFixed(2);
    const top = (Math.random() * 25 + 10).toFixed(2);
    const size = (Math.random() * 40 + 60).toFixed(0);
    const duration = (Math.random() * 60 + 60).toFixed(0);
    const rot = (Math.random() * 360).toFixed(0);

    html += `
      <div class="space-galaxy-container" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; transform: rotate(${rot}deg);">
        <svg class="space-galaxy" viewBox="0 0 100 100" style="animation: space-galaxy-spin ${duration}s linear infinite; width:100%; height:100%;">
          <defs>
            <radialGradient id="galaxy-grad-${biomeIndex}-${i}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--space-glow)" stop-opacity="1" />
              <stop offset="25%" stop-color="var(--space-core)" stop-opacity="0.8" />
              <stop offset="60%" stop-color="var(--space-arms)" stop-opacity="0.35" />
              <stop offset="100%" stop-color="var(--space-arms)" stop-opacity="0" />
            </radialGradient>
          </defs>
          <!-- Spiral Arm 1 -->
          <path d="M 50 50 Q 65 35 80 50 T 50 80 Q 25 75 35 60 T 50 50" fill="none" stroke="url(#galaxy-grad-${biomeIndex}-${i})" stroke-width="6" stroke-linecap="round" opacity="0.7" />
          <!-- Spiral Arm 2 -->
          <path d="M 50 50 Q 35 65 20 50 T 50 20 Q 75 25 65 40 T 50 50" fill="none" stroke="url(#galaxy-grad-${biomeIndex}-${i})" stroke-width="6" stroke-linecap="round" opacity="0.7" />
          <!-- Center core -->
          <circle cx="50" cy="50" r="8" fill="var(--space-glow)" />
        </svg>
      </div>
    `;
  }

  container.innerHTML = html;
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
  container.style.left = '0px';
  container.style.top = '0px';

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
  if (template.system === 'low_gravity') {
    const svgEl = container.querySelector('.beast-svg');
    if (svgEl) svgEl.classList.add('anim-float');
  }

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
  
  if (isBossBeast(beastId)) {
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
  if (beastId === 'shadow_fiend' || beastId === 'void_parasite') {
    speed = 0.8 + Math.random() * 0.4;
  } else if (beastId === 'shadow_fiend_evolved' || beastId === 'void_parasite_evolved') {
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

  // Flip unmirroring & positioning
  const w = playgroundRect.width || 800;
  const h = playgroundRect.height || 600;
  const pxX = (x / 100) * w;
  const pxY = (y / 100) * h;
  container.style.transform = `translate3d(${pxX}px, ${pxY}px, 0) scaleX(${beast.direction < 0 ? -1 : 1})`;
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
  container.style.top = `${landY}%`;
  // Start offscreen high above with a slight squash/stretch scale
  container.style.transform = 'translateY(-100vh) scaleY(1.3)';
  container.style.opacity = '0';
  
  container.setAttribute('data-spawned-at', Date.now());
  container.setAttribute('data-land-x', landX);
  container.setAttribute('data-land-y', landY);

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

  // Force reflow
  void container.offsetWidth;

  // Apply smooth drop transition using transform (compositor thread)
  container.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease-out';
  container.style.transform = 'translateY(0) scaleY(1)';
  container.style.opacity = '1';

  // Listen for transition end to apply shake effect and spawn collision particles
  container.addEventListener('transitionend', function onFallEnd(e) {
    if (e.propertyName === 'transform') {
      container.removeEventListener('transitionend', onFallEnd);
      container.style.transition = ''; // reset transition
      container.classList.add('shake');
      if (particles) {
        const absolutePos = getAbsolutePosition(landX, landY);
        particles.spawnClick(absolutePos.x, absolutePos.y);
      }
    }
  });
  
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    openCrate(instanceId, landX, landY);
  });
}

function getHighestUnlockedTier() {
  let highest = 1;
  const currentSys = state.currentSolarSystem || 'prime';
  state.unlockedBeasts.forEach(id => {
    const template = BEAST_TEMPLATES[id];
    if (template && (template.system || 'prime') === currentSys) {
      if (template.tier > highest) {
        highest = template.tier;
      }
    }
  });
  return highest;
}

// Helper to calculate the mean tier of active beasts on the field (including active incubators)
function getMeanTierOnField() {
  let count = state.beastsOnField.length;
  let sum = 0;
  
  state.beastsOnField.forEach(b => {
    const template = BEAST_TEMPLATES[b.type];
    if (template) sum += template.tier;
  });
  
  // Include beasts currently in incubators
  state.incubators.forEach(inc => {
    if (inc.active && inc.beastType) {
      const template = BEAST_TEMPLATES[inc.beastType];
      if (template) {
        sum += template.tier;
        count++;
      }
    }
  });

  if (count === 0) return 1;
  return sum / count;
}

// Opens crate (with 8% plague infection chance starting at prestige 3)
function openCrate(crateId, x, y) {
  if (!state.isTutorialCompleted) {
    if (state.tutorialStage !== 1) {
      return;
    }
  }
  const maxCap = state.inBeastHub ? 25 : UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Meadow Full", "Meadow is full! Clear some space first.");
    return;
  }

  const dom = document.getElementById(crateId);
  if (!dom) return;

  dom.remove();

  // Shadow enemy spawn check (Biome 6+)
  if (state.prestigeLevel >= 5) {
    const enemyChance = 0.01 + (state.prestigeLevel - 5) * 0.005;
    if (Math.random() <= enemyChance) {
      const bossId = state.currentSolarSystem === 'low_gravity' ? 'void_parasite' : 'shadow_fiend';
      spawnBeastOnField(bossId, x, y, false, false);
      if (audio) audio.playUnlock('ULTRA_RARE');
      spawnToastNotification(
        '🚨 SHADOW BREED!',
        `A corrupted <b>${BEAST_TEMPLATES[bossId].name}</b> has breached the meadow! Drag it to the Trash Bin or Containment Chamber!`,
        getBeastSVG(bossId, false, false)
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
  
  // Tiers 3 to 6 below the mean, chosen uniformly
  const roundedMean = Math.round(getMeanTierOnField());
  const possibleOffsets = [3, 4, 5, 6];
  const chosenOffset = possibleOffsets[Math.floor(Math.random() * possibleOffsets.length)];
  const meanScaledTier = Math.max(1, roundedMean - chosenOffset);

  let upgradeTier = 1;
  if (lvl === 1) {
    if (roll < 0.3) upgradeTier = 2;
  } else if (lvl === 2) {
    if (roll < 0.1) upgradeTier = 3;
    else if (roll < 0.4) upgradeTier = 2;
  } else if (lvl >= 3) {
    if (roll < 0.25) upgradeTier = 3;
    else if (roll < 0.6) upgradeTier = 2;
  }

  // The actual tier is the max of the mean-scaled tier and the upgrade-based tier
  const targetTier = Math.max(meanScaledTier, upgradeTier);

  const allowedMaxTier = getMaxAllowedTier();
  const actualTier = Math.min(targetTier, allowedMaxTier);

  const currentSys = state.currentSolarSystem || 'prime';
  
  // Get all templates of actualTier in current system
  const allOfTier = Object.values(BEAST_TEMPLATES).filter(b => {
    const bSys = b.system || 'prime';
    return b.tier === actualTier && bSys === currentSys && !isBossBeast(b.id);
  });

  const commonTemplates = allOfTier.filter(b => b.rarity === 'COMMON');
  const mutantTemplates = allOfTier.filter(b => b.rarity !== 'COMMON');

  let chosenTemplate = null;
  // Super low chance (2%) of a rarer mutant
  if (mutantTemplates.length > 0 && Math.random() < 0.02) {
    chosenTemplate = mutantTemplates[Math.floor(Math.random() * mutantTemplates.length)];
  } else {
    chosenTemplate = commonTemplates[Math.floor(Math.random() * commonTemplates.length)] || commonTemplates[0];
  }

  // Fallback if no matching beast
  if (!chosenTemplate) {
    const defaultBeast = currentSys === 'prime' ? BEAST_TEMPLATES.sparky : BEAST_TEMPLATES.floaty_ray;
    chosenTemplate = allOfTier[Math.floor(Math.random() * allOfTier.length)] || defaultBeast;
  }

  // Play mutation unlock sound and show toast if rarer mutant hatched
  if (chosenTemplate.rarity !== 'COMMON') {
    if (audio) {
      if (['GODLY', 'DARK_MATTER'].includes(chosenTemplate.rarity)) {
        audio.playUnlock('GODLY');
      } else if (['ULTRA_RARE', 'LEGENDARY'].includes(chosenTemplate.rarity)) {
        audio.playUnlock('ULTRA_RARE');
      } else {
        audio.playUnlock(chosenTemplate.rarity);
      }
    }
    spawnToastNotification(
      '🌟 RARE MUTATION HATCH!',
      `Directly hatched a ${RARITIES[chosenTemplate.rarity].name} <b>${chosenTemplate.name}</b> from a normal crate!`,
      getBeastSVG(chosenTemplate.id, false, false)
    );
  }

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

  if (!state.isTutorialCompleted) {
    if (state.tutorialStage === 1) {
      const remainingCrates = document.querySelectorAll('.crate-container').length;
      if (remainingCrates === 0) {
        state.tutorialStage = 2;
        updateTutorialStage();
      }
    }
  }
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

  toast.addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 400);
    }
  }, 6000);
}

// Convert coordinates pct to absolute px using cached rect
function getAbsolutePosition(pctX, pctY) {
  return {
    x: playgroundRect.left + (pctX / 100) * playgroundRect.width,
    y: playgroundRect.top + (pctY / 100) * playgroundRect.height
  };
}

// Main 60fps Game Loop
function gameLoop() {
  const now = Date.now();
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  gameLoopFrameCount++;
  if (playgroundRect.width === 0 || gameLoopFrameCount % 30 === 0) {
    updatePlaygroundRect();
  }

  // Use cached dimensions to completely eliminate layout thrashing
  const width = playgroundRect.width || 800;
  const height = playgroundRect.height || 600;

  // 1. Move and update active beasts on field
  for (let i = state.beastsOnField.length - 1; i >= 0; i--) {
    const b = state.beastsOnField[i];
    
    // Wander direction changes
    if (now > b.lastWalkChange) {
      const angle = Math.random() * Math.PI * 2;
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      b.direction = b.vx > 0 ? 1 : -1;
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) {
        tagEl.style.transform = b.direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      }
      
      b.lastWalkChange = now + 1500 + Math.random() * 3000;
    }

    // Move in percentage space using cached dimensions
    const pctVx = (b.vx / width) * 100 * 60 * dt;
    const pctVy = (b.vy / height) * 100 * 60 * dt;

    b.x += pctVx;
    b.y += pctVy;

    // Restricted boundaries to keep beasts inside screen and clear of top HUD / bottom spawner
    const paddingXMin = 5;
    const paddingXMax = 82;
    const paddingYMin = 14;
    const paddingYMax = 55;

    if (b.x < paddingXMin) { 
      b.x = paddingXMin; b.vx *= -1; b.direction = 1; 
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) tagEl.style.transform = 'scaleX(1)';
    }
    if (b.x > paddingXMax) { 
      b.x = paddingXMax; b.vx *= -1; b.direction = -1; 
      const tagEl = b.dom.querySelector('.beast-tag');
      if (tagEl) tagEl.style.transform = 'scaleX(-1)';
    }
    if (b.y < paddingYMin) { b.y = paddingYMin; b.vy *= -1; }
    if (b.y > paddingYMax) { b.y = paddingYMax; b.vy *= -1; }

    if (draggedBeast !== b) {
      const pxX = (b.x / 100) * width;
      const pxY = (b.y / 100) * height;
      b.dom.style.transform = `translate3d(${pxX}px, ${pxY}px, 0) scaleX(${b.direction < 0 ? -1 : 1})`;
    }

    // Drop crystals (Infected beasts and shadow enemies drop nothing!)
    if (!b.infected && !isBossBeast(b.type)) {
      b.orbTimer += dt * 1000;
      if (b.orbTimer >= 12000) {
        b.orbTimer = 0;
        dropEssenceCrystalOnGround(b.type, b.x, b.y, b.evolved);
      }
    }

    // SHADOW ENEMY ATTACK & DEVOUR TICK
    if (isBossBeast(b.type)) {
      if (typeof b.attackCooldown === 'undefined') {
        b.attackCooldown = (b.type === 'shadow_fiend' || b.type === 'void_parasite') ? 6.0 : 3.0;
      }
      b.attackCooldown -= dt;
      if (b.attackCooldown <= 0) {
        let closestFriendly = null;
        let minDist = Infinity;
        
        state.beastsOnField.forEach(other => {
          if (other.id !== b.id && !isBossBeast(other.type)) {
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
              `A <b>${BEAST_TEMPLATES[b.type].name}</b> devoured your friendly <b>${victimName}</b>!`,
              getBeastSVG(b.type, false, false)
            );
            saveGame();
          }
          b.attackCooldown = (b.type === 'shadow_fiend' || b.type === 'void_parasite') ? 6.0 : 3.0;
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
          if (other.id !== b.id && !other.infected && !isBossBeast(other.type)) {
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

  let value = parseFloat(crystal.getAttribute('data-value'));
  if (isBoostActive()) {
    value *= 2;
  }
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
  state.maxTimeSeen = Math.max(state.maxTimeSeen || 0, Date.now());
  let cps = state.inBeastHub ? 0 : calculateTotalCps();
  if (isBoostActive() && !state.inBeastHub) {
    cps *= 2;
  }
  state.essence += cps;

  if (Math.floor(Date.now() / 1000) % 10 === 0) {
    saveGame();
  }

  // Crate timers
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  
  if (state.beastsOnField.length < maxCap && !state.inBeastHub) {
    crateTimer--;
    if (crateTimer <= 0) {
      if (state.autoCrateDrops) {
        spawnCrateOnField();
      } else {
        if (crateQueue < 5) {
          crateQueue++;
          updateCrateQueueBadge();
          if (audio) audio.playClick();
        }
      }
      crateTimer = Math.round(getCrateCooldown());
    }
  } else {
    crateTimer = Math.round(getCrateCooldown());
  }

  // Auto drop queued crates if space becomes available and autoCrateDrops is ON
  if (state.autoCrateDrops && !state.inBeastHub) {
    while (crateQueue > 0 && state.beastsOnField.length < maxCap) {
      crateQueue--;
      spawnCrateOnField();
      updateCrateQueueBadge();
    }
  }

  if (!state.inBeastHub) {
    checkAutoOpenCrates();
  }
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
  if (!state.upgrades.crateAutoOpener || state.upgrades.crateAutoOpener === 0) return;
  if (state.autoOpenCrates === false) return;
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

  const shopTitleEl = document.querySelector('#content-shop .shop-section-title');
  if (shopTitleEl) {
    shopTitleEl.innerHTML = state.inBeastHub ? 'Hub Spawner' : `Mystic Beasts <span style="color:#ffd43b; font-size:13px; margin-left:8px; font-weight:normal;">(Balance: ${formatNumber(state.essence)} Essence)</span>`;
  }

  const cpsDisplay = document.getElementById('cps-display');
  let currentCps = calculateTotalCps();
  if (isBoostActive()) {
    currentCps *= 2;
  }
  cpsDisplay.innerText = formatNumber(currentCps);

  const countDisplay = document.getElementById('beast-count');
  countDisplay.innerText = state.beastsOnField.length;

  const capDisplay = document.getElementById('max-capacity');
  const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  capDisplay.innerText = maxCap;

  const target = getPrestigeTarget();
  const progressPercent = Math.min((state.essence / target) * 100, 100);
  
  const pctEl = document.getElementById('prestige-progress-pct');
  if (progressPercent >= 100) {
    pctEl.innerText = 'Ready to Ascend!';
    pctEl.classList.add('ready-pulse');
  } else {
    pctEl.innerText = `${Math.floor(progressPercent)}%`;
    pctEl.classList.remove('ready-pulse');
  }
  document.getElementById('prestige-progress-bar').style.width = `${progressPercent}%`;

  const prestigeBtn = document.getElementById('prestige-btn');
  if (prestigeBtn) {
    prestigeBtn.disabled = state.essence < target;
  }

  const multDisplay = document.getElementById('multiplier-display');
  const prestigeMult = 1.0 + state.prestigeLevel * 1.0;
  multDisplay.innerText = `Essence Multiplier: ${prestigeMult.toFixed(1)}x`;

  // Update double essence timer badge
  const doubleEssenceEl = document.getElementById('double-essence-timer');
  if (doubleEssenceEl) {
    if (isBoostActive()) {
      const remainingMs = state.doubleEssenceEndTime - Date.now();
      const remainingSecTotal = Math.max(0, Math.floor(remainingMs / 1000));
      const hours = Math.floor(remainingSecTotal / 3600);
      const minutes = Math.floor((remainingSecTotal % 3600) / 60);
      const seconds = remainingSecTotal % 60;
      
      let timeStr = '';
      if (hours > 0) {
        timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      doubleEssenceEl.innerText = `x2 Active: ${timeStr}`;
      doubleEssenceEl.style.display = 'block';
    } else {
      doubleEssenceEl.style.display = 'none';
    }
  }

  // Update active biome in settings tab
  const activeBiomes = getActiveBiomes();
  const biomeIdx = Math.min(state.prestigeLevel, activeBiomes.length - 1);
  const activeBiomeName = activeBiomes[biomeIdx].name;
  const settingsBiomeEl = document.getElementById('settings-active-biome');
  if (settingsBiomeEl) {
    if (state.inBeastHub) {
      settingsBiomeEl.innerText = "Beast Hub Showcase";
    } else {
      settingsBiomeEl.innerText = `${activeBiomeName} (Prestige ${state.prestigeLevel})`;
    }
  }

  const warpLocked = document.getElementById('warp-portal-locked');
  const warpUnlocked = document.getElementById('warp-portal-unlocked');
  const warpBtn = document.getElementById('warp-btn');
  const hasUnlockedPortal = (state.primeSystem && state.primeSystem.prestigeLevel >= 9) || (state.prestigeLevel >= 9) || (state.currentSolarSystem === 'low_gravity');

  // Update enter beast hub button text based on status (always visible in settings)
  const hubBtn = document.getElementById('hub-btn');
  if (hubBtn) {
    hubBtn.innerText = state.inBeastHub ? '🚪 Leave Beast Hub' : '🚀 Enter Beast Hub (Showcase)';
    hubBtn.style.display = 'block';
  }

  if (hasUnlockedPortal) {
    if (warpLocked) warpLocked.style.display = 'none';
    if (warpUnlocked) warpUnlocked.style.display = 'flex';
    if (warpBtn) {
      warpBtn.innerText = state.currentSolarSystem === 'prime' ? '🌀 Warp to Low Gravity Solar System' : '🌀 Warp to Solar System Prime';
    }
  } else {
    if (warpLocked) warpLocked.style.display = 'block';
    if (warpUnlocked) warpUnlocked.style.display = 'none';
  }
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

  playground.addEventListener('dragover', (e) => {
    if (state.inBeastHub) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  playground.addEventListener('drop', (e) => {
    if (state.inBeastHub) {
      e.preventDefault();
      const beastId = e.dataTransfer.getData('text/plain');
      if (!beastId || !BEAST_TEMPLATES[beastId]) return;

      updatePlaygroundRect();
      const w = playgroundRect.width || 800;
      const h = playgroundRect.height || 600;
      const x = e.clientX - playgroundRect.left;
      const y = e.clientY - playgroundRect.top;
      const pctX = (x / w) * 100;
      const pctY = (y / h) * 100;

      const isEvoUnlocked = state.unlockedEvolved.includes(beastId);
      if (isEvoUnlocked) {
        showSpawnChoiceDialogAtCoord(beastId, pctX, pctY);
      } else {
        spawnBeastInHubAtCoord(beastId, false, pctX, pctY);
      }
    }
  });
}

function dragStart(e) {
  if (!state.isTutorialCompleted) {
    if (state.tutorialStage !== 2) {
      return;
    }
  }
  updatePlaygroundRect();
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

  const rect = playgroundRect;

  const pctX = ((pageX - rect.left - dragStartX) / rect.width) * 100;
  const pctY = ((pageY - rect.top - dragStartY) / rect.height) * 100;

  // Only trigger highlights and dragging state once movement starts to prevent tap flashes
  if (!dragStartedMoving) {
    dragStartedMoving = true;
    dragElement.classList.add('dragging');

    // Highlight merge candidates
    const beastTemplate = BEAST_TEMPLATES[draggedBeast.type];
    if (!isBossBeast(draggedBeast.type)) {
      state.beastsOnField.forEach(b => {
        const bTemplate = BEAST_TEMPLATES[b.type];
        const isSameTier = (beastTemplate && bTemplate && beastTemplate.tier === bTemplate.tier);
        const isBothLegendary = (beastTemplate && bTemplate && beastTemplate.rarity === 'LEGENDARY' && bTemplate.rarity === 'LEGENDARY');
        if (b.id !== draggedBeast.id && 
            (isSameTier || isBothLegendary) && 
            b.evolved === draggedBeast.evolved && 
            b.infected === draggedBeast.infected) {
          b.dom.classList.add('hovering-compatible');
        }
      });
    }

    // Highlight Incubators (if unlocked and vacant and NOT in Beast Hub)
    if (!state.inBeastHub) {
      const baseBossType = state.currentSolarSystem === 'low_gravity' ? 'void_parasite' : 'shadow_fiend';
      if (draggedBeast.type === baseBossType) {
        if (state.unlockedIncubators[2] && !state.incubators[2].active) {
          const ped3 = document.getElementById('incubator-pedestal-3');
          if (ped3) ped3.classList.add('hovering-compatible');
        }
      } else if (!isBossBeast(draggedBeast.type)) {
        if (state.unlockedIncubators[0] && !state.incubators[0].active) {
          document.getElementById('incubator-pedestal').classList.add('hovering-compatible');
        }
        if (state.unlockedIncubators[1] && !state.incubators[1].active) {
          document.getElementById('incubator-pedestal-2').classList.add('hovering-compatible');
        }
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

  const pxX = (draggedBeast.x / 100) * rect.width;
  const pxY = (draggedBeast.y / 100) * rect.height;
  dragElement.style.transform = `translate3d(${pxX}px, ${pxY}px, 0) scaleX(${draggedBeast.direction < 0 ? -1.15 : 1.15}) scaleY(1.15)`;
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

  if (!state.inBeastHub) {
    // Check drop Y collisions with Incubator 1 (Alpha)
    const ped1 = document.getElementById('incubator-pedestal');
    const pRect1 = ped1.getBoundingClientRect();
    
    const dPed1 = Math.sqrt(
      Math.pow((pRect1.left + pRect1.width/2) - (bRect.left + bRect.width/2), 2) +
      Math.pow((pRect1.top + pRect1.height/2) - (bRect.top + bRect.height/2), 2)
    );

    if (dPed1 < 75) {
      if (isBossBeast(draggedBeast.type)) {
        showWarning("Incompatible", `${BEAST_TEMPLATES[draggedBeast.type].name}s cannot be placed in Incubator Alpha!`);
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
        if (isBossBeast(draggedBeast.type)) {
          showWarning("Incompatible", `${BEAST_TEMPLATES[draggedBeast.type].name}s cannot be placed in Incubator Beta!`);
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
        const baseBossType = state.currentSolarSystem === 'low_gravity' ? 'void_parasite' : 'shadow_fiend';
        if (draggedBeast.type !== baseBossType) {
          showWarning("Incompatible", `Incubator Gamma is only for base ${BEAST_TEMPLATES[baseBossType].name}s!`);
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
  }

  // Normal merges
  let mergeTarget = null;
  const draggedTemplate = BEAST_TEMPLATES[draggedBeast.type];
  if (!isBossBeast(draggedBeast.type)) {
    for (let b of state.beastsOnField) {
      if (b.id === draggedBeast.id) continue;
      const bTemplate = BEAST_TEMPLATES[b.type];
      if (!draggedTemplate || !bTemplate) continue;
      if (bTemplate.tier !== draggedTemplate.tier) continue;
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
  let template = BEAST_TEMPLATES[beastA.type];
  const targetTemplate = BEAST_TEMPLATES[beastB.type];
  if (!template || !targetTemplate) {
    if (audio) audio.playClick();
    return;
  }

  // If different types, roll using the COMMON beast of this tier and system
  const originalTemplateA = template;
  if (beastA.type !== beastB.type) {
    const currentSys = state.currentSolarSystem || 'prime';
    const commonBeast = Object.values(BEAST_TEMPLATES).find(t => 
      t.tier === template.tier && 
      t.rarity === 'COMMON' && 
      (t.system || 'prime') === currentSys
    );
    if (commonBeast) {
      template = commonBeast;
    }
  }

  const isBothLegendary = (originalTemplateA.rarity === 'LEGENDARY' && targetTemplate.rarity === 'LEGENDARY');
  const isBothT15 = (originalTemplateA.tier === 15 && targetTemplate.tier === 15);
  const isBothT19 = (originalTemplateA.tier === 19 && targetTemplate.tier === 19);

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
      const godlyPool = state.currentSolarSystem === 'low_gravity'
        ? ['aurora_jellyfish', 'spectral_jellyfish', 'abyssal_jellyfish']
        : ['infinity', 'abyssus', 'solaris'];
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
      // 90% chance (or 100% in biomes below 5) to yield same Legendary but tier 15 (Prime/Omega)
      const primeMapping = state.currentSolarSystem === 'low_gravity'
        ? {
            gravity_lord_prime: 'gravity_lord_omega',
            abyssal_deity_prime: 'abyssal_deity_omega',
            cosmic_phoenix_prime: 'cosmic_phoenix_omega'
          }
        : {
            aurelion: 'aurelion_prime',
            voidwalker: 'voidwalker_prime',
            ragnarok: 'ragnarok_prime'
          };
      
      // Fallback in case they merge prime/omega legendaries
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
      const godlyPool = state.currentSolarSystem === 'low_gravity'
        ? ['aurora_jellyfish', 'spectral_jellyfish', 'abyssal_jellyfish']
        : ['infinity', 'abyssus', 'solaris'];
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
        const t16Pool = state.currentSolarSystem === 'low_gravity'
          ? ['nova_jellyfish', 'nova_ray']
          : ['arachnomorph', 'scarab'];
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
    if (state.currentSolarSystem === 'low_gravity') {
      if (state.t20MergesCount >= 1000) {
        resultType = 'dark_pterodactyl';
        spawnBeastOnField(resultType, mergeX, mergeY, false, isInfected);
        checkDiscovery(resultType);
        
        spawnToastNotification(
          '🌌 COSMIC CONVERGENCE!',
          `Your 1000th Tier 20 merge has opened a rift! The supreme <b>Dark Matter Pterodactyl</b> has materialized!`,
          getBeastSVG(resultType, false)
        );
        if (audio) audio.playUnlock('GODLY');
      } else {
        resultType = 'singularity_monarch';
        spawnBeastOnField(resultType, mergeX, mergeY, isEvolved, isInfected);
        checkDiscovery(resultType);
        
        const left = 1000 - state.t20MergesCount;
        spawnToastNotification(
          '👑 SINGULARITY MONARCH MERGED!',
          `Singularity Monarch materialized! <b>${state.t20MergesCount}/1000</b> merges toward the Dark Matter rift (${left} left).`,
          getBeastSVG(resultType, isEvolved)
        );
        if (audio) audio.playUnlock('LEGENDARY');
      }
    } else {
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
    }
    updateBeastopediaProgressBar();
    return;
  }

  // 2. Normal fusions
  // Legendary rates:
  // - Ragnarok / Gravity Lord Prime: T13 merges. 5% if base, 25% if evolved.
  // - Voidwalker / Abyssal Deity Prime: T12+ merges. 1.5% if base, 10% if evolved.
  // - Aurelion / Cosmic Phoenix Prime: Any merge. 0.1% if base, 1.0% if evolved.
  let resultType = null;
  let isLegendarySuccess = false;
  const roll = Math.random();
  const isT13Merge = (template.tier === 13);
  const isLg = (state.currentSolarSystem === 'low_gravity');
  
  // Ragnarok / Gravity Lord Prime check (T13 merges)
  if (isT13Merge) {
    const ragnarokChance = isEvolved ? 0.25 : 0.05;
    if (roll < ragnarokChance) {
      resultType = isLg ? 'gravity_lord_prime' : 'ragnarok';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Fusing Tier 13 elements transcended into the Legendary <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
  }
  
  // Voidwalker / Abyssal Deity Prime check (T12+ merges)
  if (!isLegendarySuccess && template.tier >= 12) {
    const voidwalkerChance = isEvolved ? 0.10 : 0.015;
    if (Math.random() < voidwalkerChance) {
      resultType = isLg ? 'abyssal_deity_prime' : 'voidwalker';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Deep elemental fusion collapsed space into the Legendary <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
        getBeastSVG(resultType, isEvolved)
      );
      if (audio) audio.playUnlock('LEGENDARY');
    }
  }

  // Aurelion / Cosmic Phoenix Prime check (Any merge)
  if (!isLegendarySuccess) {
    const aurelionChance = isEvolved ? 0.01 : 0.001;
    if (Math.random() < aurelionChance) {
      resultType = isLg ? 'cosmic_phoenix_prime' : 'aurelion';
      isLegendarySuccess = true;
      spawnToastNotification(
        '🌟 LEGENDARY MUTATION!',
        `Fusing elements resonated with the stars into the Legendary <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
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

  if (!state.isTutorialCompleted && state.tutorialStage === 2) {
    state.tutorialStage = 3;
    updateTutorialStage();
  }
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

  document.getElementById('discovery-beast-name').innerText = `${template.name} (Tier ${template.tier})`;
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
  if (state.inBeastHub) return;
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
    
    const currentSys = state.currentSolarSystem || 'prime';
    const baseBossType = currentSys === 'low_gravity' ? 'void_parasite' : 'shadow_fiend';
    
    if (isSuccess) {
      const highTierKeys = Object.keys(BEAST_TEMPLATES).filter(key => {
        const t = BEAST_TEMPLATES[key];
        const tSys = t.system || 'prime';
        return (t.tier === 14 || t.tier === 15) && !isBossBeast(key) && tSys === currentSys;
      });
      resultType = highTierKeys.length > 0 ? highTierKeys[Math.floor(Math.random() * highTierKeys.length)] : (currentSys === 'prime' ? 'ifrit' : 'gravity_lord');
      
      const x = 75;
      spawnBeastOnField(resultType, x, 70, false, false);
      if (audio) audio.playCrateOpen();
      
      spawnToastNotification(
        '🌟 PURIFICATION!',
        `${BEAST_TEMPLATES[baseBossType].name} has been purified into a friendly <b>${BEAST_TEMPLATES[resultType].name}</b> (10% chance)!`,
        getBeastSVG(resultType, false, false)
      );
      checkDiscovery(resultType);
    } else {
      resultType = currentSys === 'low_gravity' ? 'void_parasite_evolved' : 'shadow_fiend_evolved';
      
      const x = 75;
      spawnBeastOnField(resultType, x, 70, false, false);
      if (audio) audio.playCrateOpen();
      
      spawnToastNotification(
        '🚨 CONTAINMENT BREACH!',
        `Purification failed! The ${BEAST_TEMPLATES[baseBossType].name} has mutated into an <b>${BEAST_TEMPLATES[resultType].name}</b>!`,
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

  const titleEl = document.querySelector('#content-shop .shop-section-title');
  if (titleEl) {
    titleEl.innerHTML = state.inBeastHub ? 'Hub Spawner' : `Mystic Beasts <span style="color:#ffd43b; font-size:13px; margin-left:8px; font-weight:normal;">(Balance: ${formatNumber(state.essence)} Essence)</span>`;
  }

  if (state.inBeastHub) {
    // Render Hub Spawner list of unlocked beasts
    const unlockedTemplates = Object.values(BEAST_TEMPLATES).filter(b => {
      return b.id !== 'shadow_fiend' && b.id !== 'shadow_fiend_evolved' &&
             b.id !== 'void_parasite' && b.id !== 'void_parasite_evolved' &&
             state.unlockedBeasts.includes(b.id);
    });

    unlockedTemplates.sort((a, b) => a.tier - b.tier || a.rarity.localeCompare(b.rarity));

    unlockedTemplates.forEach(template => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      
      card.innerHTML = `
        <div class="shop-card-icon" style="width: 50px; height: 50px;">
          ${getBeastSVG(template.id, false, false)}
        </div>
        <div class="shop-card-info" style="display:flex; flex-direction:column; gap:2px; flex:1;">
          <div class="shop-card-name">${template.name}</div>
          <div class="shop-card-desc">Tier ${template.tier} | ${template.rarity}</div>
          <div class="shop-card-meta" style="color: #a8e6cf; font-size:11px; font-weight:bold;">Showcase Spawner</div>
        </div>
        <button class="shop-buy-btn" data-id="${template.id}" style="background: linear-gradient(135deg, #1eff00, #00ced1); border: none; border-radius: 8px; color: white; padding: 6px 12px; font-weight: bold; cursor: pointer; font-size: 11px;">
          Spawn
        </button>
      `;
      beastList.appendChild(card);
    });

    const spawnButtons = beastList.querySelectorAll('.shop-buy-btn');
    spawnButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const isEvoUnlocked = state.unlockedEvolved.includes(id);
        if (isEvoUnlocked) {
          showSpawnChoiceDialog(id);
        } else {
          spawnBeastInHub(id, false);
        }
      });
    });

    const upgradesList = document.getElementById('shop-upgrades-list');
    if (upgradesList) {
      upgradesList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-text-dim); font-size: 13px; width: 100%; grid-column: span 2;">Upgrades are disabled inside the Beast Hub.</div>`;
    }
    return;
  }

  const maxAllowedTier = getMaxAllowedTier();
  const currentSys = state.currentSolarSystem || 'prime';

  const purchaseableTemplates = Object.values(BEAST_TEMPLATES).filter(b => {
    const bSys = b.system || 'prime';
    return b.tier <= maxAllowedTier && 
           b.rarity === 'COMMON' && 
           bSys === currentSys &&
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
    const y = 35 + Math.random() * 15;
    
    spawnBeastOnField(beastId, x, y, false, false);
    if (audio) audio.playCrateOpen();

    saveGame();
    updateHUD();
    
    // Instead of rebuilding the entire Shop DOM (which causes lag and interrupts spam clicks),
    // we update the cost value and label in-place for the clicked item.
    const template = BEAST_TEMPLATES[beastId];
    const buyCount = state.shopPurchases[beastId] || 0;
    const newCost = Math.round(template.cost * Math.pow(1.18, buyCount));
    
    const btn = document.querySelector(`.shop-buy-btn[data-id="${beastId}"]`);
    if (btn) {
      btn.setAttribute('data-cost', newCost);
      const cardInfo = btn.previousElementSibling;
      if (cardInfo) {
        const meta = cardInfo.querySelector('.shop-card-meta');
        if (meta) {
          meta.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:#ffa800"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg> Cost: ${formatNumber(newCost)}`;
        }
      }
    }
    
    // Instantly update the disabled status of all buy buttons based on current essence
    document.querySelectorAll('.shop-buy-btn[data-id]').forEach(b => {
      const bCost = parseFloat(b.getAttribute('data-cost'));
      b.disabled = state.essence < bCost;
    });

    document.querySelectorAll('.shop-buy-btn[data-upgrade]').forEach(b => {
      const bCost = parseFloat(b.getAttribute('data-cost'));
      b.disabled = state.essence < bCost;
    });

    document.querySelectorAll('.shop-buy-btn[data-buy-inc]').forEach(b => {
      const bCost = parseFloat(b.getAttribute('data-cost'));
      b.disabled = state.essence < bCost;
    });
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
  grid.style.display = 'flex';
  grid.style.flexDirection = 'column';
  grid.style.gap = '15px';

  // We will divide BEAST_TEMPLATES into two lists
  const allTemplates = Object.values(BEAST_TEMPLATES).filter(b => {
    return b.id !== 'shadow_fiend' && b.id !== 'shadow_fiend_evolved' && b.id !== 'void_parasite' && b.id !== 'void_parasite_evolved';
  });

  const primeTemplates = allTemplates.filter(b => (b.system || 'prime') === 'prime');
  const lgTemplates = allTemplates.filter(b => b.system === 'low_gravity');

  // Sort both lists
  primeTemplates.sort((a, b) => a.tier - b.tier || a.rarity.localeCompare(b.rarity));
  lgTemplates.sort((a, b) => a.tier - b.tier || a.rarity.localeCompare(b.rarity));

  const primeUnlocked = primeTemplates.filter(b => state.unlockedBeasts.includes(b.id)).length;
  const lgUnlocked = lgTemplates.filter(b => state.unlockedBeasts.includes(b.id)).length;
  const totalUnlocked = primeUnlocked + lgUnlocked;
  const totalBeasts = primeTemplates.length + lgTemplates.length;

  document.getElementById('beastopedia-pct').innerText = `${totalUnlocked} / ${totalBeasts} (${Math.round((totalUnlocked/totalBeasts)*100)}%)`;

  // Helper to create a section
  const createSection = (title, templatesList, unlockedCount) => {
    const sectionHeader = document.createElement('div');
    sectionHeader.style = 'margin: 15px 0 5px 0; padding: 10px 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; color: #fff; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);';
    sectionHeader.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${title === 'Prime Solar System' ? '#ffd700' : '#8a2be2'}; box-shadow: 0 0 8px ${title === 'Prime Solar System' ? '#ffd700' : '#8a2be2'};"></span>
        <span style="font-size: 14px; font-family: 'Outfit', sans-serif;">${title}</span>
      </div>
      <span style="font-size: 11px; color: var(--color-text-dim); background: rgba(255,255,255,0.07); padding: 2px 8px; border-radius: 20px; font-family: monospace;">${unlockedCount} / ${templatesList.length}</span>
    `;
    grid.appendChild(sectionHeader);

    const subGrid = document.createElement('div');
    subGrid.className = 'beastopedia-grid'; // Use the original grid css rules

    templatesList.forEach((template, index) => {
      const isUnlocked = state.unlockedBeasts.includes(template.id);
      const card = document.createElement('div');
      card.className = `beastopedia-card ${isUnlocked ? '' : 'locked'}`;
      card.setAttribute('data-id', template.id);
      if (isUnlocked && state.inBeastHub) {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', template.id);
          e.dataTransfer.effectAllowed = 'copy';
        });
      }
      
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
        <div class="beastopedia-card-name" style="font-size: 9px; margin-top: 4px; text-align: center;">${isUnlocked ? template.name : 'Unknown'}</div>
      `;
      subGrid.appendChild(card);
    });

    grid.appendChild(subGrid);
  };

  createSection('Prime Solar System', primeTemplates, primeUnlocked);
  createSection('Low Gravity Solar System', lgTemplates, lgUnlocked);

  grid.querySelectorAll('.beastopedia-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (state.inBeastHub) {
        const isEvoUnlocked = state.unlockedEvolved.includes(id);
        if (isEvoUnlocked) {
          showSpawnChoiceDialog(id);
        } else {
          spawnBeastInHub(id, false);
        }
      } else {
        showBeastDetailsModal(id);
      }
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

  // Possible mutations/evolutions display
  let evosHtml = '';
  const currentSys = template.system || 'prime';
  const isSpecialRarity = ['COMMON', 'LEGENDARY', 'GODLY', 'DARK_MATTER'].includes(template.rarity) || isBossBeast(template.id);
  
  if (!isSpecialRarity) {
    // It's a rare/super_rare/ultra_rare mutation
    const commonBeast = Object.values(BEAST_TEMPLATES).find(t => 
      t.tier === template.tier && 
      t.rarity === 'COMMON' && 
      (t.system || 'prime') === currentSys
    );
    
    if (commonBeast && commonBeast.id !== template.id) {
      evosHtml = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left;">
          <div style="font-size: 11px; color: #ffd700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Merge Outcomes (Same Type):</div>
          <div style="font-size: 10px; color: #aaa; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">When merged with another ${template.name}:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; font-family: 'Outfit', sans-serif; margin-bottom: 12px;">
            ${template.evolutions.map(evo => {
              const target = BEAST_TEMPLATES[evo.to];
              if (!target) return '';
              const isUnlocked = state.unlockedBeasts.includes(evo.to);
              const targetName = isUnlocked ? target.name : '???';
              const rarityInfo = RARITIES[target.rarity];
              const badgeColor = rarityInfo ? rarityInfo.color : '#fff';
              return `
                <span style="font-size: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; color: ${isUnlocked ? badgeColor : '#888'}; font-weight: bold;">
                  ${targetName} (${evo.weight}%)
                </span>
              `;
            }).join('')}
          </div>
          
          <div style="font-size: 11px; color: #ffd700; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Merge Outcomes (Different Type):</div>
          <div style="font-size: 10px; color: #aaa; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">When merged with any other Tier ${template.tier} beast (uses ${commonBeast.name} base):</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; font-family: 'Outfit', sans-serif;">
            ${commonBeast.evolutions.map(evo => {
              const target = BEAST_TEMPLATES[evo.to];
              if (!target) return '';
              const isUnlocked = state.unlockedBeasts.includes(evo.to);
              const targetName = isUnlocked ? target.name : '???';
              const rarityInfo = RARITIES[target.rarity];
              const badgeColor = rarityInfo ? rarityInfo.color : '#fff';
              return `
                <span style="font-size: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; color: ${isUnlocked ? badgeColor : '#888'}; font-weight: bold;">
                  ${targetName} (${evo.weight}%)
                </span>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }
  
  if (!evosHtml) {
    if (template.evolutions && template.evolutions.length > 0) {
      evosHtml = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left;">
          <div style="font-size: 11px; color: #ffd700; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Possible Mutations:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; font-family: 'Outfit', sans-serif;">
            ${template.evolutions.map(evo => {
              const target = BEAST_TEMPLATES[evo.to];
              if (!target) return '';
              const isUnlocked = state.unlockedBeasts.includes(evo.to);
              const targetName = isUnlocked ? target.name : '???';
              const rarityInfo = RARITIES[target.rarity];
              const badgeColor = rarityInfo ? rarityInfo.color : '#fff';
              return `
                <span style="font-size: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; color: ${isUnlocked ? badgeColor : '#888'}; font-weight: bold;">
                  ${targetName} (${evo.weight}%)
                </span>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      evosHtml = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left; font-size: 11px; color: #888; font-style: italic; font-family: 'Outfit', sans-serif;">
          This beast is at the apex of its evolution path.
        </div>
      `;
    }
  }

  let evoContainer = document.getElementById('details-beast-evolutions');
  if (!evoContainer) {
    evoContainer = document.createElement('div');
    evoContainer.id = 'details-beast-evolutions';
    const loreEl = document.getElementById('details-beast-lore');
    if (loreEl) {
      loreEl.parentNode.insertBefore(evoContainer, loreEl.nextSibling);
    }
  }
  evoContainer.innerHTML = evosHtml;
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

  const systemFilter = document.getElementById('filter-solar-system')?.value || 'all';
  const rarityFilter = document.getElementById('filter-rarity')?.value || 'all';
  const tierFilter = document.getElementById('filter-tier')?.value || 'all';

  const rareTemplates = Object.values(BEAST_TEMPLATES).filter(b => b.rarity !== 'COMMON');
  
  // Sort by Tier ascending (Tier 1 at top down to Tier 20)
  rareTemplates.sort((a, b) => a.tier - b.tier);

  let renderedCount = 0;
  rareTemplates.forEach(template => {
    const isUnlocked = state.unlockedBeasts.includes(template.id);
    if (!isUnlocked) return;

    // Apply filters
    const bSys = template.system || 'prime';
    if (systemFilter !== 'all' && bSys !== systemFilter) return;
    if (rarityFilter !== 'all' && template.rarity !== rarityFilter) return;
    if (tierFilter !== 'all' && String(template.tier) !== tierFilter) return;

    renderedCount++;
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

    // Click handler to open perk detailed modal
    card.addEventListener('click', () => {
      showTrophyPerkModal(template.id);
    });

    trophyGrid.appendChild(card);
  });

  if (renderedCount === 0) {
    if (systemFilter === 'all' && rarityFilter === 'all' && tierFilter === 'all') {
      trophyGrid.innerHTML = `<div class="sanctuary-intro" style="grid-column: 1/-1; text-align: center; opacity: 0.5; margin-top:10px;">No rare trophies collected yet. Merge beasts to trigger mutations!</div>`;
    } else {
      trophyGrid.innerHTML = `<div class="sanctuary-intro" style="grid-column: 1/-1; text-align: center; opacity: 0.5; margin-top:10px;">No matching trophies found.</div>`;
    }
  }
}

// Shows a beautiful modal outlining the beast perk details
function showTrophyPerkModal(beastId) {
  if (audio) audio.playClick();
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return;

  const merges = state.trophyCounts[beastId] || 0;
  const perkDesc = getBeastPerkDescription(template);
  const systemName = template.system === 'low_gravity' ? 'Low Gravity Solar System' : 'Original Prime Solar System';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '1005';
  overlay.style.backdropFilter = 'blur(8px)';
  
  let elementColor = '#ffd700';
  if (template.element === 'FIRE') elementColor = '#ff5f00';
  if (template.element === 'WATER') elementColor = '#00cdff';
  if (template.element === 'EARTH') elementColor = '#5cd65c';
  if (template.element === 'WIND') elementColor = '#a8e6cf';
  if (['COSMIC', 'VOID', 'DEITY'].includes(template.element)) elementColor = '#a800ff';
  if (template.element === 'LIGHT') elementColor = '#ffffff';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 360px; border-color: ${elementColor}; padding: 25px; text-align: center; background: rgba(18, 14, 30, 0.95); box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(121,40,202,0.15); border-radius:20px;">
      <div class="modal-title" style="font-size: 24px; color: ${elementColor}; text-shadow: 0 0 10px rgba(121,40,202,0.5); margin-bottom: 5px; font-family:'Outfit', sans-serif;">${template.name}</div>
      <div style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 20px; letter-spacing: 1px; font-family:'Outfit', sans-serif;">${systemName}</div>
      
      <div style="width: 100px; height: 100px; margin: 0 auto 20px; filter: drop-shadow(0 4px 15px rgba(255,215,0,0.2));">
        ${getBeastSVG(template.id, false, false)}
      </div>

      <div style="display:flex; justify-content:center; gap: 8px; margin-bottom: 20px; font-family:'Outfit', sans-serif;">
        <span style="background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1);">Tier ${template.tier}</span>
        <span class="trophy-rarity ${template.rarity.toLowerCase()}" style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">${RARITIES[template.rarity].name}</span>
        <span style="background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); color: ${elementColor};">${template.element}</span>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 15px; margin-bottom: 25px; font-family:'Outfit', sans-serif;">
        <div style="font-size: 11px; color: #ffd700; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 6px;">Active Sanctuary Perk</div>
        <div style="font-size: 14px; color: #fff; font-weight: 500; line-height: 1.4;">${perkDesc}</div>
        <div style="font-size: 10px; color: #888; margin-top: 8px; font-style: italic;">Perk active when this beast is placed in a Sanctuary slot. (Collected ${merges} times)</div>
      </div>

      <button class="modal-btn" style="width: 100%; padding: 12px; font-size: 14px; font-family:'Outfit', sans-serif;" id="perk-modal-close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#perk-modal-close-btn').addEventListener('click', () => {
    if (audio) audio.playClick();
    overlay.remove();
  });
}

// Set up changes listeners for Sanctuary dropdown selects
function setupSanctuaryFilters() {
  const fs = document.getElementById('filter-solar-system');
  const fr = document.getElementById('filter-rarity');
  const ft = document.getElementById('filter-tier');

  if (fs) fs.addEventListener('change', () => renderSanctuary());
  if (fr) fr.addEventListener('change', () => renderSanctuary());
  if (ft) ft.addEventListener('change', () => renderSanctuary());
}

// --- PRESTIGE RESET LOGIC ---

function setupSettingsListeners() {
  setupTutorialListeners();
  const volRange = document.getElementById('volume-range');
  volRange.addEventListener('input', (e) => {
    if (audio) audio.setVolume(e.target.value);
  });

  const musicToggle = document.getElementById('toggle-music');
  musicToggle.addEventListener('change', (e) => {
    if (audio) audio.toggleMusic(e.target.checked);
  });

  const skipSongBtn = document.getElementById('skip-song-btn');
  if (skipSongBtn) {
    skipSongBtn.addEventListener('click', () => {
      if (audio) audio.skipToNextSong();
    });
  }

  const sfxToggle = document.getElementById('toggle-sfx');
  sfxToggle.addEventListener('change', (e) => {
    if (audio) audio.toggleSfx(e.target.checked);
  });

  const autoOpenToggle = document.getElementById('toggle-auto-open');
  if (autoOpenToggle) {
    autoOpenToggle.addEventListener('change', (e) => {
      state.autoOpenCrates = e.target.checked;
      saveGame();
    });
  }

  const autoDropsToggle = document.getElementById('toggle-auto-drops');
  if (autoDropsToggle) {
    autoDropsToggle.addEventListener('change', (e) => {
      state.autoCrateDrops = e.target.checked;
      saveGame();
      if (state.autoCrateDrops && !state.inBeastHub) {
        const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
        while (crateQueue > 0 && state.beastsOnField.length < maxCap) {
          crateQueue--;
          spawnCrateOnField();
        }
        updateCrateQueueBadge();
        updateHUD();
      }
    });
  }

  const buyBoostBtn = document.getElementById('buy-boost-btn');
  if (buyBoostBtn) {
    buyBoostBtn.addEventListener('click', () => {
      triggerIosPurchase('boost_2x', '1-Hour 2x Essence Boost', '£1.99', buyDoubleEssenceBoost);
    });
  }

  const buyCratesBtn = document.getElementById('buy-crates-btn');
  if (buyCratesBtn) {
    buyCratesBtn.addEventListener('click', () => {
      triggerIosPurchase('crates_premium_3x', '3x Premium Crates', '£2.99', buyPremiumCrates);
    });
  }

  const prestigeBtn = document.getElementById('prestige-btn');
  prestigeBtn.addEventListener('click', () => {
    const target = getPrestigeTarget();
    if (state.essence >= target) {
      openPrestigeSelectorModal();
    }
  });

  const warpBtn = document.getElementById('warp-btn');
  if (warpBtn) {
    warpBtn.addEventListener('click', () => {
      const targetSys = state.currentSolarSystem === 'prime' ? 'low_gravity' : 'prime';
      warpToSolarSystem(targetSys);
    });
  }

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("WARNING: This will delete ALL progress, save data, unlocked beasts, and upgrades permanently. Are you sure you want to reset?")) {
      state.isResetting = true;
      localStorage.removeItem('mystic_beasts_evolution_save');
      location.reload();
    }
  });
}

function warpToSolarSystem(systemId) {
  if (state.currentSolarSystem === systemId) return;

  if (audio) audio.playClick();

  // 1. Serialize active environment progress to state.[primeSystem|lowGravitySystem]
  const savedBeasts = state.beastsOnField.map(b => ({
    type: b.type,
    x: b.x,
    y: b.y,
    evolved: b.evolved || false,
    infected: b.infected || false,
    deathTimer: b.deathTimer || 45.0
  }));

  const activeBranch = {
    essence: state.essence,
    prestigeLevel: state.prestigeLevel,
    shopPurchases: state.shopPurchases,
    unlockedIncubators: state.unlockedIncubators,
    upgrades: state.upgrades,
    incubators: state.incubators,
    beastsOnField: savedBeasts
  };

  if (state.currentSolarSystem === 'prime') {
    state.primeSystem = activeBranch;
  } else {
    state.lowGravitySystem = activeBranch;
  }

  // 2. Set current system
  state.currentSolarSystem = systemId;

  // 3. Clear active field DOM and arrays
  state.beastsOnField.forEach(b => b.dom.remove());
  state.beastsOnField = [];
  document.querySelectorAll('.essence-crystal').forEach(c => c.remove());
  document.querySelectorAll('.crate-container').forEach(c => c.remove());
  if (particles) particles.clear();

  // 4. Load new system branch
  const newSys = systemId === 'prime' ? state.primeSystem : state.lowGravitySystem;
  
  state.essence = newSys.essence;
  state.prestigeLevel = newSys.prestigeLevel;
  state.shopPurchases = newSys.shopPurchases;
  state.unlockedIncubators = newSys.unlockedIncubators;
  state.upgrades = newSys.upgrades;
  state.incubators = newSys.incubators;

  // 5. Restore active biomes and spawn active beasts
  applyBiomeBg(state.prestigeLevel);

  if (newSys.beastsOnField && newSys.beastsOnField.length > 0) {
    newSys.beastsOnField.forEach(b => {
      spawnBeastOnField(b.type, b.x, b.y, b.evolved, b.infected, b.deathTimer);
    });
  } else {
    // Default fallback spawn
    spawnBeastOnField(systemId === 'prime' ? 'sparky' : 'floaty_ray', 30, 50, false, false);
  }

  // 6. Update UI
  updateIncubatorsVisibility();
  restoreIncubatorSlotUI(0);
  restoreIncubatorSlotUI(1);
  restoreIncubatorSlotUI(2);
  updateTrashBinUI();
  updateBeastopediaProgressBar();
  
  // Re-render Shop & Beastopedia
  renderShop();
  renderBeastopedia();
  renderSanctuary();
  updateHUD();

  // 7. Transition Music sequence
  if (audio) {
    audio.transitionSolarSystemMusic(systemId);
  }

  saveGame();

  spawnToastNotification(
    "WARP SUCCESS",
    `Warped to <b>${systemId === 'prime' ? 'Solar System Prime' : 'Low Gravity Solar System'}</b>!`,
    getBeastSVG(systemId === 'prime' ? 'sparky' : 'floaty_ray', false, false)
  );
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
  document.querySelectorAll('.crate-container').forEach(c => c.remove());

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

  const startBeast = state.currentSolarSystem === 'low_gravity' ? 'floaty_ray' : 'sparky';
  spawnBeastOnField(startBeast, 30, 50, false, false);
  spawnBeastOnField(startBeast, 60, 50, false, false);

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
  const activeBiomes = getActiveBiomes();
  spawnToastNotification(
    "🏆 ASCENSION SUCCESSFUL!", 
    `You have ascended to Prestige Level ${state.prestigeLevel} (${activeBiomes[Math.min(state.prestigeLevel, activeBiomes.length-1)].name}). Permanent +100% production multiplier applied!`, 
    successIcon
  );
}

// --- HUD SPINNER TIMERS & UI ---

function isBossBeast(type) {
  return ['shadow_fiend', 'shadow_fiend_evolved', 'void_parasite', 'void_parasite_evolved'].includes(type);
}

function isBoostActive() {
  return Date.now() < state.doubleEssenceEndTime;
}

let isStoreInitialized = false;
let activePurchaseCallback = null;

function initStoreKit() {
  if (typeof CdvPurchase === 'undefined') {
    console.log("StoreKit: CdvPurchase global not found. Simulated mode will be used.");
    return;
  }

  const { store, ProductType, Platform } = CdvPurchase;

  // Verbose logging in debug/TestFlight
  store.verbosity = CdvPurchase.LogLevel.DEBUG;

  // Register Consumable Products
  store.register([
    {
      id: 'boost_2x',
      type: ProductType.CONSUMABLE,
      platform: Platform.APPLE_APPSTORE
    },
    {
      id: 'crates_premium_3x',
      type: ProductType.CONSUMABLE,
      platform: Platform.APPLE_APPSTORE
    }
  ]);

  // Transaction Approved -> Verify
  store.when().approved((transaction) => {
    console.log(`StoreKit: Transaction approved for ${transaction.products[0].id}, verifying receipt...`);
    transaction.verify();
  });

  // Transaction Verified -> Finish & Grant
  store.when().verified((receipt) => {
    console.log("StoreKit: Transaction receipt verified successfully.");
    const transaction = receipt.transactions[0];
    if (transaction && transaction.products && transaction.products.length > 0) {
      const productId = transaction.products[0].id;
      transaction.finish();
      
      console.log(`StoreKit: Transaction finished and items granted for ${productId}`);
      
      // Hide loader and execute callback
      hideStoreLoadingSpinner();
      
      if (activePurchaseCallback) {
        activePurchaseCallback();
        activePurchaseCallback = null;
      } else {
        handleSuccessfulPurchase(productId);
      }
    } else {
      hideStoreLoadingSpinner();
    }
  });

  // Track finished transactions
  store.when().finished((transaction) => {
    console.log(`StoreKit: Transaction fully completed for ${transaction.products[0].id}`);
    hideStoreLoadingSpinner();
  });

  // Track global errors
  store.onError((error) => {
    console.error(`StoreKit Error (${error.code}): ${error.message}`);
    hideStoreLoadingSpinner();
    // Only alert if the error wasn't user cancellation
    if (error.code !== CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
      alert(`App Store Purchase Failed: ${error.message}`);
    }
  });

  // Initialize Apple App Store integration
  store.initialize([Platform.APPLE_APPSTORE])
    .then(() => {
      console.log("StoreKit: Apple App Store billing successfully initialized.");
      isStoreInitialized = true;
    })
    .catch((err) => {
      console.error("StoreKit: Store initialization failed:", err);
    });
}

function handleSuccessfulPurchase(productId) {
  if (productId === 'boost_2x') {
    buyDoubleEssenceBoost();
  } else if (productId === 'crates_premium_3x') {
    buyPremiumCrates();
  } else {
    console.warn(`StoreKit: Unrecognized product ID rewarded: ${productId}`);
  }
}

function showStoreLoadingSpinner() {
  if (document.getElementById('store-loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'store-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.65);
    z-index: 10005;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    opacity: 0;
    transition: opacity 0.25s ease;
  `;

  overlay.innerHTML = `
    <div style="
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.15);
      border-top-color: #007aff;
      border-radius: 50%;
      animation: storeSpin 1s linear infinite;
      margin-bottom: 20px;
    "></div>
    <div style="font-size: 16px; font-weight: 600; letter-spacing: -0.2px;">Connecting to App Store...</div>
    <style>
      @keyframes storeSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  document.body.appendChild(overlay);
  void overlay.offsetWidth; // Force layout calculation for transition
  overlay.style.opacity = '1';
}

function hideStoreLoadingSpinner() {
  const overlay = document.getElementById('store-loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
    }, 250);
  }
}

function triggerIosPurchase(productId, productName, productPrice, onComplete) {
  // If native billing is not loaded (running in browser/simulator), fall back to mockup
  if (typeof CdvPurchase === 'undefined' || !isStoreInitialized) {
    console.log("StoreKit: Billing not initialized or not running on native iOS device. Falling back to simulation.");
    runMockIosPurchase(productId, productName, productPrice, onComplete);
    return;
  }

  showStoreLoadingSpinner();
  activePurchaseCallback = onComplete;

  const { store } = CdvPurchase;
  store.order(productId)
    .then(() => {
      console.log(`StoreKit: Order successfully requested for ${productId}`);
    })
    .catch((err) => {
      console.error(`StoreKit: Failed to request order for ${productId}`, err);
      hideStoreLoadingSpinner();
      activePurchaseCallback = null;
      alert(`Could not initiate purchase: ${err.message}`);
    });
}

function runMockIosPurchase(productId, productName, productPrice, onComplete) {
  // Create Apple Pay sheet container
  const overlay = document.createElement('div');
  overlay.id = 'apple-pay-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  const sheet = document.createElement('div');
  sheet.id = 'apple-pay-sheet';
  sheet.style.cssText = `
    width: 100%;
    max-width: 480px;
    background: rgba(28, 28, 30, 0.94);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    padding: 24px 20px 40px 20px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.15, 0.85, 0.15, 1);
    color: white;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  sheet.innerHTML = `
    <div style="width: 36px; height: 5px; background: rgba(255,255,255,0.2); border-radius: 2.5px; margin-bottom: 24px;"></div>
    
    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 28px;">
      <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px;"></span>
      <span style="font-size: 17px; font-weight: 700; letter-spacing: -0.2px;">Pay</span>
    </div>

    <div style="width: 100%; display: flex; flex-direction: column; gap: 14px; border-bottom: 0.5px solid rgba(255,255,255,0.15); padding-bottom: 18px; margin-bottom: 18px; font-size: 13px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: rgba(255,255,255,0.5); text-transform: uppercase; font-size: 10px; font-weight: 700;">Merchant</span>
        <span style="font-weight: 600; color: white;">Mystic Beasts Evolution</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: rgba(255,255,255,0.5); text-transform: uppercase; font-size: 10px; font-weight: 700;">Payment</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="background: rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 5px; font-weight: 700; font-size: 9px;">Pay</span>
          <span style="font-weight: 600;">Visa (•••• 8921)</span>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: rgba(255,255,255,0.5); text-transform: uppercase; font-size: 10px; font-weight: 700;">Item</span>
        <span style="font-weight: 600; color: white;">${productName}</span>
      </div>
    </div>

    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <span style="font-size: 15px; font-weight: 700; color: white;">TOTAL</span>
      <span style="font-size: 24px; font-weight: 800; color: white; font-family: monospace;">${productPrice}</span>
    </div>

    <div id="faceid-trigger-area" style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; width: 100%; padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px;">
      <div id="faceid-animation-icon" style="width: 60px; height: 60px; position: relative; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
        <svg viewBox="0 0 100 100" style="width: 44px; height: 44px; fill: none; stroke: #007aff; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round;">
          <path d="M25 15C25 15 15 25 15 35M15 65C15 65 25 75 35 75M75 75C75 75 75 65 75 55M75 25C75 25 65 15 55 15M40 32C40 32 37 32 37 35V45C37 45 40 45 40 42M60 32C60 32 63 32 63 35V45C63 45 60 45 60 42M50 40V55M45 55H55M40 65H60M35 60C35 60 38 68 50 68C62 68 65 60 65 60" />
        </svg>
        <div id="faceid-scanning-bar" style="position: absolute; left: 10px; top: 15px; width: 40px; height: 2px; background: #007aff; box-shadow: 0 0 8px #007aff; display: none; animation: laserUpDown 1.2s ease-in-out infinite;"></div>
      </div>
      <div id="faceid-status-label" style="font-size: 14px; font-weight: 600; color: #007aff; letter-spacing: -0.1px;">Authorize Payment</div>
    </div>

    <button id="apple-pay-cancel-btn" style="width: 100%; border: none; background: none; color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 600; margin-top: 24px; padding: 10px; cursor: pointer;">Cancel</button>
  `;

  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes laserUpDown {
      0% { top: 15px; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 45px; opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  void overlay.offsetWidth;
  overlay.style.opacity = '1';
  sheet.style.transform = 'translateY(0)';

  const cleanUp = () => {
    sheet.style.transform = 'translateY(100%)';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      styleEl.remove();
    }, 350);
  };

  document.getElementById('apple-pay-cancel-btn').addEventListener('click', cleanUp);

  let authorizing = false;
  const triggerArea = document.getElementById('faceid-trigger-area');
  const statusLabel = document.getElementById('faceid-status-label');
  const animIcon = document.getElementById('faceid-animation-icon');
  const scanningBar = document.getElementById('faceid-scanning-bar');

  triggerArea.addEventListener('click', () => {
    if (authorizing) return;
    authorizing = true;

    if (audio) audio.playClick();

    statusLabel.innerText = "Verifying with Face ID...";
    scanningBar.style.display = 'block';
    animIcon.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      scanningBar.style.display = 'none';
      animIcon.style.transform = 'scale(1.0)';
      animIcon.innerHTML = `
        <svg viewBox="0 0 100 100" style="width: 50px; height: 50px; fill: none; stroke: #34c759; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 6px rgba(52,199,89,0.4));">
          <circle cx="50" cy="50" r="40" stroke="#34c759" stroke-width="4"/>
          <path d="M30 50L45 65L70 35" />
        </svg>
      `;
      statusLabel.innerText = "Payment Approved";
      statusLabel.style.color = "#34c759";

      if (audio) {
        audio.playUnlock('GODLY');
      }

      setTimeout(() => {
        cleanUp();
        showTestFlightAlert(productName, () => {
          onComplete();
        });
      }, 1000);

    }, 2000);
  });
}

function showTestFlightAlert(itemName, onDone) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '10001';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 300px; border-color: rgba(255,255,255,0.15); background: rgba(30, 30, 30, 0.95); border-radius: 14px; padding: 20px; text-shadow: none;">
      <div style="font-weight: 700; font-size: 16px; color: white; text-align: center; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont;">TestFlight Sandbox</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.85); text-align: center; margin-bottom: 20px; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont;">
        You're all set. Your purchase of <b>${itemName}</b> was successful in the TestFlight sandbox environment.
      </div>
      <button class="modal-btn" style="width: 100%; border-radius: 10px; background: #007aff; color: white; border: none; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont;" id="testflight-ok-btn">OK</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#testflight-ok-btn').addEventListener('click', () => {
    overlay.remove();
    if (audio) audio.playClick();
    onDone();
  });
}

function buyDoubleEssenceBoost() {
  state.doubleEssenceEndTime = Date.now() + 3600 * 1000;
  saveGame();
  updateHUD();
  if (audio) audio.playUnlock('LEGENDARY');
  
  const doubleIcon = `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,168,0,0.15);box-shadow:0 0 10px rgba(255,168,0,0.3);border-radius:12px;font-weight:900;color:#ffa800;font-size:16px;">2X</div>
  `;
  spawnToastNotification(
    "x2 ESSENCE BOOST ACTIVATED!", 
    "All essence generated and clicked is doubled for the next 1 hour!", 
    doubleIcon
  );
}

function buyPremiumCrates() {
  state.premiumCratesCount += 3;
  saveGame();
  updatePremiumCratesDisplay();
  if (audio) audio.playUnlock('LEGENDARY');
  
  const boxIcon = `
    <svg viewBox="0 0 24 24" style="width:100%;height:100%;fill:#ff00c8">
      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm1 1h2v10H7V7zm8 0h2v10h-2V7z" />
    </svg>
  `;
  spawnToastNotification(
    "3x PREMIUM CRATES RECEIVED!", 
    "Premium crates added! Check the spawner tray at the bottom.", 
    boxIcon
  );
}

function updatePremiumCratesDisplay() {
  const btn = document.getElementById('spawn-premium-crate-btn');
  const label = document.getElementById('premium-crates-label');
  if (label) {
    label.innerText = `Premium: ${state.premiumCratesCount}`;
  }
  if (btn) {
    if (state.premiumCratesCount > 0) {
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1.0';
      btn.style.border = '1.5px solid #ff00c8';
    } else {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.6';
      btn.style.border = '1.5px dashed rgba(255,0,200,0.3)';
    }
  }
}

// Spawns a physical Premium Crate on the field
function spawnPremiumCrateOnField() {
  const playground = document.getElementById('beast-playground');
  
  const instanceId = 'premium-crate-' + Math.random().toString(36).substr(2, 9);
  const landX = 10 + Math.random() * 75;
  const landY = 40 + Math.random() * 32;

  const container = document.createElement('div');
  container.className = 'crate-container';
  container.id = instanceId;
  container.style.left = `${landX}%`;
  container.style.top = `${landY}%`;
  container.style.transform = 'translateY(-100vh) scaleY(1.3)';
  container.style.opacity = '0';
  
  container.setAttribute('data-spawned-at', Date.now());
  container.setAttribute('data-land-x', landX);
  container.setAttribute('data-land-y', landY);

  container.innerHTML = `
    <svg class="crate-sprite" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 8px #ff00c8); transform: scale(1.4);">
      <rect x="10" y="10" width="80" height="80" rx="10" fill="#ff00c8" stroke="#b300ff" stroke-width="6"/>
      <line x1="10" y1="10" x2="90" y2="90" stroke="#b300ff" stroke-width="8" />
      <line x1="90" y1="10" x2="10" y2="90" stroke="#b300ff" stroke-width="8" />
      <rect x="22" y="22" width="56" height="56" rx="6" fill="none" stroke="#ffd700" stroke-width="3"/>
      <circle cx="50" cy="50" r="14" fill="#ffd700" stroke="#ff00c8" stroke-width="3"/>
      <polygon points="50,42 53,49 60,50 55,55 56,62 50,58 44,62 45,55 40,50 47,49" fill="#ff00c8"/>
    </svg>
  `;

  playground.appendChild(container);

  if (audio) audio.playCrateDrop();

  // Force reflow
  void container.offsetWidth;

  // Apply smooth drop transition
  container.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease-out';
  container.style.transform = 'translateY(0) scaleY(1)';
  container.style.opacity = '1';

  container.addEventListener('transitionend', function onFallEnd(e) {
    if (e.propertyName === 'transform') {
      container.removeEventListener('transitionend', onFallEnd);
      container.style.transition = ''; // reset transition
      container.classList.add('shake');
      if (particles) {
        const absolutePos = getAbsolutePosition(landX, landY);
        particles.spawnClick(absolutePos.x, absolutePos.y);
      }
    }
  });
  
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    openPremiumCrate(instanceId, landX, landY);
  });
}

function openPremiumCrate(crateId, x, y) {
  const maxCap = state.inBeastHub ? 25 : UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Meadow Full", "Meadow is full! Clear some space first.");
    return;
  }

  const dom = document.getElementById(crateId);
  if (!dom) return;

  dom.remove();

  const abs = getAbsolutePosition(x, y);
  if (particles) particles.spawnMerge(abs.x, abs.y, '#ff00c8');
  if (audio) audio.playCrateOpen();

  const currentSys = state.currentSolarSystem || 'prime';
  const targetRarities = ['RARE', 'SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'];
  const possibilities = Object.values(BEAST_TEMPLATES).filter(b => {
    const bSys = b.system || 'prime';
    return b.tier >= 5 && b.tier <= 20 && targetRarities.includes(b.rarity) && bSys === currentSys && !isBossBeast(b.id);
  });

  const defaultBeast = currentSys === 'prime' ? 'torrent' : 'tempest_eagle';
  const chosenBeastId = possibilities.length > 0 ? possibilities[Math.floor(Math.random() * possibilities.length)].id : defaultBeast;

  spawnBeastOnField(chosenBeastId, x, y, false, false);

  const chosenTemplate = BEAST_TEMPLATES[chosenBeastId];
  if (audio) {
    if (['GODLY', 'DARK_MATTER'].includes(chosenTemplate.rarity)) {
      audio.playUnlock('GODLY');
    } else if (['ULTRA_RARE', 'LEGENDARY'].includes(chosenTemplate.rarity)) {
      audio.playUnlock('ULTRA_RARE');
    } else {
      audio.playUnlock(chosenTemplate.rarity);
    }
  }

  spawnToastNotification(
    '🎁 PREMIUM HATCH!', 
    `Hatched a guaranteed Rare+ <b>${chosenTemplate.name}</b> from a Premium Crate!`, 
    getBeastSVG(chosenBeastId, false, false)
  );

  checkDiscovery(chosenBeastId);
}

function setupSpawnerListeners() {
  const spawnBtn = document.getElementById('spawn-crate-btn');
  spawnBtn.addEventListener('click', () => {
    if (!state.isTutorialCompleted) {
      return;
    }

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

  const spawnPremiumBtn = document.getElementById('spawn-premium-crate-btn');
  if (spawnPremiumBtn) {
    spawnPremiumBtn.addEventListener('click', () => {
      const maxCap = UPGRADE_CONFIGS.meadowCapacity.getValue(state.upgrades.meadowCapacity);
      if (state.beastsOnField.length >= maxCap) {
        showWarning("Meadow Full", "Meadow is full! Clear some space first.");
        return;
      }

      if (state.premiumCratesCount <= 0) {
        showWarning("No Premium Crates", "You don't have any Premium Crates left! Buy more in the shop.");
        return;
      }

      if (state.essence >= getPrestigeTarget()) {
        if (!confirm("WARNING: Biome progress is at 100%! Ascending will reset your meadow and you will lose any beasts currently on the field. Are you sure you want to spawn this Premium Crate now?")) {
          return;
        }
      }

      state.premiumCratesCount--;
      spawnPremiumCrateOnField();
      updatePremiumCratesDisplay();
      saveGame();
    });
  }

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

function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === tabId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  contents.forEach(c => {
    if (c.id === `content-${tabId}`) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

function setupSidebarTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
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

  if (state.inBeastHub) {
    if (audio) audio.playClick();
    if (particles) {
      particles.spawnClick(pageX, pageY);
    }
    return;
  }

  const evolvedMult = beast.evolved ? 3.0 : 1.0;
  const clickBaseVal = getClickMultiplier();
  // Click yield scales with click multiplier and beast's tier value
  let clickPower = Math.round(clickBaseVal * evolvedMult * Math.max(1, template.baseCps * 0.15));

  if (isBoostActive()) {
    clickPower *= 2;
  }

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

// --- BEAST HUB FUNCTIONALITY ---

function spawnBeastInHub(beastId, evolved = false) {
  if (!state.unlockedBeasts.includes(beastId)) {
    showWarning("Locked Beast", "You must discover this beast in the main game before you can spawn it in the Beast Hub!");
    return;
  }
  const maxCap = 25;
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Showcase Full", "Showcase is full! Release some beasts in the Trash Can first.");
    return;
  }
  const spawnX = 30 + Math.random() * 40;
  const spawnY = 30 + Math.random() * 40;
  
  spawnBeastOnField(beastId, spawnX, spawnY, evolved, false);
  saveGame();
  
  const template = BEAST_TEMPLATES[beastId];
  spawnToastNotification(
    "Beast Spawned", 
    `Spawned <b>${template.name}</b> ${evolved ? '(Evolved)' : ''} in the Showcase Hub!`,
    getBeastSVG(beastId, evolved, false)
  );
}

function spawnBeastInHubAtCoord(beastId, evolved, pctX, pctY) {
  if (!state.unlockedBeasts.includes(beastId)) {
    showWarning("Locked Beast", "You must discover this beast in the main game before you can spawn it in the Beast Hub!");
    return;
  }
  const maxCap = 25;
  if (state.beastsOnField.length >= maxCap) {
    showWarning("Showcase Full", "Showcase is full! Release some beasts in the Trash Can first.");
    return;
  }
  const x = Math.max(1, Math.min(pctX, 96));
  const y = Math.max(10, Math.min(pctY, 80));
  
  spawnBeastOnField(beastId, x, y, evolved, false);
  saveGame();
  
  const template = BEAST_TEMPLATES[beastId];
  spawnToastNotification(
    "Beast Spawned", 
    `Spawned <b>${template.name}</b> ${evolved ? '(Evolved)' : ''} in the Showcase Hub!`,
    getBeastSVG(beastId, evolved, false)
  );
}

function showSpawnChoiceDialog(beastId) {
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '1000';
  overlay.id = 'spawn-choice-modal';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 320px; border-color: #7928ca; padding: 20px;">
      <div class="modal-title" style="font-size: 20px; margin-bottom: 15px;">Spawn Beast</div>
      <div class="modal-desc" style="font-size: 13px; margin-bottom: 20px;">
        Choose which form of <b>${template.name}</b> to spawn:
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <button id="spawn-choice-base-btn" class="settings-btn" style="background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.15); width: 100%;">
          Base Form
        </button>
        <button id="spawn-choice-evolved-btn" class="settings-btn" style="background: linear-gradient(135deg, #7928ca, #ff007f); color: white; border: none; font-weight: bold; width: 100%;">
          Evolved Form
        </button>
        <button id="spawn-choice-cancel-btn" class="settings-btn reset" style="margin-top: 5px; width: 100%;">
          Cancel
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('spawn-choice-base-btn').addEventListener('click', () => {
    spawnBeastInHub(beastId, false);
    overlay.remove();
  });
  document.getElementById('spawn-choice-evolved-btn').addEventListener('click', () => {
    spawnBeastInHub(beastId, true);
    overlay.remove();
  });
  document.getElementById('spawn-choice-cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

function showSpawnChoiceDialogAtCoord(beastId, pctX, pctY) {
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '1000';
  overlay.id = 'spawn-choice-modal';
  
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 320px; border-color: #7928ca; padding: 20px;">
      <div class="modal-title" style="font-size: 20px; margin-bottom: 15px;">Spawn Beast</div>
      <div class="modal-desc" style="font-size: 13px; margin-bottom: 20px;">
        Choose which form of <b>${template.name}</b> to spawn:
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <button id="spawn-choice-base-btn" class="settings-btn" style="background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.15); width: 100%;">
          Base Form
        </button>
        <button id="spawn-choice-evolved-btn" class="settings-btn" style="background: linear-gradient(135deg, #7928ca, #ff007f); color: white; border: none; font-weight: bold; width: 100%;">
          Evolved Form
        </button>
        <button id="spawn-choice-cancel-btn" class="settings-btn reset" style="margin-top: 5px; width: 100%;">
          Cancel
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('spawn-choice-base-btn').addEventListener('click', () => {
    spawnBeastInHubAtCoord(beastId, false, pctX, pctY);
    overlay.remove();
  });
  document.getElementById('spawn-choice-evolved-btn').addEventListener('click', () => {
    spawnBeastInHubAtCoord(beastId, true, pctX, pctY);
    overlay.remove();
  });
  document.getElementById('spawn-choice-cancel-btn').addEventListener('click', () => {
    overlay.remove();
  });
}

function toggleBeastHub(enter) {
  if (enter === state.inBeastHub) return;
  
  if (audio) audio.playClick();
  
  // Save current state first
  saveGame();
  
  // Clear playground elements
  document.querySelectorAll('.beast-container, .crate-container, .essence-crystal').forEach(el => el.remove());
  
  state.inBeastHub = enter;
  state.lastTrashedBeast = null; // Clear undo trash on boundary crossing
  updateTrashBinUI();
  
  const spawnBtn = document.getElementById('spawn-crate-btn');
  const crateTimerEl = document.getElementById('crate-timer');
  const premiumSlot = document.getElementById('premium-spawner-slot');
  const capIndicator = document.getElementById('meadow-capacity');

  if (enter) {
    // Entering Beast Hub
    // Clear state.beastsOnField array
    state.beastsOnField = [];
    
    // Load beast hub beasts
    if (state.beastHubBeasts && state.beastHubBeasts.length > 0) {
      state.beastHubBeasts.forEach(b => {
        spawnBeastOnField(b.type, b.x, b.y, b.evolved || false, b.infected || false);
      });
    } else {
      spawnBeastOnField(state.currentSolarSystem === 'prime' ? 'sparky' : 'floaty_ray', 50, 50, false, false);
    }
    
    // Change background style
    document.getElementById('game-container').className = 'game-container biome-hub';
    
    // Show leave button
    const hubControls = document.getElementById('hub-controls');
    if (hubControls) hubControls.style.display = 'flex';
    
    // Hide bottom bar elements except trash bin
    if (spawnBtn) spawnBtn.style.display = 'none';
    if (crateTimerEl) crateTimerEl.style.display = 'none';
    if (premiumSlot) premiumSlot.style.display = 'none';
    if (capIndicator) capIndicator.style.display = 'none';

    // Switch to catalog/beastopedia tab
    activeTab = 'beastopedia';
    switchTab('beastopedia');
    
  } else {
    // Leaving Beast Hub
    // Save hub beasts
    state.beastHubBeasts = state.beastsOnField.map(b => ({
      type: b.type,
      x: b.x,
      y: b.y,
      evolved: b.evolved || false,
      infected: b.infected || false
    }));
    
    // Clear playground
    state.beastsOnField = [];
    
    // Reload active solar system branch
    const activeSys = state.currentSolarSystem === 'prime' ? state.primeSystem : state.lowGravitySystem;
    state.essence = activeSys.essence;
    state.prestigeLevel = activeSys.prestigeLevel;
    
    applyBiomeBg(state.prestigeLevel);
    
    // Restore beasts
    if (activeSys.beastsOnField && activeSys.beastsOnField.length > 0) {
      activeSys.beastsOnField.forEach(b => {
        spawnBeastOnField(b.type, b.x, b.y, b.evolved, b.infected, b.deathTimer);
      });
    } else {
      spawnBeastOnField(state.currentSolarSystem === 'prime' ? 'sparky' : 'floaty_ray', 30, 50, false, false);
    }
    
    // Hide leave button
    const hubControls = document.getElementById('hub-controls');
    if (hubControls) hubControls.style.display = 'none';

    // Restore bottom bar elements
    if (spawnBtn) spawnBtn.style.display = 'flex';
    if (crateTimerEl) crateTimerEl.style.display = 'block';
    if (premiumSlot) premiumSlot.style.display = 'flex';
    if (capIndicator) capIndicator.style.display = 'block';

    document.getElementById('game-container').className = 'game-container';
  }
  
  applyBiomeBg(state.prestigeLevel);
  updateIncubatorsVisibility();
  renderShop();
  renderBeastopedia();
  saveGame();
  updateHUD();
}

function setupBeastHub() {
  const hubBtn = document.getElementById('hub-btn');
  if (hubBtn) {
    hubBtn.addEventListener('click', () => {
      // Toggle sidebar drawer close first
      const sidebar = document.getElementById('sidebar-panel');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
      
      toggleBeastHub(!state.inBeastHub);
    });
  }
  
  const leaveBtn = document.getElementById('leave-hub-btn');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      toggleBeastHub(false);
    });
  }
}

// --- DAILY SPIN WHEEL FUNCTIONALITY ---

let dailySpinWinningBeast = null;
let dailySpinWinningRarity = null;
let dailySpinWinningTier = null;

function checkDailySpinAvailable() {
  if (Date.now() < (state.maxTimeSeen || 0)) {
    return false; // CHEATER! Date rollback detected.
  }
  const today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
  return state.lastDailySpinDate !== today;
}

function updateDailySpinHUD() {
  const badge = document.getElementById('daily-spin-badge');
  if (badge) {
    badge.style.display = checkDailySpinAvailable() ? 'block' : 'none';
  }
}

function showDailySpinModal() {
  if (!checkDailySpinAvailable()) {
    showWarning("Spin Claimed", "You have already claimed your free daily spin today! Come back tomorrow.");
    return;
  }
  const modal = document.getElementById('daily-spin-modal');
  if (!modal) return;
  
  document.getElementById('spin-result-container').style.display = 'none';
  
  const spinBtn = document.getElementById('wheel-spin-btn');
  spinBtn.classList.remove('disabled');
  spinBtn.disabled = false;
  
  const canvasContainer = document.getElementById('wheel-canvas-container');
  canvasContainer.style.transition = 'none';
  canvasContainer.style.transform = 'rotate(0deg)';
  
  drawDailySpinWheel();
  
  modal.classList.add('active');
  if (audio) audio.playClick();
}

const dailySpinSegments = [
  { name: 'COMMON', rarity: 'COMMON', startDeg: 270, endDeg: 450, color: '#b0c4de', text: '#111', chance: 50 },
  { name: 'RARE', rarity: 'RARE', startDeg: 450, endDeg: 540, color: '#1eff00', text: '#111', chance: 25 },
  { name: 'SUPER RARE', rarity: 'SUPER_RARE', startDeg: 540, endDeg: 594, color: '#0070dd', text: '#fff', chance: 15 },
  { name: 'ULTRA RARE', rarity: 'ULTRA_RARE', startDeg: 594, endDeg: 612, color: '#af40ff', text: '#fff', chance: 5 },
  { name: 'LEGENDARY', rarity: 'LEGENDARY', startDeg: 612, endDeg: 621, color: '#ff8000', text: '#fff', chance: 2.5 },
  { name: 'GODLY', rarity: 'GODLY', startDeg: 621, endDeg: 629.64, color: '#00ffff', text: '#111', chance: 2.4 },
  { name: 'DARK MATTER', rarity: 'DARK_MATTER', startDeg: 629.64, endDeg: 630, color: '#ff00ff', text: '#fff', chance: 0.1 }
];

function drawDailySpinWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = cx - 12;

  ctx.clearRect(0, 0, w, h);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw proportional slices
  dailySpinSegments.forEach(seg => {
    const startRad = (seg.startDeg * Math.PI) / 180;
    const endRad = (seg.endDeg * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startRad, endRad);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw text inside slice only if chance >= 5%
    if (seg.chance >= 5) {
      ctx.save();
      ctx.translate(cx, cy);
      const midRad = (startRad + endRad) / 2;
      ctx.rotate(midRad);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seg.text;
      ctx.font = 'bold 9px "Outfit", sans-serif';
      ctx.fillText(seg.name, r - 15, 0);
      ctx.restore();
    }
  });

  // Draw gold dots decoration
  for (let i = 0; i < 24; i++) {
    const dotAngle = (i * 2 * Math.PI) / 24;
    const dx = cx + (r + 4) * Math.cos(dotAngle);
    const dy = cy + (r + 4) * Math.sin(dotAngle);
    ctx.beginPath();
    ctx.arc(dx, dy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#fff';
    ctx.fill();
  }

  // Center pin
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
  ctx.fillStyle = '#1b0e36';
  ctx.fill();
}

const TIER_WEIGHTS = {
  5: 23.0,
  6: 18.0,
  7: 14.0,
  8: 10.0,
  9: 6.0,
  10: 4.0,
  11: 5.0,
  12: 4.5,
  13: 4.0,
  14: 3.5,
  15: 2.8,
  16: 2.0,
  17: 1.2,
  18: 0.9,
  19: 0.7,
  20: 0.4
};

function rollRarity() {
  const roll = Math.random() * 100;
  if (roll < 50) return 'COMMON';
  if (roll < 75) return 'RARE';
  if (roll < 90) return 'SUPER_RARE';
  if (roll < 95) return 'ULTRA_RARE';
  if (roll < 97.5) return 'LEGENDARY';
  if (roll < 99.9) return 'GODLY';
  return 'DARK_MATTER';
}

function rollTier() {
  const weights = TIER_WEIGHTS;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (const [tier, weight] of Object.entries(weights)) {
    if (roll < weight) {
      return parseInt(tier);
    }
    roll -= weight;
  }
  return 5;
}

function getRandomBeastForDailySpin(targetTier, targetRarity) {
  const currentSys = state.currentSolarSystem || 'prime';
  const allBeasts = Object.values(BEAST_TEMPLATES).filter(b => {
    const bSys = b.system || 'prime';
    return bSys === currentSys && b.tier >= 5 && b.id !== 'shadow_fiend' && b.id !== 'shadow_fiend_evolved' && b.id !== 'void_parasite' && b.id !== 'void_parasite_evolved';
  });
  
  let matches = allBeasts.filter(b => b.tier === targetTier && b.rarity === targetRarity);
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)].id;
  }
  
  matches = allBeasts.filter(b => b.rarity === targetRarity);
  if (matches.length > 0) {
    matches.sort((a, b) => Math.abs(a.tier - targetTier) - Math.abs(b.tier - targetTier));
    const closestTier = matches[0].tier;
    const candidates = matches.filter(b => b.tier === closestTier);
    return candidates[Math.floor(Math.random() * candidates.length)].id;
  }
  
  matches = allBeasts.filter(b => b.tier === targetTier);
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)].id;
  }
  
  return allBeasts[Math.floor(Math.random() * allBeasts.length)].id;
}

function triggerDailySpin() {
  if (!checkDailySpinAvailable()) {
    showWarning("Spin Claimed", "You have already claimed your free daily spin today!");
    return;
  }
  const spinBtn = document.getElementById('wheel-spin-btn');
  spinBtn.classList.add('disabled');
  spinBtn.disabled = true;
  
  dailySpinWinningRarity = rollRarity();
  dailySpinWinningTier = rollTier();
  dailySpinWinningBeast = getRandomBeastForDailySpin(dailySpinWinningTier, dailySpinWinningRarity);
  
  const winningSegment = dailySpinSegments.find(s => s.rarity === dailySpinWinningRarity);
  const startDeg = winningSegment.startDeg;
  const endDeg = winningSegment.endDeg;
  const buffer = Math.min(1.5, (endDeg - startDeg) / 3);
  const alpha = startDeg + buffer + Math.random() * (endDeg - startDeg - 2 * buffer);
  
  const targetAngle = 1800 + (270 - alpha);
  
  const canvasContainer = document.getElementById('wheel-canvas-container');
  canvasContainer.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.15, 1)';
  canvasContainer.style.transform = `rotate(${targetAngle}deg)`;
  
  playSpinTicks(0);
  
  setTimeout(() => {
    if (audio) {
      if (['LEGENDARY', 'GODLY', 'DARK_MATTER'].includes(dailySpinWinningRarity)) {
        audio.playUnlock(dailySpinWinningRarity);
      } else {
        audio.playCrateOpen();
      }
    }
    
    document.getElementById('spin-result-container').style.display = 'flex';
    document.getElementById('spin-result-card').innerHTML = getBeastSVG(dailySpinWinningBeast, false, false);
    
    const template = BEAST_TEMPLATES[dailySpinWinningBeast];
    document.getElementById('spin-result-name').innerText = template.name;
    
    const rarityInfo = RARITIES[template.rarity];
    const rarityColor = rarityInfo ? rarityInfo.color : '#fff';
    const metaText = `Tier ${template.tier} | ${rarityInfo ? rarityInfo.name : template.rarity}`;
    
    const metaEl = document.getElementById('spin-result-meta');
    metaEl.innerText = metaText;
    metaEl.style.color = rarityColor;
    
    const today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
    state.lastDailySpinDate = today;
    saveGame();
    updateDailySpinHUD();
    
  }, 4000);
}

const totalTicks = 32;
function playSpinTicks(tickNum) {
  if (tickNum >= totalTicks) return;
  if (audio) audio.playClick();
  
  const progress = tickNum / totalTicks;
  const delay = 40 + Math.pow(progress, 2.5) * 450;
  
  setTimeout(() => {
    playSpinTicks(tickNum + 1);
  }, delay);
}

function setupDailySpin() {
  const hudBtn = document.getElementById('daily-spin-hud');
  if (hudBtn) {
    hudBtn.addEventListener('click', showDailySpinModal);
  }
  
  const closeBtn = document.getElementById('daily-spin-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('daily-spin-modal').classList.remove('active');
      if (audio) audio.playClick();
    });
  }
  
  const spinBtn = document.getElementById('wheel-spin-btn');
  if (spinBtn) {
    spinBtn.addEventListener('click', triggerDailySpin);
  }
  
  const claimBtn = document.getElementById('daily-spin-claim-btn');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      if (!dailySpinWinningBeast) return;
      
      const x = 30 + Math.random() * 40;
      const y = 35 + Math.random() * 15;
      
      spawnBeastOnField(dailySpinWinningBeast, x, y, false, false);
      
      if (!state.unlockedBeasts.includes(dailySpinWinningBeast)) {
        state.unlockedBeasts.push(dailySpinWinningBeast);
      }
      
      saveGame();
      updateHUD();
      
      document.getElementById('daily-spin-modal').classList.remove('active');
      
      spawnToastNotification(
        "BEAST CLAIMED!",
        `Your new <b>${BEAST_TEMPLATES[dailySpinWinningBeast].name}</b> has been placed in the meadow!`,
        getBeastSVG(dailySpinWinningBeast, false, false)
      );
    });
  }
  
  updateDailySpinHUD();
}

// --- INTERACTIVE ONBOARDING TUTORIAL SYSTEM ---
function startInteractiveTutorial() {
  // Clear field
  state.beastsOnField.forEach(b => b.dom.remove());
  state.beastsOnField = [];
  document.querySelectorAll('.crate-container').forEach(c => c.remove());
  document.querySelectorAll('.essence-crystal').forEach(c => c.remove());

  // Reset progress and system variables to start fresh
  state.essence = 0;
  state.prestigeLevel = 0;
  state.shopPurchases = {};
  state.unlockedIncubators = [false, false, false];
  state.upgrades = { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 };
  state.unlockedBeasts = ['sparky', 'floaty_ray'];
  state.unlockedEvolved = [];
  state.sanctuaryBeasts = [];
  state.trophyCounts = { sparky: 1, floaty_ray: 1 };
  state.t20MergesCount = 0;
  state.premiumCratesCount = 0;
  state.doubleEssenceEndTime = 0;

  state.primeSystem = {
    essence: 0,
    prestigeLevel: 0,
    shopPurchases: {},
    unlockedIncubators: [false, false, false],
    upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
    incubators: [
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
    ],
    beastsOnField: []
  };
  state.lowGravitySystem = {
    essence: 0,
    prestigeLevel: 0,
    shopPurchases: {},
    unlockedIncubators: [false, false, false],
    upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
    incubators: [
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
      { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
    ],
    beastsOnField: []
  };

  updateHUD();
  renderShop();
  renderBeastopedia();
  renderSanctuary();

  state.tutorialStage = 1;
  document.body.classList.add('interactive-tutorial-active');
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.style.display = 'none';
  
  // Spawn 3 crates instantly
  spawnCrateOnField();
  spawnCrateOnField();
  spawnCrateOnField();

  updateTutorialStage();
}

function updateTutorialStage() {
  // Clear any existing tutorial glows
  document.querySelectorAll('.tutorial-glow').forEach(el => {
    el.classList.remove('tutorial-glow');
  });

  // Remove stage classes from body
  document.body.classList.remove('stage-1', 'stage-2', 'stage-3');

  const banner = document.getElementById('tutorial-banner');
  if (!banner) return;

  if (state.tutorialStage >= 1 && state.tutorialStage <= 2) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }

  const bannerText = banner.querySelector('.tutorial-banner-text');

  switch (state.tutorialStage) {
    case 1:
      document.body.classList.add('stage-1');
      if (bannerText) bannerText.innerText = "A few beast crates have landed! Tap on them to open them!";
      const crates = document.querySelectorAll('.crate-container');
      crates.forEach(c => c.classList.add('tutorial-glow'));
      break;
    case 2:
      document.body.classList.add('stage-2');
      if (bannerText) bannerText.innerText = "Drag one Sparky onto another to merge and evolve them!";
      const beasts = document.querySelectorAll('.beast-container');
      beasts.forEach(b => b.classList.add('tutorial-glow'));
      break;
    case 3:
      document.body.classList.remove('interactive-tutorial-active');
      showTutorialStep(1); // Show completion slide
      break;
  }
}

function showTutorialStep(step) {
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';

  const titleEl = document.getElementById('tutorial-step-title');
  const descEl = document.getElementById('tutorial-step-desc');
  const nextBtn = document.getElementById('tutorial-next-btn');
  const skipBtn = document.getElementById('tutorial-skip-btn');

  if (step === 0) {
    titleEl.innerText = "Welcome, Creator!";
    descEl.innerText = "Learn the basics of growing your sanctuary by taking a short, interactive tour.";
    if (skipBtn) skipBtn.style.display = 'inline-block';
    nextBtn.innerText = "Start Tutorial";
  } else if (step === 1) {
    titleEl.innerText = "Masterfully Done!";
    descEl.innerText = "You have evolved your first beast! Continue merging, exploring new solar systems, and restoring the biomes.";
    if (skipBtn) skipBtn.style.display = 'none';
    nextBtn.innerText = "Finish";
  }
}

function setupTutorialListeners() {
  const skipBtn = document.getElementById('tutorial-skip-btn');
  const nextBtn = document.getElementById('tutorial-next-btn');
  const overlay = document.getElementById('tutorial-overlay');

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      // Clear active field DOM and arrays
      state.beastsOnField.forEach(b => b.dom.remove());
      state.beastsOnField = [];
      document.querySelectorAll('.essence-crystal').forEach(c => c.remove());
      document.querySelectorAll('.crate-container').forEach(c => c.remove());
      if (particles) particles.clear();

      state.isTutorialCompleted = true;
      document.body.classList.remove('interactive-tutorial-active');
      overlay.style.display = 'none';
      const banner = document.getElementById('tutorial-banner');
      if (banner) banner.style.display = 'none';
      
      // Reset all progress to 0 on skip as well since it's a fresh start!
      state.essence = 0;
      state.prestigeLevel = 0;
      state.shopPurchases = {};
      state.unlockedIncubators = [false, false, false];
      state.upgrades = { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 };
      state.unlockedBeasts = ['sparky', 'floaty_ray'];
      state.unlockedEvolved = [];
      state.sanctuaryBeasts = [];
      state.trophyCounts = { sparky: 1, floaty_ray: 1 };
      state.t20MergesCount = 0;
      state.premiumCratesCount = 0;
      state.doubleEssenceEndTime = 0;

      state.primeSystem = {
        essence: 0,
        prestigeLevel: 0,
        shopPurchases: {},
        unlockedIncubators: [false, false, false],
        upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
        incubators: [
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
        ],
        beastsOnField: []
      };
      state.lowGravitySystem = {
        essence: 0,
        prestigeLevel: 0,
        shopPurchases: {},
        unlockedIncubators: [false, false, false],
        upgrades: { meadowCapacity: 0, crateSpeed: 0, crateQuality: 0, luckCharms: 0, autoCollector: 0, activeClicks: 0, crateAutoOpener: 0, essenceMagnet: 0, doubleMergeChance: 0 },
        incubators: [
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false },
          { active: false, beastType: null, timer: 0, maxTime: 15, complete: false, isInfected: false, evolvedState: false }
        ],
        beastsOnField: []
      };

      updateHUD();
      renderShop();
      renderBeastopedia();
      renderSanctuary();

      // Spawn default Sparkys so the field is populated
      if (state.beastsOnField.length === 0) {
        spawnBeastOnField('sparky', 30, 50, false, false);
        spawnBeastOnField('sparky', 60, 50, false, false);
      }
      
      saveGame();
      if (audio) audio.playClick();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.innerText === "Start Tutorial") {
        startInteractiveTutorial();
      } else {
        // Finish
        state.isTutorialCompleted = true;
        document.body.classList.remove('interactive-tutorial-active');
        overlay.style.display = 'none';
        const banner = document.getElementById('tutorial-banner');
        if (banner) banner.style.display = 'none';
        
        saveGame();
      }
      if (audio) audio.playClick();
    });
  }
}

