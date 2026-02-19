const canvas = document.querySelector("#scene");
const hudEl = document.querySelector(".hud");
const hudToggleBtn = document.querySelector("#hud-toggle");
const planetSelect = document.querySelector("#planet-search");
const speedSlider = document.querySelector("#speed-slider");
const speedValue = document.querySelector("#speed-value");
const yearsValue = document.querySelector("#years-value");
const fullscreenBtn = document.querySelector("#fullscreen-btn");
const flyBtn = document.querySelector("#fly-btn");
const overviewBtn = document.querySelector("#overview-btn");
const infoEl = document.querySelector("#planet-info");

const ctx = canvas.getContext("2d");

if (!ctx) {
  infoEl.textContent = "Canvas 2D is not available in this browser.";
  throw new Error("Canvas 2D context unavailable");
}

const TAU = Math.PI * 2;

const camera = {
  target: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0.26,
  radius: 520,
  position: { x: 0, y: 0, z: 0 },
  fovScale: 920,
};

let width = 1;
let height = 1;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function vec(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

function add(a, b) {
  return vec(a.x + b.x, a.y + b.y, a.z + b.z);
}

function sub(a, b) {
  return vec(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scale(a, s) {
  return vec(a.x * s, a.y * s, a.z * s);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}

function length(a) {
  return Math.hypot(a.x, a.y, a.z);
}

function normalize(a) {
  const len = length(a) || 1;
  return scale(a, 1 / len);
}

function rotateX(v, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return vec(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
}

function rotateY(v, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return vec(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

function updateCameraPosition() {
  const cp = Math.cos(camera.pitch);
  camera.position.x = camera.target.x + camera.radius * Math.sin(camera.yaw) * cp;
  camera.position.y = camera.target.y + camera.radius * Math.sin(camera.pitch);
  camera.position.z = camera.target.z + camera.radius * Math.cos(camera.yaw) * cp;
}

function cameraBasis() {
  const forward = normalize(sub(camera.target, camera.position));
  const worldUp = vec(0, 1, 0);
  let right = normalize(cross(forward, worldUp));

  if (length(right) < 1e-4) {
    right = vec(1, 0, 0);
  }

  const up = normalize(cross(right, forward));
  return { forward, right, up };
}

function project(world, basis) {
  const rel = sub(world, camera.position);
  const xCam = dot(rel, basis.right);
  const yCam = dot(rel, basis.up);
  const zCam = dot(rel, basis.forward);

  if (zCam <= 0.1) return null;

  const scalePx = camera.fovScale / zCam;
  return {
    x: width * 0.5 + xCam * scalePx,
    y: height * 0.5 - yCam * scalePx,
    scalePx,
    zCam,
  };
}

const stars = Array.from({ length: 2200 }, () => {
  const r = 1400 + Math.random() * 5200;
  const t = Math.random() * TAU;
  const p = Math.acos(2 * Math.random() - 1);
  return {
    x: r * Math.sin(p) * Math.cos(t),
    y: r * Math.cos(p),
    z: r * Math.sin(p) * Math.sin(t),
    a: 0.45 + Math.random() * 0.55,
    s: 0.4 + Math.random() * 1.4,
    hue: 190 + Math.random() * 45,
    twinkle: Math.random() * TAU,
    twinkleSpeed: 0.4 + Math.random() * 1.8,
  };
});

const texturePathCandidates = {
  Sun: ["./assets/textures/Sun.jpg", "./assets/textures/sun.jpg", "./assets/textures/Sun.png", "./assets/textures/sun.png"],
  Mercury: ["./assets/textures/Mercury.jpg", "./assets/textures/mercury.jpg", "./assets/textures/Mercury.png", "./assets/textures/mercury.png"],
  Venus: ["./assets/textures/Venus.jpg", "./assets/textures/venus.jpg", "./assets/textures/Venus.png", "./assets/textures/venus.png"],
  Earth: ["./assets/textures/Earth.jpg", "./assets/textures/earth.jpg", "./assets/textures/Earth.png", "./assets/textures/earth.png"],
  Mars: ["./assets/textures/Mars.jpg", "./assets/textures/mars.jpg", "./assets/textures/Mars.png", "./assets/textures/mars.png"],
  Jupiter: ["./assets/textures/Jupiter.jpg", "./assets/textures/jupiter.jpg", "./assets/textures/Jupiter.png", "./assets/textures/jupiter.png"],
  Saturn: ["./assets/textures/Saturn.jpg", "./assets/textures/saturn.jpg", "./assets/textures/Saturn.png", "./assets/textures/saturn.png"],
  Uranus: ["./assets/textures/Uranus.jpg", "./assets/textures/uranus.jpg", "./assets/textures/Uranus.png", "./assets/textures/uranus.png"],
  Neptune: ["./assets/textures/Neptune.jpg", "./assets/textures/neptune.jpg", "./assets/textures/Neptune.png", "./assets/textures/neptune.png"],
};

const simulation = {
  daysPerSecond: Number(speedSlider?.value || 40),
  elapsedDays: 0,
};

function setHudCollapsed(collapsed) {
  if (!hudEl || !hudToggleBtn) return;
  hudEl.classList.toggle("collapsed", collapsed);
  hudToggleBtn.textContent = collapsed ? "Show Controls" : "Hide Controls";
}

if (window.matchMedia("(max-width: 720px)").matches) {
  setHudCollapsed(true);
}

if (hudToggleBtn) {
  hudToggleBtn.addEventListener("click", () => {
    setHudCollapsed(!hudEl.classList.contains("collapsed"));
  });
}

function loadImage(src, onSuccess) {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => onSuccess(img);
  img.onerror = () => {};
  img.src = src;
}

function loadFirstImage(paths, onSuccess) {
  const list = Array.isArray(paths) ? paths : [paths];
  let idx = 0;

  function tryNext() {
    if (idx >= list.length) return;
    const src = list[idx];
    idx += 1;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => onSuccess(img);
    img.onerror = tryNext;
    img.src = src;
  }

  tryNext();
}

function createDetailNoiseCanvas() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const cctx = c.getContext("2d");
  if (!cctx) return c;

  const image = cctx.createImageData(c.width, c.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = 105 + Math.floor(Math.random() * 150);
    image.data[i] = n;
    image.data[i + 1] = n;
    image.data[i + 2] = n;
    image.data[i + 3] = 255;
  }
  cctx.putImageData(image, 0, 0);
  return c;
}

const detailNoiseCanvas = createDetailNoiseCanvas();

const planets = [
  {
    name: "Mercury",
    type: "Rocky",
    diameterKm: 4879,
    dayLength: "1408 h",
    yearLength: "88 days",
    orbitalPeriodDays: 88,
    radius: 3.2,
    distance: 50,
    orbitSpeed: 0.94,
    spinSpeed: 0.7,
    color: "#9f8f7d",
    summary: "Smallest planet, heavily cratered, and closest to the Sun.",
    angle: Math.random() * TAU,
    orbitTilt: 0.02,
  },
  {
    name: "Venus",
    type: "Rocky",
    diameterKm: 12104,
    dayLength: "5832 h",
    yearLength: "225 days",
    orbitalPeriodDays: 225,
    radius: 5.2,
    distance: 72,
    orbitSpeed: 0.71,
    spinSpeed: 0.45,
    color: "#d8b482",
    summary: "Hottest planet with a dense CO2 atmosphere and sulfuric acid clouds.",
    angle: Math.random() * TAU,
    orbitTilt: 0.03,
  },
  {
    name: "Earth",
    type: "Rocky",
    diameterKm: 12742,
    dayLength: "24 h",
    yearLength: "365 days",
    orbitalPeriodDays: 365.25,
    radius: 5.7,
    distance: 96,
    orbitSpeed: 0.6,
    spinSpeed: 1.2,
    color: "#5ea8ff",
    summary: "Our home world with liquid oceans and a life-supporting atmosphere.",
    angle: Math.random() * TAU,
    orbitTilt: 0.01,
  },
  {
    name: "Mars",
    type: "Rocky",
    diameterKm: 6779,
    dayLength: "24.6 h",
    yearLength: "687 days",
    orbitalPeriodDays: 687,
    radius: 4.4,
    distance: 122,
    orbitSpeed: 0.49,
    spinSpeed: 1.05,
    color: "#cb6f3b",
    summary: "The red planet, cold and dusty, with giant canyons and volcanoes.",
    angle: Math.random() * TAU,
    orbitTilt: 0.04,
  },
  {
    name: "Jupiter",
    type: "Gas Giant",
    diameterKm: 139820,
    dayLength: "9.9 h",
    yearLength: "4333 days",
    orbitalPeriodDays: 4333,
    radius: 14.5,
    distance: 178,
    orbitSpeed: 0.26,
    spinSpeed: 2.2,
    color: "#c9966f",
    summary: "Largest planet, a gas giant with a massive Great Red Spot storm.",
    angle: Math.random() * TAU,
    orbitTilt: 0.025,
  },
  {
    name: "Saturn",
    type: "Gas Giant",
    diameterKm: 116460,
    dayLength: "10.7 h",
    yearLength: "10759 days",
    orbitalPeriodDays: 10759,
    radius: 12.1,
    distance: 240,
    orbitSpeed: 0.2,
    spinSpeed: 2.05,
    color: "#d8c089",
    summary: "Gas giant famous for its spectacular bright ring system.",
    angle: Math.random() * TAU,
    orbitTilt: 0.02,
    ring: true,
    ringTilt: 0.55,
  },
  {
    name: "Uranus",
    type: "Ice Giant",
    diameterKm: 50724,
    dayLength: "17.2 h",
    yearLength: "30687 days",
    orbitalPeriodDays: 30687,
    radius: 9,
    distance: 300,
    orbitSpeed: 0.14,
    spinSpeed: 1.4,
    color: "#95d7dc",
    summary: "Ice giant with an extreme tilt, rotating almost on its side.",
    angle: Math.random() * TAU,
    orbitTilt: 0.018,
  },
  {
    name: "Neptune",
    type: "Ice Giant",
    diameterKm: 49244,
    dayLength: "16.1 h",
    yearLength: "60190 days",
    orbitalPeriodDays: 60190,
    radius: 8.8,
    distance: 356,
    orbitSpeed: 0.11,
    spinSpeed: 1.5,
    color: "#588df4",
    summary: "Distant ice giant with fast winds and deep blue methane-rich skies.",
    angle: Math.random() * TAU,
    orbitTilt: 0.03,
  },
];

for (const p of planets) {
  const option = document.createElement("option");
  option.value = p.name;
  option.textContent = p.name;
  option.label = p.name;
  planetSelect.appendChild(option);
  p.position = vec();
  p.spin = Math.random() * TAU;

  const paths = texturePathCandidates[p.name];
  if (paths) {
    loadFirstImage(paths, (img) => {
      p.texture = img;
    });
  }
}

const sun = {
  position: vec(0, 0, 0),
  radius: 22,
  spin: 0,
};

loadFirstImage(texturePathCandidates.Sun, (img) => {
  sun.texture = img;
});

let selectedPlanet = null;
let hoveredPlanet = null;
const projectedPlanets = [];
let flyTransition = null;

function updatePlanetInfo(planet, mode = "focus") {
  if (!planet) {
    infoEl.textContent = "Overview mode: Sun + all 8 planets visible. Hover a planet to see stats.";
    return;
  }

  const prefix = mode === "hover" ? "Hovering" : "Focused";
  infoEl.innerHTML = `${prefix}: <strong>${planet.name}</strong> (${planet.type})<br>${planet.summary}<br>Diameter: ${planet.diameterKm.toLocaleString()} km | Distance: ${planet.distance} AU (scaled) | Day: ${planet.dayLength} | Year: ${planet.yearLength}`;
}

function refreshInfoPanel() {
  if (hoveredPlanet) {
    updatePlanetInfo(hoveredPlanet, "hover");
    return;
  }
  if (selectedPlanet) {
    updatePlanetInfo(selectedPlanet, "focus");
    return;
  }
  updatePlanetInfo(null);
}

function startFly(toTarget, toRadius, toYaw = camera.yaw, toPitch = camera.pitch, duration = 1800) {
  flyTransition = {
    start: performance.now(),
    duration,
    fromTarget: { ...camera.target },
    toTarget: { ...toTarget },
    fromRadius: camera.radius,
    toRadius,
    fromYaw: camera.yaw,
    toYaw,
    fromPitch: camera.pitch,
    toPitch,
  };
}

function flyToOverview() {
  selectedPlanet = null;
  startFly(vec(0, 0, 0), 520, 0.2, 0.28, 1600);
  refreshInfoPanel();
}

function flyToPlanet(planet) {
  if (!planet) return;
  selectedPlanet = planet;
  const dist = clamp(planet.radius * 14 + 40, 85, 190);
  startFly(planet.position, dist, camera.yaw + 0.8, 0.22, 1900);
  planetSelect.value = planet.name;
  refreshInfoPanel();
}

function getPlanetByName(name) {
  const key = name.trim().toLowerCase();
  return planets.find((p) => p.name.toLowerCase() === key);
}

function onFlyRequest() {
  const query = planetSelect.value.trim();
  if (!query) {
    infoEl.textContent = "Choose a planet from the dropdown.";
    return;
  }

  const planet = getPlanetByName(query);
  if (!planet) {
    infoEl.textContent = `Planet "${query}" not found. Try Mercury to Neptune.`;
    return;
  }

  flyToPlanet(planet);
}

function updateSimulationLabels() {
  speedValue.textContent = `${simulation.daysPerSecond.toFixed(0)} days/s`;
  yearsValue.textContent = `${(simulation.elapsedDays / 365.25).toFixed(2)} years elapsed`;
}

flyBtn.addEventListener("click", onFlyRequest);
overviewBtn.addEventListener("click", flyToOverview);
planetSelect.addEventListener("change", onFlyRequest);
speedSlider.addEventListener("input", () => {
  simulation.daysPerSecond = Number(speedSlider.value);
  updateSimulationLabels();
});

let dragging = false;
let lastX = 0;
let lastY = 0;
let pointerX = -1;
let pointerY = -1;
let pointerInside = false;
const touchPoints = new Map();
let pinchStartDistance = 0;
let pinchStartRadius = 0;

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function beginPinchIfNeeded() {
  if (touchPoints.size !== 2) return;
  const pts = Array.from(touchPoints.values());
  pinchStartDistance = Math.max(1, distance2D(pts[0], pts[1]));
  pinchStartRadius = camera.radius;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") {
    touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
    beginPinchIfNeeded();
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") {
    e.preventDefault();
    touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (touchPoints.size === 2) {
      const pts = Array.from(touchPoints.values());
      const dist = Math.max(1, distance2D(pts[0], pts[1]));
      const ratio = pinchStartDistance / dist;
      camera.radius = clamp(pinchStartRadius * ratio, 35, 1600);
      return;
    }

    if (touchPoints.size === 1) {
      const p = touchPoints.get(e.pointerId);
      if (!p) return;
      if (!dragging) {
        dragging = true;
        lastX = p.x;
        lastY = p.y;
        return;
      }
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      lastX = p.x;
      lastY = p.y;
      camera.yaw -= dx * 0.005;
      camera.pitch = clamp(camera.pitch - dy * 0.004, -1.3, 1.3);
      return;
    }
  }

  const rect = canvas.getBoundingClientRect();
  pointerX = e.clientX - rect.left;
  pointerY = e.clientY - rect.top;
  pointerInside = true;

  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  camera.yaw -= dx * 0.005;
  camera.pitch = clamp(camera.pitch - dy * 0.004, -1.3, 1.3);
});

canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType === "touch") {
    touchPoints.delete(e.pointerId);
    if (touchPoints.size !== 2) {
      pinchStartDistance = 0;
      pinchStartRadius = camera.radius;
    }
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    return;
  }

  dragging = false;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("pointerleave", () => {
  pointerInside = false;
  hoveredPlanet = null;
  refreshInfoPanel();
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  camera.radius = clamp(camera.radius * (1 + delta * 0.08), 35, 1600);
}, { passive: false });

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock("landscape");
          } catch {
            // Some browsers block orientation lock without user settings.
          }
        }
        fullscreenBtn.textContent = "Exit Fullscreen";
      } else {
        await document.exitFullscreen();
        fullscreenBtn.textContent = "Fullscreen Landscape";
      }
    } catch {
      infoEl.textContent = "Fullscreen/orientation is not supported in this mobile browser.";
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen Landscape";
  });
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "#050b1c");
  g.addColorStop(0.55, "#020713");
  g.addColorStop(1, "#01040b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const nebulaA = ctx.createRadialGradient(width * 0.22, height * 0.2, 0, width * 0.22, height * 0.2, width * 0.46);
  nebulaA.addColorStop(0, "rgba(36, 84, 170, 0.1)");
  nebulaA.addColorStop(1, "rgba(10, 24, 52, 0)");
  ctx.fillStyle = nebulaA;
  ctx.fillRect(0, 0, width, height);

  const nebulaB = ctx.createRadialGradient(width * 0.8, height * 0.1, 0, width * 0.8, height * 0.1, width * 0.42);
  nebulaB.addColorStop(0, "rgba(86, 116, 200, 0.08)");
  nebulaB.addColorStop(1, "rgba(14, 22, 44, 0)");
  ctx.fillStyle = nebulaB;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(basis, tSec) {
  for (const s of stars) {
    const p = project(s, basis);
    if (!p) continue;
    const size = clamp(s.s * p.scalePx * 0.07, 0.25, 2.4);
    const twinkle = 0.82 + 0.18 * Math.sin(tSec * s.twinkleSpeed + s.twinkle);
    const alpha = clamp(s.a * twinkle, 0.12, 1);
    ctx.fillStyle = `hsla(${s.hue}, 80%, 78%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, TAU);
    ctx.fill();
  }
}

function drawOrbit(distance, tilt, basis) {
  const steps = 420;
  const projected = new Array(steps);

  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * TAU;
    const z = Math.sin(t) * distance;
    const w = vec(Math.cos(t) * distance, z * tilt, z);
    projected[i] = project(w, basis);
  }

  ctx.strokeStyle = "rgba(80,120,170,0.35)";
  ctx.lineWidth = 1;

  for (let i = 0; i < steps; i += 1) {
    const a = projected[i];
    const b = projected[(i + 1) % steps];
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawSphere(screen, rPx, baseColor, glow = false) {
  if (rPx < 0.3) return;

  const grad = ctx.createRadialGradient(screen.x - rPx * 0.35, screen.y - rPx * 0.35, rPx * 0.15, screen.x, screen.y, rPx);

  if (glow) {
    grad.addColorStop(0, "#fff1a5");
    grad.addColorStop(0.36, "#ffca63");
    grad.addColorStop(1, "#cf6a18");
  } else {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.12, baseColor);
    grad.addColorStop(1, "#111827");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx, 0, TAU);
  ctx.fill();
}

function drawSunCorona(screen, rPx) {
  const corona = ctx.createRadialGradient(screen.x, screen.y, rPx * 0.95, screen.x, screen.y, rPx * 1.32);
  corona.addColorStop(0, "rgba(255, 190, 95, 0.22)");
  corona.addColorStop(0.45, "rgba(255, 155, 60, 0.12)");
  corona.addColorStop(1, "rgba(255, 130, 40, 0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx * 1.32, 0, TAU);
  ctx.fill();
}

function drawTexturedSphere(screen, rPx, texture, baseColor, spin = 0, phaseU = 0) {
  if (!texture) {
    drawSphere(screen, rPx, baseColor, false);
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx, 0, TAU);
  ctx.clip();

  const texW = Math.max(1, texture.width | 0);
  const texH = Math.max(1, texture.height | 0);
  const strips = Math.max(28, Math.floor(rPx * 2.4));
  const dx = (rPx * 2) / strips;
  const spinU = (spin / TAU) % 1;

  // Hemisphere projection: compress texture detail near the limb so rotation reads as 3D.
  for (let i = 0; i < strips; i += 1) {
    const x0 = -rPx + i * dx;
    const x1 = x0 + dx;
    const nx = clamp((x0 + x1) * 0.5 / rPx, -1, 1);
    const lon = Math.asin(nx);
    let u = 0.5 + lon / TAU + spinU + phaseU;
    u = ((u % 1) + 1) % 1;

    const sx = Math.floor(u * texW);
    const sw = 1;
    const dstX = screen.x + x0;
    const dstY = screen.y - rPx;
    const dstW = Math.max(1, dx + 0.35);
    const dstH = rPx * 2;
    ctx.drawImage(texture, sx, 0, sw, texH, dstX, dstY, dstW, dstH);
  }

  // Subtle procedural detail helps reduce flatness when texture resolution is limited.
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.14;
  const noiseW = rPx * 2.2;
  const noiseH = rPx * 1.35;
  const noiseOffset = ((spin % TAU) / TAU) * noiseW;
  ctx.drawImage(detailNoiseCanvas, screen.x - noiseW + noiseOffset, screen.y - noiseH * 0.5, noiseW, noiseH);
  ctx.drawImage(detailNoiseCanvas, screen.x - noiseOffset, screen.y - noiseH * 0.5, noiseW, noiseH);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  ctx.restore();

  const shade = ctx.createRadialGradient(screen.x - rPx * 0.45, screen.y - rPx * 0.45, rPx * 0.12, screen.x, screen.y, rPx);
  shade.addColorStop(0, "rgba(255,255,255,0.45)");
  shade.addColorStop(0.4, "rgba(255,255,255,0.02)");
  shade.addColorStop(1, "rgba(3,8,18,0.66)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx, 0, TAU);
  ctx.fill();
}

function shadeSphereBySun(screen, rPx, lightCam, glossy = 0.25) {
  // Project light direction into screen space for plausible day/night transition.
  const sx = lightCam.x;
  const sy = -lightCam.y;
  const sl = Math.hypot(sx, sy) || 1;
  const nx = sx / sl;
  const ny = sy / sl;

  const litX = screen.x + nx * rPx * 1.05;
  const litY = screen.y + ny * rPx * 1.05;
  const darkX = screen.x - nx * rPx * 1.15;
  const darkY = screen.y - ny * rPx * 1.15;

  const terminator = ctx.createLinearGradient(litX, litY, darkX, darkY);
  terminator.addColorStop(0, "rgba(255,255,255,0)");
  terminator.addColorStop(0.48, "rgba(10,16,28,0.08)");
  terminator.addColorStop(0.78, "rgba(6,10,20,0.42)");
  terminator.addColorStop(1, "rgba(3,7,14,0.76)");

  ctx.fillStyle = terminator;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx, 0, TAU);
  ctx.fill();

  // Fresnel-like rim darkening.
  const rim = ctx.createRadialGradient(screen.x, screen.y, rPx * 0.55, screen.x, screen.y, rPx * 1.02);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, rPx, 0, TAU);
  ctx.fill();

  // Keep reflections subtle; strong mirror-like highlights look fake for most planets.
  if (glossy > 0.001) {
    const facing = Math.max(0, lightCam.z);
    const highlightR = rPx * (0.08 + glossy * 0.1);
    const hx = screen.x + nx * rPx * 0.34;
    const hy = screen.y + ny * rPx * 0.34;
    const spec = ctx.createRadialGradient(hx, hy, highlightR * 0.2, hx, hy, highlightR);
    spec.addColorStop(0, `rgba(255,255,255,${(0.03 + facing * 0.08) * glossy})`);
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, rPx, 0, TAU);
    ctx.fill();
  }
}

function drawSaturnRing(planet, basis, centerDepth, planetPx, part = "full") {
  const innerR = planet.radius * 1.45;
  const outerR = planet.radius * 2.5;
  const bands = 10;
  const steps = 220;
  const baseAlpha = part === "back" ? 0.44 : 0.68;

  for (let i = 0; i < bands; i += 1) {
    const t = i / Math.max(1, bands - 1);
    const rr = lerp(innerR, outerR, t);
    const tone = 172 + Math.floor(46 * t);
    const alpha = baseAlpha * (0.72 + 0.28 * Math.sin((i + 1) * 1.9));
    ctx.strokeStyle = `rgba(${tone + 18}, ${tone + 8}, ${tone - 18}, ${alpha.toFixed(3)})`;
    ctx.lineWidth = Math.max(0.7, planetPx * (0.03 + 0.007 * (i % 3)));
    for (let k = 0; k < steps; k += 1) {
      const a0 = (k / steps) * TAU;
      const a1 = ((k + 1) / steps) * TAU;

      let p0 = vec(Math.cos(a0) * rr, 0, Math.sin(a0) * rr);
      let p1 = vec(Math.cos(a1) * rr, 0, Math.sin(a1) * rr);

      const tilt = planet.ringTilt || 0.55;
      p0 = rotateX(p0, tilt);
      p1 = rotateX(p1, tilt);

      // Keep ring orientation tied to Saturn's current orbital frame.
      const ringYaw = planet.angle * 0.35;
      p0 = rotateY(p0, ringYaw);
      p1 = rotateY(p1, ringYaw);

      p0 = add(planet.position, p0);
      p1 = add(planet.position, p1);

      const s0 = project(p0, basis);
      const s1 = project(p1, basis);
      if (!s0 || !s1) continue;

      const segFront = (s0.zCam + s1.zCam) * 0.5 < centerDepth;
      if ((part === "front" && !segFront) || (part === "back" && segFront)) continue;

      ctx.beginPath();
      ctx.moveTo(s0.x, s0.y);
      ctx.lineTo(s1.x, s1.y);
      ctx.stroke();
    }
  }
}

function updatePlanetPositions(dt) {
  const simDaysDelta = dt * simulation.daysPerSecond;
  simulation.elapsedDays += simDaysDelta;
  updateSimulationLabels();

  for (const p of planets) {
    p.angle += (TAU * simDaysDelta) / p.orbitalPeriodDays;
    p.spin += p.spinSpeed * dt;
    p.position.x = Math.cos(p.angle) * p.distance;
    p.position.z = Math.sin(p.angle) * p.distance;
    p.position.y = p.position.z * p.orbitTilt;
  }
  sun.spin += 0.16 * dt;
}

function renderBodies(basis) {
  const entries = [];
  projectedPlanets.length = 0;

  for (const p of planets) {
    const screen = project(p.position, basis);
    if (!screen) continue;
    entries.push({ type: "planet", planet: p, screen, depth: screen.zCam });
  }

  const sunScreen = project(sun.position, basis);
  if (sunScreen) {
    entries.push({ type: "sun", screen: sunScreen, depth: sunScreen.zCam });
  }

  entries.sort((a, b) => b.depth - a.depth);

  for (const e of entries) {
    if (e.type === "sun") {
      const rPx = clamp(sun.radius * e.screen.scalePx, 3, 200);
      drawSunCorona(e.screen, rPx);
      const sunViewDir = normalize(sub(camera.position, sun.position));
      const sunPhaseU = Math.atan2(sunViewDir.x, sunViewDir.z) / TAU;
      drawTexturedSphere(e.screen, rPx, sun.texture, "#ffcc65", sun.spin, sunPhaseU);
      continue;
    }

    const rPx = clamp(e.planet.radius * e.screen.scalePx, 1.3, 100);
    projectedPlanets.push({
      planet: e.planet,
      x: e.screen.x,
      y: e.screen.y,
      r: rPx,
      zCam: e.screen.zCam,
    });
    if (e.planet.ring) drawSaturnRing(e.planet, basis, e.screen.zCam, rPx, "back");
    const viewDir = normalize(sub(camera.position, e.planet.position));
    const phaseU = Math.atan2(viewDir.x, viewDir.z) / TAU;
    drawTexturedSphere(e.screen, rPx, e.planet.texture, e.planet.color, e.planet.spin, phaseU);
    if (e.planet.ring) drawSaturnRing(e.planet, basis, e.screen.zCam, rPx, "front");
    const lightWorld = normalize(sub(sun.position, e.planet.position));
    const lightCam = {
      x: dot(lightWorld, basis.right),
      y: dot(lightWorld, basis.up),
      z: dot(lightWorld, basis.forward),
    };
    let glossy = 0.01;
    if (e.planet.name === "Earth") glossy = 0.08;
    if (e.planet.name === "Venus") glossy = 0.04;
    if (e.planet.name === "Jupiter" || e.planet.name === "Saturn") glossy = 0.03;
    shadeSphereBySun(e.screen, rPx, lightCam, glossy);
  }
}

function updateHoverState() {
  if (!pointerInside || dragging) {
    if (hoveredPlanet) {
      hoveredPlanet = null;
      refreshInfoPanel();
    }
    return;
  }

  let picked = null;
  let nearestDepth = Infinity;
  for (const p of projectedPlanets) {
    const dx = pointerX - p.x;
    const dy = pointerY - p.y;
    if (dx * dx + dy * dy > p.r * p.r) continue;
    if (p.zCam < nearestDepth) {
      nearestDepth = p.zCam;
      picked = p.planet;
    }
  }

  if (picked !== hoveredPlanet) {
    hoveredPlanet = picked;
    refreshInfoPanel();
  }
}

function tick(timestamp) {
  if (!tick.last) tick.last = timestamp;
  const dt = clamp((timestamp - tick.last) / 1000, 0, 0.04);
  tick.last = timestamp;

  updatePlanetPositions(dt);

  if (flyTransition) {
    const t = clamp((performance.now() - flyTransition.start) / flyTransition.duration, 0, 1);
    const k = easeInOutCubic(t);

    camera.target.x = lerp(flyTransition.fromTarget.x, flyTransition.toTarget.x, k);
    camera.target.y = lerp(flyTransition.fromTarget.y, flyTransition.toTarget.y, k);
    camera.target.z = lerp(flyTransition.fromTarget.z, flyTransition.toTarget.z, k);
    camera.radius = lerp(flyTransition.fromRadius, flyTransition.toRadius, k);
    camera.yaw = lerp(flyTransition.fromYaw, flyTransition.toYaw, k);
    camera.pitch = lerp(flyTransition.fromPitch, flyTransition.toPitch, k);

    if (t >= 1) flyTransition = null;
  }

  if (selectedPlanet && !flyTransition) {
    camera.target.x = lerp(camera.target.x, selectedPlanet.position.x, 0.05);
    camera.target.y = lerp(camera.target.y, selectedPlanet.position.y, 0.05);
    camera.target.z = lerp(camera.target.z, selectedPlanet.position.z, 0.05);
  }

  updateCameraPosition();
  const basis = cameraBasis();

  drawBackground();
  drawStars(basis, timestamp * 0.001);

  for (const p of planets) {
    drawOrbit(p.distance, p.orbitTilt, basis);
  }

  renderBodies(basis);
  updateHoverState();

  requestAnimationFrame(tick);
}

resize();
window.addEventListener("resize", resize);
refreshInfoPanel();
updateSimulationLabels();
updateCameraPosition();
requestAnimationFrame(tick);
