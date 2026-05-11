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
  const LABEL_LEAD_TIME = 2.5;

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
    { start: 0.0, end: 0.03, spacing: 8, side: "both", length: 5.8, height: 0.85, depth: 0.18 },
    { start: 0.235, end: 0.256, spacing: 7, side: "both", length: 5.2, height: 0.8, depth: 0.18 },
    { start: 0.566, end: 0.588, spacing: 6, side: "both", length: 4.2, height: 0.62, depth: 0.2 },
    { start: 0.682, end: 0.703, spacing: 7, side: "both", length: 5.8, height: 0.85, depth: 0.18 },
    { start: 0.721, end: 0.829, spacing: 9, side: "both", length: 5.8, height: 0.76, depth: 0.18 },
    { start: 0.853, end: 0.945, spacing: 10, side: "both", length: 6.6, height: 0.8, depth: 0.18 },
    { start: 0.966, end: 1.0, spacing: 7, side: "both", length: 5.8, height: 0.85, depth: 0.18 }
  ];

  const KERB_ZONES = [
    { start: 0.052, end: 0.083, spacing: 5.4, side: "both", length: 4.2, width: 0.85 },
    { start: 0.235, end: 0.272, spacing: 5.2, side: "both", length: 4.2, width: 0.8 },
    { start: 0.552, end: 0.59, spacing: 4.8, side: "inside", length: 3.8, width: 0.95 },
    { start: 0.694, end: 0.782, spacing: 5.4, side: "both", length: 4.4, width: 0.9 },
    { start: 0.81, end: 0.866, spacing: 5.0, side: "both", length: 4.0, width: 0.85 },
    { start: 0.962, end: 1.0, spacing: 5.2, side: "both", length: 4.0, width: 0.85 }
  ];

  const rootLang = resolveLang();
  document.documentElement.lang = rootLang === "cn" ? "zh-Hans" : "en";
  const defaultSpeedKmh = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 180;
  const DRIVE_DIRECTION = 1;

  const ui = {
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
    lastLapFlash: 0
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

  state.meterPerSvgUnit = LAP_LENGTH_M / state.totalSvgLength;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x071016, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071016);
  scene.fog = new THREE.FogExp2(0x071016, 0.00018);

  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 30000);

  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x0d120f, 1.0);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-0.35, 1.0, 0.5);
  scene.add(hemi, sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28000, 28000),
    new THREE.MeshStandardMaterial({
      color: 0x0d1b11,
      roughness: 1,
      metalness: 0
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1d21,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const shoulderMaterial = new THREE.MeshStandardMaterial({
    color: 0x283125,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const edgeLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6d8cf,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const kerbRedMaterial = new THREE.MeshStandardMaterial({
    color: 0xa72723,
    roughness: 0.95,
    metalness: 0
  });

  const kerbWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e3d6,
    roughness: 0.95,
    metalness: 0
  });

  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0x606873,
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide
  });

  const roadGroup = new THREE.Group();
  scene.add(roadGroup);

  buildFrames();
  buildRoad();
  buildEdgeLines();
  buildKerbs();
  buildBarriers();

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
    const value = Number(params.get("speed"));
    if (!Number.isFinite(value)) {
      return defaultSpeed;
    }
    return Math.round(clamp(value, 60, 280) / 5) * 5;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function cloneFrameForPlacement(frame) {
    return {
      position: frame.position.clone(),
      tangent: frame.tangent.clone(),
      right: frame.right.clone(),
      up: frame.up.clone(),
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
    const shoulder = buildRibbon((frame) => frame.road + frame.shoulder * 2, -0.08, shoulderMaterial);
    const road = buildRibbon((frame) => frame.road, 0.04, roadMaterial);
    roadGroup.add(shoulder);
    roadGroup.add(road);
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

  function buildKerbs() {
    const redPlacements = [];
    const whitePlacements = [];
    let blockIndex = 0;
    const staticFrame = createFrameScratch();

    KERB_ZONES.forEach((zone) => {
      for (let distance = zone.start * LAP_LENGTH_M; distance < zone.end * LAP_LENGTH_M; distance += zone.spacing) {
        const frame = mapFrameAt(distance / LAP_LENGTH_M, staticFrame);
        const sides = sidesForKerb(zone, frame);
        sides.forEach((side) => {
          const placement = { frame: cloneFrameForPlacement(frame), side, zone };
          if (blockIndex % 2 === 0) {
            redPlacements.push(placement);
          } else {
            whitePlacements.push(placement);
          }
          blockIndex += 1;
        });
      }
    });

    addKerbMesh(redPlacements, kerbRedMaterial);
    addKerbMesh(whitePlacements, kerbWhiteMaterial);
  }

  function sidesForKerb(zone, frame) {
    if (zone.side === "left") {
      return [-1];
    }
    if (zone.side === "right") {
      return [1];
    }
    if (zone.side === "inside") {
      return [frame.turn >= 0 ? -1 : 1];
    }
    return [-1, 1];
  }

  function addKerbMesh(placements, material) {
    if (!placements.length) {
      return;
    }

    const kerbGeo = new THREE.BoxGeometry(1, 1, 1);
    const kerbMesh = new THREE.InstancedMesh(kerbGeo, material, placements.length);
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const basis = new THREE.Matrix4();

    placements.forEach((placement, index) => {
      const { frame, side, zone } = placement;
      const offset = frame.road / 2 + Math.min(frame.shoulder, 1.1) * 0.45;
      const position = frame.position.clone()
        .addScaledVector(frame.right, side * offset)
        .addScaledVector(frame.up, 0.08);
      basis.makeBasis(frame.tangent, frame.up, frame.right);
      quat.setFromRotationMatrix(basis);
      matrix.compose(
        position,
        quat,
        new THREE.Vector3(zone.length, 0.04, zone.width)
      );
      kerbMesh.setMatrixAt(index, matrix);
    });

    roadGroup.add(kerbMesh);
  }

  function buildBarriers() {
    const placements = [];
    const staticFrame = createFrameScratch();
    BARRIER_ZONES.forEach((zone) => {
      for (let distance = zone.start * LAP_LENGTH_M; distance < zone.end * LAP_LENGTH_M; distance += zone.spacing) {
        const frame = mapFrameAt(distance / LAP_LENGTH_M, staticFrame);
        if (zone.side === "both" || zone.side === "left") {
          placements.push({ frame: cloneFrameForPlacement(frame), side: -1, zone });
        }
        if (zone.side === "both" || zone.side === "right") {
          placements.push({ frame: cloneFrameForPlacement(frame), side: 1, zone });
        }
      }
    });

    const barrierGeo = new THREE.BoxGeometry(1, 1, 1);
    const barrierMesh = new THREE.InstancedMesh(barrierGeo, barrierMaterial, placements.length);
    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const basis = new THREE.Matrix4();

    placements.forEach((placement, index) => {
      const { frame, side, zone } = placement;
      const offset = frame.road / 2 + frame.shoulder + 0.95;
      const position = frame.position.clone()
        .addScaledVector(frame.right, side * offset)
        .addScaledVector(frame.up, zone.height / 2 + 0.05);
      basis.makeBasis(frame.tangent, frame.up, frame.right);
      quat.setFromRotationMatrix(basis);
      matrix.compose(
        position,
        quat,
        new THREE.Vector3(zone.length, zone.height, zone.depth)
      );
      barrierMesh.setMatrixAt(index, matrix);
    });

    roadGroup.add(barrierMesh);
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
    const lookAhead = (state.speedKmh / 3.6) * LABEL_LEAD_TIME / LAP_LENGTH_M;
    const aheadFrame = frameAt(state.progress + lookAhead, labelFrame);
    const copy = COPY[state.lang];

    if (force || aheadFrame.label[state.lang] !== state.lastSegmentLabel) {
      ui.sectorLabel.textContent = aheadFrame.label[state.lang];
      ui.sectorBadge.textContent = aheadFrame.badge[state.lang];
      ui.speedNote.textContent = `${copy.badge} · ${aheadFrame.badge[state.lang]}`;
      state.lastSegmentLabel = aheadFrame.label[state.lang];
    }

    const speed = Math.round(state.speedKmh);
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

  function updateCamera(frame, delta) {
    const lookAhead = Math.max(50, Math.min(110, 54 + state.speedKmh * 0.18));
    const cameraHeight = frame.camHeight + 0.8;
    const desiredPosition = cameraTemp.position.set(
      frame.position.x + frame.up.x * cameraHeight + frame.right.x * 0.25,
      frame.position.y + frame.up.y * cameraHeight + frame.right.y * 0.25,
      frame.position.z + frame.up.z * cameraHeight + frame.right.z * 0.25
    );
    const desiredTarget = cameraTemp.target.set(
      frame.position.x + frame.tangent.x * lookAhead + frame.up.x * frame.camHeight * 0.35,
      frame.position.y + frame.tangent.y * lookAhead + frame.up.y * frame.camHeight * 0.35,
      frame.position.z + frame.tangent.z * lookAhead + frame.up.z * frame.camHeight * 0.35
    );
    const desiredUp = cameraTemp.up.set(0, 1, 0).lerp(frame.up, 0.22).normalize();

    if (!cameraBlend.initialized) {
      cameraBlend.position.copy(desiredPosition);
      cameraBlend.target.copy(desiredTarget);
      cameraBlend.up.copy(desiredUp);
      cameraBlend.initialized = true;
    } else {
      const smoothing = 1 - Math.exp(-Math.max(delta, 0.008) * (22 + Math.max(0, state.speedKmh - 60) * 0.045));
      cameraBlend.position.lerp(desiredPosition, smoothing);
      cameraBlend.target.lerp(desiredTarget, smoothing);
      cameraBlend.up.lerp(desiredUp, smoothing).normalize();
    }

    camera.position.copy(cameraBlend.position);
    camera.up.copy(cameraBlend.up);
    camera.lookAt(cameraBlend.target);
  }

  function tick(now) {
    const delta = Math.min((now - state.lastTs) / 1000, 0.05);
    state.lastTs = now;

    if (state.running) {
      const advance = (state.speedKmh / 3.6) * delta / LAP_LENGTH_M;
      let nextProgress = state.progress + advance;
      while (nextProgress >= 1) {
        nextProgress -= 1;
        state.lap += 1;
        state.lastLapFlash = now;
      }
      state.progress = nextProgress;
    }

    const frame = frameAt(state.progress, runtimeFrame);
    updateCamera(frame, delta);
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
