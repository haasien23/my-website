(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  function normalize(vector) {
    const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
    return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
  }

  function averageDepth(points) {
    if (!points.length) return 0;
    return points.reduce((sum, point) => sum + point.depth, 0) / points.length;
  }

  function lerp(start, end, ratio) {
    return start + (end - start) * ratio;
  }

  function angleDelta(a, b) {
    let delta = a - b;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  function hashUnit(seedA, seedB) {
    const raw = Math.sin(seedA * 12.9898 + seedB * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  function droneRgb(style) {
    if (style.drone === "#0f766e") return "15, 118, 110";
    if (style.drone === "#ea580c") return "234, 88, 12";
    return "71, 85, 105";
  }

  function withAlpha(color, alpha) {
    const safeAlpha = clamp(alpha, 0, 1).toFixed(3);
    if (!color) return color;
    const rgbMatch = color.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(",").map((part) => part.trim());
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${safeAlpha})`;
    }
    if (/^#([0-9a-f]{6})$/i.test(color)) {
      const hex = color.slice(1);
      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
    }
    return color;
  }

  function drawPolygon(ctx, points, fillStyle, strokeStyle, lineWidth) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
  }

  function blendPoint(a, b, ratio) {
    return {
      x: lerp(a.x, b.x, ratio),
      y: lerp(a.y, b.y, ratio),
    };
  }

  function quadPoint(quad, u, v) {
    const top = blendPoint(quad[0], quad[1], u);
    const bottom = blendPoint(quad[3], quad[2], u);
    return blendPoint(top, bottom, v);
  }

  function pointNearObstacle(environment, x, y, margin) {
    const obstacleMargin = margin || 0;
    const cell = environment.cell_size || 50;
    return (environment.obstacles || []).some((obstacle) => {
      const x0 = obstacle.col * cell - obstacleMargin;
      const x1 = (obstacle.col + obstacle.width) * cell + obstacleMargin;
      const y0 = obstacle.row * cell - obstacleMargin;
      const y1 = (obstacle.row + obstacle.height) * cell + obstacleMargin;
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });
  }

  const environmentLayoutCache = new WeakMap();

  function chooseRoadBands(coverage, targetRatios, size) {
    const taken = new Set();
    return targetRatios
      .map((ratio, index) => {
        const target = Math.round((size - 1) * ratio);
        let bestIndex = target;
        let bestScore = Number.POSITIVE_INFINITY;
        for (let candidate = 1; candidate < size - 1; candidate += 1) {
          if (taken.has(candidate) || taken.has(candidate - 1) || taken.has(candidate + 1)) {
            continue;
          }
          const score = coverage[candidate] * 7 + Math.abs(candidate - target) * (1 + index * 0.25);
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
    const cell = environment.cell_size || 50;
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

    const horizontalRoads = chooseRoadBands(rowCoverage, [0.22, 0.68], rows).map((row, index) => ({
      y: (row + 0.5) * cell,
      width: cell * (index === 0 ? 1.35 : 1.05),
    }));
    const verticalRoads = chooseRoadBands(colCoverage, [0.34, 0.8], cols).map((col, index) => ({
      x: (col + 0.5) * cell,
      width: cell * (index === 0 ? 1.28 : 1.0),
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
      { x: cell * 2.3, y: cell * 2.2, size: cell * 1.45 },
      { x: mapSize - cell * 2.6, y: cell * 2.4, size: cell * 1.45 },
      { x: cell * 2.5, y: mapSize - cell * 2.8, size: cell * 1.45 },
    ];
    decor.helipad =
      helipadCandidates.find((item) => !pointNearObstacle(environment, item.x, item.y, cell * 1.3)) || null;

    if (decor.helipad) {
      decor.parkingAprons.push({
        x: clamp(decor.helipad.x + cell * 1.9, cell * 1.4, mapSize - cell * 1.4),
        y: clamp(decor.helipad.y + cell * 0.45, cell * 1.4, mapSize - cell * 1.4),
        width: cell * 1.55,
        depth: cell * 0.95,
        heading: 0,
      });
    }

    [
      { x: cell * 1.8, y: mapSize * 0.2, height: 165 },
      { x: mapSize - cell * 1.8, y: mapSize * 0.72, height: 172 },
    ].forEach((tower) => {
      if (!pointNearObstacle(environment, tower.x, tower.y, cell * 1.0)) {
        decor.towers.push(tower);
      }
    });

    const waterCandidates = [
      { x: mapSize * 0.17, y: mapSize * 0.78, width: cell * 2.8, depth: cell * 1.8 },
      { x: mapSize * 0.82, y: mapSize * 0.24, width: cell * 2.5, depth: cell * 1.55 },
    ];
    decor.waterBody =
      waterCandidates.find(
        (item) =>
          !pointNearObstacle(environment, item.x, item.y, Math.max(item.width, item.depth) * 0.7) &&
          !horizontalRoads.some((road) => Math.abs(road.y - item.y) < item.depth * 0.7) &&
          !verticalRoads.some((road) => Math.abs(road.x - item.x) < item.width * 0.7)
      ) || null;

    for (let row = 1; row < rows - 1; row += 2) {
      for (let col = 1; col < cols - 1; col += 2) {
        const x = (col + 0.5) * cell;
        const y = (row + 0.5) * cell;
        if (pointNearObstacle(environment, x, y, cell * 0.55)) {
          continue;
        }
        const roadNearby =
          horizontalRoads.some((road) => Math.abs(road.y - y) < cell * 1.3) ||
          verticalRoads.some((road) => Math.abs(road.x - x) < cell * 1.3);
        const treeChance = hashUnit(col + 13, row + 29);
        if (!roadNearby && treeChance > 0.72 && decor.trees.length < 14) {
          decor.trees.push({
            x,
            y,
            height: 24 + hashUnit(col + 3, row + 8) * 18,
            spread: 14 + hashUnit(col + 11, row + 7) * 9,
          });
        }
        if (roadNearby && treeChance < 0.12 && decor.depots.length < 6) {
          decor.depots.push({
            x,
            y,
            width: cell * 0.62,
            depth: cell * 0.34,
            heading: hashUnit(col + 17, row + 41) > 0.5 ? 0 : Math.PI / 2,
          });
        }
      }
    }

    horizontalRoads.forEach((road, roadIndex) => {
      for (let offset = cell * 1.3; offset < mapSize - cell; offset += cell * 3.2) {
        const x = offset;
        const y = road.y + (roadIndex % 2 === 0 ? road.width * 0.56 : -road.width * 0.56);
        if (!pointNearObstacle(environment, x, y, cell * 0.4) && decor.streetlights.length < 20) {
          decor.streetlights.push({ x, y, height: 28 + hashUnit(offset, road.y) * 10 });
        }
      }
    });
    verticalRoads.forEach((road, roadIndex) => {
      for (let offset = cell * 1.7; offset < mapSize - cell; offset += cell * 3.6) {
        const x = road.x + (roadIndex % 2 === 0 ? -road.width * 0.56 : road.width * 0.56);
        const y = offset;
        if (!pointNearObstacle(environment, x, y, cell * 0.4) && decor.streetlights.length < 34) {
          decor.streetlights.push({ x, y, height: 28 + hashUnit(road.x, offset) * 10 });
        }
      }
    });

    const layout = { horizontalRoads, verticalRoads, decor };
    environmentLayoutCache.set(environment, layout);
    return layout;
  }

  function drawSceneBackground(ctx, canvas) {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#8fb8e8");
    sky.addColorStop(0.24, "#c6ddf7");
    sky.addColorStop(0.58, "#eef6ff");
    sky.addColorStop(1, "#e7f3ea");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width * 0.76, canvas.height * 0.18, 10, canvas.width * 0.76, canvas.height * 0.18, canvas.width * 0.55);
    glow.addColorStop(0, "rgba(255, 245, 210, 0.55)");
    glow.addColorStop(0.28, "rgba(255, 244, 224, 0.18)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.11)";
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.18, canvas.height * 0.2, canvas.width * 0.16, canvas.height * 0.05, -0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.62, canvas.height * 0.26, canvas.width * 0.18, canvas.height * 0.06, 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(68, 98, 124, 0.14)";
    const skylineY = canvas.height * 0.31;
    ctx.beginPath();
    ctx.moveTo(0, skylineY + 24);
    for (let index = 0; index <= 18; index += 1) {
      const x = (canvas.width / 18) * index;
      const height = 18 + hashUnit(index + 2, 7) * 56;
      ctx.lineTo(x, skylineY + 20 - height);
      ctx.lineTo(x + canvas.width / 24, skylineY + 20 - height);
    }
    ctx.lineTo(canvas.width, skylineY + 24);
    ctx.closePath();
    ctx.fill();

    const vignette = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.18, canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.8);
    vignette.addColorStop(0, "rgba(15, 23, 42, 0)");
    vignette.addColorStop(1, "rgba(15, 23, 42, 0.14)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function createCamera(view, mapSize) {
    const target = { x: mapSize / 2, y: mapSize / 2, z: 42 };
    const eye = {
      x: target.x + view.distance * Math.cos(view.pitch) * Math.cos(view.yaw),
      y: target.y + view.distance * Math.cos(view.pitch) * Math.sin(view.yaw),
      z: target.z + view.distance * Math.sin(view.pitch),
    };
    const forward = normalize(subtract(target, eye));
    const upRef = { x: 0, y: 0, z: 1 };
    let right = cross(forward, upRef);
    if (Math.hypot(right.x, right.y, right.z) < 1e-6) {
      right = { x: 1, y: 0, z: 0 };
    }
    right = normalize(right);
    const up = normalize(cross(right, forward));
    return { eye, forward, right, up };
  }

  function projectPoint(point, camera, canvas) {
    const relative = subtract(point, camera.eye);
    const depth = dot(relative, camera.forward);
    if (depth <= 4) {
      return null;
    }
    const focal = Math.min(canvas.width, canvas.height) * 1.08;
    const scale = focal / depth;
    return {
      x: canvas.width * 0.5 + dot(relative, camera.right) * scale,
      y: canvas.height * 0.62 - dot(relative, camera.up) * scale,
      depth,
      scale,
    };
  }

  function drawRoadBand(ctx, canvas, camera, orientation, center, width, mapSize) {
    const half = width / 2;
    const polygon =
      orientation === "horizontal"
        ? [
            projectPoint({ x: 0, y: center - half, z: 0.4 }, camera, canvas),
            projectPoint({ x: mapSize, y: center - half, z: 0.4 }, camera, canvas),
            projectPoint({ x: mapSize, y: center + half, z: 0.4 }, camera, canvas),
            projectPoint({ x: 0, y: center + half, z: 0.4 }, camera, canvas),
          ].filter(Boolean)
        : [
            projectPoint({ x: center - half, y: 0, z: 0.4 }, camera, canvas),
            projectPoint({ x: center + half, y: 0, z: 0.4 }, camera, canvas),
            projectPoint({ x: center + half, y: mapSize, z: 0.4 }, camera, canvas),
            projectPoint({ x: center - half, y: mapSize, z: 0.4 }, camera, canvas),
          ].filter(Boolean);
    if (polygon.length !== 4) {
      return;
    }

    drawPolygon(ctx, polygon, "rgba(102, 116, 128, 0.56)", "rgba(226, 232, 240, 0.18)", 1);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;

    const edgeA =
      orientation === "horizontal"
        ? [
            projectPoint({ x: 0, y: center - half * 0.72, z: 0.7 }, camera, canvas),
            projectPoint({ x: mapSize, y: center - half * 0.72, z: 0.7 }, camera, canvas),
          ]
        : [
            projectPoint({ x: center - half * 0.72, y: 0, z: 0.7 }, camera, canvas),
            projectPoint({ x: center - half * 0.72, y: mapSize, z: 0.7 }, camera, canvas),
          ];
    const edgeB =
      orientation === "horizontal"
        ? [
            projectPoint({ x: 0, y: center + half * 0.72, z: 0.7 }, camera, canvas),
            projectPoint({ x: mapSize, y: center + half * 0.72, z: 0.7 }, camera, canvas),
          ]
        : [
            projectPoint({ x: center + half * 0.72, y: 0, z: 0.7 }, camera, canvas),
            projectPoint({ x: center + half * 0.72, y: mapSize, z: 0.7 }, camera, canvas),
          ];
    [edgeA, edgeB].forEach((edge) => {
      if (!edge[0] || !edge[1]) return;
      ctx.beginPath();
      ctx.moveTo(edge[0].x, edge[0].y);
      ctx.lineTo(edge[1].x, edge[1].y);
      ctx.stroke();
    });

    ctx.save();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.56)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([10, 12]);
    const centerLine =
      orientation === "horizontal"
        ? [
            projectPoint({ x: 0, y: center, z: 0.9 }, camera, canvas),
            projectPoint({ x: mapSize, y: center, z: 0.9 }, camera, canvas),
          ]
        : [
            projectPoint({ x: center, y: 0, z: 0.9 }, camera, canvas),
            projectPoint({ x: center, y: mapSize, z: 0.9 }, camera, canvas),
          ];
    if (centerLine[0] && centerLine[1]) {
      ctx.beginPath();
      ctx.moveTo(centerLine[0].x, centerLine[0].y);
      ctx.lineTo(centerLine[1].x, centerLine[1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrosswalk(ctx, canvas, camera, x, y, size) {
    const half = size / 2;
    for (let index = -2; index <= 2; index += 1) {
      const offset = index * (size / 6);
      const stripe = [
        projectPoint({ x: x - half, y: y + offset - 5, z: 1 }, camera, canvas),
        projectPoint({ x: x + half, y: y + offset - 5, z: 1 }, camera, canvas),
        projectPoint({ x: x + half, y: y + offset + 5, z: 1 }, camera, canvas),
        projectPoint({ x: x - half, y: y + offset + 5, z: 1 }, camera, canvas),
      ].filter(Boolean);
      if (stripe.length === 4) {
        drawPolygon(ctx, stripe, "rgba(248, 250, 252, 0.2)", null, 0);
      }
    }
  }

  function drawSurfaceRect(ctx, canvas, camera, rect, fillStyle, strokeStyle, z) {
    const heading = rect.heading || 0;
    const dx = Math.cos(heading) * rect.width;
    const dy = Math.sin(heading) * rect.width;
    const sx = Math.cos(heading + Math.PI / 2) * rect.depth;
    const sy = Math.sin(heading + Math.PI / 2) * rect.depth;
    const surface = [
      projectPoint({ x: rect.x - dx - sx, y: rect.y - dy - sy, z: z || 0.7 }, camera, canvas),
      projectPoint({ x: rect.x + dx - sx, y: rect.y + dy - sy, z: z || 0.7 }, camera, canvas),
      projectPoint({ x: rect.x + dx + sx, y: rect.y + dy + sy, z: z || 0.7 }, camera, canvas),
      projectPoint({ x: rect.x - dx + sx, y: rect.y - dy + sy, z: z || 0.7 }, camera, canvas),
    ].filter(Boolean);
    if (surface.length === 4) {
      drawPolygon(ctx, surface, fillStyle, strokeStyle, 1);
    }
  }

  function drawGround(ctx, canvas, environment, camera) {
    const mapSize = environment.map_size || 1000;
    const layout = buildEnvironmentLayout(environment);
    const corners = [
      projectPoint({ x: 0, y: 0, z: 0 }, camera, canvas),
      projectPoint({ x: mapSize, y: 0, z: 0 }, camera, canvas),
      projectPoint({ x: mapSize, y: mapSize, z: 0 }, camera, canvas),
      projectPoint({ x: 0, y: mapSize, z: 0 }, camera, canvas),
    ].filter(Boolean);
    if (!corners.length) return;

    const topY = Math.min(...corners.map((point) => point.y));
    const bottomY = Math.max(...corners.map((point) => point.y));
    const ground = ctx.createLinearGradient(0, topY, 0, bottomY);
    ground.addColorStop(0, "rgba(204, 225, 214, 0.92)");
    ground.addColorStop(0.45, "rgba(226, 239, 231, 0.94)");
    ground.addColorStop(1, "rgba(212, 229, 219, 0.96)");
    drawPolygon(ctx, corners, ground, "rgba(148, 163, 184, 0.22)", 1);

    for (let band = 0; band < 6; band += 1) {
      const y0 = (mapSize * band) / 6;
      const y1 = y0 + mapSize / 7.5;
      const strip = [
        projectPoint({ x: 0, y: y0, z: 0 }, camera, canvas),
        projectPoint({ x: mapSize, y: y0, z: 0 }, camera, canvas),
        projectPoint({ x: mapSize, y: Math.min(y1, mapSize), z: 0 }, camera, canvas),
        projectPoint({ x: 0, y: Math.min(y1, mapSize), z: 0 }, camera, canvas),
      ].filter(Boolean);
      if (strip.length === 4) {
        drawPolygon(
          ctx,
          strip,
          band % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 118, 110, 0.025)",
          null,
          0
        );
      }
    }

    layout.horizontalRoads.forEach((road) => {
      drawRoadBand(ctx, canvas, camera, "horizontal", road.y, road.width, mapSize);
    });
    layout.verticalRoads.forEach((road) => {
      drawRoadBand(ctx, canvas, camera, "vertical", road.x, road.width, mapSize);
    });
    layout.decor.parkingAprons.forEach((apron) => {
      drawSurfaceRect(
        ctx,
        canvas,
        camera,
        apron,
        "rgba(184, 196, 204, 0.32)",
        "rgba(248, 250, 252, 0.16)",
        0.8
      );
    });
    if (layout.decor.waterBody) {
      drawSurfaceRect(
        ctx,
        canvas,
        camera,
        layout.decor.waterBody,
        "rgba(61, 131, 201, 0.26)",
        "rgba(186, 230, 253, 0.32)",
        0.3
      );
    }
    layout.horizontalRoads.forEach((roadY) => {
      layout.verticalRoads.forEach((roadX) => {
        drawCrosswalk(ctx, canvas, camera, roadX.x, roadY.y, Math.min(roadX.width, roadY.width) * 0.62);
      });
    });

    ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(environment.cell_size || 50, 50);
    for (let value = 0; value <= mapSize; value += gridStep) {
      const vertical = [
        projectPoint({ x: value, y: 0, z: 0 }, camera, canvas),
        projectPoint({ x: value, y: mapSize, z: 0 }, camera, canvas),
      ];
      if (vertical[0] && vertical[1]) {
        ctx.beginPath();
        ctx.moveTo(vertical[0].x, vertical[0].y);
        ctx.lineTo(vertical[1].x, vertical[1].y);
        ctx.stroke();
      }
      const horizontal = [
        projectPoint({ x: 0, y: value, z: 0 }, camera, canvas),
        projectPoint({ x: mapSize, y: value, z: 0 }, camera, canvas),
      ];
      if (horizontal[0] && horizontal[1]) {
        ctx.beginPath();
        ctx.moveTo(horizontal[0].x, horizontal[0].y);
        ctx.lineTo(horizontal[1].x, horizontal[1].y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(99, 115, 138, 0.24)";
    ctx.lineWidth = 1.2;
    for (let value = 0; value <= mapSize; value += gridStep * 5) {
      const vertical = [
        projectPoint({ x: value, y: 0, z: 0 }, camera, canvas),
        projectPoint({ x: value, y: mapSize, z: 0 }, camera, canvas),
      ];
      if (vertical[0] && vertical[1]) {
        ctx.beginPath();
        ctx.moveTo(vertical[0].x, vertical[0].y);
        ctx.lineTo(vertical[1].x, vertical[1].y);
        ctx.stroke();
      }
      const horizontal = [
        projectPoint({ x: 0, y: value, z: 0 }, camera, canvas),
        projectPoint({ x: mapSize, y: value, z: 0 }, camera, canvas),
      ];
      if (horizontal[0] && horizontal[1]) {
        ctx.beginPath();
        ctx.moveTo(horizontal[0].x, horizontal[0].y);
        ctx.lineTo(horizontal[1].x, horizontal[1].y);
        ctx.stroke();
      }
    }

    const sectorCenters = [
      { x: mapSize * 0.24, y: mapSize * 0.28, r: mapSize * 0.08 },
      { x: mapSize * 0.72, y: mapSize * 0.62, r: mapSize * 0.1 },
    ];
    sectorCenters.forEach((sector, index) => {
      const points = [];
      for (let step = 0; step <= 36; step += 1) {
        const angle = (Math.PI * 2 * step) / 36;
        points.push(
          projectPoint(
            {
              x: sector.x + Math.cos(angle) * sector.r,
              y: sector.y + Math.sin(angle) * sector.r,
              z: 0,
            },
            camera,
            canvas
          )
        );
      }
      const projected = points.filter(Boolean);
      if (projected.length > 8) {
        drawPolygon(ctx, projected, index === 0 ? "rgba(21, 94, 239, 0.035)" : "rgba(245, 158, 11, 0.035)", index === 0 ? "rgba(21, 94, 239, 0.12)" : "rgba(245, 158, 11, 0.12)", 1);
      }
    });

    ctx.strokeStyle = "rgba(15, 23, 42, 0.24)";
    ctx.lineWidth = 1.2;
    drawPolygon(ctx, corners, null, "rgba(15, 23, 42, 0.24)", 1.2);
  }

  function obstacleFaces(obstacle, environment) {
    const cell = environment.cell_size || 50;
    const x0 = obstacle.col * cell;
    const x1 = (obstacle.col + obstacle.width) * cell;
    const y0 = obstacle.row * cell;
    const y1 = (obstacle.row + obstacle.height) * cell;
    const z = obstacle.elevation || 80;
    return {
      top: [
        { x: x0, y: y0, z },
        { x: x1, y: y0, z },
        { x: x1, y: y1, z },
        { x: x0, y: y1, z },
      ],
      west: [
        { x: x0, y: y0, z: 0 },
        { x: x0, y: y1, z: 0 },
        { x: x0, y: y1, z },
        { x: x0, y: y0, z },
      ],
      east: [
        { x: x1, y: y0, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x1, y: y1, z },
        { x: x1, y: y0, z },
      ],
      north: [
        { x: x0, y: y0, z: 0 },
        { x: x1, y: y0, z: 0 },
        { x: x1, y: y0, z },
        { x: x0, y: y0, z },
      ],
      south: [
        { x: x0, y: y1, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x1, y: y1, z },
        { x: x0, y: y1, z },
      ],
      center: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: z / 2 },
      bounds: { x0, x1, y0, y1 },
    };
  }

  function drawFacadeWindows(ctx, quad, rows, cols, alpha) {
    if (!quad || quad.length !== 4) return;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const u0 = 0.12 + (col / cols) * 0.76;
        const u1 = 0.12 + ((col + 0.58) / cols) * 0.76;
        const v0 = 0.12 + (row / rows) * 0.72;
        const v1 = 0.12 + ((row + 0.5) / rows) * 0.72;
        const pane = [
          quadPoint(quad, u0, v0),
          quadPoint(quad, u1, v0),
          quadPoint(quad, u1, v1),
          quadPoint(quad, u0, v1),
        ];
        drawPolygon(ctx, pane, `rgba(170, 211, 255, ${alpha.toFixed(3)})`, null, 0);
      }
    }
  }

  function drawRoofEquipment(ctx, roof, obstacle, index) {
    if (!roof || roof.length !== 4) return;
    const units = 1 + ((obstacle.width + obstacle.height + index) % 3);
    for (let unit = 0; unit < units; unit += 1) {
      const baseU = 0.2 + unit * 0.2;
      const baseV = 0.22 + hashUnit(index + 4, unit + 7) * 0.32;
      const equipment = [
        quadPoint(roof, baseU, baseV),
        quadPoint(roof, baseU + 0.18, baseV),
        quadPoint(roof, baseU + 0.18, baseV + 0.16),
        quadPoint(roof, baseU, baseV + 0.16),
      ];
      drawPolygon(ctx, equipment, "rgba(214, 226, 236, 0.58)", "rgba(255, 255, 255, 0.18)", 0.8);
    }
  }

  function addLandmarkCommands(commands, ctx, canvas, environment, camera) {
    const decor = buildEnvironmentLayout(environment).decor;
    const mapSize = environment.map_size || 1000;
    const cell = environment.cell_size || 50;

    for (let offset = cell; offset <= mapSize - cell; offset += cell * 2.8) {
      [
        { x: offset, y: cell * 0.4 },
        { x: offset, y: mapSize - cell * 0.4 },
        { x: cell * 0.4, y: offset },
        { x: mapSize - cell * 0.4, y: offset },
      ].forEach((post) => {
        const base = projectPoint({ x: post.x, y: post.y, z: 0 }, camera, canvas);
        const top = projectPoint({ x: post.x, y: post.y, z: 9 }, camera, canvas);
        if (!base || !top) return;
        commands.push({
          depth: top.depth - 0.08,
          draw() {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.38)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(top.x, top.y);
            ctx.stroke();
          },
        });
      });
    }

    decor.streetlights.forEach((light, index) => {
      const base = projectPoint({ x: light.x, y: light.y, z: 0 }, camera, canvas);
      const top = projectPoint({ x: light.x, y: light.y, z: light.height }, camera, canvas);
      if (!base || !top) return;
      commands.push({
        depth: top.depth + 0.02,
        draw() {
          ctx.strokeStyle = "rgba(94, 101, 109, 0.72)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.stroke();
          ctx.fillStyle = index % 3 === 0 ? "rgba(255, 234, 138, 0.82)" : "rgba(248, 250, 252, 0.82)";
          ctx.beginPath();
          ctx.arc(top.x, top.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255, 240, 185, 0.12)";
          ctx.beginPath();
          ctx.arc(base.x, base.y, 5.5, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    });

    if (decor.helipad) {
      const { x, y, size } = decor.helipad;
      const pad = [
        projectPoint({ x: x - size, y: y - size, z: 0.8 }, camera, canvas),
        projectPoint({ x: x + size, y: y - size, z: 0.8 }, camera, canvas),
        projectPoint({ x: x + size, y: y + size, z: 0.8 }, camera, canvas),
        projectPoint({ x: x - size, y: y + size, z: 0.8 }, camera, canvas),
      ].filter(Boolean);
      if (pad.length === 4) {
        commands.push({
          depth: averageDepth(pad) - 0.05,
          draw() {
            drawPolygon(ctx, pad, "rgba(184, 198, 208, 0.44)", "rgba(255, 255, 255, 0.16)", 1);
            const ring = [];
            for (let step = 0; step <= 26; step += 1) {
              const angle = (Math.PI * 2 * step) / 26;
              ring.push(
                projectPoint(
                  {
                    x: x + Math.cos(angle) * size * 0.66,
                    y: y + Math.sin(angle) * size * 0.66,
                    z: 1.1,
                  },
                  camera,
                  canvas
                )
              );
            }
            drawPolygon(ctx, ring.filter(Boolean), null, "rgba(255, 255, 255, 0.42)", 1.6);
            const p1 = projectPoint({ x: x - size * 0.18, y, z: 1.2 }, camera, canvas);
            const p2 = projectPoint({ x: x + size * 0.18, y, z: 1.2 }, camera, canvas);
            const p3 = projectPoint({ x: x - size * 0.18, y: y - size * 0.24, z: 1.2 }, camera, canvas);
            const p4 = projectPoint({ x: x - size * 0.18, y: y + size * 0.24, z: 1.2 }, camera, canvas);
            const p5 = projectPoint({ x: x + size * 0.18, y: y - size * 0.24, z: 1.2 }, camera, canvas);
            const p6 = projectPoint({ x: x + size * 0.18, y: y + size * 0.24, z: 1.2 }, camera, canvas);
            ctx.strokeStyle = "rgba(248, 250, 252, 0.78)";
            ctx.lineWidth = 2;
            [[p1, p2], [p3, p4], [p5, p6]].forEach((line) => {
              if (!line[0] || !line[1]) return;
              ctx.beginPath();
              ctx.moveTo(line[0].x, line[0].y);
              ctx.lineTo(line[1].x, line[1].y);
              ctx.stroke();
            });
          },
        });
      }
    }

    decor.towers.forEach((tower, index) => {
      const base = projectPoint({ x: tower.x, y: tower.y, z: 0 }, camera, canvas);
      const top = projectPoint({ x: tower.x, y: tower.y, z: tower.height }, camera, canvas);
      if (!base || !top) return;
      commands.push({
        depth: top.depth + 0.3,
        draw() {
          ctx.strokeStyle = "rgba(226, 232, 240, 0.88)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.stroke();
          for (let level = 1; level <= 4; level += 1) {
            const ratio = level / 5;
            const left = projectPoint({ x: tower.x - 8, y: tower.y, z: tower.height * ratio }, camera, canvas);
            const right = projectPoint({ x: tower.x + 8, y: tower.y, z: tower.height * ratio }, camera, canvas);
            if (!left || !right) continue;
            ctx.strokeStyle = "rgba(148, 163, 184, 0.58)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }
          ctx.fillStyle = index === 0 ? "rgba(250, 204, 21, 0.9)" : "rgba(248, 113, 113, 0.9)";
          ctx.beginPath();
          ctx.arc(top.x, top.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    });

    decor.depots.forEach((depot) => {
      const dx = Math.cos(depot.heading) * depot.width;
      const dy = Math.sin(depot.heading) * depot.width;
      const sx = Math.cos(depot.heading + Math.PI / 2) * depot.depth;
      const sy = Math.sin(depot.heading + Math.PI / 2) * depot.depth;
      const vehicle = [
        projectPoint({ x: depot.x - dx - sx, y: depot.y - dy - sy, z: 1.2 }, camera, canvas),
        projectPoint({ x: depot.x + dx - sx, y: depot.y + dy - sy, z: 1.2 }, camera, canvas),
        projectPoint({ x: depot.x + dx + sx, y: depot.y + dy + sy, z: 1.2 }, camera, canvas),
        projectPoint({ x: depot.x - dx + sx, y: depot.y - dy + sy, z: 1.2 }, camera, canvas),
      ].filter(Boolean);
      if (vehicle.length !== 4) return;
      commands.push({
        depth: averageDepth(vehicle) + 0.02,
        draw() {
          drawPolygon(ctx, vehicle, "rgba(222, 234, 243, 0.68)", "rgba(59, 130, 246, 0.24)", 1);
        },
      });
    });

    decor.trees.forEach((tree) => {
      const base = projectPoint({ x: tree.x, y: tree.y, z: 0 }, camera, canvas);
      const trunk = projectPoint({ x: tree.x, y: tree.y, z: tree.height * 0.42 }, camera, canvas);
      const top = projectPoint({ x: tree.x, y: tree.y, z: tree.height }, camera, canvas);
      if (!base || !trunk || !top) return;
      commands.push({
        depth: top.depth + 0.04,
        draw() {
          ctx.strokeStyle = "rgba(120, 84, 57, 0.74)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(trunk.x, trunk.y);
          ctx.stroke();
          ctx.fillStyle = "rgba(38, 118, 76, 0.44)";
          ctx.beginPath();
          ctx.arc(trunk.x, trunk.y, tree.spread * trunk.scale * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(30, 97, 63, 0.62)";
          ctx.beginPath();
          ctx.arc(top.x, top.y, tree.spread * top.scale * 0.34, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    });
  }

  function addObstacleShadowCommands(commands, ctx, canvas, environment, camera) {
    const shadowVector = { x: -0.78, y: -0.52 };
    (environment.obstacles || []).forEach((obstacle) => {
      const faces = obstacleFaces(obstacle, environment);
      const offset = (obstacle.elevation || 80) * 1.28;
      const shadow = [
        { x: faces.bounds.x0 + shadowVector.x * offset, y: faces.bounds.y0 + shadowVector.y * offset, z: 0 },
        { x: faces.bounds.x1 + shadowVector.x * offset, y: faces.bounds.y0 + shadowVector.y * offset, z: 0 },
        { x: faces.bounds.x1 + shadowVector.x * offset, y: faces.bounds.y1 + shadowVector.y * offset, z: 0 },
        { x: faces.bounds.x0 + shadowVector.x * offset, y: faces.bounds.y1 + shadowVector.y * offset, z: 0 },
      ];
      const projected = shadow.map((point) => projectPoint(point, camera, canvas)).filter(Boolean);
      if (projected.length < 4) return;
      commands.push({
        depth: averageDepth(projected) - 0.4,
        draw() {
          drawPolygon(ctx, projected, "rgba(15, 23, 42, 0.10)", null, 0);
        },
      });
    });
  }

  function addObstacleCommands(commands, ctx, canvas, environment, camera) {
    (environment.obstacles || []).forEach((obstacle, index) => {
      const faces = obstacleFaces(obstacle, environment);
      const center = projectPoint(faces.center, camera, canvas);
      if (!center) return;
      const heightRatio = clamp((obstacle.elevation || 80) / 140, 0.25, 1);
      const visibleFaces = [];
      visibleFaces.push({
        kind: "top",
        points: faces.top,
        fill: `rgba(${Math.round(28 + heightRatio * 18)}, ${Math.round(36 + heightRatio * 16)}, ${Math.round(52 + heightRatio * 22)}, 0.96)`,
      });
      visibleFaces.push({
        kind: "side",
        points: camera.eye.x <= faces.bounds.x0 ? faces.west : faces.east,
        fill: `rgba(${Math.round(41 + heightRatio * 12)}, ${Math.round(53 + heightRatio * 10)}, ${Math.round(72 + heightRatio * 18)}, 0.84)`,
      });
      visibleFaces.push({
        kind: "side",
        points: camera.eye.y <= faces.bounds.y0 ? faces.north : faces.south,
        fill: `rgba(${Math.round(56 + heightRatio * 8)}, ${Math.round(72 + heightRatio * 8)}, ${Math.round(93 + heightRatio * 12)}, 0.8)`,
      });
      commands.push({
        depth: center.depth,
        draw() {
          visibleFaces.forEach((face) => {
            const projected = face.points.map((point) => projectPoint(point, camera, canvas)).filter(Boolean);
            drawPolygon(ctx, projected, face.fill, "rgba(148, 163, 184, 0.18)", 1);
            if (face.kind === "side" && projected.length === 4) {
              const facadeRows = Math.max(2, Math.round((obstacle.elevation || 80) / 34));
              const facadeCols = Math.max(2, Math.min(5, obstacle.width + obstacle.height));
              drawFacadeWindows(ctx, projected, facadeRows, facadeCols, 0.1 + heightRatio * 0.08);
            }
          });

          const roof = faces.top.map((point) => projectPoint(point, camera, canvas)).filter(Boolean);
          if (roof.length === 4) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(roof[0].x, roof[0].y);
            ctx.lineTo(roof[2].x, roof[2].y);
            ctx.moveTo(roof[1].x, roof[1].y);
            ctx.lineTo(roof[3].x, roof[3].y);
            ctx.stroke();
            drawRoofEquipment(ctx, roof, obstacle, index);
          }
        },
      });
    });
  }

  function addTrailCommands(commands, ctx, canvas, camera, trails, style, compact, focusState) {
    if (!trails) return;
    const focusActive = Boolean(focusState && focusState.active);
    const focusedTargetId = focusState ? focusState.targetId : null;
    const focusedUavIds = focusState ? focusState.assignedIds || new Set() : new Set();

    (trails.targets || []).forEach((trail) => {
      const projected = trail.points
        .map((point) => projectPoint({ x: point.x, y: point.y, z: point.z || 0 }, camera, canvas))
        .filter(Boolean);
      if (projected.length < 2) return;
      const isFocusedTrail = focusActive && trail.id === focusedTargetId;
      const fade = focusActive && !isFocusedTrail ? 0.18 : 1;
      commands.push({
        depth: averageDepth(projected) + 0.15,
        draw() {
          ctx.save();
          ctx.setLineDash(compact ? [4, 4] : [6, 5]);
          for (let index = 1; index < projected.length; index += 1) {
            const alpha = (0.12 + (0.42 * index) / projected.length) * fade;
            ctx.strokeStyle = `rgba(220, 38, 38, ${alpha.toFixed(3)})`;
            ctx.lineWidth = compact ? (isFocusedTrail ? 1.7 : 1.1) : isFocusedTrail ? 2.2 : 1.6;
            ctx.beginPath();
            ctx.moveTo(projected[index - 1].x, projected[index - 1].y);
            ctx.lineTo(projected[index].x, projected[index].y);
            ctx.stroke();
          }
          ctx.restore();
        },
      });
    });

    (trails.uavs || []).forEach((trail) => {
      const projected = trail.points
        .map((point) => projectPoint({ x: point.x, y: point.y, z: point.z }, camera, canvas))
        .filter(Boolean);
      if (projected.length < 2) return;
      const isFocusedTrail = focusActive && focusedUavIds.has(trail.id);
      const fade = focusActive && !isFocusedTrail ? 0.18 : 1;
      commands.push({
        depth: averageDepth(projected) + 0.2,
        draw() {
          for (let index = 1; index < projected.length; index += 1) {
            const alpha = (0.08 + (0.36 * index) / projected.length) * fade;
            ctx.strokeStyle = trail.failed
              ? `rgba(148, 163, 184, ${alpha.toFixed(3)})`
              : `rgba(${droneRgb(style)}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = compact ? (isFocusedTrail ? 1.5 : 1.0) : isFocusedTrail ? 2.0 : 1.5;
            ctx.beginPath();
            ctx.moveTo(projected[index - 1].x, projected[index - 1].y);
            ctx.lineTo(projected[index].x, projected[index].y);
            ctx.stroke();
          }
        },
      });
    });
  }

  function addOcclusionCommands(commands, ctx, canvas, camera, environment, uav, config) {
    const sensorRange = config.sensor_range || 180;
    const mapSize = environment.map_size || 1000;
    const halfFov = ((config.sensor_fov_deg || 110) * Math.PI) / 360;
    const cell = environment.cell_size || 50;

    (environment.obstacles || []).forEach((obstacle) => {
      const centerX = (obstacle.col + obstacle.width / 2) * cell;
      const centerY = (obstacle.row + obstacle.height / 2) * cell;
      const dx = centerX - uav.x;
      const dy = centerY - uav.y;
      const distance = Math.hypot(dx, dy);
      if (distance < cell * 0.45 || distance > sensorRange * 1.05) {
        return;
      }

      const centerAngle = Math.atan2(dy, dx);
      const obstacleWidth = Math.max(obstacle.width, obstacle.height) * cell * 0.92;
      const span = Math.min(0.44, Math.atan2(obstacleWidth, distance));
      if (Math.abs(angleDelta(centerAngle, uav.heading)) > halfFov + span) {
        return;
      }

      const nearDistance = Math.max(cell * 0.55, distance - obstacleWidth * 0.38);
      const farDistance = Math.min(sensorRange, distance + Math.max(sensorRange * 0.42, obstacleWidth * 1.12));
      const polygon = [
        {
          x: clamp(uav.x + Math.cos(centerAngle - span) * nearDistance, 0, mapSize),
          y: clamp(uav.y + Math.sin(centerAngle - span) * nearDistance, 0, mapSize),
          z: 1,
        },
        {
          x: clamp(uav.x + Math.cos(centerAngle + span) * nearDistance, 0, mapSize),
          y: clamp(uav.y + Math.sin(centerAngle + span) * nearDistance, 0, mapSize),
          z: 1,
        },
        {
          x: clamp(uav.x + Math.cos(centerAngle + span * 1.08) * farDistance, 0, mapSize),
          y: clamp(uav.y + Math.sin(centerAngle + span * 1.08) * farDistance, 0, mapSize),
          z: 1,
        },
        {
          x: clamp(uav.x + Math.cos(centerAngle - span * 1.08) * farDistance, 0, mapSize),
          y: clamp(uav.y + Math.sin(centerAngle - span * 1.08) * farDistance, 0, mapSize),
          z: 1,
        },
      ];
      const projected = polygon.map((point) => projectPoint(point, camera, canvas)).filter(Boolean);
      if (projected.length < 4) return;

      commands.push({
        depth: averageDepth(projected) - 0.05,
        draw() {
          drawPolygon(ctx, projected, "rgba(15, 23, 42, 0.14)", "rgba(15, 23, 42, 0.05)", 1);
        },
      });
    });
  }

  function drawCompass(ctx, canvas, view, compact) {
    const size = compact ? 38 : 56;
    const x = canvas.width - size - 18;
    const y = 18;
    ctx.fillStyle = "rgba(15, 23, 42, 0.56)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    const heading = -view.yaw + Math.PI / 2;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size * 0.24;
    ctx.strokeStyle = "rgba(92, 246, 210, 0.9)";
    ctx.lineWidth = compact ? 1.8 : 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(heading) * radius, cy - Math.sin(heading) * radius);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.font = `${compact ? 9 : 10}px "Microsoft YaHei UI", sans-serif`;
    ctx.fillText("N", cx - 4, y + 12);
  }

  function drawHud(ctx, canvas, frame, options) {
    if (options && options.showHud === false) {
      return;
    }
    const compact = options && options.compact;
    const targets = frame.targets || [];
    const uavs = frame.uavs || [];
    const strictCount = targets.filter((target) => target.last_success).length;
    const passCount = targets.filter((target) => target.last_pass).length;
    const observedCount = targets.filter((target) => target.last_estimate).length;
    const activeCount = uavs.filter((uav) => !uav.failed).length;
    const panelWidth = compact ? 172 : 256;
    const panelHeight = compact ? 62 : 86;
    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.fillRect(16, 16, panelWidth, panelHeight);
    ctx.fillStyle = "#f8fafc";
    ctx.font = `${compact ? 11 : 13}px "Microsoft YaHei UI", sans-serif`;
    ctx.fillText(options && options.hudTitle ? options.hudTitle : `3D frame ${frame.step}`, 28, compact ? 35 : 40);
    ctx.fillStyle = "rgba(248, 250, 252, 0.76)";
    if (compact) {
      ctx.fillText(`step ${frame.step} | pass ${passCount}/${targets.length}`, 28, 52);
    } else {
      ctx.fillText(`strict ${strictCount}/${targets.length} | pass ${passCount}/${targets.length} | observed ${observedCount}`, 28, 62);
      ctx.fillText(`uav ${activeCount}/${uavs.length} active | drag orbit | wheel zoom`, 28, 80);
    }
  }

  function renderScene(canvas, payload, view) {
    const ctx = canvas.getContext("2d");
    const { environment, frame, config, style, showLabels, compact, trails, focusedTargetId } = payload;
    const focusActive = focusedTargetId !== null && focusedTargetId !== undefined;
    const focusState = {
      active: focusActive,
      targetId: focusedTargetId,
      assignedIds: new Set(
        (frame.uavs || [])
          .filter((uav) => focusActive && uav.assignment === focusedTargetId && !uav.failed)
          .map((uav) => uav.id)
      ),
    };
    drawSceneBackground(ctx, canvas);
    const camera = createCamera(view, environment.map_size || 1000);
    drawGround(ctx, canvas, environment, camera);

    const commands = [];
    const targetLookup = new Map((frame.targets || []).map((target) => [target.id, target]));
    addTrailCommands(commands, ctx, canvas, camera, trails, style, compact, focusState);
    addObstacleShadowCommands(commands, ctx, canvas, environment, camera);
    addObstacleCommands(commands, ctx, canvas, environment, camera);
    addLandmarkCommands(commands, ctx, canvas, environment, camera);

    (frame.targets || []).forEach((target) => {
      const base = projectPoint({ x: target.x, y: target.y, z: 0 }, camera, canvas);
      const tip = projectPoint({ x: target.x, y: target.y, z: target.z + 16 }, camera, canvas);
      if (!base || !tip) return;
      const uncertaintyPx = clamp((target.uncertainty || 18) * base.scale * 0.34, compact ? 5 : 9, compact ? 28 : 54);
      const isFocusedTarget = focusActive && target.id === focusedTargetId;
      const targetFade = focusActive && !isFocusedTarget ? 0.2 : 1;
      commands.push({
        depth: tip.depth,
        draw() {
          const stateColor = target.last_success
            ? withAlpha("#10b981", isFocusedTarget ? 0.98 : 0.82 * targetFade)
            : target.last_pass
              ? withAlpha("#f59e0b", isFocusedTarget ? 0.96 : 0.82 * targetFade)
              : withAlpha("#dc2626", isFocusedTarget ? 1 : 0.88 * targetFade);

          if (isFocusedTarget) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
            ctx.lineWidth = compact ? 2.1 : 2.8;
            ctx.beginPath();
            ctx.arc(base.x, base.y, uncertaintyPx + (compact ? 4 : 7), 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.strokeStyle = `rgba(148, 163, 184, ${(0.24 * targetFade).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(base.x, base.y, uncertaintyPx, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = withAlpha("#dc2626", isFocusedTarget ? 0.42 : 0.28 * targetFade);
          ctx.lineWidth = compact ? (isFocusedTarget ? 1.8 : 1.4) : isFocusedTarget ? 2.2 : 1.8;
          ctx.beginPath();
          ctx.arc(base.x, base.y, uncertaintyPx * 0.9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = stateColor;
          ctx.lineWidth = compact ? (isFocusedTarget ? 2.6 : 2) : isFocusedTarget ? 3.6 : 2.8;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tip.x - (compact ? 7 : 10), tip.y);
          ctx.lineTo(tip.x + (compact ? 7 : 10), tip.y);
          ctx.moveTo(tip.x, tip.y - (compact ? 7 : 10));
          ctx.lineTo(tip.x, tip.y + (compact ? 7 : 10));
          ctx.stroke();

          ctx.fillStyle = target.last_success
            ? withAlpha("#10b981", isFocusedTarget ? 0.24 : 0.18 * targetFade)
            : target.last_pass
              ? withAlpha("#f59e0b", isFocusedTarget ? 0.2 : 0.14 * targetFade)
              : withAlpha("#dc2626", isFocusedTarget ? 0.18 : 0.12 * targetFade);
          ctx.beginPath();
          ctx.arc(base.x, base.y, compact ? (isFocusedTarget ? 7 : 5.5) : isFocusedTarget ? 10.5 : 8.5, 0, Math.PI * 2);
          ctx.fill();

          if (target.last_estimate) {
            const estimate = projectPoint({ x: target.last_estimate[0], y: target.last_estimate[1], z: target.z + 6 }, camera, canvas);
            if (estimate) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(isFocusedTarget ? 0.62 : 0.38 * targetFade).toFixed(3)})`;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(estimate.x, estimate.y);
              ctx.lineTo(tip.x, tip.y);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.fillStyle = isFocusedTarget ? withAlpha(style.estimate, 0.98) : withAlpha(style.estimate, 0.88 * targetFade);
              const estimateSize = compact ? (isFocusedTarget ? 10 : 8) : isFocusedTarget ? 14 : 11;
              ctx.fillRect(estimate.x - estimateSize / 2, estimate.y - estimateSize / 2, estimateSize, estimateSize);
              ctx.strokeStyle = `rgba(255, 255, 255, ${(isFocusedTarget ? 0.9 : 0.6 * targetFade).toFixed(3)})`;
              ctx.lineWidth = isFocusedTarget ? 1.5 : 1;
              ctx.strokeRect(estimate.x - estimateSize / 2, estimate.y - estimateSize / 2, estimateSize, estimateSize);
            }
          }
          if (showLabels && (!focusActive || isFocusedTarget)) {
            ctx.fillStyle = "#0f172a";
            ctx.font = `${compact ? 11 : 13}px "Microsoft YaHei UI", sans-serif`;
            ctx.fillText(`T${target.id}`, tip.x + 10, tip.y - 6);
            if (!compact) {
              ctx.fillStyle = "rgba(15, 23, 42, 0.66)";
              ctx.font = '11px "Microsoft YaHei UI", sans-serif';
              ctx.fillText(`${Math.round(target.z || 0)}m`, tip.x + 10, tip.y + 9);
            }
          }
        },
      });
    });

    (frame.uavs || []).forEach((uav) => {
      const body = projectPoint({ x: uav.x, y: uav.y, z: uav.z }, camera, canvas);
      const nosePoint = projectPoint(
        { x: uav.x + Math.cos(uav.heading) * 22, y: uav.y + Math.sin(uav.heading) * 22, z: uav.z },
        camera,
        canvas
      );
      const shadowPoint = projectPoint(
        {
          x: uav.x - uav.z * 0.28,
          y: uav.y - uav.z * 0.18,
          z: 0,
        },
        camera,
        canvas
      );
      const ground = projectPoint({ x: uav.x, y: uav.y, z: 0 }, camera, canvas);
      if (!body || !ground) return;
      const pulse = 0.72;
      const isFocusedAssignment = focusActive && uav.assignment === focusedTargetId && !uav.failed;
      const uavFade = focusActive && !isFocusedAssignment ? 0.18 : 1;

      if (uav.assignment !== null && !uav.failed) {
        const halfFov = ((config.sensor_fov_deg || 110) * Math.PI) / 360;
        const footprint = [{ x: uav.x, y: uav.y, z: uav.z }];
        for (let step = 0; step <= 10; step += 1) {
          const angle = uav.heading - halfFov + (halfFov * 2 * step) / 10;
          footprint.push({
            x: clamp(uav.x + Math.cos(angle) * config.sensor_range, 0, environment.map_size),
            y: clamp(uav.y + Math.sin(angle) * config.sensor_range, 0, environment.map_size),
            z: 0,
          });
        }
        commands.push({
          depth: body.depth + 1,
          draw() {
            const projected = footprint.map((point) => projectPoint(point, camera, canvas)).filter(Boolean);
            drawPolygon(
              ctx,
              projected,
              withAlpha(style.sensor, isFocusedAssignment ? 0.22 : 0.1 * uavFade),
              `rgba(148, 163, 184, ${(isFocusedAssignment ? 0.26 : 0.18 * uavFade).toFixed(3)})`,
              isFocusedAssignment ? 1.4 : 1
            );

            if (projected.length > 3) {
              ctx.strokeStyle = `rgba(${droneRgb(style)}, ${(isFocusedAssignment ? 0.52 : 0.35 * uavFade).toFixed(3)})`;
              ctx.lineWidth = compact ? (isFocusedAssignment ? 1.3 : 1) : isFocusedAssignment ? 1.7 : 1.3;
              ctx.beginPath();
              ctx.moveTo(body.x, body.y);
              ctx.lineTo(projected[1].x, projected[1].y);
              ctx.moveTo(body.x, body.y);
              ctx.lineTo(projected[projected.length - 1].x, projected[projected.length - 1].y);
              ctx.stroke();
            }

            const scanPoint = projectPoint(
              {
                x: clamp(uav.x + Math.cos(uav.heading) * config.sensor_range * 0.62, 0, environment.map_size),
                y: clamp(uav.y + Math.sin(uav.heading) * config.sensor_range * 0.62, 0, environment.map_size),
                z: 0,
              },
              camera,
              canvas
            );
            if (scanPoint) {
              ctx.fillStyle = `rgba(${droneRgb(style)}, ${(isFocusedAssignment ? 0.56 : 0.34 * uavFade).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(scanPoint.x, scanPoint.y, compact ? (isFocusedAssignment ? 4.2 : 3.5) : isFocusedAssignment ? 6 : 5, 0, Math.PI * 2);
              ctx.fill();
            }
          },
        });
        addOcclusionCommands(commands, ctx, canvas, camera, environment, uav, config);

        const assignedTarget = targetLookup.get(uav.assignment);
        if (assignedTarget) {
          const linkStart = { x: uav.x, y: uav.y, z: Math.max(uav.z - 4, 6) };
          const linkEnd = { x: assignedTarget.x, y: assignedTarget.y, z: assignedTarget.z + 12 };
          commands.push({
            depth: body.depth + 0.5,
            draw() {
              const start = projectPoint(linkStart, camera, canvas);
              const end = projectPoint(linkEnd, camera, canvas);
              if (!start || !end) return;
              ctx.strokeStyle = withAlpha(style.link, isFocusedAssignment ? 0.56 : 0.28 * uavFade);
              ctx.lineWidth = isFocusedAssignment ? 2.1 : 1.4;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
              ctx.setLineDash([]);
            },
          });
        }
      }

      commands.push({
        depth: body.depth,
        draw() {
          ctx.strokeStyle = `rgba(15, 23, 42, ${(isFocusedAssignment ? 0.24 : 0.18 * uavFade).toFixed(3)})`;
          ctx.lineWidth = isFocusedAssignment ? 2.4 : 2;
          ctx.beginPath();
          ctx.moveTo(ground.x, ground.y);
          ctx.lineTo(body.x, body.y);
          ctx.stroke();

          ctx.fillStyle = `rgba(15, 23, 42, ${(0.06 * uavFade).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(ground.x, ground.y, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          if (shadowPoint) {
            ctx.fillStyle = `rgba(15, 23, 42, ${(0.12 * uavFade).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(
              shadowPoint.x,
              shadowPoint.y,
              clamp(8 + uav.z * 0.035, 9, 18),
              clamp(4 + uav.z * 0.018, 4, 10),
              0.2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          const bodyColor = uav.failed ? "#94a3b8" : style.drone;
          const bodyFill = withAlpha(bodyColor, uav.failed ? 0.92 : isFocusedAssignment ? 0.98 : 0.86 * uavFade);
          const bodyStroke = uav.failed
            ? `rgba(148, 163, 184, ${(0.22 * uavFade).toFixed(3)})`
            : `rgba(${droneRgb(style)}, ${(isFocusedAssignment ? 0.46 : 0.24 * uavFade).toFixed(3)})`;
          const angle = nosePoint ? Math.atan2(nosePoint.y - body.y, nosePoint.x - body.x) : 0;
          const size = clamp(body.scale * 20, 9, 18);
          const wing = size * 0.72;
          const tail = size * 0.86;
          const rotorSpread = size * lerp(1.15, 1.45, pulse);

          ctx.strokeStyle = bodyStroke;
          ctx.lineWidth = compact ? (isFocusedAssignment ? 1.6 : 1.2) : isFocusedAssignment ? 2.1 : 1.6;
          ctx.beginPath();
          ctx.ellipse(body.x, body.y, rotorSpread, rotorSpread * 0.42, angle, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(body.x, body.y, rotorSpread, rotorSpread * 0.42, angle + Math.PI / 2, 0, Math.PI * 2);
          ctx.stroke();

          const points = [
            { x: body.x + Math.cos(angle) * size, y: body.y + Math.sin(angle) * size },
            { x: body.x + Math.cos(angle + 2.38) * wing, y: body.y + Math.sin(angle + 2.38) * wing },
            { x: body.x - Math.cos(angle) * tail, y: body.y - Math.sin(angle) * tail },
            { x: body.x + Math.cos(angle - 2.38) * wing, y: body.y + Math.sin(angle - 2.38) * wing },
          ];
          drawPolygon(
            ctx,
            points,
            bodyFill,
            `rgba(255, 255, 255, ${(isFocusedAssignment ? 0.92 : 0.68 * uavFade).toFixed(3)})`,
            isFocusedAssignment ? 1.3 : 1
          );

          if (isFocusedAssignment) {
            ctx.strokeStyle = withAlpha("#ffffff", 0.92);
            ctx.lineWidth = compact ? 1.4 : 2;
            ctx.beginPath();
            ctx.arc(body.x, body.y, size * 1.18, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = `rgba(255, 255, 255, ${(isFocusedAssignment ? 0.96 : 0.78 * uavFade).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(body.x, body.y, compact ? (isFocusedAssignment ? 2.2 : 1.8) : isFocusedAssignment ? 2.9 : 2.4, 0, Math.PI * 2);
          ctx.fill();

          if (showLabels && (!focusActive || isFocusedAssignment)) {
            ctx.fillStyle = "#0f172a";
            ctx.font = `${compact ? 11 : 13}px "Microsoft YaHei UI", sans-serif`;
            ctx.fillText(`A${uav.id}`, body.x + 10, body.y + 10);
            if (!compact) {
              ctx.fillStyle = "rgba(15, 23, 42, 0.66)";
              ctx.font = '11px "Microsoft YaHei UI", sans-serif';
              ctx.fillText(`${Math.round(uav.z)}m`, body.x + 10, body.y + 23);
            }
          }
        },
      });
    });

    commands.sort((left, right) => right.depth - left.depth);
    commands.forEach((command) => command.draw());
    drawHud(ctx, canvas, frame, payload);
    drawCompass(ctx, canvas, view, compact);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
  }

  function drawEmpty(canvas, text) {
    const ctx = canvas.getContext("2d");
    drawSceneBackground(ctx, canvas);
    ctx.fillStyle = "rgba(15, 23, 42, 0.68)";
    ctx.fillRect(16, 16, 250, 60);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '13px "Microsoft YaHei UI", sans-serif';
    ctx.fillText("3D situational perception", 28, 40);
    ctx.fillStyle = "#0f172a";
    ctx.font = '14px "Microsoft YaHei UI", sans-serif';
    ctx.fillText(text, canvas.width / 2 - 90, canvas.height / 2);
  }

  function createOrbitController(canvas, options) {
    const settings = options || {};
    const view = {
      yaw: settings.yaw !== undefined ? settings.yaw : -2.25,
      pitch: settings.pitch !== undefined ? settings.pitch : 0.88,
      distance: settings.distance !== undefined ? settings.distance : 1420,
    };
    const state = { dragging: false, lastX: 0, lastY: 0, payload: null, timeMs: 0, ticking: false };

    function rerender() {
      if (state.payload) {
        renderScene(canvas, { ...state.payload, timeMs: state.timeMs }, view);
      }
    }

    function animationLoop(timeMs) {
      state.timeMs = timeMs;
      if (state.payload) {
        renderScene(canvas, { ...state.payload, timeMs: state.timeMs }, view);
      }
      if (state.ticking) {
        window.requestAnimationFrame(animationLoop);
      }
    }

    if (settings.interactive !== false) {
      canvas.addEventListener("mousedown", (event) => {
        state.dragging = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
      });

      window.addEventListener("mouseup", () => {
        state.dragging = false;
      });

      window.addEventListener("mousemove", (event) => {
        if (!state.dragging) return;
        const dx = event.clientX - state.lastX;
        const dy = event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        view.yaw -= dx * 0.006;
        view.pitch = clamp(view.pitch - dy * 0.004, 0.42, 1.3);
        rerender();
      });

      canvas.addEventListener(
        "wheel",
        (event) => {
          event.preventDefault();
          view.distance = clamp(view.distance + event.deltaY * 0.8, 880, 2200);
          rerender();
        },
        { passive: false }
      );

      canvas.addEventListener("dblclick", () => {
        view.yaw = settings.yaw !== undefined ? settings.yaw : -2.25;
        view.pitch = settings.pitch !== undefined ? settings.pitch : 0.88;
        view.distance = settings.distance !== undefined ? settings.distance : 1420;
        rerender();
      });
    }

    return {
      drawEmpty(text) {
        state.payload = null;
        state.ticking = false;
        drawEmpty(canvas, text);
      },
      render(payload) {
        state.payload = payload;
        if (settings.animate === false) {
          renderScene(canvas, payload, view);
          return;
        }
        if (!state.ticking) {
          state.ticking = true;
          window.requestAnimationFrame(animationLoop);
        }
        rerender();
      },
    };
  }

  window.Scene3D = { createOrbitController };
})();
