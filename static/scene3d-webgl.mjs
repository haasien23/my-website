import * as THREE from "./vendor/three.module.js";

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function lerp(start, end, ratio) {
  return start + (end - start) * ratio;
}

function hashUnit(seedA, seedB) {
  const raw = Math.sin(seedA * 12.9898 + seedB * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function bodyColorPreview(color, failed) {
  return failed ? 0x94a3b8 : new THREE.Color(color).getHex();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function pointNearObstacle(environment, x, y, margin) {
  const safeMargin = margin || 0;
  const cell = environment.cell_size || 40;
  return (environment.obstacles || []).some((obstacle) => {
    const x0 = obstacle.col * cell - safeMargin;
    const x1 = (obstacle.col + obstacle.width) * cell + safeMargin;
    const y0 = obstacle.row * cell - safeMargin;
    const y1 = (obstacle.row + obstacle.height) * cell + safeMargin;
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  });
}

const environmentLayoutCache = new WeakMap();

function chooseRoadBands(coverage, ratios, size) {
  const taken = new Set();
  return ratios
    .map((ratio, index) => {
      const target = Math.round((size - 1) * ratio);
      let bestIndex = target;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let candidate = 1; candidate < size - 1; candidate += 1) {
        if (taken.has(candidate) || taken.has(candidate - 1) || taken.has(candidate + 1)) {
          continue;
        }
        const score = coverage[candidate] * 7 + Math.abs(candidate - target) * (1 + index * 0.35);
        if (score < bestScore) {
          bestScore = score;
          bestIndex = candidate;
        }
      }
      taken.add(bestIndex);
      return bestIndex;
    })
    .sort((left, right) => left - right);
}

function buildEnvironmentLayout(environment) {
  if (environmentLayoutCache.has(environment)) {
    return environmentLayoutCache.get(environment);
  }

  const mapSize = environment.map_size || 1000;
  const cell = environment.cell_size || 40;
  const rows = Math.max(4, Math.round(mapSize / cell));
  const cols = Math.max(4, Math.round(mapSize / cell));
  const rowCoverage = Array(rows).fill(0);
  const colCoverage = Array(cols).fill(0);

  (environment.obstacles || []).forEach((obstacle) => {
    for (let row = obstacle.row; row < Math.min(rows, obstacle.row + obstacle.height); row += 1) {
      rowCoverage[row] += obstacle.width;
    }
    for (let col = obstacle.col; col < Math.min(cols, obstacle.col + obstacle.width); col += 1) {
      colCoverage[col] += obstacle.height;
    }
  });

  const horizontalRoads = chooseRoadBands(rowCoverage, [0.18, 0.47, 0.76], rows).map((row, index) => ({
    y: (row + 0.5) * cell,
    width: cell * (index === 1 ? 1.55 : 1.1),
  }));
  const verticalRoads = chooseRoadBands(colCoverage, [0.24, 0.58, 0.84], cols).map((col, index) => ({
    x: (col + 0.5) * cell,
    width: cell * (index === 1 ? 1.5 : 1.08),
  }));

  const decor = {
    helipad: null,
    towers: [],
    trees: [],
    depots: [],
    parkingAprons: [],
    streetlights: [],
    waterBody: null,
  };

  const helipadCandidates = [
    { x: cell * 2.8, y: cell * 2.5, size: cell * 1.6 },
    { x: mapSize - cell * 3.1, y: cell * 2.7, size: cell * 1.6 },
    { x: cell * 2.7, y: mapSize - cell * 3.2, size: cell * 1.6 },
  ];
  decor.helipad =
    helipadCandidates.find((candidate) => !pointNearObstacle(environment, candidate.x, candidate.y, cell * 1.5)) ||
    null;

  if (decor.helipad) {
    decor.parkingAprons.push({
      x: clamp(decor.helipad.x + cell * 2.15, cell * 1.8, mapSize - cell * 1.8),
      y: clamp(decor.helipad.y + cell * 0.65, cell * 1.8, mapSize - cell * 1.8),
      width: cell * 1.6,
      depth: cell * 0.9,
      heading: 0,
    });
  }

  [
    { x: cell * 2.0, y: mapSize * 0.24, height: 190 },
    { x: mapSize - cell * 2.1, y: mapSize * 0.68, height: 182 },
  ].forEach((tower) => {
    if (!pointNearObstacle(environment, tower.x, tower.y, cell * 0.8)) {
      decor.towers.push(tower);
    }
  });

  const waterCandidates = [
    { x: mapSize * 0.16, y: mapSize * 0.82, width: cell * 2.9, depth: cell * 1.8, heading: 0.2 },
    { x: mapSize * 0.84, y: mapSize * 0.2, width: cell * 2.4, depth: cell * 1.5, heading: -0.18 },
  ];
  decor.waterBody =
    waterCandidates.find(
      (candidate) =>
        !pointNearObstacle(environment, candidate.x, candidate.y, Math.max(candidate.width, candidate.depth) * 0.7) &&
        !horizontalRoads.some((road) => Math.abs(road.y - candidate.y) < candidate.depth * 0.75) &&
        !verticalRoads.some((road) => Math.abs(road.x - candidate.x) < candidate.width * 0.75)
    ) || null;

  for (let row = 1; row < rows - 1; row += 2) {
    for (let col = 1; col < cols - 1; col += 2) {
      const x = (col + 0.5) * cell;
      const y = (row + 0.5) * cell;
      if (pointNearObstacle(environment, x, y, cell * 0.58)) {
        continue;
      }
      const roadNearby =
        horizontalRoads.some((road) => Math.abs(road.y - y) < cell * 1.35) ||
        verticalRoads.some((road) => Math.abs(road.x - x) < cell * 1.35);
      const chance = hashUnit(col + 11, row + 17);
      if (!roadNearby && chance > 0.72 && decor.trees.length < 18) {
        decor.trees.push({
          x,
          y,
          height: 18 + hashUnit(col + 3, row + 9) * 14,
          spread: 10 + hashUnit(col + 13, row + 7) * 7,
        });
      }
      if (roadNearby && chance < 0.12 && decor.depots.length < 7) {
        decor.depots.push({
          x,
          y,
          width: cell * 0.55,
          depth: cell * 0.3,
          heading: hashUnit(col + 23, row + 41) > 0.5 ? 0 : Math.PI / 2,
        });
      }
    }
  }

  horizontalRoads.forEach((road, roadIndex) => {
    for (let offset = cell * 1.4; offset < mapSize - cell; offset += cell * 3.4) {
      const x = offset;
      const y = road.y + (roadIndex % 2 === 0 ? road.width * 0.6 : -road.width * 0.6);
      if (!pointNearObstacle(environment, x, y, cell * 0.4) && decor.streetlights.length < 18) {
        decor.streetlights.push({ x, y, height: 24 + hashUnit(offset, road.y) * 8 });
      }
    }
  });
  verticalRoads.forEach((road, roadIndex) => {
    for (let offset = cell * 1.8; offset < mapSize - cell; offset += cell * 3.8) {
      const x = road.x + (roadIndex % 2 === 0 ? -road.width * 0.6 : road.width * 0.6);
      const y = offset;
      if (!pointNearObstacle(environment, x, y, cell * 0.4) && decor.streetlights.length < 30) {
        decor.streetlights.push({ x, y, height: 24 + hashUnit(road.x, offset) * 8 });
      }
    }
  });

  const layout = { horizontalRoads, verticalRoads, decor };
  environmentLayoutCache.set(environment, layout);
  return layout;
}

function getWeatherVisualProfile(config) {
  const preset = (config && config.weather_preset) || "clear";
  const profiles = {
    clear: {
      label: "晴空",
      background: 0xd7e8f8,
      fogColor: 0xd7e8f8,
      fogNearScale: 1.05,
      fogFarScale: 3.4,
      ambient: 1.35,
      hemi: 1.25,
      sun: 1.6,
      sunColor: 0xfff6db,
      mistLayers: 0,
      rainCount: 0,
      rainOpacity: 0,
      cloudCount: 0,
      cloudOpacity: 0,
      mistOpacityBase: 0,
      badgeColor: "rgba(21, 94, 239, 0.72)",
    },
    haze: {
      label: "薄雾",
      background: 0xd3dde7,
      fogColor: 0xdbe3eb,
      fogNearScale: 0.78,
      fogFarScale: 2.35,
      ambient: 1.24,
      hemi: 1.08,
      sun: 1.02,
      sunColor: 0xf5f0de,
      mistLayers: 2,
      rainCount: 0,
      rainOpacity: 0,
      cloudCount: 2,
      cloudOpacity: 0.09,
      mistOpacityBase: 0.03,
      badgeColor: "rgba(71, 85, 105, 0.72)",
    },
    rain: {
      label: "降雨",
      background: 0xb0c1d1,
      fogColor: 0xc1cfdb,
      fogNearScale: 0.7,
      fogFarScale: 2.0,
      ambient: 1.0,
      hemi: 0.92,
      sun: 0.72,
      sunColor: 0xdbe4f0,
      mistLayers: 1,
      rainCount: 260,
      rainOpacity: 0.36,
      cloudCount: 4,
      cloudOpacity: 0.12,
      mistOpacityBase: 0.024,
      badgeColor: "rgba(14, 116, 144, 0.76)",
    },
    storm: {
      label: "雷暴",
      background: 0x8395ab,
      fogColor: 0xaebac7,
      fogNearScale: 0.58,
      fogFarScale: 1.5,
      ambient: 0.78,
      hemi: 0.72,
      sun: 0.34,
      sunColor: 0xcfd7e4,
      mistLayers: 2,
      rainCount: 420,
      rainOpacity: 0.54,
      cloudCount: 6,
      cloudOpacity: 0.15,
      mistOpacityBase: 0.03,
      badgeColor: "rgba(71, 85, 105, 0.82)",
    },
  };
  if (preset === "haze") {
    return {
      ...profiles.haze,
      background: 0xc7d2de,
      fogColor: 0xd2dbe4,
      fogNearScale: 0.58,
      fogFarScale: 1.75,
      ambient: 1.16,
      hemi: 0.98,
      sun: 0.84,
      sunColor: 0xebf1f5,
      mistLayers: 3,
      cloudCount: 4,
      cloudOpacity: 0.15,
      mistOpacityBase: 0.055,
      badgeColor: "rgba(100, 116, 139, 0.78)",
    };
  }
  return profiles[preset] || profiles.clear;
}

function createMistPlane(environment, y, scale, opacity, color) {
  const size = (environment.map_size || 1000) * scale;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  plane.rotation.x = -Math.PI / 2 + 0.05;
  plane.position.set(0, y, 0);
  return plane;
}

function createCloudSheet(environment, y, scale, opacity, color, seedOffset) {
  const group = new THREE.Group();
  const size = environment.map_size || 1000;
  for (let index = 0; index < 4; index += 1) {
    const width = size * lerp(0.18, 0.3, hashUnit(seedOffset + index, 4.2));
    const depth = size * lerp(0.1, 0.18, hashUnit(seedOffset + index, 8.4));
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    mesh.rotation.x = -Math.PI / 2 + lerp(-0.08, 0.08, hashUnit(seedOffset + index, 11.4));
    mesh.rotation.z = lerp(-0.3, 0.3, hashUnit(seedOffset + index, 14.8));
    mesh.position.set(
      lerp(-size * 0.34, size * 0.34, hashUnit(seedOffset + index, 18.1)),
      y + lerp(-8, 8, hashUnit(seedOffset + index, 20.6)),
      lerp(-size * 0.28, size * 0.28, hashUnit(seedOffset + index, 24.9))
    );
    mesh.userData = {
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      driftAmplitude: lerp(size * 0.012, size * 0.028, hashUnit(seedOffset + index, 29.7)),
      driftSpeed: lerp(0.035, 0.075, hashUnit(seedOffset + index, 33.1)),
      driftPhase: hashUnit(seedOffset + index, 37.5) * Math.PI * 2,
    };
    group.add(mesh);
  }
  return group;
}

function createRainField(environment, count, opacity, color) {
  const mapSize = environment.map_size || 1000;
  const positions = new Float32Array(count * 6);
  const drops = [];
  for (let index = 0; index < count; index += 1) {
    const x = lerp(-mapSize / 2, mapSize / 2, hashUnit(index + 1, 1.7));
    const z = lerp(-mapSize / 2, mapSize / 2, hashUnit(index + 1, 3.9));
    const top = lerp(170, 350, hashUnit(index + 1, 6.3));
    const length = lerp(28, 52, hashUnit(index + 1, 8.7));
    const drift = lerp(-10, 10, hashUnit(index + 1, 12.9));
    const speed = lerp(110, 220, hashUnit(index + 1, 15.6));
    const phase = hashUnit(index + 1, 18.8);
    const offset = index * 6;
    positions[offset] = x;
    positions[offset + 1] = top;
    positions[offset + 2] = z;
    positions[offset + 3] = x + drift;
    positions[offset + 4] = top - length;
    positions[offset + 5] = z + drift * 0.35;
    drops.push({ x, z, top, length, drift, speed, phase });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return {
    line: new THREE.LineSegments(geometry, material),
    geometry,
    positions,
    drops,
    floorY: -18,
  };
}

function createLightningBolt(environment, color, opacity) {
  const size = environment.map_size || 1000;
  const points = [
    toWorld(environment, size * 0.76, size * 0.2, 280),
    toWorld(environment, size * 0.72, size * 0.25, 220),
    toWorld(environment, size * 0.75, size * 0.28, 190),
    toWorld(environment, size * 0.7, size * 0.34, 120),
    toWorld(environment, size * 0.73, size * 0.36, 86),
  ];
  const group = new THREE.Group();
  group.add(createLine(points, color, opacity, false));
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(20, 12, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  glow.position.copy(points[0]);
  group.add(glow);
  group.children[0].material.opacity = 0;
  return {
    group,
    line: group.children[0],
    glow,
    baseOpacity: opacity,
    phase: hashUnit(size, opacity) * Math.PI * 2,
  };
}

function createWeatherOverlay(environment, config, compact) {
  const profile = getWeatherVisualProfile(config);
  const group = new THREE.Group();
  const cloudGroups = [];
  let rainField = null;
  let lightning = null;

  for (let index = 0; index < profile.mistLayers; index += 1) {
    group.add(
      createMistPlane(
        environment,
        12 + index * 10,
        compact ? 0.82 + index * 0.08 : 0.92 + index * 0.1,
        compact ? profile.mistOpacityBase * 0.8 + index * 0.01 : profile.mistOpacityBase + index * 0.012,
        profile.fogColor
      )
    );
  }

  for (let index = 0; index < profile.cloudCount; index += 1) {
    const cloudGroup = createCloudSheet(
      environment,
      180 + index * 14,
      0.24,
      compact ? profile.cloudOpacity * 0.85 : profile.cloudOpacity,
      profile.fogColor,
      30 + index * 17
    );
    cloudGroups.push(cloudGroup);
    group.add(cloudGroup);
  }

  if (profile.rainCount > 0) {
    rainField = createRainField(
      environment,
      compact ? Math.floor(profile.rainCount * 0.6) : profile.rainCount,
      profile.rainOpacity,
      0xeaf2fb
    );
    group.add(rainField.line);
  }
  if ((config && config.weather_preset) === "storm") {
    lightning = createLightningBolt(environment, 0xf8fafc, compact ? 0.42 : 0.58);
    group.add(lightning.group);
  }

  const weatherTag = createLabelSprite(profile.label, {
    width: compact ? 132 : 160,
    height: compact ? 46 : 54,
    fontSize: compact ? 18 : 22,
    scale: compact ? 62 : 74,
    background: profile.badgeColor,
    border: "rgba(255,255,255,0.24)",
  });
  weatherTag.position.copy(
    toWorld(environment, (environment.map_size || 1000) * 0.14, (environment.map_size || 1000) * 0.12, compact ? 86 : 98)
  );
  group.add(weatherTag);

  return {
    group,
    profile,
    cloudGroups,
    rainField,
    lightning,
    weatherTag,
  };
}

function animateWeatherOverlay(controller, nowSec) {
  const state = controller.weatherState;
  if (!state) {
    return;
  }

  state.cloudGroups.forEach((cloudGroup) => {
    cloudGroup.children.forEach((mesh) => {
      const data = mesh.userData || {};
      mesh.position.x = (data.baseX || 0) + Math.sin(nowSec * (data.driftSpeed || 0.04) + (data.driftPhase || 0)) * (data.driftAmplitude || 0);
      mesh.position.z =
        (data.baseZ || 0) +
        Math.cos(nowSec * (data.driftSpeed || 0.04) * 0.72 + (data.driftPhase || 0)) * (data.driftAmplitude || 0) * 0.28;
      mesh.position.y = data.baseY || mesh.position.y;
    });
  });

  if (state.rainField) {
    const { positions, drops, floorY, geometry } = state.rainField;
    for (let index = 0; index < drops.length; index += 1) {
      const drop = drops[index];
      const span = drop.top - floorY + drop.length + 36;
      const fall = (nowSec * drop.speed + drop.phase * span) % span;
      const topY = drop.top - fall;
      const sway = Math.sin(nowSec * 1.8 + drop.phase * 12.0) * drop.drift * 0.16;
      const offset = index * 6;
      positions[offset] = drop.x + sway;
      positions[offset + 1] = topY;
      positions[offset + 2] = drop.z;
      positions[offset + 3] = drop.x + drop.drift + sway;
      positions[offset + 4] = topY - drop.length;
      positions[offset + 5] = drop.z + drop.drift * 0.35;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  let flash = 0;
  if (state.lightning) {
    const base = Math.sin(nowSec * 1.45 + state.lightning.phase);
    const flicker = Math.sin(nowSec * 18.0 + state.lightning.phase * 0.7);
    if (base > 0.988) {
      flash = 1;
    } else if (base > 0.958) {
      flash = 0.45 + Math.max(0, flicker) * 0.4;
    }
    state.lightning.line.material.opacity = state.lightning.baseOpacity * flash;
    state.lightning.glow.material.opacity = state.lightning.baseOpacity * 0.26 * flash;
  }

  if (controller.weatherBase) {
    controller.ambientLight.intensity = controller.weatherBase.ambient + flash * 0.42;
    controller.hemiLight.intensity = controller.weatherBase.hemi + flash * 0.24;
    controller.sunLight.intensity = controller.weatherBase.sun + flash * 0.92;
  }
}

function applyWeatherScene(controller, config, environment) {
  const profile = getWeatherVisualProfile(config);
  const mapSize = environment.map_size || 1000;
  controller.weatherBase = profile;
  controller.scene.background = new THREE.Color(profile.background);
  controller.scene.fog = new THREE.Fog(
    profile.fogColor,
    mapSize * profile.fogNearScale,
    mapSize * profile.fogFarScale
  );
  if (controller.ambientLight) {
    controller.ambientLight.intensity = profile.ambient;
  }
  if (controller.hemiLight) {
    controller.hemiLight.intensity = profile.hemi;
  }
  if (controller.sunLight) {
    controller.sunLight.intensity = profile.sun;
    controller.sunLight.color.setHex(profile.sunColor);
  }
}

function createLabelSprite(text, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width || 240;
  canvas.height = options.height || 72;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (options.background !== false) {
    ctx.fillStyle = options.background || "rgba(15, 23, 42, 0.72)";
    roundedRectPath(ctx, 0, 0, canvas.width, canvas.height, 18);
    ctx.fill();
    ctx.strokeStyle = options.border || "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    roundedRectPath(ctx, 1, 1, canvas.width - 2, canvas.height - 2, 18);
    ctx.stroke();
  }
  ctx.fillStyle = options.color || "#f8fafc";
  ctx.font = `${options.fontSize || 28}px "Microsoft YaHei UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const scale = options.scale || 64;
  sprite.scale.set((canvas.width / canvas.height) * scale, scale, 1);
  return sprite;
}

function disposeObject(object) {
  object.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (Array.isArray(node.material)) {
      node.material.forEach((material) => material.dispose());
    } else if (node.material) {
      node.material.dispose();
    }
  });
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    disposeObject(child);
    group.remove(child);
  }
}

function toWorld(environment, x, y, z = 0) {
  const half = (environment.map_size || 1000) / 2;
  return new THREE.Vector3(x - half, z, y - half);
}

function createLine(points, color, opacity = 1, dashed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: opacity < 1, opacity, dashSize: 14, gapSize: 8 })
    : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const line = new THREE.Line(geometry, material);
  if (dashed) {
    line.computeLineDistances();
  }
  return line;
}

function createArcLine(start, end, color, opacity = 1, dashed = false, lift = 120) {
  const midpoint = start.clone().lerp(end, 0.5);
  midpoint.y = Math.max(start.y, end.y) + lift;
  const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
  return createLine(curve.getPoints(28), color, opacity, dashed);
}

function createDashedRoadLine(width, length, orientation = "horizontal") {
  const group = new THREE.Group();
  const dashLength = 18;
  const gap = 14;
  const count = Math.max(6, Math.floor(length / (dashLength + gap)));
  for (let index = 0; index < count; index += 1) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(orientation === "horizontal" ? dashLength : 3, orientation === "horizontal" ? 3 : dashLength),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.56 })
    );
    dash.rotation.x = -Math.PI / 2;
    const offset = -length / 2 + (index + 0.5) * (length / count);
    if (orientation === "horizontal") {
      dash.position.set(offset, 0, 0);
    } else {
      dash.position.set(0, 0, offset);
    }
    group.add(dash);
  }
  return group;
}

function createGround(environment) {
  const group = new THREE.Group();
  const mapSize = environment.map_size || 1000;
  const layout = buildEnvironmentLayout(environment);

  const terrainBase = new THREE.Mesh(
    new THREE.BoxGeometry(mapSize + 180, 26, mapSize + 180),
    new THREE.MeshStandardMaterial({ color: 0x7e9a73, roughness: 0.98, metalness: 0.02 })
  );
  terrainBase.position.y = -13;
  terrainBase.receiveShadow = true;
  group.add(terrainBase);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(mapSize, mapSize, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x9fbd9e, roughness: 0.95, metalness: 0.03 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  for (let patchIndex = 0; patchIndex < 12; patchIndex += 1) {
    const width = lerp(mapSize * 0.08, mapSize * 0.18, hashUnit(patchIndex + 3, 11));
    const depth = lerp(mapSize * 0.05, mapSize * 0.13, hashUnit(patchIndex + 9, 17));
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({
        color: patchIndex % 2 === 0 ? 0x89a97f : 0xb5c79d,
        transparent: true,
        opacity: 0.16,
        roughness: 1,
      })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = lerp(-0.8, 0.8, hashUnit(patchIndex + 21, 5));
    patch.position.copy(
      toWorld(
        environment,
        lerp(mapSize * 0.08, mapSize * 0.92, hashUnit(patchIndex + 31, 7)),
        lerp(mapSize * 0.08, mapSize * 0.92, hashUnit(patchIndex + 13, 29)),
        0.08 + hashUnit(patchIndex + 19, 23) * 0.04
      )
    );
    group.add(patch);
  }

  const districtPlate = new THREE.Mesh(
    new THREE.BoxGeometry(mapSize + 40, 4, mapSize + 40),
    new THREE.MeshStandardMaterial({ color: 0x99b896, roughness: 0.94, metalness: 0.02 })
  );
  districtPlate.position.y = -2;
  districtPlate.receiveShadow = true;
  group.add(districtPlate);

  for (let band = 0; band < 7; band += 1) {
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(mapSize, mapSize / 7.8),
      new THREE.MeshStandardMaterial({
        color: band % 2 === 0 ? 0xa7c5a4 : 0x93b18f,
        transparent: true,
        opacity: 0.18,
        roughness: 1,
      })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.z = -mapSize / 2 + (mapSize * (band + 0.5)) / 7;
    patch.position.y = 0.02;
    group.add(patch);
  }

  const grid = new THREE.GridHelper(mapSize, Math.round(mapSize / (environment.cell_size || 40)), 0x6b7280, 0xcbd5e1);
  if (Array.isArray(grid.material)) {
    grid.material.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.15;
    });
  } else {
    grid.material.transparent = true;
    grid.material.opacity = 0.15;
  }
  group.add(grid);

  layout.horizontalRoads.forEach((road) => {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(mapSize, 2.2, road.width + 8),
      new THREE.MeshStandardMaterial({ color: 0x6f7b83, roughness: 0.92, metalness: 0.04 })
    );
    curb.position.set(0, 0.88, road.y - mapSize / 2);
    curb.receiveShadow = true;
    group.add(curb);

    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(mapSize, road.width),
      new THREE.MeshStandardMaterial({ color: 0x59626b, roughness: 0.88, metalness: 0.04 })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 2.05, road.y - mapSize / 2);
    group.add(strip);

    const shoulder = new THREE.Mesh(
      new THREE.PlaneGeometry(mapSize, road.width + 16),
      new THREE.MeshStandardMaterial({ color: 0x7b8790, transparent: true, opacity: 0.22, roughness: 0.94 })
    );
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(0, 0.92, road.y - mapSize / 2);
    group.add(shoulder);

    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(mapSize, 3),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.76 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 2.12, road.y - mapSize / 2);
    group.add(line);

    const dashed = createDashedRoadLine(3, mapSize, "horizontal");
    dashed.position.set(0, 2.16, road.y - mapSize / 2 + road.width * 0.24);
    group.add(dashed);
  });

  layout.verticalRoads.forEach((road) => {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(road.width + 8, 2.2, mapSize),
      new THREE.MeshStandardMaterial({ color: 0x6f7b83, roughness: 0.92, metalness: 0.04 })
    );
    curb.position.set(road.x - mapSize / 2, 0.88, 0);
    curb.receiveShadow = true;
    group.add(curb);

    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(road.width, mapSize),
      new THREE.MeshStandardMaterial({ color: 0x5a646c, roughness: 0.88, metalness: 0.04 })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(road.x - mapSize / 2, 2.05, 0);
    group.add(strip);

    const shoulder = new THREE.Mesh(
      new THREE.PlaneGeometry(road.width + 16, mapSize),
      new THREE.MeshStandardMaterial({ color: 0x7b8790, transparent: true, opacity: 0.22, roughness: 0.94 })
    );
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(road.x - mapSize / 2, 0.92, 0);
    group.add(shoulder);

    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(3, mapSize),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.76 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(road.x - mapSize / 2, 2.12, 0);
    group.add(line);

    const dashed = createDashedRoadLine(3, mapSize, "vertical");
    dashed.position.set(road.x - mapSize / 2 + road.width * 0.24, 2.16, 0);
    group.add(dashed);
  });

  layout.horizontalRoads.forEach((rowRoad) => {
    layout.verticalRoads.forEach((colRoad) => {
      for (let index = -2; index <= 2; index += 1) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.min(rowRoad.width, colRoad.width) * 0.65, 6),
          new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.24 })
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(colRoad.x - mapSize / 2, 2.18, rowRoad.y - mapSize / 2 + index * 14);
        group.add(stripe);
      }
    });
  });

  if (layout.decor.waterBody) {
    const water = layout.decor.waterBody;
    const shore = new THREE.Mesh(
      new THREE.PlaneGeometry(water.width * 2.2, water.depth * 2.2),
      new THREE.MeshStandardMaterial({ color: 0xc6d4bd, transparent: true, opacity: 0.38, roughness: 0.96 })
    );
    shore.rotation.x = -Math.PI / 2;
    shore.rotation.z = water.heading || 0;
    shore.position.copy(toWorld(environment, water.x, water.y, -1.2));
    group.add(shore);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(water.width * 2, water.depth * 2),
      new THREE.MeshPhysicalMaterial({
        color: 0x2f6fb0,
        roughness: 0.15,
        metalness: 0.08,
        transparent: true,
        opacity: 0.55,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = water.heading || 0;
    mesh.position.copy(toWorld(environment, water.x, water.y, -1.4));
    group.add(mesh);
  }

  if (layout.decor.helipad) {
    const pad = layout.decor.helipad;
    const padMesh = new THREE.Mesh(
      new THREE.CircleGeometry(pad.size, 48),
      new THREE.MeshStandardMaterial({ color: 0xb7c3cc, roughness: 0.82, metalness: 0.03 })
    );
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.copy(toWorld(environment, pad.x, pad.y, 0.18));
    group.add(padMesh);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(pad.size * 0.56, pad.size * 0.66, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.86, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(toWorld(environment, pad.x, pad.y, 0.22));
    group.add(ring);

    const glyph = new THREE.Mesh(
      new THREE.PlaneGeometry(pad.size * 0.92, pad.size * 0.92),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
    );
    glyph.rotation.x = -Math.PI / 2;
    glyph.position.copy(toWorld(environment, pad.x, pad.y, 0.26));
    group.add(glyph);
  }

  layout.decor.parkingAprons.forEach((apron) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(apron.width * 2, apron.depth * 2),
      new THREE.MeshStandardMaterial({ color: 0xb3bec7, roughness: 0.86 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = apron.heading || 0;
    mesh.position.copy(toWorld(environment, apron.x, apron.y, 0.16));
    group.add(mesh);

    for (let lane = -1; lane <= 1; lane += 1) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(apron.width * 1.7, 2.4),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.56 })
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.rotation.z = apron.heading || 0;
      stripe.position.copy(toWorld(environment, apron.x, apron.y + lane * apron.depth * 0.6, 0.2));
      group.add(stripe);
    }
  });

  const half = mapSize / 2;
  const fencePoints = [
    new THREE.Vector3(-half, 0.6, -half),
    new THREE.Vector3(half, 0.6, -half),
    new THREE.Vector3(half, 0.6, half),
    new THREE.Vector3(-half, 0.6, half),
    new THREE.Vector3(-half, 0.6, -half),
  ];
  group.add(createLine(fencePoints, 0x94a3b8, 0.42, false));

  return group;
}

function createBackdropSkyline(environment) {
  const group = new THREE.Group();
  const mapSize = environment.map_size || 1000;
  const ringRadius = mapSize * 0.68;
  const towerCount = 34;
  for (let index = 0; index < towerCount; index += 1) {
    const angle = (index / towerCount) * Math.PI * 2;
    const width = 46 + hashUnit(index + 7, 17) * 56;
    const depth = 46 + hashUnit(index + 23, 31) * 64;
    const height = 90 + hashUnit(index + 19, 41) * 260;
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.61, 0.16, 0.34),
        transparent: true,
        opacity: 0.55,
        roughness: 0.92,
        metalness: 0.05,
      })
    );
    tower.position.set(Math.cos(angle) * ringRadius, height / 2 - 4, Math.sin(angle) * ringRadius);
    tower.rotation.y = angle + Math.PI / 2;
    group.add(tower);
  }
  return group;
}

function createObstacleMesh(environment, obstacle, index) {
  const width = obstacle.width * environment.cell_size;
  const depth = obstacle.height * environment.cell_size;
  const sourceHeight = obstacle.elevation || 80;
  const height = clamp(sourceHeight * 1.5 + Math.min(width, depth) * 0.08, 74, 230);
  const centerX = (obstacle.col + obstacle.width / 2) * environment.cell_size;
  const centerY = (obstacle.row + obstacle.height / 2) * environment.cell_size;
  const group = new THREE.Group();
  group.position.copy(toWorld(environment, centerX, centerY, 0));

  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(width + 8, 8, depth + 8),
    new THREE.MeshStandardMaterial({ color: 0x8b97a5, roughness: 0.9, metalness: 0.04 })
  );
  podium.position.y = 4;
  podium.receiveShadow = true;
  group.add(podium);

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.6, 0.18, lerp(0.22, 0.42, clamp(height / 160, 0, 1))),
    roughness: 0.82,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2 + 8;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const facadeMaterial = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.11,
    side: THREE.DoubleSide,
  });
  const frontFacade = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.76, height * 0.68), facadeMaterial);
  frontFacade.position.set(0, height * 0.06, depth / 2 + 0.8);
  mesh.add(frontFacade);
  const rearFacade = frontFacade.clone();
  rearFacade.position.z = -depth / 2 - 0.8;
  rearFacade.rotation.y = Math.PI;
  mesh.add(rearFacade);
  const sideFacade = new THREE.Mesh(new THREE.PlaneGeometry(depth * 0.72, height * 0.62), facadeMaterial);
  sideFacade.position.set(width / 2 + 0.8, height * 0.04, 0);
  sideFacade.rotation.y = Math.PI / 2;
  mesh.add(sideFacade);
  const sideFacadeOpposite = sideFacade.clone();
  sideFacadeOpposite.position.x = -width / 2 - 0.8;
  sideFacadeOpposite.rotation.y = -Math.PI / 2;
  mesh.add(sideFacadeOpposite);

  const roofGroup = new THREE.Group();
  const units = 1 + ((obstacle.width + obstacle.height + index) % 3);
  for (let unit = 0; unit < units; unit += 1) {
    const unitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.18, 8, depth * 0.16),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.7, metalness: 0.12 })
    );
    unitMesh.position.set(
      lerp(-width * 0.25, width * 0.25, unit / Math.max(units - 1, 1)),
      height / 2 + 4,
      lerp(-depth * 0.18, depth * 0.18, hashUnit(index + 7, unit + 3))
    );
    roofGroup.add(unitMesh);
  }
  const helix = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 2.2, 16, 8),
    new THREE.MeshStandardMaterial({ color: 0xdbe4ec, roughness: 0.6, metalness: 0.35 })
  );
  helix.position.set(width * 0.18, height / 2 + 8, -depth * 0.18);
  roofGroup.add(helix);
  mesh.add(roofGroup);

  return group;
}

function createTree(environment, tree) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 2.6, tree.height * 0.55, 10),
    new THREE.MeshStandardMaterial({ color: 0x7b5c43, roughness: 0.92 })
  );
  trunk.position.y = tree.height * 0.27;
  trunk.castShadow = true;
  group.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(tree.spread, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x2f7a47, roughness: 0.86 })
  );
  crown.position.y = tree.height * 0.82;
  crown.scale.y = 0.84;
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);
  group.position.copy(toWorld(environment, tree.x, tree.y, 0));
  return group;
}

function createTower(environment, tower, index) {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 3.5, tower.height, 10),
    new THREE.MeshStandardMaterial({ color: 0xd9e2ec, roughness: 0.55, metalness: 0.4 })
  );
  shaft.position.y = tower.height / 2;
  shaft.castShadow = true;
  group.add(shaft);
  for (let level = 1; level <= 4; level += 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.3 })
    );
    bar.position.y = (tower.height * level) / 5;
    group.add(bar);
  }
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 12, 10),
    new THREE.MeshBasicMaterial({ color: index === 0 ? 0xfacc15 : 0xf87171 })
  );
  lamp.position.y = tower.height + 6;
  group.add(lamp);
  group.position.copy(toWorld(environment, tower.x, tower.y, 0));
  return group;
}

function createStreetlight(environment, light) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.1, light.height, 8),
    new THREE.MeshStandardMaterial({ color: 0x5b6770, roughness: 0.72, metalness: 0.22 })
  );
  pole.position.y = light.height / 2;
  pole.castShadow = true;
  group.add(pole);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffefb2 })
  );
  head.position.y = light.height;
  group.add(head);
  group.position.copy(toWorld(environment, light.x, light.y, 0));
  return group;
}

function createDepot(environment, depot) {
  const width = depot.width * 2;
  const depth = depot.depth * 2;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 5.5, depth),
    new THREE.MeshStandardMaterial({ color: 0xdfe8ef, roughness: 0.72, metalness: 0.08 })
  );
  mesh.position.copy(toWorld(environment, depot.x, depot.y, 2.75));
  mesh.rotation.y = depot.heading || 0;
  return mesh;
}

function createStaticWorld(environment) {
  const group = new THREE.Group();
  group.add(createBackdropSkyline(environment));
  group.add(createGround(environment));
  (environment.obstacles || []).forEach((obstacle, index) => {
    group.add(createObstacleMesh(environment, obstacle, index));
  });
  const decor = buildEnvironmentLayout(environment).decor;
  decor.trees.forEach((tree) => group.add(createTree(environment, tree)));
  decor.towers.forEach((tower, index) => group.add(createTower(environment, tower, index)));
  decor.streetlights.forEach((light) => group.add(createStreetlight(environment, light)));
  decor.depots.forEach((depot) => group.add(createDepot(environment, depot)));
  return group;
}

function createTrailMesh(environment, trail, color, opacity) {
  const points = trail.points.map((point) => toWorld(environment, point.x, point.y, (point.z || 0) + 2));
  return createLine(points, color, opacity, false);
}

function createTargetObject(environment, target, style, focused, options = {}) {
  const group = new THREE.Group();
  const fade = focused.active && !focused.isTarget ? 0.18 : 1;
  const color = target.last_success ? 0x10b981 : target.last_pass ? 0xf59e0b : 0xdc2626;
  const position = toWorld(environment, target.x, target.y, target.z || 0);
  const markerRadius = options.compact ? (focused.isTarget ? 8.8 : 7.2) : focused.isTarget ? 11.5 : 9.2;

  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(markerRadius, 0),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: focused.isTarget ? 0.62 : 0.32,
      transparent: fade < 1,
      opacity: fade,
      roughness: 0.38,
    })
  );
  marker.position.copy(position);
  marker.castShadow = true;
  group.add(marker);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(markerRadius * 1.55, options.compact ? 12 : 16, options.compact ? 10 : 14),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: focused.isTarget ? 0.18 : 0.1 * fade,
    })
  );
  glow.position.copy(position);
  group.add(glow);

  group.add(
    createLine(
      [toWorld(environment, target.x, target.y, 0), toWorld(environment, target.x, target.y, (target.z || 0) + 34)],
      color,
      focused.isTarget ? 1 : 0.7 * fade,
      false
    )
  );

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(markerRadius * 1.35, markerRadius * 1.95, options.compact ? 20 : 28),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: focused.isTarget ? 0.9 : 0.55 * fade,
      side: THREE.DoubleSide,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.copy(toWorld(environment, target.x, target.y, 1.1));
  group.add(baseRing);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      clamp((target.uncertainty || 18) * 0.22, 10, 28),
      focused.isTarget ? 1.8 : 1.15,
      10,
      options.compact ? 24 : 32
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: focused.isTarget ? 0.56 : 0.22 * fade,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(toWorld(environment, target.x, target.y, 1.6));
  group.add(ring);

  if (target.last_estimate) {
    const estimate = new THREE.Mesh(
      new THREE.BoxGeometry(focused.isTarget ? 15 : 12, focused.isTarget ? 15 : 12, focused.isTarget ? 15 : 12),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(style.estimate),
        emissive: new THREE.Color(style.estimate),
        emissiveIntensity: focused.isTarget ? 0.52 : 0.28,
        transparent: fade < 1,
        opacity: fade,
      })
    );
    estimate.position.copy(toWorld(environment, target.last_estimate[0], target.last_estimate[1], (target.z || 0) + 6));
    group.add(estimate);
    group.add(
      createLine(
        [estimate.position.clone(), toWorld(environment, target.x, target.y, (target.z || 0) + 18)],
        0xffffff,
        focused.isTarget ? 0.68 : 0.24 * fade,
        true
      )
    );
  }

  if (options.showLabels && (!focused.active || focused.isTarget)) {
    const label = createLabelSprite(`T${target.id}`, {
      scale: options.compact ? (focused.isTarget ? 38 : 28) : focused.isTarget ? 48 : 36,
      width: options.compact ? 110 : 140,
      height: options.compact ? 46 : 56,
      fontSize: options.compact ? 18 : 22,
      background: "rgba(15, 23, 42, 0.58)",
    });
    label.position.copy(toWorld(environment, target.x, target.y, (target.z || 0) + 54));
    group.add(label);
  }

  return group;
}

function createSensorSector(environment, uav, config, color, opacity) {
  const radius = config.sensor_range || 180;
  const fov = THREE.MathUtils.degToRad(config.sensor_fov_deg || 120);
  const detail = config.compactVisuals ? 20 : 32;
  const group = new THREE.Group();
  const highlightColor = new THREE.Color(0x53b8ff);
  const footprint = new THREE.Mesh(
    new THREE.CircleGeometry(radius, detail, -fov / 2, fov),
    new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: config.compactVisuals ? Math.max(opacity, 0.12) : Math.max(opacity, 0.22),
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  footprint.rotation.x = -Math.PI / 2;
  footprint.position.y = -uav.z + 1.8;
  group.add(footprint);

  const footprintCore = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.94, detail, -fov / 2, fov),
    new THREE.MeshBasicMaterial({
      color: 0x87d9ff,
      transparent: true,
      opacity: config.compactVisuals ? 0.08 : 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  footprintCore.rotation.x = -Math.PI / 2;
  footprintCore.position.y = -uav.z + 2.1;
  group.add(footprintCore);

  const volume = new THREE.Mesh(
    new THREE.CylinderGeometry(0, radius * 0.54, radius * 0.88, detail, 1, true, -fov / 2, fov),
    new THREE.MeshStandardMaterial({
      color: highlightColor,
      emissive: highlightColor,
      emissiveIntensity: config.compactVisuals ? 0.16 : 0.28,
      transparent: true,
      opacity: config.compactVisuals ? 0.14 : Math.max(opacity * 0.82, 0.2),
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.2,
      metalness: 0.05,
    })
  );
  volume.rotation.z = -Math.PI / 2 - 0.26;
  volume.position.set(radius * 0.34, -12, 0);
  group.add(volume);

  const groundY = -uav.z + 2.2;
  const left = new THREE.Vector3(Math.cos(-fov / 2) * radius, groundY, Math.sin(-fov / 2) * radius);
  const right = new THREE.Vector3(Math.cos(fov / 2) * radius, groundY, Math.sin(fov / 2) * radius);
  const rimPoints = [];
  const rimSegments = config.compactVisuals ? 16 : 26;
  for (let segment = 0; segment <= rimSegments; segment += 1) {
    const angle = -fov / 2 + (segment / rimSegments) * fov;
    rimPoints.push(new THREE.Vector3(Math.cos(angle) * radius, groundY, Math.sin(angle) * radius));
  }
  group.add(createLine([new THREE.Vector3(0, groundY, 0), ...rimPoints], 0x9cdcff, config.compactVisuals ? 0.42 : 0.68, false));
  group.add(createLine([new THREE.Vector3(0, 0, 0), left], 0x6fd6ff, config.compactVisuals ? 0.38 : 0.72, false));
  group.add(createLine([new THREE.Vector3(0, 0, 0), right], 0x6fd6ff, config.compactVisuals ? 0.38 : 0.72, false));

  const apex = new THREE.Mesh(
    new THREE.SphereGeometry(config.compactVisuals ? 2.8 : 4.2, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xcff2ff, transparent: true, opacity: 0.88 })
  );
  apex.position.set(0, 0, 0);
  group.add(apex);

  const farCap = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.28, config.compactVisuals ? 1.2 : 1.8, 8, 28, fov),
    new THREE.MeshBasicMaterial({
      color: 0xa8e5ff,
      transparent: true,
      opacity: config.compactVisuals ? 0.22 : 0.38,
    })
  );
  farCap.rotation.y = Math.PI / 2;
  farCap.rotation.z = Math.PI / 2;
  farCap.position.set(radius * 0.74, groundY * 0.18, 0);
  group.add(farCap);
  return group;
}

function createDroneObject(environment, uav, style, config, focused, options = {}) {
  const group = new THREE.Group();
  const fade = focused.active && !focused.isAssignment ? 0.18 : 1;
  group.position.copy(toWorld(environment, uav.x, uav.y, uav.z));
  group.rotation.y = -uav.heading + Math.PI / 2;
  const bodyRadius = options.compact ? (focused.isAssignment ? 10.5 : 8.6) : focused.isAssignment ? 12.6 : 10.2;
  const bodyLength = options.compact ? (focused.isAssignment ? 26 : 22) : focused.isAssignment ? 31 : 26;

  const groundShadow = new THREE.Mesh(
    new THREE.CircleGeometry(focused.isAssignment ? 18 : 13, 24),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.14 * fade })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = -uav.z + 1.4;
  group.add(groundShadow);

  const groundRing = new THREE.Mesh(
    new THREE.RingGeometry(focused.isAssignment ? 13 : 10, focused.isAssignment ? 18 : 14, 28),
    new THREE.MeshBasicMaterial({
      color: bodyColorPreview(style.drone, uav.failed),
      transparent: true,
      opacity: focused.isAssignment ? 0.42 : 0.2 * fade,
      side: THREE.DoubleSide,
    })
  );
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = -uav.z + 2.1;
  group.add(groundRing);

  group.add(
    createLine(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -uav.z + 2.5, 0)],
      0x94a3b8,
      focused.isAssignment ? 0.5 : 0.16 * fade,
      false
    )
  );

  const bodyColor = bodyColorPreview(style.drone, uav.failed);
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(bodyRadius, bodyLength, 7),
    new THREE.MeshStandardMaterial({
      color: bodyColor,
      emissive: bodyColor,
      emissiveIntensity: focused.isAssignment && !uav.failed ? 0.34 : 0.14,
      transparent: fade < 1,
      opacity: fade,
      roughness: 0.48,
      metalness: 0.14,
    })
  );
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(options.compact ? 2.8 : 3.4, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: uav.failed ? 0.22 : 0.92 * fade })
  );
  nose.position.set(bodyLength * 0.38, 0, 0);
  group.add(nose);

  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    transparent: fade < 1,
    opacity: fade,
    roughness: 0.65,
    metalness: 0.08,
  });
  [
    [16, 0, 0],
    [-16, 0, 0],
    [0, 0, 16],
    [0, 0, -16],
  ].forEach((offset) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 20), armMaterial);
    arm.position.set(offset[0], offset[1], offset[2]);
    group.add(arm);
    const rotor = new THREE.Mesh(
      new THREE.TorusGeometry(4.8, 0.72, 8, options.compact ? 14 : 18),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.58 * fade })
    );
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(offset[0], offset[1] + 0.2, offset[2]);
    group.add(rotor);
  });

  if (focused.isAssignment) {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(12, 16, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.76, side: THREE.DoubleSide })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -uav.z + 2.4;
    group.add(halo);
  }

  if (!uav.failed) {
    group.add(
      createSensorSector(environment, { ...uav }, { ...config, compactVisuals: Boolean(options.compact) }, style.sensor, focused.isAssignment ? 0.24 : 0.07 * fade)
    );
  }

  if (options.showLabels && (!focused.active || focused.isAssignment)) {
    const label = createLabelSprite(`A${uav.id}`, {
      scale: options.compact ? (focused.isAssignment ? 34 : 26) : focused.isAssignment ? 42 : 34,
      width: options.compact ? 100 : 120,
      height: options.compact ? 42 : 52,
      fontSize: options.compact ? 17 : 21,
      background: "rgba(15, 23, 42, 0.5)",
    });
    label.position.set(0, 34, 0);
    group.add(label);
  }

  return group;
}

function buildSceneContents(controller, payload) {
  const { environment, frame, config, style, focusedTargetId, trails, showLabels, compact } = payload;
  const focusActive = focusedTargetId !== null && focusedTargetId !== undefined;
  const focusedAssignments = new Set(
    (frame.uavs || []).filter((uav) => focusActive && uav.assignment === focusedTargetId && !uav.failed).map((uav) => uav.id)
  );

  applyWeatherScene(controller, config || {}, environment);

  if (controller.envRef !== environment) {
    clearGroup(controller.staticGroup);
    controller.staticGroup.add(createStaticWorld(environment));
    controller.envRef = environment;
  }

  clearGroup(controller.dynamicGroup);
  controller.weatherState = createWeatherOverlay(environment, config || {}, compact);
  controller.dynamicGroup.add(controller.weatherState.group);

  (trails?.targets || []).forEach((trail) => {
    const opacity = focusActive && trail.id !== focusedTargetId ? 0.12 : trail.id === focusedTargetId ? 0.86 : 0.38;
    controller.dynamicGroup.add(createTrailMesh(environment, trail, 0xdc2626, opacity));
  });

  (trails?.uavs || []).forEach((trail) => {
    const active = focusActive && focusedAssignments.has(trail.id);
    const opacity = focusActive && !active ? 0.1 : active ? 0.82 : 0.28;
    controller.dynamicGroup.add(
      createTrailMesh(environment, trail, trail.failed ? 0x94a3b8 : new THREE.Color(style.drone).getHex(), opacity)
    );
  });

  (frame.targets || []).forEach((target) => {
    controller.dynamicGroup.add(
      createTargetObject(environment, target, style, {
        active: focusActive,
        isTarget: focusActive && target.id === focusedTargetId,
      }, { showLabels, compact })
    );
  });

  const targetLookup = new Map((frame.targets || []).map((target) => [target.id, target]));
  (frame.uavs || []).forEach((uav) => {
    controller.dynamicGroup.add(
      createDroneObject(environment, uav, style, config, {
        active: focusActive,
        isAssignment: focusActive && focusedAssignments.has(uav.id),
      }, { showLabels, compact })
    );

  if (uav.assignment !== null && !uav.failed) {
      const target = targetLookup.get(uav.assignment);
      if (target) {
        const lineStart = toWorld(environment, uav.x, uav.y, Math.max(uav.z - 6, 10));
        const lineEnd = toWorld(environment, target.x, target.y, (target.z || 0) + 12);
        const arcLift = clamp(lineStart.distanceTo(lineEnd) * 0.18, 72, 180);
        controller.dynamicGroup.add(
          createArcLine(
            lineStart,
            lineEnd,
            new THREE.Color(style.link).getHex(),
            focusActive && uav.assignment !== focusedTargetId ? 0.14 : 0.52,
            true,
            arcLift
          )
        );
      }
    }
  });
}

function updateCamera(controller, environment) {
  const radius = controller.view.distance;
  const horizontal = radius * Math.cos(controller.view.pitch);
  const lookAhead = controller.view.pitch > 1.35 ? 0 : (environment.map_size || 1000) * 0.04;
  controller.camera.position.set(
    Math.cos(controller.view.yaw) * horizontal,
    Math.sin(controller.view.pitch) * radius,
    Math.sin(controller.view.yaw) * horizontal
  );
  controller.camera.lookAt(0, (environment.map_size || 1000) * 0.055, lookAhead);
}

function ensureRendererSize(controller) {
  const width = controller.canvas.clientWidth || controller.canvas.width;
  const height = controller.canvas.clientHeight || controller.canvas.height;
  controller.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, controller.maxPixelRatio || 1.25));
  controller.renderer.setSize(width, height, false);
  controller.camera.aspect = width / Math.max(height, 1);
  controller.camera.updateProjectionMatrix();
}

function renderEmptyScene(controller, text) {
  clearGroup(controller.dynamicGroup);
  clearGroup(controller.staticGroup);
  controller.weatherState = null;
  controller.scene.background = new THREE.Color(0xcfe2f5);
  controller.scene.fog = new THREE.Fog(0xcfe2f5, 720, 2600);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: 0xa9c3a5, roughness: 0.95 })
  );
  plane.rotation.x = -Math.PI / 2;
  controller.staticGroup.add(plane);
  const label = createLabelSprite(text, {
    scale: 120,
    width: 540,
    height: 90,
    fontSize: 28,
    background: "rgba(15, 23, 42, 0.62)",
  });
  label.position.set(0, 72, 0);
  controller.dynamicGroup.add(label);
  updateCamera(controller, { map_size: 1000 });
  controller.renderer.render(controller.scene, controller.camera);
}

function createOrbitController(canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: options.compact ? false : true,
    alpha: false,
    powerPreference: "high-performance",
  });
  const shadowsEnabled = options.shadows !== false;
  renderer.shadowMap.enabled = shadowsEnabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.compact ? 1.08 : 1.14;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd7e8f8);
  scene.fog = new THREE.Fog(0xd7e8f8, 900, 3400);

  const camera = new THREE.PerspectiveCamera(options.compact ? 52 : 56, 1, 1, 5200);
  const view = {
    yaw: options.yaw !== undefined ? options.yaw : -2.18,
    pitch: options.pitch !== undefined ? options.pitch : 0.56,
    distance: options.distance !== undefined ? options.distance : 2100,
  };
  const defaultView = {
    yaw: view.yaw,
    pitch: view.pitch,
    distance: view.distance,
  };
  const minPitch = options.minPitch !== undefined ? options.minPitch : 0.06;
  const maxPitch = options.maxPitch !== undefined ? options.maxPitch : 1.54;
  const minDistance = options.minDistance !== undefined ? options.minDistance : 720;
  const maxDistance = options.maxDistance !== undefined ? options.maxDistance : 4200;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x355b44, 1.25);
  scene.add(ambientLight);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xfff6db, 1.6);
  sun.position.set(560, 920, 420);
  sun.castShadow = shadowsEnabled;
  sun.shadow.mapSize.width = options.compact ? 768 : 1280;
  sun.shadow.mapSize.height = options.compact ? 768 : 1280;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 3000;
  sun.shadow.camera.left = -1100;
  sun.shadow.camera.right = 1100;
  sun.shadow.camera.top = 1100;
  sun.shadow.camera.bottom = -1100;
  scene.add(sun);

  const staticGroup = new THREE.Group();
  const dynamicGroup = new THREE.Group();
  scene.add(staticGroup);
  scene.add(dynamicGroup);

  const controller = {
    canvas,
    renderer,
    scene,
    camera,
    view,
    staticGroup,
    dynamicGroup,
    ambientLight,
    hemiLight,
    sunLight: sun,
    envRef: null,
    payload: null,
    weatherState: null,
    weatherBase: null,
    animateWeather: Boolean(options.animateWeather),
    maxPixelRatio: options.maxPixelRatio !== undefined ? options.maxPixelRatio : options.compact ? 0.95 : 1.2,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  function rerender() {
    if (!controller.payload) {
      renderEmptyScene(controller, "运行仿真后显示真实 3D 场景");
      return;
    }
    ensureRendererSize(controller);
    buildSceneContents(controller, controller.payload);
    updateCamera(controller, controller.payload.environment || { map_size: 1000 });
    renderer.render(scene, camera);
  }

  if (options.interactive !== false) {
    canvas.addEventListener("mousedown", (event) => {
      controller.dragging = true;
      controller.lastX = event.clientX;
      controller.lastY = event.clientY;
    });
    window.addEventListener("mouseup", () => {
      controller.dragging = false;
    });
    window.addEventListener("mousemove", (event) => {
      if (!controller.dragging) return;
      const dx = event.clientX - controller.lastX;
      const dy = event.clientY - controller.lastY;
      controller.lastX = event.clientX;
      controller.lastY = event.clientY;
      controller.view.yaw -= dx * 0.006;
      controller.view.pitch = clamp(controller.view.pitch + dy * 0.004, minPitch, maxPitch);
      rerender();
    });
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        controller.view.distance = clamp(controller.view.distance + event.deltaY * 0.8, minDistance, maxDistance);
        rerender();
      },
      { passive: false }
    );
    canvas.addEventListener("dblclick", () => {
      controller.view.yaw = defaultView.yaw;
      controller.view.pitch = defaultView.pitch;
      controller.view.distance = defaultView.distance;
      rerender();
    });
  }

  window.addEventListener("resize", rerender);

  function tick(nowMs) {
    if (
      controller.animateWeather &&
      controller.payload &&
      controller.weatherState &&
      controller.canvas.isConnected &&
      controller.canvas.clientWidth > 0 &&
      controller.canvas.clientHeight > 0
    ) {
      animateWeatherOverlay(controller, nowMs / 1000);
      ensureRendererSize(controller);
      renderer.render(scene, camera);
    }
    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);

  return {
    drawEmpty(text) {
      controller.payload = null;
      ensureRendererSize(controller);
      renderEmptyScene(controller, text || "运行仿真后显示真实 3D 场景");
    },
    render(payload) {
      controller.payload = payload;
      ensureRendererSize(controller);
      rerender();
    },
    resetView() {
      controller.view.yaw = defaultView.yaw;
      controller.view.pitch = defaultView.pitch;
      controller.view.distance = defaultView.distance;
      rerender();
    },
    topView() {
      const mapSize = controller.payload?.environment?.map_size || 1000;
      controller.view.yaw = options.topYaw !== undefined ? options.topYaw : -Math.PI / 2;
      controller.view.pitch = options.topPitch !== undefined ? options.topPitch : 1.52;
      controller.view.distance = clamp(
        options.topDistance !== undefined ? options.topDistance : Math.max(mapSize * 1.04, defaultView.distance * 0.96),
        minDistance,
        maxDistance
      );
      rerender();
    },
    setView(nextView) {
      controller.view.yaw = nextView.yaw !== undefined ? nextView.yaw : controller.view.yaw;
      controller.view.pitch = nextView.pitch !== undefined ? clamp(nextView.pitch, minPitch, maxPitch) : controller.view.pitch;
      controller.view.distance =
        nextView.distance !== undefined ? clamp(nextView.distance, minDistance, maxDistance) : controller.view.distance;
      rerender();
    },
  };
}

window.Scene3D = { createOrbitController };
window.dispatchEvent(new Event("scene3d-ready"));
