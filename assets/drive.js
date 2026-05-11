(() => {
  const THREE_OK = typeof THREE !== "undefined";
  const pathEl = document.getElementById("drive-track");
  const canvas = document.getElementById("driveCanvas");

  if (!THREE_OK || !pathEl || !canvas) {
    return;
  }

  const LAP_LENGTH_M = 20832;
  const TRACK_BASE_Y = 18;
  const SAMPLE_COUNT = 2400;
  const EDGE_LINE_WIDTH = 0.16;
  const KERB_UV_DIVISOR = 5;
  const LABEL_LEAD_TIME = 2.5;
  const FOREST_SPACING_M = 34;
  const DISTANCE_BOARD_OFFSET = 6.4;
  const WORLD_UP = new THREE.Vector3(0, 1, 0);

  const TRACKSIDE_SIGNS = [
    { p: 0.002, label: "START", side: 1, accent: "#d9c16d" },
    { p: 0.117, label: "FLUGPLATZ", side: -1, accent: "#9ec5ff" },
    { p: 0.205, label: "FOXHOLE", side: 1, accent: "#ff725c" },
    { p: 0.420, label: "BERGWERK", side: -1, accent: "#d9c16d" },
    { p: 0.571, label: "KARUSSELL", side: 1, accent: "#ff725c" },
    { p: 0.681, label: "BRUNNCHEN", side: -1, accent: "#9ec5ff" },
    { p: 0.853, label: "DOT. HOHE", side: 1, accent: "#d9c16d" }
  ];

  const DISTANCE_BOARD_GROUPS = [
    { p: 0.235, side: -1 },
    { p: 0.566, side: 1 },
    { p: 0.721, side: -1 },
    { p: 0.966, side: 1 }
  ];

  const ICONS = {
    play:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"></path></svg>',
    pause:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7z"></path><path d="M14 5h3v14h-3z"></path></svg>',
    reset:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6"></path><path d="M4 4v5h5"></path></svg>',
    back:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6L4 12l6 6"></path><path d="M5 12h15"></path></svg>'
  };

  const COPY = {
    en: {
      title: "Nürburgring Drive",
      subtitle: "Nordschleife",
      cruise: "Cruise",
      lap: "Lap",
      position: "Position",
      running: "RUNNING",
      paused: "PAUSED",
      auto: "AUTO CRUISE",
      hold: "ON HOLD",
      back: "Map",
      reset: "Reset",
      pause: "Pause",
      play: "Play",
      speed: "Speed",
      badge: "Sector"
    },
    cn: {
      title: "纽北第一人称巡航",
      subtitle: "北环",
      cruise: "巡航",
      lap: "圈",
      position: "位置",
      running: "运行中",
      paused: "已暂停",
      auto: "自动巡航",
      hold: "暂停中",
      back: "地图",
      reset: "重置",
      pause: "暂停",
      play: "继续",
      speed: "速度",
      badge: "区段"
    }
  };

  const PROFILE_ANCHORS = [
    {
      p: 0.0,
      label: { en: "T13 / Start", cn: "T13 / 起点" },
      badge: { en: "Pit lane", cn: "维修区" },
      road: 14.4,
      shoulder: 1.8,
      bank: 0,
      elevation: 0,
      camHeight: 1.8,
      speedHint: 70
    },
    {
      p: 0.006,
      label: { en: "Sabine-Schmitz-Kurve", cn: "萨宾娜弯" },
      badge: { en: "Launch", cn: "起步段" },
      road: 12.1,
      shoulder: 1.2,
      bank: 0,
      elevation: 0,
      camHeight: 1.75,
      speedHint: 120
    },
    {
      p: 0.019,
      label: { en: "Hatzenbach Bogen", cn: "哈岑巴赫弧形弯" },
      badge: { en: "Technical", cn: "技术弯" },
      road: 10.0,
      shoulder: 0.8,
      bank: -1,
      elevation: 2,
      camHeight: 1.70,
      speedHint: 110
    },
    {
      p: 0.033,
      label: { en: "Hatzenbach", cn: "哈岑巴赫" },
      badge: { en: "Technical", cn: "技术弯" },
      road: 8.8,
      shoulder: 0.6,
      bank: -1,
      elevation: 4,
      camHeight: 1.68,
      speedHint: 105
    },
    {
      p: 0.065,
      label: { en: "Hoheichen", cn: "大橡树" },
      badge: { en: "Technical", cn: "技术弯" },
      road: 9.2,
      shoulder: 0.7,
      bank: 0,
      elevation: 8,
      camHeight: 1.68,
      speedHint: 120
    },
    {
      p: 0.08,
      label: { en: "Quiddelbacher Höhe", cn: "奎德巴赫高地" },
      badge: { en: "Crest", cn: "起伏" },
      road: 10.6,
      shoulder: 0.9,
      bank: 1,
      elevation: 16,
      camHeight: 1.72,
      speedHint: 190
    },
    {
      p: 0.117,
      label: { en: "Flugplatz", cn: "飞机场" },
      badge: { en: "Crest", cn: "起伏" },
      road: 10.0,
      shoulder: 0.8,
      bank: 1,
      elevation: 18,
      camHeight: 1.72,
      speedHint: 180
    },
    {
      p: 0.129,
      label: { en: "Kottenborn", cn: "科滕博恩" },
      badge: { en: "Crest", cn: "起伏" },
      road: 9.6,
      shoulder: 0.7,
      bank: 0,
      elevation: 18,
      camHeight: 1.70,
      speedHint: 160
    },
    {
      p: 0.163,
      label: { en: "Schwedenkreuz", cn: "瑞典十字" },
      badge: { en: "Fast sweep", cn: "高速弯" },
      road: 9.8,
      shoulder: 0.7,
      bank: 2,
      elevation: 20,
      camHeight: 1.72,
      speedHint: 175
    },
    {
      p: 0.179,
      label: { en: "Aremberg", cn: "阿伦山" },
      badge: { en: "Fast sweep", cn: "高速弯" },
      road: 9.4,
      shoulder: 0.7,
      bank: 1,
      elevation: 18,
      camHeight: 1.70,
      speedHint: 160
    },
    {
      p: 0.205,
      label: { en: "Foxhole", cn: "狐洞" },
      badge: { en: "Brake zone", cn: "制动区" },
      road: 8.7,
      shoulder: 0.5,
      bank: 0,
      elevation: 12,
      camHeight: 1.68,
      speedHint: 125
    },
    {
      p: 0.237,
      label: { en: "Adenauer Forst", cn: "阿德瑙森林" },
      badge: { en: "Hairpin", cn: "急弯" },
      road: 8.2,
      shoulder: 0.5,
      bank: -1,
      elevation: 6,
      camHeight: 1.66,
      speedHint: 110
    },
    {
      p: 0.277,
      label: { en: "Metzgesfeld 1", cn: "屠宰场 1" },
      badge: { en: "Flowing", cn: "流畅段" },
      road: 9.0,
      shoulder: 0.7,
      bank: 0,
      elevation: 8,
      camHeight: 1.68,
      speedHint: 140
    },
    {
      p: 0.291,
      label: { en: "Metzgesfeld 2", cn: "屠宰场 2" },
      badge: { en: "Flowing", cn: "流畅段" },
      road: 9.2,
      shoulder: 0.8,
      bank: 0,
      elevation: 9,
      camHeight: 1.68,
      speedHint: 145
    },
    {
      p: 0.305,
      label: { en: "Kallenhard", cn: "卡伦哈特" },
      badge: { en: "Flowing", cn: "流畅段" },
      road: 9.2,
      shoulder: 0.8,
      bank: 0,
      elevation: 10,
      camHeight: 1.68,
      speedHint: 150
    },
    {
      p: 0.319,
      label: { en: "Spiegelkurve", cn: "镜像双子" },
      badge: { en: "Chicane", cn: "减速弯" },
      road: 8.8,
      shoulder: 0.6,
      bank: 0,
      elevation: 10,
      camHeight: 1.66,
      speedHint: 120
    },
    {
      p: 0.329,
      label: { en: "Miss-Hit-Miss", cn: "Miss-Hit-Miss" },
      badge: { en: "Chicane", cn: "减速弯" },
      road: 9.0,
      shoulder: 0.7,
      bank: 0,
      elevation: 11,
      camHeight: 1.66,
      speedHint: 115
    },
    {
      p: 0.347,
      label: { en: "Wehrseifen", cn: "防御谷" },
      badge: { en: "Slow", cn: "慢速弯" },
      road: 8.6,
      shoulder: 0.6,
      bank: -1,
      elevation: 12,
      camHeight: 1.64,
      speedHint: 95
    },
    {
      p: 0.372,
      label: { en: "Breidscheid", cn: "布雷德沙伊德" },
      badge: { en: "Low point", cn: "最低点" },
      road: 10.0,
      shoulder: 0.8,
      bank: 0,
      elevation: 4,
      camHeight: 1.68,
      speedHint: 110
    },
    {
      p: 0.385,
      label: { en: "Ex Mühle", cn: "水磨坊" },
      badge: { en: "Technical", cn: "技术弯" },
      road: 9.0,
      shoulder: 0.7,
      bank: 0,
      elevation: 8,
      camHeight: 1.66,
      speedHint: 105
    },
    {
      p: 0.408,
      label: { en: "Lauda-Links", cn: "劳达" },
      badge: { en: "Famous", cn: "名弯" },
      road: 9.4,
      shoulder: 0.7,
      bank: 0,
      elevation: 12,
      camHeight: 1.68,
      speedHint: 120
    },
    {
      p: 0.42,
      label: { en: "Bergwerk", cn: "矿山" },
      badge: { en: "Climb", cn: "爬升" },
      road: 10.2,
      shoulder: 0.9,
      bank: 1,
      elevation: 16,
      camHeight: 1.72,
      speedHint: 170
    },
    {
      p: 0.466,
      label: { en: "Kesselchen", cn: "小谷" },
      badge: { en: "Uphill", cn: "上坡" },
      road: 12,
      shoulder: 1,
      bank: 0,
      elevation: 28,
      camHeight: 1.76,
      speedHint: 210
    },
    {
      p: 0.513,
      label: { en: "Mutkurve", cn: "勇气弯" },
      badge: { en: "Fast bend", cn: "高速弯" },
      road: 9.4,
      shoulder: 0.7,
      bank: 1,
      elevation: 30,
      camHeight: 1.70,
      speedHint: 195
    },
    {
      p: 0.531,
      label: { en: "Klostertal", cn: "修道谷" },
      badge: { en: "Uphill", cn: "上坡" },
      road: 10.8,
      shoulder: 0.9,
      bank: 0,
      elevation: 28,
      camHeight: 1.74,
      speedHint: 180
    },
    {
      p: 0.552,
      label: { en: "Steilstrecke", cn: "陡坡" },
      badge: { en: "Uphill", cn: "上坡" },
      road: 10.0,
      shoulder: 0.8,
      bank: -1,
      elevation: 24,
      camHeight: 1.70,
      speedHint: 150
    },
    {
      p: 0.571,
      label: { en: "Caracciola-Karussell", cn: "卡拉乔拉旋转木马" },
      badge: { en: "Banked", cn: "水槽弯" },
      road: 7.8,
      shoulder: 0.4,
      bank: -8,
      elevation: 20,
      camHeight: 1.58,
      speedHint: 90
    },
    {
      p: 0.624,
      label: { en: "Hohe Acht", cn: "高八" },
      badge: { en: "High point", cn: "高位" },
      road: 9.0,
      shoulder: 0.6,
      bank: 1,
      elevation: 34,
      camHeight: 1.72,
      speedHint: 135
    },
    {
      p: 0.636,
      label: { en: "Hedwigshöhe", cn: "海德薇高地" },
      badge: { en: "High point", cn: "高位" },
      road: 9.2,
      shoulder: 0.7,
      bank: 0,
      elevation: 32,
      camHeight: 1.70,
      speedHint: 140
    },
    {
      p: 0.65,
      label: { en: "Wippermann", cn: "弹跳人" },
      badge: { en: "Bumpy", cn: "颠簸段" },
      road: 9.4,
      shoulder: 0.8,
      bank: 0,
      elevation: 28,
      camHeight: 1.68,
      speedHint: 145
    },
    {
      p: 0.662,
      label: { en: "Eschbach", cn: "艾许巴赫" },
      badge: { en: "Flowing", cn: "流畅段" },
      road: 9.6,
      shoulder: 0.8,
      bank: 0,
      elevation: 26,
      camHeight: 1.70,
      speedHint: 140
    },
    {
      p: 0.681,
      label: { en: "Brünnchen", cn: "小水井" },
      badge: { en: "Spectator", cn: "观众点" },
      road: 10.1,
      shoulder: 1.1,
      bank: 0,
      elevation: 24,
      camHeight: 1.72,
      speedHint: 150
    },
    {
      p: 0.692,
      label: { en: "YouTube Corner", cn: "网红弯" },
      badge: { en: "Spectator", cn: "观众点" },
      road: 10.0,
      shoulder: 1.0,
      bank: 0,
      elevation: 22,
      camHeight: 1.70,
      speedHint: 140
    },
    {
      p: 0.705,
      label: { en: "Eiskurve", cn: "冰弯" },
      badge: { en: "Slippery", cn: "易滑段" },
      road: 9.4,
      shoulder: 0.7,
      bank: -1,
      elevation: 20,
      camHeight: 1.68,
      speedHint: 130
    },
    {
      p: 0.721,
      label: { en: "Pflanzgarten 1", cn: "植物园 1" },
      badge: { en: "Jump zone", cn: "跳跃段" },
      road: 9.2,
      shoulder: 0.8,
      bank: 2,
      elevation: 14,
      camHeight: 1.68,
      speedHint: 180
    },
    {
      p: 0.746,
      label: { en: "Pflanzgarten 2", cn: "植物园 2" },
      badge: { en: "Jump zone", cn: "跳跃段" },
      road: 9.0,
      shoulder: 0.7,
      bank: 1,
      elevation: 13,
      camHeight: 1.66,
      speedHint: 170
    },
    {
      p: 0.763,
      label: { en: "Stefan-Bellof-S", cn: "斯特凡贝洛夫 S 弯" },
      badge: { en: "Chicane", cn: "减速弯" },
      road: 9.0,
      shoulder: 0.7,
      bank: 0,
      elevation: 12,
      camHeight: 1.66,
      speedHint: 140
    },
    {
      p: 0.793,
      label: { en: "Schwalbenschwanz", cn: "燕尾" },
      badge: { en: "Compress", cn: "压缩段" },
      road: 8.8,
      shoulder: 0.6,
      bank: -2,
      elevation: 10,
      camHeight: 1.64,
      speedHint: 130
    },
    {
      p: 0.815,
      label: { en: "Kleine Karussell", cn: "小旋转木马" },
      badge: { en: "Banked", cn: "水槽弯" },
      road: 8.4,
      shoulder: 0.5,
      bank: -5,
      elevation: 10,
      camHeight: 1.62,
      speedHint: 120
    },
    {
      p: 0.834,
      label: { en: "Galgenkopf", cn: "断头台" },
      badge: { en: "Exit curve", cn: "出口弯" },
      road: 10.1,
      shoulder: 0.8,
      bank: 0,
      elevation: 8,
      camHeight: 1.68,
      speedHint: 160
    },
    {
      p: 0.853,
      label: { en: "Döttinger Höhe", cn: "多廷根高地" },
      badge: { en: "Long straight", cn: "长直道" },
      road: 12.8,
      shoulder: 1.4,
      bank: 0,
      elevation: 16,
      camHeight: 1.72,
      speedHint: 240
    },
    {
      p: 0.947,
      label: { en: "Antoniusbuche", cn: "安东尼榉木" },
      badge: { en: "Intermediate", cn: "过渡段" },
      road: 10.8,
      shoulder: 1.0,
      bank: 0,
      elevation: 6,
      camHeight: 1.72,
      speedHint: 200
    },
    {
      p: 0.966,
      label: { en: "Tiergarten", cn: "动物园" },
      badge: { en: "Fast bend", cn: "高速弯" },
      road: 11.0,
      shoulder: 1.0,
      bank: 0,
      elevation: 4,
      camHeight: 1.72,
      speedHint: 190
    },
    {
      p: 0.981,
      label: { en: "Hohenrain", cn: "高雨组合弯" },
      badge: { en: "Finish setup", cn: "冲线准备" },
      road: 11.4,
      shoulder: 1,
      bank: 0,
      elevation: 2,
      camHeight: 1.74,
      speedHint: 170
    },
    {
      p: 0.994,
      label: { en: "T13", cn: "T13" },
      badge: { en: "Pit lane", cn: "维修区" },
      road: 14.4,
      shoulder: 1.8,
      bank: 0,
      elevation: 0,
      camHeight: 1.8,
      speedHint: 70
    }
  ];

  const BARRIER_ZONES = [
    { start: 0.0, end: 0.04, spacing: 8.5, side: "both", length: 7.2, height: 1.1, depth: 0.16 },
    { start: 0.18, end: 0.27, spacing: 8.5, side: "both", length: 7.2, height: 1.1, depth: 0.16 },
    { start: 0.55, end: 0.59, spacing: 7.5, side: "both", length: 6.5, height: 1.05, depth: 0.16 },
    { start: 0.68, end: 0.83, spacing: 8.5, side: "both", length: 7.2, height: 1.1, depth: 0.16 },
    { start: 0.85, end: 0.96, spacing: 9.5, side: "both", length: 8.2, height: 1.08, depth: 0.16 }
  ];

  const KERB_ZONES = [
    { start: 0.052, end: 0.083, spacing: 5.4, side: "both", length: 4.2, width: 0.85 },
    { start: 0.235, end: 0.272, spacing: 5.2, side: "both", length: 4.2, width: 0.8 },
    { start: 0.552, end: 0.59, spacing: 4.8, side: "inside", length: 3.8, width: 0.95 },
    { start: 0.694, end: 0.782, spacing: 5.4, side: "both", length: 4.4, width: 0.9 },
    { start: 0.81, end: 0.866, spacing: 5.0, side: "both", length: 4.0, width: 0.85 },
    { start: 0.962, end: 1.0, spacing: 5.2, side: "both", length: 4.0, width: 0.85 }
  ];

  const KERB_STRIP_ZONES = [
    { start: 0.052, end: 0.083, side: -1, width: 0.68 },
    { start: 0.052, end: 0.083, side: 1, width: 0.68 },
    { start: 0.235, end: 0.272, side: -1, width: 0.72 },
    { start: 0.235, end: 0.272, side: 1, width: 0.72 },
    { start: 0.552, end: 0.59, side: "inside", width: 0.76 },
    { start: 0.694, end: 0.782, side: -1, width: 0.76 },
    { start: 0.694, end: 0.782, side: 1, width: 0.76 },
    { start: 0.81, end: 0.866, side: -1, width: 0.72 },
    { start: 0.81, end: 0.866, side: 1, width: 0.72 },
    { start: 0.962, end: 0.995, side: -1, width: 0.72 },
    { start: 0.962, end: 0.995, side: 1, width: 0.72 }
  ];

  const SHOULDER_PATCH_ZONES = [
    { start: 0.052, end: 0.083, side: "both", width: 0.62 },
    { start: 0.235, end: 0.272, side: "both", width: 0.6 },
    { start: 0.552, end: 0.59, side: "inside", width: 0.68 },
    { start: 0.694, end: 0.782, side: "both", width: 0.64 },
    { start: 0.81, end: 0.866, side: "both", width: 0.6 },
    { start: 0.962, end: 0.995, side: "both", width: 0.62 }
  ];

  const rootLang = resolveLang();
  document.documentElement.lang = rootLang === "cn" ? "zh-Hans" : "en";
  const defaultSpeedKmh = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 180;
  const DRIVE_DIRECTION = 1;

  const ui = {
    app: document.querySelector(".drive-app"),
    title: document.getElementById("driveTitle"),
    subtitle: document.getElementById("driveSubtitle"),
    sectorLabel: document.getElementById("sectorLabel"),
    sectorBadge: document.getElementById("sectorBadge"),
    speedNumber: document.getElementById("speedNumber"),
    speedNote: document.getElementById("speedNote"),
    lapText: document.getElementById("lapText"),
    progressText: document.getElementById("progressText"),
    statusLine: document.getElementById("statusLine"),
    statusSub: document.getElementById("statusSub"),
    toggleBtn: document.getElementById("toggleBtn"),
    toggleLabel: document.getElementById("toggleLabel"),
    toggleIcon: document.getElementById("toggleIcon"),
    resetBtn: document.getElementById("resetBtn"),
    resetLabel: document.getElementById("resetLabel"),
    resetIcon: document.getElementById("resetIcon"),
    backBtn: document.getElementById("backBtn"),
    backLabel: document.getElementById("backLabel"),
    backIcon: document.getElementById("backIcon"),
    speedLabel: document.getElementById("speedLabel"),
    speedSlider: document.getElementById("speedSlider"),
    speedValue: document.getElementById("speedValue"),
    progressLabel: document.getElementById("progressLabel"),
    progressSlider: document.getElementById("progressSlider"),
    progressValue: document.getElementById("progressValue"),
    mapDot: document.getElementById("mapDot")
  };

  const state = {
    lang: rootLang,
    running: true,
    speedKmh: resolveInitialSpeed(defaultSpeedKmh),
    progress: resolveInitialProgress(),
    lap: 1,
    lastTs: performance.now(),
    totalSvgLength: pathEl.getTotalLength(),
    meterPerSvgUnit: 1,
    originSvgX: 330,
    originSvgY: 265,
    frames: [],
    frameCount: SAMPLE_COUNT,
    currentSegment: PROFILE_ANCHORS[0],
    lastSegmentLabel: "",
    lastLapFlash: 0,
    driveClock: 0,
    lastCssSpeed: -1,
    lastCssTurn: 99,
    lastFov: 68
  };

  const runtimeFrame = createFrameScratch();
  const labelFrame = createFrameScratch();
  const cameraBlend = {
    initialized: false,
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    up: new THREE.Vector3()
  };
  const cameraTemp = {
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    up: new THREE.Vector3()
  };
  const skyRig = {
    sunGlow: null
  };

  state.meterPerSvgUnit = LAP_LENGTH_M / state.totalSvgLength;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x091116, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1419);
  scene.fog = new THREE.Fog(0xd8dccf, 460, 3600);

  const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 5200);

  const hemi = new THREE.HemisphereLight(0xdceeff, 0x172318, 1.25);
  const sun = new THREE.DirectionalLight(0xffe0a6, 2.25);
  sun.position.set(-1600, 1650, 980);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 5200;
  sun.shadow.camera.left = -1700;
  sun.shadow.camera.right = 1700;
  sun.shadow.camera.top = 1700;
  sun.shadow.camera.bottom = -1700;
  sun.shadow.bias = -0.0002;
  const fill = new THREE.DirectionalLight(0x9fc9ff, 0.48);
  fill.position.set(900, 360, -1100);
  scene.add(hemi, sun, fill);

  const roadTexture = makeRoadTexture();
  roadTexture.wrapS = THREE.RepeatWrapping;
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(1100, 1.25);
  roadTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  roadTexture.colorSpace = THREE.SRGBColorSpace;

  const shoulderTexture = makeGroundTexture("#6a7750", "#a7a26d", 0.42);
  shoulderTexture.wrapS = THREE.RepeatWrapping;
  shoulderTexture.wrapT = THREE.RepeatWrapping;
  shoulderTexture.repeat.set(620, 1.4);
  shoulderTexture.colorSpace = THREE.SRGBColorSpace;

  const grassTexture = makeGroundTexture("#446438", "#aab26f", 0.82);
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(120, 120);
  grassTexture.colorSpace = THREE.SRGBColorSpace;

  const gravelTexture = makeGroundTexture("#716958", "#c1b48a", 0.95);
  gravelTexture.wrapS = THREE.RepeatWrapping;
  gravelTexture.wrapT = THREE.RepeatWrapping;
  gravelTexture.repeat.set(820, 1.8);
  gravelTexture.colorSpace = THREE.SRGBColorSpace;

  const meadowTexture = makeGroundTexture("#557741", "#c8c382", 0.88);
  meadowTexture.wrapS = THREE.RepeatWrapping;
  meadowTexture.wrapT = THREE.RepeatWrapping;
  meadowTexture.repeat.set(520, 2.4);
  meadowTexture.colorSpace = THREE.SRGBColorSpace;

  const kerbTexture = makeKerbTexture();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28000, 28000),
    new THREE.MeshStandardMaterial({
      color: 0x2f4a28,
      map: grassTexture,
      roughness: 1,
      metalness: 0
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x25282a,
    map: roadTexture,
    roughness: 0.83,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const shoulderMaterial = new THREE.MeshStandardMaterial({
    color: 0x77734d,
    map: shoulderTexture,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const edgeLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2ead4,
    roughness: 0.76,
    metalness: 0,
    emissive: 0x17120a,
    side: THREE.DoubleSide
  });

  const tireMarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0c0d,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const vergeMaterial = new THREE.MeshStandardMaterial({
    color: 0x607b36,
    map: grassTexture,
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const gravelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b805e,
    map: gravelTexture,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const meadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f7f3f,
    map: meadowTexture,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const kerbRedMaterial = new THREE.MeshStandardMaterial({
    color: 0xc82f28,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const kerbWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6ead4,
    roughness: 0.64,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const kerbStripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: kerbTexture,
    roughness: 0.66,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0xa4a9a4,
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide
  });

  const barrierCapMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9ced0,
    roughness: 0.36,
    metalness: 0.62
  });

  const barrierPostMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c6260,
    roughness: 0.52,
    metalness: 0.48
  });

  const treeTrunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3e2d1f,
    roughness: 0.96,
    metalness: 0
  });

  const treeCanopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x234629,
    roughness: 0.98,
    metalness: 0
  });

  const grassClumpMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b8a4f,
    roughness: 1,
    metalness: 0
  });

  const signPostMaterial = new THREE.MeshStandardMaterial({
    color: 0x707a7d,
    roughness: 0.55,
    metalness: 0.42
  });

  const roadGroup = new THREE.Group();
  scene.add(roadGroup);
  const environmentGroup = new THREE.Group();
  scene.add(environmentGroup);
  const cockpitGroup = new THREE.Group();
  cockpitGroup.renderOrder = 20;
  camera.add(cockpitGroup);
  scene.add(camera);

  buildFrames();
  buildSkyDome();
  buildRoad();
  buildEdgeLines();
  buildShoulderPatches();
  buildKerbStrips();
  buildBarriers();
  buildForest();
  buildGrassClumps();
  buildTracksideSigns();
  buildDistanceBoards();

  ui.title.textContent = COPY[state.lang].title;
  ui.subtitle.textContent = COPY[state.lang].subtitle;
  document.title = COPY[state.lang].title;
  ui.speedLabel.textContent = COPY[state.lang].speed;
  ui.progressLabel.textContent = COPY[state.lang].position;
  ui.lapText.textContent = `${COPY[state.lang].lap} 1`;
  ui.progressText.textContent = `${(state.progress * 100).toFixed(1)}%`;
  ui.speedSlider.value = String(state.speedKmh);
  ui.speedValue.textContent = String(state.speedKmh);
  ui.progressSlider.value = String(Math.round(state.progress * 1000));
  ui.speedNote.textContent = COPY[state.lang].auto;
  ui.statusLine.textContent = COPY[state.lang].running;
  ui.statusSub.textContent = COPY[state.lang].auto;
  ui.toggleLabel.textContent = COPY[state.lang].pause;
  ui.toggleIcon.innerHTML = ICONS.pause;
  ui.resetLabel.textContent = COPY[state.lang].reset;
  ui.resetIcon.innerHTML = ICONS.reset;
  ui.backLabel.textContent = COPY[state.lang].back;
  ui.backIcon.innerHTML = ICONS.back;
  ui.backBtn.href = `index.html?lang=${encodeURIComponent(state.lang)}`;

  ui.toggleBtn.addEventListener("click", () => {
    state.running = !state.running;
    state.lastTs = performance.now();
    syncStatus();
  });

  ui.resetBtn.addEventListener("click", () => {
    state.progress = 0;
    state.lap = 1;
    state.lastLapFlash = 0;
    updateSeekUI();
    syncFrameUI(true);
    state.lastTs = performance.now();
  });

  ui.speedSlider.addEventListener("input", () => {
    state.speedKmh = Number(ui.speedSlider.value);
    ui.speedValue.textContent = String(Math.round(state.speedKmh));
  });

  ui.progressSlider.addEventListener("input", () => {
    state.progress = Number(ui.progressSlider.value) / 1000;
    state.lastTs = performance.now();
    syncFrameUI(true);
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      state.running = !state.running;
      state.lastTs = performance.now();
      syncStatus();
    } else if (event.code === "KeyR") {
      state.progress = 0;
      state.lap = 1;
      state.lastLapFlash = 0;
      updateSeekUI();
      syncFrameUI(true);
      state.lastTs = performance.now();
    } else if (event.code === "ArrowUp") {
      state.speedKmh = Math.min(280, state.speedKmh + 5);
      ui.speedSlider.value = String(state.speedKmh);
      ui.speedValue.textContent = String(Math.round(state.speedKmh));
    } else if (event.code === "ArrowDown") {
      state.speedKmh = Math.max(60, state.speedKmh - 5);
      ui.speedSlider.value = String(state.speedKmh);
      ui.speedValue.textContent = String(Math.round(state.speedKmh));
    }
  });

  window.addEventListener("resize", onResize);

  syncStatus();
  syncFrameUI(true);
  requestAnimationFrame(tick);

  function resolveLang() {
    if (window.lang === "cn" || window.lang === "en") {
      return window.lang;
    }
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("lang");
    if (forced === "cn" || forced === "en") {
      return forced;
    }
    const nav = [];
    if (window.navigator && Array.isArray(window.navigator.languages)) {
      nav.push(...window.navigator.languages);
    }
    if (window.navigator && window.navigator.language) {
      nav.push(window.navigator.language);
    }
    return nav.some((item) => /^zh-/i.test(item)) ? "cn" : "en";
  }

  function resolveInitialProgress() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("progress") || params.get("pos") || params.get("p");
    if (!raw) {
      return 0;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return 0;
    }
    return clamp(value > 1 ? value / 100 : value, 0, 0.999);
  }

  function resolveInitialSpeed(defaultSpeed) {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("speed");
    if (!raw) {
      return defaultSpeed;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return defaultSpeed;
    }
    return Math.round(clamp(value, 60, 280) / 5) * 5;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function seededNoise(value) {
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function createFrameScratch() {
    return {
      position: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      road: 0,
      shoulder: 0,
      bank: 0,
      camHeight: 0,
      speedHint: 0,
      label: PROFILE_ANCHORS[0].label,
      badge: PROFILE_ANCHORS[0].badge,
      turn: 0,
      svgX: 0,
      svgY: 0
    };
  }

  function makeRoadTexture() {
    const size = 512;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = size;
    textureCanvas.height = size;
    const ctx = textureCanvas.getContext("2d");
    const base = ctx.createLinearGradient(0, 0, 0, size);
    base.addColorStop(0, "#202326");
    base.addColorStop(0.48, "#2b2d2f");
    base.addColorStop(1, "#171a1c");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    const image = ctx.getImageData(0, 0, size, size);
    const data = image.data;
    for (let index = 0; index < data.length; index += 4) {
      const n = seededNoise(index * 0.013) * 22 - 11;
      data[index] = clamp(data[index] + n, 0, 255);
      data[index + 1] = clamp(data[index + 1] + n, 0, 255);
      data[index + 2] = clamp(data[index + 2] + n, 0, 255);
    }
    ctx.putImageData(image, 0, 0);

    ctx.globalAlpha = 0.16;
    for (let y = 0; y < size; y += 13) {
      ctx.fillStyle = y % 39 === 0 ? "#070808" : "#4f5354";
      ctx.fillRect(0, y, size, 1);
    }
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#090909";
    ctx.fillRect(size * 0.32, 0, 12, size);
    ctx.fillRect(size * 0.66, 0, 10, size);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#f1e7d3";
    ctx.fillRect(size * 0.5 - 1, 0, 2, size);
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.needsUpdate = true;
    return texture;
  }

  function makeGroundTexture(a, b, fleckStrength) {
    const size = 256;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = size;
    textureCanvas.height = size;
    const ctx = textureCanvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, a);
    gradient.addColorStop(1, b);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1800; i += 1) {
      const x = seededNoise(i * 2.13) * size;
      const y = seededNoise(i * 4.71 + 8) * size;
      const alpha = 0.08 + seededNoise(i * 0.9) * 0.13 * fleckStrength;
      ctx.fillStyle = seededNoise(i) > 0.55 ? `rgba(215, 196, 120, ${alpha})` : `rgba(4, 11, 5, ${alpha})`;
      ctx.fillRect(x, y, 1 + seededNoise(i + 2) * 3, 1 + seededNoise(i + 4) * 2);
    }

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.needsUpdate = true;
    return texture;
  }

  function makeKerbTexture() {
    const width = 512;
    const height = 64;
    const slant = Math.round(height * Math.tan(18 * Math.PI / 180));
    const cycleWidth = Math.round(width / 5);
    const stripeWidth = Math.round(cycleWidth / 2);

    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const ctx = textureCanvas.getContext("2d");

    ctx.fillStyle = "#f5ead7";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#c82f28";
    for (let x = -height; x < width + height; x += cycleWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + slant, height);
      ctx.lineTo(x + slant, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#24150f";
    ctx.fillRect(0, height - 5, width, 2);
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function makeSignTexture(label, accent = "#d9c16d", compact = false) {
    const width = compact ? 180 : 384;
    const height = compact ? 112 : 160;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const ctx = textureCanvas.getContext("2d");
    ctx.fillStyle = "#0b1113";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = accent;
    ctx.lineWidth = compact ? 8 : 10;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, width, compact ? 18 : 22);
    ctx.fillStyle = "#f6f0df";
    ctx.font = compact ? "700 46px Arial, sans-serif" : "700 38px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, width / 2, compact ? height * 0.58 : height * 0.56, width - 26);
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(18, 32, width - 36, 2);
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function makeCockpitTexture() {
    const width = 1024;
    const height = 320;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const ctx = textureCanvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    const dash = ctx.createLinearGradient(0, height * 0.24, 0, height);
    dash.addColorStop(0, "rgba(6, 8, 9, 0)");
    dash.addColorStop(0.5, "rgba(8, 10, 11, 0.48)");
    dash.addColorStop(1, "rgba(2, 3, 4, 0.88)");
    ctx.fillStyle = dash;
    ctx.fillRect(0, height * 0.2, width, height * 0.8);

    ctx.fillStyle = "rgba(18, 21, 22, 0.62)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.98, width * 0.33, height * 0.16, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = "#d9c16d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.24, height * 0.58);
    ctx.lineTo(width * 0.76, height * 0.58);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function cloneFrameForPlacement(frame) {
    return {
      position: frame.position.clone(),
      tangent: frame.tangent.clone(),
      right: frame.right.clone(),
      up: frame.up.clone(),
      distance: frame.distance,
      road: frame.road,
      shoulder: frame.shoulder,
      turn: frame.turn
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function wrap01(value) {
    let result = value % 1;
    if (result < 0) {
      result += 1;
    }
    return result;
  }

  function travelProgress(progress) {
    const u = wrap01(progress);
    return DRIVE_DIRECTION < 0 ? wrap01(1 - u) : u;
  }

  function mixVec3(a, b, t, out) {
    const target = out || new THREE.Vector3();
    return target.set(
      lerp(a.x, b.x, t),
      lerp(a.y, b.y, t),
      lerp(a.z, b.z, t)
    );
  }

  function sampleProfile(progress) {
    const u = wrap01(progress);
    for (let index = 0; index < PROFILE_ANCHORS.length - 1; index += 1) {
      const a = PROFILE_ANCHORS[index];
      const b = PROFILE_ANCHORS[index + 1];
      if (u >= a.p && u < b.p) {
        const t = smooth((u - a.p) / (b.p - a.p || 1));
        return {
          label: a.label,
          badge: a.badge,
          road: lerp(a.road, b.road, t),
          shoulder: lerp(a.shoulder, b.shoulder, t),
          bank: lerp(a.bank, b.bank, t),
          elevation: lerp(a.elevation, b.elevation, t),
          camHeight: lerp(a.camHeight, b.camHeight, t),
          speedHint: lerp(a.speedHint, b.speedHint, t)
        };
      }
    }
    const last = PROFILE_ANCHORS[PROFILE_ANCHORS.length - 1];
    return {
      label: last.label,
      badge: last.badge,
      road: last.road,
      shoulder: last.shoulder,
      bank: last.bank,
      elevation: last.elevation,
      camHeight: last.camHeight,
      speedHint: last.speedHint
    };
  }

  function buildFrames() {
    const samples = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const u = index / SAMPLE_COUNT;
      const svgPoint = pathEl.getPointAtLength(state.totalSvgLength * u);
      minX = Math.min(minX, svgPoint.x);
      minY = Math.min(minY, svgPoint.y);
      maxX = Math.max(maxX, svgPoint.x);
      maxY = Math.max(maxY, svgPoint.y);
      samples.push({
        u,
        svgX: svgPoint.x,
        svgY: svgPoint.y,
        profile: sampleProfile(u)
      });
    }

    state.originSvgX = (minX + maxX) / 2;
    state.originSvgY = (minY + maxY) / 2;

    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];
      const p = sample.profile;
      sample.position = new THREE.Vector3(
        (sample.svgX - state.originSvgX) * state.meterPerSvgUnit,
        TRACK_BASE_Y + p.elevation,
        (sample.svgY - state.originSvgY) * state.meterPerSvgUnit
      );
      sample.distance = sample.u * LAP_LENGTH_M;
    }

    for (let index = 0; index < samples.length; index += 1) {
      const prev = samples[(index - 1 + samples.length) % samples.length];
      const next = samples[(index + 1) % samples.length];
      const current = samples[index];
      const tangent = mixVec3(prev.position, next.position, 0.5).sub(prev.position).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      let right = new THREE.Vector3().crossVectors(worldUp, tangent);
      if (right.lengthSq() < 1e-6) {
        right = index > 0 ? samples[index - 1].right.clone() : new THREE.Vector3(1, 0, 0);
      }
      right.normalize();
      const bankedRight = right.clone().applyAxisAngle(tangent, current.profile.bank * Math.PI / 180);
      const up = new THREE.Vector3().crossVectors(tangent, bankedRight).normalize();
      const curveTurn = Math.sign(
        (next.position.x - current.position.x) * (current.position.z - prev.position.z) -
        (next.position.z - current.position.z) * (current.position.x - prev.position.x)
      );

      current.tangent = tangent;
      current.right = bankedRight;
      current.up = up;
      current.turn = DRIVE_DIRECTION * curveTurn;
      current.label = current.profile.label;
      current.badge = current.profile.badge;
      current.road = current.profile.road;
      current.shoulder = current.profile.shoulder;
      current.bank = current.profile.bank;
      current.camHeight = current.profile.camHeight;
      current.speedHint = current.profile.speedHint;
    }

    const smoothed = samples.map((s) => ({
      tangent: s.tangent.clone(),
      right: s.right.clone()
    }));
    for (let index = 0; index < samples.length; index += 1) {
      const prev = smoothed[(index - 1 + samples.length) % samples.length];
      const next = smoothed[(index + 1) % samples.length];
      const current = samples[index];
      current.tangent = mixVec3(prev.tangent, next.tangent, 0.5).normalize();
      current.right = mixVec3(prev.right, next.right, 0.5).normalize();
      current.up.crossVectors(current.tangent, current.right).normalize();
      current.right.crossVectors(current.up, current.tangent).normalize();
    }

    state.frames = samples;
  }

  function sampleFrame(progress, out, direction = 1) {
    const u = wrap01(progress) * SAMPLE_COUNT;
    const index = Math.floor(u) % SAMPLE_COUNT;
    const nextIndex = (index + 1) % SAMPLE_COUNT;
    const t = u - Math.floor(u);
    const a = state.frames[index];
    const b = state.frames[nextIndex];
    const frame = out || createFrameScratch();
    mixVec3(a.position, b.position, t, frame.position);
    mixVec3(a.tangent, b.tangent, t, frame.tangent).multiplyScalar(direction).normalize();
    mixVec3(a.right, b.right, t, frame.right).multiplyScalar(direction).normalize();
    frame.up.crossVectors(frame.tangent, frame.right).normalize();
    frame.right.crossVectors(frame.up, frame.tangent).normalize();
    frame.road = lerp(a.road, b.road, t);
    frame.shoulder = lerp(a.shoulder, b.shoulder, t);
    frame.bank = lerp(a.bank, b.bank, t);
    frame.camHeight = lerp(a.camHeight, b.camHeight, t);
    frame.speedHint = lerp(a.speedHint, b.speedHint, t);
    frame.label = t < 0.05 ? a.label : b.label;
    frame.badge = t < 0.05 ? a.badge : b.badge;
    frame.turn = lerp(a.turn, b.turn, t);
    frame.svgX = lerp(a.svgX, b.svgX, t);
    frame.svgY = lerp(a.svgY, b.svgY, t);
    return frame;
  }

  function frameAt(progress, out) {
    return sampleFrame(travelProgress(progress), out, DRIVE_DIRECTION);
  }

  function mapFrameAt(progress, out) {
    return sampleFrame(progress, out, 1);
  }

  function buildRibbon(widthAccessor, lift, material) {
    const vertexCount = state.frames.length * 2;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(state.frames.length * 6);

    for (let index = 0; index < state.frames.length; index += 1) {
      const frame = state.frames[index];
      const width = widthAccessor(frame);
      const left = frame.position.clone()
        .addScaledVector(frame.right, -width / 2)
        .addScaledVector(frame.up, lift);
      const right = frame.position.clone()
        .addScaledVector(frame.right, width / 2)
        .addScaledVector(frame.up, lift);

      const vert = index * 6;
      positions[vert] = left.x;
      positions[vert + 1] = left.y;
      positions[vert + 2] = left.z;
      positions[vert + 3] = right.x;
      positions[vert + 4] = right.y;
      positions[vert + 5] = right.z;

      const uv = index * 4;
      uvs[uv] = frame.distance / 8;
      uvs[uv + 1] = 0;
      uvs[uv + 2] = frame.distance / 8;
      uvs[uv + 3] = 1;

      const next = (index + 1) % state.frames.length;
      const row = index * 6;
      const base = index * 2;
      const nextBase = next * 2;
      indices[row] = base;
      indices[row + 1] = base + 1;
      indices[row + 2] = nextBase;
      indices[row + 3] = base + 1;
      indices[row + 4] = nextBase + 1;
      indices[row + 5] = nextBase;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return new THREE.Mesh(geometry, material);
  }

  function buildRoad() {
    const roadEdge = (frame) => frame.road / 2;
    const vergeWidth = () => 2.6;
    const meadowWidth = (frame) => 38 + frame.shoulder * 1.25;
    const addSideBand = (widthAccessor, offsetAccessor, lift, material) => {
      const leftBand = buildOffsetRibbon(widthAccessor, (frame) => -offsetAccessor(frame), lift, material);
      const rightBand = buildOffsetRibbon(widthAccessor, offsetAccessor, lift, material);
      leftBand.receiveShadow = true;
      rightBand.receiveShadow = true;
      roadGroup.add(leftBand, rightBand);
    };

    addSideBand(
      meadowWidth,
      (frame) => roadEdge(frame) + vergeWidth(frame) + meadowWidth(frame) / 2,
      -0.22,
      meadowMaterial
    );
    addSideBand(
      vergeWidth,
      (frame) => roadEdge(frame) + vergeWidth(frame) / 2,
      -0.04,
      vergeMaterial
    );
    const road = buildRibbon((frame) => frame.road, 0.045, roadMaterial);
    road.receiveShadow = true;
    roadGroup.add(road);
    buildTireMarks();
  }

  function buildOffsetRibbon(widthAccessor, offsetAccessor, lift, material) {
    const vertexCount = state.frames.length * 2;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(state.frames.length * 6);

    for (let index = 0; index < state.frames.length; index += 1) {
      const frame = state.frames[index];
      const width = widthAccessor(frame);
      const offset = offsetAccessor(frame);
      const center = frame.position.clone()
        .addScaledVector(frame.right, offset)
        .addScaledVector(frame.up, lift);
      const left = center.clone().addScaledVector(frame.right, -width / 2);
      const right = center.clone().addScaledVector(frame.right, width / 2);

      const vert = index * 6;
      positions[vert] = left.x;
      positions[vert + 1] = left.y;
      positions[vert + 2] = left.z;
      positions[vert + 3] = right.x;
      positions[vert + 4] = right.y;
      positions[vert + 5] = right.z;

      const uv = index * 4;
      uvs[uv] = frame.distance / 8;
      uvs[uv + 1] = 0;
      uvs[uv + 2] = frame.distance / 8;
      uvs[uv + 3] = 1;

      const next = (index + 1) % state.frames.length;
      const row = index * 6;
      const base = index * 2;
      const nextBase = next * 2;
      indices[row] = base;
      indices[row + 1] = base + 1;
      indices[row + 2] = nextBase;
      indices[row + 3] = base + 1;
      indices[row + 4] = nextBase + 1;
      indices[row + 5] = nextBase;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return new THREE.Mesh(geometry, material);
  }

  function buildFrameRibbon(frames, widthAccessor, offsetAccessor, lift, material, closed = false, uvDivisor = null) {
    if (!frames.length) {
      return null;
    }

    const vertexCount = frames.length * 2;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const segmentCount = closed ? frames.length : Math.max(0, frames.length - 1);
    const indices = new Uint32Array(segmentCount * 6);
    const startDistance = frames[0].distance || 0;
    const endDistance = frames[frames.length - 1].distance || startDistance + 1;
    const span = Math.max(1, endDistance - startDistance);

    for (let index = 0; index < frames.length; index += 1) {
      const frame = frames[index];
      const width = widthAccessor(frame, index, frames);
      const offset = offsetAccessor(frame, index, frames);
      const center = frame.position.clone()
        .addScaledVector(frame.right, offset)
        .addScaledVector(frame.up, lift);
      const left = center.clone().addScaledVector(frame.right, -width / 2);
      const right = center.clone().addScaledVector(frame.right, width / 2);

      const vert = index * 6;
      positions[vert] = left.x;
      positions[vert + 1] = left.y;
      positions[vert + 2] = left.z;
      positions[vert + 3] = right.x;
      positions[vert + 4] = right.y;
      positions[vert + 5] = right.z;

      const uv = index * 4;
      const u = uvDivisor != null
        ? (frame.distance || 0) / uvDivisor
        : ((frame.distance || startDistance) - startDistance) / span * 6;
      uvs[uv] = u;
      uvs[uv + 1] = 0;
      uvs[uv + 2] = u;
      uvs[uv + 3] = 1;

      if (index < frames.length - 1 || closed) {
        const nextBase = ((index + 1) % frames.length) * 2;
        const row = index * 6;
        const base = index * 2;
        indices[row] = base;
        indices[row + 1] = base + 1;
        indices[row + 2] = nextBase;
        indices[row + 3] = base + 1;
        indices[row + 4] = nextBase + 1;
        indices[row + 5] = nextBase;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return new THREE.Mesh(geometry, material);
  }

  function collectZoneFrames(start, end) {
    const frames = [];
    const scratch = createFrameScratch();
    const zoneStart = wrap01(start);
    const zoneEnd = wrap01(end);

    const appendSample = (progress) => {
      const sample = sampleFrame(progress, scratch, 1);
      sample.distance = progress * LAP_LENGTH_M;
      frames.push(cloneFrameForPlacement(sample));
    };

    appendSample(zoneStart);
    state.frames.forEach((frame) => {
      if (zoneStart <= zoneEnd) {
        if (frame.u > zoneStart && frame.u < zoneEnd) {
          frames.push(cloneFrameForPlacement(frame));
        }
      } else if (frame.u > zoneStart || frame.u < zoneEnd) {
        const copy = cloneFrameForPlacement(frame);
        copy.distance = frame.u > zoneStart ? frame.distance : frame.distance + LAP_LENGTH_M;
        frames.push(copy);
      }
    });
    appendSample(zoneEnd > zoneStart ? zoneEnd : zoneEnd + 1);

    return frames;
  }

  function buildEdgeLines() {
    const inset = 0.22;
    const leftLine = buildOffsetRibbon(
      () => EDGE_LINE_WIDTH,
      (frame) => -frame.road / 2 + inset,
      0.085,
      edgeLineMaterial
    );
    const rightLine = buildOffsetRibbon(
      () => EDGE_LINE_WIDTH,
      (frame) => frame.road / 2 - inset,
      0.085,
      edgeLineMaterial
    );
    roadGroup.add(leftLine, rightLine);
  }

  function buildTireMarks() {
    const leftMark = buildOffsetRibbon(
      () => 0.18,
      (frame) => -Math.min(frame.road * 0.22, 1.15) + frame.turn * 0.18,
      0.095,
      tireMarkMaterial
    );
    const rightMark = buildOffsetRibbon(
      () => 0.16,
      (frame) => Math.min(frame.road * 0.22, 1.15) + frame.turn * 0.18,
      0.096,
      tireMarkMaterial
    );
    leftMark.renderOrder = 2;
    rightMark.renderOrder = 2;
    roadGroup.add(leftMark, rightMark);
  }

  function buildKerbStrips() {
    KERB_STRIP_ZONES.forEach((zone) => {
      const frames = collectZoneFrames(zone.start, zone.end);
      const strip = buildFrameRibbon(
        frames,
        () => zone.width,
        (frame) => {
          const roadEdge = frame.road / 2;
          if (zone.side === "inside") {
            return frame.turn >= 0 ? -roadEdge - frame.shoulder * 0.28 : roadEdge + frame.shoulder * 0.28;
          }
          return zone.side < 0 ? -roadEdge - frame.shoulder * 0.18 : roadEdge + frame.shoulder * 0.18;
        },
        0.11,
        kerbStripeMaterial,
        false,
        KERB_UV_DIVISOR
      );
      if (strip) {
        strip.renderOrder = 3;
        roadGroup.add(strip);
      }
    });
  }

  function buildShoulderPatches() {
    SHOULDER_PATCH_ZONES.forEach((zone) => {
      const frames = collectZoneFrames(zone.start, zone.end);
      const patch = buildFrameRibbon(
        frames,
        () => zone.width,
        (frame) => {
          const roadEdge = frame.road / 2;
          if (zone.side === "inside") {
            return frame.turn >= 0 ? -roadEdge - frame.shoulder * 0.48 : roadEdge + frame.shoulder * 0.48;
          }
          return zone.side < 0 ? -roadEdge - frame.shoulder * 0.42 : roadEdge + frame.shoulder * 0.42;
        },
        -0.026,
        shoulderMaterial,
        false
      );
      if (patch) {
        patch.renderOrder = 2;
        roadGroup.add(patch);
      }
    });
  }

  function buildSkyDome() {
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    gradient.addColorStop(0, "#6e8f9d");
    gradient.addColorStop(0.28, "#bcced3");
    gradient.addColorStop(0.58, "#efe8c9");
    gradient.addColorStop(0.78, "#e0d7b3");
    gradient.addColorStop(1, "#c8c6b0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 24; i += 1) {
      const y = 42 + seededNoise(i * 9.1) * 190;
      const x = seededNoise(i * 5.3) * skyCanvas.width;
      const w = 150 + seededNoise(i * 2.7) * 340;
      const h = 12 + seededNoise(i * 4.2) * 34;
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, w);
      cloud.addColorStop(0, "rgba(255,255,255,0.68)");
      cloud.addColorStop(0.55, "rgba(255,255,255,0.22)");
      cloud.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, seededNoise(i) * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const sun = ctx.createRadialGradient(178, 92, 0, 178, 92, 132);
    sun.addColorStop(0, "rgba(255, 247, 214, 0.92)");
    sun.addColorStop(0.32, "rgba(255, 226, 162, 0.38)");
    sun.addColorStop(1, "rgba(255, 226, 162, 0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(178, 92, 118, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(104, 120, 88, 0.17)";
    ctx.beginPath();
    ctx.moveTo(0, 390);
    for (let x = 0; x <= skyCanvas.width; x += 48) {
      const y = 344 + seededNoise(x * 0.17) * 28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(skyCanvas.width, skyCanvas.height);
    ctx.lineTo(0, skyCanvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(84, 97, 74, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, 414);
    for (let x = 0; x <= skyCanvas.width; x += 38) {
      ctx.lineTo(x, 390 + seededNoise(x * 0.39 + 14) * 20);
    }
    ctx.lineTo(skyCanvas.width, skyCanvas.height);
    ctx.lineTo(0, skyCanvas.height);
    ctx.closePath();
    ctx.fill();

    const mist = ctx.createLinearGradient(0, 300, 0, skyCanvas.height);
    mist.addColorStop(0, "rgba(255,255,255,0)");
    mist.addColorStop(0.6, "rgba(245,243,231,0.14)");
    mist.addColorStop(1, "rgba(232,233,221,0.34)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 300, skyCanvas.width, skyCanvas.height - 300);

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.mapping = THREE.UVMapping;
    skyTexture.needsUpdate = true;
    scene.background = skyTexture;

    const sunGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshBasicMaterial({
        color: 0xffd889,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      })
    );
    sunGlow.position.set(-3500, 1450, 2300);
    sunGlow.lookAt(0, 120, 0);
    environmentGroup.add(sunGlow);
    skyRig.sunGlow = sunGlow;
  }

  function buildForest() {
    const placements = [];
    const staticFrame = createFrameScratch();
    for (let distance = 0; distance < LAP_LENGTH_M; distance += FOREST_SPACING_M) {
      const progress = distance / LAP_LENGTH_M;
      if (progress < 0.04 || progress > 0.97) {
        continue;
      }
      const frame = mapFrameAt(distance / LAP_LENGTH_M, staticFrame);
      [-1, 1].forEach((side) => {
        const densityNoise = seededNoise(distance * 0.071 + side * 17);
        if (densityNoise < 0.14) {
          return;
        }
        const offset = frame.road / 2 + frame.shoulder + 24 + seededNoise(distance * 0.11 + side) * 34;
        const height = 4.2 + seededNoise(distance * 0.23 + side * 9) * 5.6;
        const radius = 0.92 + seededNoise(distance * 0.31 + side * 4) * 1.55;
        placements.push({
          frame: cloneFrameForPlacement(frame),
          side,
          offset,
          height,
          radius,
          lean: (seededNoise(distance * 0.41 + side) - 0.5) * 0.18
        });
      });
    }

    if (!placements.length) {
      return;
    }

    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.38, 1, 7);
    const canopyGeo = new THREE.ConeGeometry(1, 1, 10);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, treeTrunkMaterial, placements.length);
    const canopyMesh = new THREE.InstancedMesh(canopyGeo, treeCanopyMaterial, placements.length);
    trunkMesh.castShadow = true;
    canopyMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    canopyMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const axis = new THREE.Vector3(1, 0, 0);

    placements.forEach((placement, index) => {
      const base = placement.frame.position.clone()
        .addScaledVector(placement.frame.right, placement.side * placement.offset);
      const up = placement.frame.up;
      quat.setFromAxisAngle(axis, placement.lean);
      matrix.compose(
        base.clone().addScaledVector(up, -0.14 + placement.height * 0.16),
        quat,
        scale.set(0.52, placement.height * 0.38, 0.52)
      );
      trunkMesh.setMatrixAt(index, matrix);

      const canopyOffset = placement.height * 0.43;
      matrix.compose(
        base.clone().addScaledVector(up, canopyOffset),
        quat,
        scale.set(placement.radius * 1.02, placement.height * 0.62, placement.radius * 1.02)
      );
      canopyMesh.setMatrixAt(index, matrix);
    });

    environmentGroup.add(trunkMesh, canopyMesh);
  }

  function buildGrassClumps() {
    const placements = [];
    const staticFrame = createFrameScratch();
    for (let distance = 18; distance < LAP_LENGTH_M; distance += 18) {
      const frame = mapFrameAt(distance / LAP_LENGTH_M, staticFrame);
      [-1, 1].forEach((side) => {
        if (seededNoise(distance * 0.42 + side * 3) < 0.36) {
          return;
        }
        const offset = frame.road / 2 + frame.shoulder + 2.1 + seededNoise(distance * 0.17 + side) * 6.4;
        placements.push({
          frame: cloneFrameForPlacement(frame),
          side,
          offset,
          height: 0.18 + seededNoise(distance * 0.6 + side) * 0.32,
          width: 0.2 + seededNoise(distance * 0.28 + side) * 0.34
        });
      });
    }

    if (!placements.length) {
      return;
    }

    const clumpGeo = new THREE.ConeGeometry(1, 1, 4);
    const clumpMesh = new THREE.InstancedMesh(clumpGeo, grassClumpMaterial, placements.length);
    clumpMesh.castShadow = true;
    clumpMesh.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    placements.forEach((placement, index) => {
      const frame = placement.frame;
      const position = frame.position.clone()
        .addScaledVector(frame.right, placement.side * placement.offset)
        .addScaledVector(frame.up, -0.12 + placement.height * 0.08);
      quat.setFromAxisAngle(frame.tangent, (seededNoise(index * 1.7) - 0.5) * 0.38);
      matrix.compose(position, quat, scale.set(placement.width, placement.height, placement.width));
      clumpMesh.setMatrixAt(index, matrix);
    });

    roadGroup.add(clumpMesh);
  }

  function buildTracksideSigns() {
    const staticFrame = createFrameScratch();
    TRACKSIDE_SIGNS.forEach((sign) => {
      const frame = mapFrameAt(sign.p, staticFrame);
      const group = new THREE.Group();
      const offset = frame.road / 2 + frame.shoulder + 4.8;
      group.position.copy(frame.position)
        .addScaledVector(frame.right, sign.side * offset)
        .addScaledVector(WORLD_UP, 2.35);
      group.lookAt(frame.position.clone().addScaledVector(frame.tangent, 25));

      const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
      const leftPost = new THREE.Mesh(postGeo, signPostMaterial);
      const rightPost = new THREE.Mesh(postGeo, signPostMaterial);
      leftPost.position.set(-1.05, -0.85, 0);
      rightPost.position.set(1.05, -0.85, 0);
      leftPost.castShadow = true;
      rightPost.castShadow = true;

      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.18),
        new THREE.MeshStandardMaterial({
          map: makeSignTexture(sign.label, sign.accent),
          roughness: 0.48,
          metalness: 0.04,
          side: THREE.DoubleSide
        })
      );
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(leftPost, rightPost, board);
      environmentGroup.add(group);
    });
  }

  function buildDistanceBoards() {
    const staticFrame = createFrameScratch();
    DISTANCE_BOARD_GROUPS.forEach((group) => {
      [150, 100, 50].forEach((mark, index) => {
        const boardProgress = wrap01(group.p - (mark / LAP_LENGTH_M));
        const frame = mapFrameAt(boardProgress, staticFrame);
        const marker = new THREE.Group();
        const offset = frame.road / 2 + frame.shoulder + DISTANCE_BOARD_OFFSET;
        marker.position.copy(frame.position)
          .addScaledVector(frame.right, group.side * offset)
          .addScaledVector(WORLD_UP, 1.55);
        marker.lookAt(frame.position.clone().addScaledVector(frame.tangent, 18));
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 1.7, 8),
          signPostMaterial
        );
        post.position.y = -0.48;
        const board = new THREE.Mesh(
          new THREE.PlaneGeometry(1.05, 0.7),
          new THREE.MeshStandardMaterial({
            map: makeSignTexture(String(mark), index === 2 ? "#ff725c" : "#f5efe2", true),
            roughness: 0.5,
            side: THREE.DoubleSide
          })
        );
        marker.add(post, board);
        environmentGroup.add(marker);
      });
    });
  }

  function buildCockpitOverlay() {
    const texture = makeCockpitTexture();
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false
    });
    const cockpit = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.54), material);
    cockpit.position.set(0, -0.52, -0.86);
    cockpit.renderOrder = 40;
    cockpitGroup.add(cockpit);
  }

  function buildBarriers() {
    const placements = [];
    const zoneGroups = new Map();
    const staticFrame = createFrameScratch();
    BARRIER_ZONES.forEach((zone, zoneIndex) => {
      for (let distance = zone.start * LAP_LENGTH_M; distance < zone.end * LAP_LENGTH_M; distance += zone.spacing) {
        const frame = mapFrameAt(distance / LAP_LENGTH_M, staticFrame);
        if (zone.side === "both" || zone.side === "left") {
          const placement = { frame: cloneFrameForPlacement(frame), side: -1, zone, zoneIndex };
          placements.push(placement);
          const key = `${zoneIndex}:left`;
          if (!zoneGroups.has(key)) {
            zoneGroups.set(key, []);
          }
          zoneGroups.get(key).push(placement);
        }
        if (zone.side === "both" || zone.side === "right") {
          const placement = { frame: cloneFrameForPlacement(frame), side: 1, zone, zoneIndex };
          placements.push(placement);
          const key = `${zoneIndex}:right`;
          if (!zoneGroups.has(key)) {
            zoneGroups.set(key, []);
          }
          zoneGroups.get(key).push(placement);
        }
      }
    });

    const upperRails = [];
    const lowerRails = [];
    zoneGroups.forEach((groupPlacements) => {
      if (!groupPlacements.length) {
        return;
      }
      groupPlacements.sort((a, b) => a.frame.distance - b.frame.distance);
      const { zone, side } = groupPlacements[0];
      const frames = groupPlacements.map((placement) => placement.frame);
      const offsetAccessor = (frame) => side * (frame.road / 2 + frame.shoulder + 1.45);
      const upperRail = buildFrameRibbon(frames, () => 0.18, offsetAccessor, zone.height * 0.64, barrierMaterial);
      const lowerRail = buildFrameRibbon(frames, () => 0.16, offsetAccessor, zone.height * 0.26, barrierCapMaterial);
      if (upperRail) {
        upperRail.castShadow = true;
        upperRail.receiveShadow = true;
        upperRail.renderOrder = 4;
        upperRails.push(upperRail);
      }
      if (lowerRail) {
        lowerRail.castShadow = true;
        lowerRail.receiveShadow = true;
        lowerRail.renderOrder = 4;
        lowerRails.push(lowerRail);
      }
    });

    const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), barrierPostMaterial, placements.length);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    const postMatrix = new THREE.Matrix4();
    const identity = new THREE.Quaternion();

    placements.forEach((placement, index) => {
      const { frame, side, zone } = placement;
      const offset = frame.road / 2 + frame.shoulder + 1.42;
      postMatrix.compose(
        frame.position.clone()
          .addScaledVector(frame.right, side * (offset - 0.1))
          .addScaledVector(WORLD_UP, zone.height * 0.14 + 0.18),
        identity,
        new THREE.Vector3(0.16, 1.08, 0.16)
      );
      postMesh.setMatrixAt(index, postMatrix);
    });

    roadGroup.add(...upperRails, ...lowerRails, postMesh);
  }

  function syncStatus() {
    const copy = COPY[state.lang];
    ui.toggleLabel.textContent = state.running ? copy.pause : copy.play;
    ui.toggleIcon.innerHTML = state.running ? ICONS.pause : ICONS.play;
    ui.statusLine.textContent = state.running ? copy.running : copy.paused;
    ui.statusSub.textContent = state.running ? copy.auto : copy.hold;
    ui.backLabel.textContent = copy.back;
    ui.resetLabel.textContent = copy.reset;
    ui.speedLabel.textContent = copy.speed;
    ui.progressLabel.textContent = copy.position;
    ui.lapText.textContent = `${copy.lap} ${state.lap}`;
  }

  function syncFrameUI(force = false, frame = null) {
    const activeFrame = frame || frameAt(state.progress, runtimeFrame);
    const lookAhead = ((state.effectiveSpeed || state.speedKmh) / 3.6) * LABEL_LEAD_TIME / LAP_LENGTH_M;
    const aheadFrame = frameAt(state.progress + lookAhead, labelFrame);
    const copy = COPY[state.lang];

    if (force || aheadFrame.label[state.lang] !== state.lastSegmentLabel) {
      ui.sectorLabel.textContent = aheadFrame.label[state.lang];
      ui.sectorBadge.textContent = aheadFrame.badge[state.lang];
      ui.speedNote.textContent = `${copy.badge} · ${aheadFrame.badge[state.lang]}`;
      state.lastSegmentLabel = aheadFrame.label[state.lang];
    }

    const speed = Math.round(state.effectiveSpeed || state.speedKmh);
    ui.speedNumber.textContent = String(speed);
    ui.speedValue.textContent = String(speed);
    ui.progressText.textContent = `${(state.progress * 100).toFixed(1)}%`;
    ui.progressValue.textContent = `${(state.progress * 100).toFixed(1)}%`;
    ui.lapText.textContent = `${copy.lap} ${state.lap}`;
    ui.mapDot.setAttribute("cx", String(activeFrame.svgX));
    ui.mapDot.setAttribute("cy", String(activeFrame.svgY));
    ui.mapDot.setAttribute("r", state.running ? "5" : "4.2");
    ui.progressSlider.value = String(Math.round(state.progress * 1000));
  }

  function updateSeekUI() {
    ui.progressSlider.value = String(Math.round(state.progress * 1000));
    ui.progressText.textContent = `${(state.progress * 100).toFixed(1)}%`;
    ui.progressValue.textContent = `${(state.progress * 100).toFixed(1)}%`;
  }

  function updateVisualFeedback(frame) {
    if (!ui.app) {
      return;
    }
    const speedRatio = clamp(((state.effectiveSpeed || state.speedKmh) - 60) / 220, 0, 1);
    const turn = clamp(frame.turn, -1, 1);
    const cssSpeed = Math.round(speedRatio * 100);
    const cssTurn = Math.round(turn * 100) / 100;
    if (cssSpeed !== state.lastCssSpeed) {
      ui.app.style.setProperty("--speed", String(cssSpeed / 100));
      state.lastCssSpeed = cssSpeed;
    }
    if (cssTurn !== state.lastCssTurn) {
      ui.app.style.setProperty("--turn", String(cssTurn));
      state.lastCssTurn = cssTurn;
    }
  }

  function updateCamera(frame, delta) {
    const displaySpeed = state.effectiveSpeed || state.speedKmh;
    const speedRatio = clamp((displaySpeed - 60) / 220, 0, 1);
    const lookAhead = Math.max(54, Math.min(132, 58 + displaySpeed * 0.24));
    const cameraHeight = frame.camHeight + 0.8;
    const bob = Math.sin(state.driveClock * (5 + speedRatio * 5)) * (0.008 + speedRatio * 0.015);
    const lateral = Math.sin(state.driveClock * 2.2) * speedRatio * 0.03;
    const turnLean = clamp(frame.turn, -1, 1) * (0.18 + speedRatio * 0.2);
    const desiredPosition = cameraTemp.position.set(
      frame.position.x + frame.up.x * (cameraHeight + bob) + frame.right.x * (0.25 + lateral - turnLean),
      frame.position.y + frame.up.y * (cameraHeight + bob) + frame.right.y * (0.25 + lateral - turnLean),
      frame.position.z + frame.up.z * (cameraHeight + bob) + frame.right.z * (0.25 + lateral - turnLean)
    );
    const desiredTarget = cameraTemp.target.set(
      frame.position.x + frame.tangent.x * lookAhead + frame.up.x * (frame.camHeight * 0.36 + bob * 0.4) + frame.right.x * (-turnLean * 6),
      frame.position.y + frame.tangent.y * lookAhead + frame.up.y * (frame.camHeight * 0.36 + bob * 0.4) + frame.right.y * (-turnLean * 6),
      frame.position.z + frame.tangent.z * lookAhead + frame.up.z * (frame.camHeight * 0.36 + bob * 0.4) + frame.right.z * (-turnLean * 6)
    );
    const desiredUp = cameraTemp.up.set(0, 1, 0).lerp(frame.up, 0.2 + speedRatio * 0.08).normalize();

    if (!cameraBlend.initialized) {
      cameraBlend.position.copy(desiredPosition);
      cameraBlend.target.copy(desiredTarget);
      cameraBlend.up.copy(desiredUp);
      cameraBlend.initialized = true;
    } else {
      const smoothing = 1 - Math.exp(-Math.max(delta, 0.008) * (22 + Math.max(0, displaySpeed - 60) * 0.045));
      cameraBlend.position.lerp(desiredPosition, smoothing);
      cameraBlend.target.lerp(desiredTarget, smoothing);
      cameraBlend.up.lerp(desiredUp, smoothing).normalize();
    }

    camera.position.copy(cameraBlend.position);
    camera.up.copy(cameraBlend.up);
    camera.lookAt(cameraBlend.target);
    if (skyRig.sunGlow) {
      skyRig.sunGlow.position.copy(camera.position).add(new THREE.Vector3(-850, 520, 960));
      skyRig.sunGlow.lookAt(camera.position);
    }

    const targetFov = 66 + speedRatio * 10;
    if (Math.abs(targetFov - state.lastFov) > 0.02) {
      state.lastFov = lerp(state.lastFov, targetFov, 1 - Math.exp(-Math.max(delta, 0.008) * 5));
      camera.fov = state.lastFov;
      camera.updateProjectionMatrix();
    }
  }

  function tick(now) {
    const delta = Math.min((now - state.lastTs) / 1000, 0.05);
    state.lastTs = now;

    const frame = frameAt(state.progress, runtimeFrame);

    if (state.running) {
      const currentSpeed = state.effectiveSpeed || state.speedKmh;
      const lookAheadDist = 0.01 + currentSpeed / 20000;
      const lookAheadSamples = 12;
      let minAhead = Infinity;
      let minDist = lookAheadDist;
      for (let i = 1; i <= lookAheadSamples; i += 1) {
        const d = lookAheadDist * (i / lookAheadSamples);
        const p = wrap01(state.progress + d);
        const idx = Math.floor(p * SAMPLE_COUNT) % SAMPLE_COUNT;
        const hint = state.frames[idx].speedHint;
        if (hint > 0 && hint < minAhead) {
          minAhead = hint;
          minDist = d;
        }
      }
      const brakingThreshold = 0.003 + currentSpeed * 0.000015;
      let targetSpeed;
      if (minAhead < currentSpeed - 10 && minDist < brakingThreshold) {
        targetSpeed = Math.max(minAhead, currentSpeed - 400 * delta);
      } else if (minAhead < currentSpeed - 10) {
        targetSpeed = currentSpeed;
      } else {
        targetSpeed = state.speedKmh;
      }
      const rate = targetSpeed < currentSpeed ? 1 - Math.exp(-delta * 8) : 1 - Math.exp(-delta * 2.5);
      state.effectiveSpeed = state.effectiveSpeed != null
        ? lerp(currentSpeed, targetSpeed, rate)
        : targetSpeed;
      const displaySpeed = state.effectiveSpeed;
      state.driveClock += delta * (0.72 + displaySpeed / 240);
      const advance = (displaySpeed / 3.6) * delta / LAP_LENGTH_M;
      let nextProgress = state.progress + advance;
      while (nextProgress >= 1) {
        nextProgress -= 1;
        state.lap += 1;
        state.lastLapFlash = now;
      }
      state.progress = nextProgress;
    }

    updateCamera(frame, delta);
    updateVisualFeedback(frame);
    syncFrameUI(false, frame);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  }
})();
