(function () {
  function startApp() {
    if (window.__uavAppBooted) {
      return;
    }
    window.__uavAppBooted = true;

  const defaultConfig = window.DEFAULT_CONFIG || {};
  const configKeys = [
    "seed",
    "drone_count",
    "target_count",
    "obstacle_count",
    "run_steps",
    "sensor_range",
    "sensor_fov_deg",
    "comm_range",
    "sensor_noise",
    "packet_loss_rate",
    "comm_delay_steps",
    "merge_radius",
    "min_observations",
    "dispatch_ratio",
    "drone_speed",
    "target_speed",
    "fault_rate",
    "weather_preset",
  ];
  const strategyKeys = ["smart", "random", "full"];
  const executionModeStrategies = {
    compare_all: ["smart", "random", "full"],
    smart_only: ["smart"],
    random_only: ["random"],
    full_only: ["full"],
  };
  const strategyStyles = {
    smart: {
      label: "RADS 动态子群",
      drone: "#0f766e",
      link: "rgba(15, 118, 110, 0.24)",
      sensor: "rgba(21, 94, 239, 0.12)",
      estimate: "#155eef",
    },
    random: {
      label: "随机派遣",
      drone: "#ea580c",
      link: "rgba(234, 88, 12, 0.22)",
      sensor: "rgba(234, 88, 12, 0.10)",
      estimate: "#c2410c",
    },
    full: {
      label: "全量派遣",
      drone: "#475569",
      link: "rgba(71, 85, 105, 0.22)",
      sensor: "rgba(71, 85, 105, 0.10)",
      estimate: "#334155",
    },
  };

  const refs = {
    runBtn: document.getElementById("runBtn"),
    resetBtn: document.getElementById("resetBtn"),
    progressLabel: document.getElementById("progressLabel"),
    progressPercent: document.getElementById("progressPercent"),
    progressBar: document.getElementById("progressBar"),
    currentStepInfo: document.getElementById("currentStepInfo"),
    playbackInfo: document.getElementById("playbackInfo"),
    frameLabel: document.getElementById("frameLabel"),
    comparisonText: document.getElementById("comparisonText"),
    comparisonRows: document.getElementById("comparisonRows"),
    detailRows: document.getElementById("detailRows"),
    timelineCanvas: document.getElementById("timelineCanvas"),
    strategyBand: document.getElementById("strategyBand"),
    smartCanvas: document.getElementById("smartCanvas"),
    randomCanvas: document.getElementById("randomCanvas"),
    fullCanvas: document.getElementById("fullCanvas"),
    timelinePanel: document.getElementById("timelinePanel"),
    baselinePanel: document.getElementById("baselinePanel"),
    analysisGrid: document.getElementById("analysisGrid"),
    battlefieldTitle: document.getElementById("battlefieldTitle"),
    battlefieldDesc: document.getElementById("battlefieldDesc"),
    metricGlossaryBlocks: Array.from(document.querySelectorAll("#metricGlossary, #metricGlossaryMain")),
    runFactsBlocks: Array.from(document.querySelectorAll("#runFacts, #runFactsMain")),
    topViewBtn: document.getElementById("topViewBtn"),
    resetViewBtn: document.getElementById("resetViewBtn"),
    openCompareModalBtn: document.getElementById("openCompareModalBtn"),
    sceneModal: document.getElementById("sceneModal"),
    sceneModalBackdrop: document.getElementById("sceneModalBackdrop"),
    sceneModalClose: document.getElementById("sceneModalClose"),
    sceneModalTitle: document.getElementById("sceneModalTitle"),
    sceneModalHint: document.getElementById("sceneModalHint"),
    sceneModalTopBtn: document.getElementById("sceneModalTopBtn"),
    sceneModalResetViewBtn: document.getElementById("sceneModalResetViewBtn"),
    expandedSceneCanvas: document.getElementById("expandedSceneCanvas"),
    compareModal: document.getElementById("compareModal"),
    compareModalBackdrop: document.getElementById("compareModalBackdrop"),
    compareModalClose: document.getElementById("compareModalClose"),
    compareModalTopBtn: document.getElementById("compareModalTopBtn"),
    compareModalResetViewBtn: document.getElementById("compareModalResetViewBtn"),
    compareSmartCanvas: document.getElementById("compareSmartCanvas"),
    compareRandomCanvas: document.getElementById("compareRandomCanvas"),
    compareFullCanvas: document.getElementById("compareFullCanvas"),
    frameSlider: document.getElementById("frameSlider"),
    prevFrameBtn: document.getElementById("prevFrameBtn"),
    playBtn: document.getElementById("playBtn"),
    nextFrameBtn: document.getElementById("nextFrameBtn"),
    clearFocusBtn: document.getElementById("clearFocusBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    focusInfo: document.getElementById("focusInfo"),
    briefSubtitle: document.getElementById("briefSubtitle"),
    briefModeTag: document.getElementById("briefModeTag"),
    briefAssignedCount: document.getElementById("briefAssignedCount"),
    briefFailedCount: document.getElementById("briefFailedCount"),
    briefObservedCount: document.getElementById("briefObservedCount"),
    briefConfirmedCount: document.getElementById("briefConfirmedCount"),
    briefSuccessCount: document.getElementById("briefSuccessCount"),
    focusSummaryText: document.getElementById("focusSummaryText"),
    focusTargetTag: document.getElementById("focusTargetTag"),
    focusStrategyCards: document.getElementById("focusStrategyCards"),
    hotTargetList: document.getElementById("hotTargetList"),
    executionModeInputs: Array.from(document.querySelectorAll('input[name="execution_mode"]')),
    strategyCards: Array.from(document.querySelectorAll("[data-strategy-card]")),
    cards: {
      smart: {
        meta: document.getElementById("smartMeta"),
        success: document.getElementById("smartSuccess"),
        coverage: document.getElementById("smartCoverage"),
        error: document.getElementById("smartError"),
        energy: document.getElementById("smartEnergy"),
        dispatch: document.getElementById("smartDispatch"),
      },
      random: {
        meta: document.getElementById("randomMeta"),
        success: document.getElementById("randomSuccess"),
        coverage: document.getElementById("randomCoverage"),
        error: document.getElementById("randomError"),
        energy: document.getElementById("randomEnergy"),
        dispatch: document.getElementById("randomDispatch"),
      },
      full: {
        meta: document.getElementById("fullMeta"),
        success: document.getElementById("fullSuccess"),
        coverage: document.getElementById("fullCoverage"),
        error: document.getElementById("fullError"),
        energy: document.getElementById("fullEnergy"),
        dispatch: document.getElementById("fullDispatch"),
      },
    },
  };

  let clientState = createEmptyState();
  let playbackIndex = 0;
  let playTimer = null;
  let activeRunToken = 0;
  let currentSessionId = null;
  let focusedTargetId = null;
  let smartScene3D = null;
  let randomScene3D = null;
  let fullScene3D = null;
  let sceneInitError = null;
  let expandedScene3D = null;
  let expandedSceneKey = null;
  let compareScene3D = {
    smart: null,
    random: null,
    full: null,
  };

  window.setTimeout(() => {
    if (!window.Scene3D && refs.focusInfo) {
      refs.focusInfo.textContent = "3D 模块未加载，当前显示的是 2D 回退画面。请重启服务并强制刷新页面。";
    }
  }, 1200);

  function ensureSceneControllers() {
    if (!window.Scene3D) {
      return false;
    }
    try {
      if (!smartScene3D) {
        smartScene3D = window.Scene3D.createOrbitController(refs.smartCanvas, {
          animate: false,
          animateWeather: true,
          distance: 2140,
          pitch: 0.54,
          yaw: -2.08,
          maxPixelRatio: 1.15,
        });
      }
      if (!randomScene3D) {
        randomScene3D = window.Scene3D.createOrbitController(refs.randomCanvas, {
          animate: false,
          interactive: true,
          compact: true,
          showHud: true,
          hudTitle: "Random 3D",
          yaw: -2.26,
          pitch: 0.6,
          distance: 2080,
          shadows: false,
          maxPixelRatio: 0.9,
        });
      }
      if (!fullScene3D) {
        fullScene3D = window.Scene3D.createOrbitController(refs.fullCanvas, {
          animate: false,
          interactive: true,
          compact: true,
          showHud: true,
          hudTitle: "Full 3D",
          yaw: -2.44,
          pitch: 0.62,
          distance: 2040,
          shadows: false,
          maxPixelRatio: 0.9,
        });
      }
      if (expandedSceneKey && !expandedScene3D && refs.expandedSceneCanvas) {
        expandedScene3D = window.Scene3D.createOrbitController(refs.expandedSceneCanvas, {
          animate: false,
          animateWeather: true,
          distance: 2240,
          pitch: 0.58,
          yaw: -2.16,
          maxPixelRatio: 1.2,
        });
      }
      if (refs.compareSmartCanvas && !compareScene3D.smart) {
        compareScene3D.smart = window.Scene3D.createOrbitController(refs.compareSmartCanvas, {
          animate: false,
          animateWeather: true,
          distance: 2140,
          pitch: 0.58,
          yaw: -2.12,
          maxPixelRatio: 1.05,
          shadows: false,
        });
      }
      if (refs.compareRandomCanvas && !compareScene3D.random) {
        compareScene3D.random = window.Scene3D.createOrbitController(refs.compareRandomCanvas, {
          animate: false,
          animateWeather: true,
          distance: 2140,
          pitch: 0.58,
          yaw: -2.2,
          maxPixelRatio: 1.05,
          shadows: false,
        });
      }
      if (refs.compareFullCanvas && !compareScene3D.full) {
        compareScene3D.full = window.Scene3D.createOrbitController(refs.compareFullCanvas, {
          animate: false,
          animateWeather: true,
          distance: 2140,
          pitch: 0.58,
          yaw: -2.28,
          maxPixelRatio: 1.05,
          shadows: false,
        });
      }
      sceneInitError = null;
      return true;
    } catch (error) {
      sceneInitError = error;
      console.error("Scene3D init failed", error);
      if (refs.focusInfo && focusedTargetId === null) {
        refs.focusInfo.textContent = `3D 场景初始化失败：${error.message}`;
      }
      return false;
    }
  }

  function createEmptyState() {
    return {
      config: null,
      environment: null,
      snapshot: null,
      narrative: "",
      histories: {
        smart: [],
        random: [],
        full: [],
      },
      frames: {
        smart: [],
        random: [],
        full: [],
      },
    };
  }

  function normalizeExecutionMode(mode) {
    return executionModeStrategies[mode] ? mode : "compare_all";
  }

  function getExecutionMode(config) {
    return normalizeExecutionMode((config && config.execution_mode) || defaultConfig.execution_mode || "compare_all");
  }

  function getActiveStrategies(config) {
    return executionModeStrategies[getExecutionMode(config)];
  }

  function getMainStrategyKey(config) {
    const active = getActiveStrategies(config);
    return active.length === 1 ? active[0] : "smart";
  }

  function getExecutionModeValue() {
    const checked = refs.executionModeInputs.find((input) => input.checked);
    return normalizeExecutionMode(checked ? checked.value : defaultConfig.execution_mode || "compare_all");
  }

  function setExecutionModeValue(mode) {
    const normalized = normalizeExecutionMode(mode);
    refs.executionModeInputs.forEach((input) => {
      input.checked = input.value === normalized;
    });
  }

  function getFocusedRow() {
    if (!clientState.snapshot || !clientState.snapshot.rows || focusedTargetId === null) {
      return null;
    }
    return clientState.snapshot.rows.find((row) => row.target_id === focusedTargetId) || null;
  }

  function updateActionState() {
    const hasRows = Boolean(clientState.snapshot && clientState.snapshot.rows && clientState.snapshot.rows.length);
    if (refs.exportCsvBtn) {
      refs.exportCsvBtn.disabled = !hasRows;
    }
    if (refs.clearFocusBtn) {
      refs.clearFocusBtn.disabled = focusedTargetId === null;
    }
    if (!refs.focusInfo) {
      return;
    }

    const row = getFocusedRow();
    if (!row) {
      refs.focusInfo.textContent =
        focusedTargetId === null
          ? "当前未追踪目标"
          : `已锁定追踪目标 T${focusedTargetId}，下次运行会自动高亮`;
      return;
    }

    refs.focusInfo.textContent = `正在追踪 T${row.target_id} | 优先级 ${row.priority} | 最佳 ${pickBestMethod(row)}`;
  }

  function applyFocusTarget(targetId) {
    const nextId =
      targetId === null || targetId === undefined || Number.isNaN(Number(targetId)) ? null : Number(targetId);
    focusedTargetId = nextId;
    updateActionState();
  }

  function toggleFocusTarget(targetId) {
    const numericId = Number(targetId);
    applyFocusTarget(focusedTargetId === numericId ? null : numericId);
    if (clientState.snapshot) {
      renderTables(clientState.snapshot);
      renderPlayback();
    }
  }

  function fillForm(config) {
    configKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (input) {
        input.value = config[key];
      }
    });
    setExecutionModeValue(config.execution_mode || "compare_all");
  }

  function readForm() {
    const payload = {};
    configKeys.forEach((key) => {
      const input = document.getElementById(key);
      if (!input) return;
      payload[key] = input.tagName === "SELECT" ? input.value : Number(input.value);
    });
    payload.execution_mode = getExecutionModeValue();
    return payload;
  }

  function formatPercent(value) {
    return `${(Number(value) * 100).toFixed(1)}%`;
  }

  function formatNumber(value, digits = 2, unit = "") {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "--";
    }
    return `${Number(value).toFixed(digits)}${unit}`;
  }

  function formatError(value) {
    return value === null || value === undefined ? "--" : `${Number(value).toFixed(2)} m`;
  }

  function getStrategyRowValue(row, strategyKey, suffix) {
    if (!row) {
      return null;
    }
    return row[`${strategyKey}_${suffix}`];
  }

  function getStrategyReason(row, strategyKey) {
    if (!row) {
      return "未运行";
    }
    return row[`${strategyKey}_reason`] || "当前未给出解释";
  }

  function getFrameForStrategy(strategyKey) {
    const frames = clientState.frames[strategyKey] || [];
    if (!frames.length) {
      return null;
    }
    return frames[Math.max(0, Math.min(playbackIndex, frames.length - 1))];
  }

  function pickSuggestedFocusRow(rows, strategyKey) {
    const candidates = (rows || []).slice();
    if (!candidates.length) {
      return null;
    }
    candidates.sort((left, right) => {
      const dispatchGap =
        (getStrategyRowValue(right, strategyKey, "selected") || []).length -
        (getStrategyRowValue(left, strategyKey, "selected") || []).length;
      if (dispatchGap) return dispatchGap;
      if (right.priority !== left.priority) return right.priority - left.priority;
      return right.uncertainty - left.uncertainty;
    });
    return candidates[0];
  }

  function renderBattlefieldInsights() {
    if (!refs.briefAssignedCount || !refs.focusStrategyCards || !refs.hotTargetList) {
      return;
    }

    const strategyKey = getMainStrategyKey(clientState.config || defaultConfig);
    const frame = getFrameForStrategy(strategyKey);
    const rows = clientState.snapshot ? clientState.snapshot.rows || [] : [];

    if (!frame || !clientState.snapshot) {
      refs.briefSubtitle.textContent = "等待仿真开始后生成当前帧态势摘要。";
      refs.briefModeTag.textContent = "待命";
      refs.briefAssignedCount.textContent = "--";
      refs.briefFailedCount.textContent = "--";
      refs.briefObservedCount.textContent = "--";
      refs.briefConfirmedCount.textContent = "--";
      refs.briefSuccessCount.textContent = "--";
      refs.focusTargetTag.textContent = "未锁定";
      refs.focusSummaryText.textContent =
        "点击下方表格中的某个目标后，这里会持续展示该目标在三种策略下的派机与感知差异。";
      refs.focusStrategyCards.innerHTML =
        '<div class="hot-target-empty">运行仿真后，这里会显示目标在 RADS、随机派遣和全量派遣下的派机子群、状态和误差对比。</div>';
      refs.hotTargetList.innerHTML =
        '<div class="hot-target-empty">运行仿真后，这里会列出当前主算法最值得关注的热点目标，点击条目可直接开始追踪。</div>';
      return;
    }

    const assignedCount = frame.uavs.filter((uav) => uav.assignment !== null && !uav.failed).length;
    const failedCount = frame.uavs.filter((uav) => uav.failed).length;
    const observedCount = rows.filter((row) => getStrategyRowValue(row, strategyKey, "error") !== null).length;
    const confirmedCount = rows.filter((row) => Boolean(getStrategyRowValue(row, strategyKey, "confirmed"))).length;
    const successCount = rows.filter((row) => Boolean(getStrategyRowValue(row, strategyKey, "success"))).length;

    refs.briefSubtitle.textContent = `当前主视图策略：${strategyStyles[strategyKey].label} · 第 ${frame.step} 步`;
    refs.briefModeTag.textContent = getActiveStrategies(clientState.config || defaultConfig).length === 1 ? "单算法" : "三算法";
    refs.briefAssignedCount.textContent = String(assignedCount);
    refs.briefFailedCount.textContent = String(failedCount);
    refs.briefObservedCount.textContent = `${observedCount}/${frame.targets.length}`;
    refs.briefConfirmedCount.textContent = `${confirmedCount}/${frame.targets.length}`;
    refs.briefSuccessCount.textContent = `${successCount}/${frame.targets.length}`;

    const trackedRow = getFocusedRow();
    const displayRow = trackedRow || pickSuggestedFocusRow(rows, strategyKey);
    if (!displayRow) {
      refs.focusTargetTag.textContent = "未锁定";
      refs.focusSummaryText.textContent = "当前没有可分析的目标数据。";
      refs.focusStrategyCards.innerHTML =
        '<div class="hot-target-empty">暂无目标对比结果，请先运行仿真。</div>';
    } else {
      refs.focusTargetTag.textContent = trackedRow ? `追踪 T${displayRow.target_id}` : `建议关注 T${displayRow.target_id}`;
      refs.focusSummaryText.textContent = trackedRow
        ? `当前持续追踪目标 T${displayRow.target_id}，优先级 ${displayRow.priority}，不确定半径 ${displayRow.uncertainty.toFixed(
            1
          )} m，综合表现最优的是 ${pickBestMethod(displayRow)}。`
        : `当前未锁定目标，系统建议优先观察 T${displayRow.target_id}。该目标的派机规模较大，且优先级与不确定性都更高，适合用于展示协同感知效果。`;

      refs.focusStrategyCards.innerHTML = strategyKeys
        .map((key) => {
          const selected = getStrategyRowValue(displayRow, key, "selected") || [];
          const status = resultText(
            getStrategyRowValue(displayRow, key, "success"),
            getStrategyRowValue(displayRow, key, "pass"),
            getStrategyRowValue(displayRow, key, "confirmed"),
            getStrategyRowValue(displayRow, key, "error")
          );
          const members = selected.length ? selected.map((id) => `A${id}`).join("、") : "--";
          return `
            <article class="focus-strategy-card ${key}">
              <div class="focus-strategy-card-head">
                <strong>${strategyStyles[key].label}</strong>
                <span class="focus-strategy-count">${selected.length} 架</span>
              </div>
              <div class="focus-strategy-meta">
                <div class="focus-strategy-item"><span>状态</span><b>${status}</b></div>
                <div class="focus-strategy-item"><span>误差</span><b>${formatError(
                  getStrategyRowValue(displayRow, key, "error")
                )}</b></div>
                <div class="focus-strategy-item"><span>子群</span><b>${members}</b></div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    const hotRows = rows
      .slice()
      .sort((left, right) => {
        const dispatchGap =
          (getStrategyRowValue(right, strategyKey, "selected") || []).length -
          (getStrategyRowValue(left, strategyKey, "selected") || []).length;
        if (dispatchGap) return dispatchGap;
        if (right.priority !== left.priority) return right.priority - left.priority;
        return right.uncertainty - left.uncertainty;
      })
      .slice(0, 4);

    refs.hotTargetList.innerHTML = hotRows.length
      ? hotRows
          .map((row) => {
            const selected = getStrategyRowValue(row, strategyKey, "selected") || [];
            const status = resultText(
              getStrategyRowValue(row, strategyKey, "success"),
              getStrategyRowValue(row, strategyKey, "pass"),
              getStrategyRowValue(row, strategyKey, "confirmed"),
              getStrategyRowValue(row, strategyKey, "error")
            );
            return `
              <div class="hot-target-item ${row.target_id === focusedTargetId ? "is-focused" : ""}" data-target-id="${row.target_id}">
                <div class="hot-target-head">
                  <strong>T${row.target_id}</strong>
                  <span class="hot-target-badge">${selected.length} 架派机</span>
                </div>
                <div class="hot-target-meta">
                  优先级 ${row.priority} · 不确定半径 ${row.uncertainty.toFixed(1)} m · ${status}<br />
                  当前最佳策略：${pickBestMethod(row)}
                </div>
              </div>
            `;
          })
          .join("")
      : '<div class="hot-target-empty">当前没有可展示的热点目标。</div>';
  }

  function renderBattlefieldInsights() {
    if (!refs.briefAssignedCount || !refs.focusStrategyCards || !refs.hotTargetList) {
      return;
    }

    const strategyKey = getMainStrategyKey(clientState.config || defaultConfig);
    const activeStrategies = getActiveStrategies(clientState.config || defaultConfig);
    const frame = getFrameForStrategy(strategyKey);
    const rows = clientState.snapshot ? clientState.snapshot.rows || [] : [];

    if (!frame || !clientState.snapshot) {
      refs.briefSubtitle.textContent = "等待仿真开始后生成当前帧态势摘要。";
      refs.briefModeTag.textContent = "待命";
      refs.briefAssignedCount.textContent = "--";
      refs.briefFailedCount.textContent = "--";
      refs.briefObservedCount.textContent = "--";
      refs.briefConfirmedCount.textContent = "--";
      refs.briefSuccessCount.textContent = "--";
      refs.focusTargetTag.textContent = "未锁定";
      refs.focusSummaryText.textContent =
        "点击下方表格中的某个目标后，这里会持续展示该目标在当前实验模式下的派机与感知差异。";
      refs.focusStrategyCards.innerHTML =
        '<div class="hot-target-empty">运行仿真后，这里会显示目标在各个已运行策略下的派机子群、状态和误差对比。</div>';
      refs.hotTargetList.innerHTML =
        '<div class="hot-target-empty">运行仿真后，这里会列出当前主算法最值得关注的热点目标，点击条目可直接开始追踪。</div>';
      return;
    }

    const assignedCount = frame.uavs.filter((uav) => uav.assignment !== null && !uav.failed).length;
    const failedCount = frame.uavs.filter((uav) => uav.failed).length;
    const observedCount = rows.filter((row) => getStrategyRowValue(row, strategyKey, "error") !== null).length;
    const confirmedCount = rows.filter((row) => Boolean(getStrategyRowValue(row, strategyKey, "confirmed"))).length;
    const successCount = rows.filter((row) => Boolean(getStrategyRowValue(row, strategyKey, "success"))).length;

    refs.briefSubtitle.textContent = `当前主视图策略：${strategyStyles[strategyKey].label} · 第 ${frame.step} 步`;
    refs.briefModeTag.textContent = activeStrategies.length === 1 ? "单算法" : "三算法";
    refs.briefAssignedCount.textContent = String(assignedCount);
    refs.briefFailedCount.textContent = String(failedCount);
    refs.briefObservedCount.textContent = `${observedCount}/${frame.targets.length}`;
    refs.briefConfirmedCount.textContent = `${confirmedCount}/${frame.targets.length}`;
    refs.briefSuccessCount.textContent = `${successCount}/${frame.targets.length}`;

    const trackedRow = getFocusedRow();
    const displayRow = trackedRow || pickSuggestedFocusRow(rows, strategyKey);
    if (!displayRow) {
      refs.focusTargetTag.textContent = "未锁定";
      refs.focusSummaryText.textContent = "当前没有可分析的目标数据。";
      refs.focusStrategyCards.innerHTML =
        '<div class="hot-target-empty">暂无目标对比结果，请先运行仿真。</div>';
    } else {
      refs.focusTargetTag.textContent = trackedRow ? `追踪 T${displayRow.target_id}` : `建议关注 T${displayRow.target_id}`;
      refs.focusSummaryText.textContent = trackedRow
        ? `当前持续追踪目标 T${displayRow.target_id}，优先级 ${displayRow.priority}，不确定半径 ${displayRow.uncertainty.toFixed(
            1
          )} m，综合表现最优的是 ${pickBestMethod(displayRow)}。`
        : `当前未锁定目标，系统建议优先观察 T${displayRow.target_id}。该目标派机规模较大，且优先级与不确定性都更高，适合用于展示协同感知效果。`;

      refs.focusStrategyCards.innerHTML = strategyKeys
        .map((key) => {
          const selected = getStrategyRowValue(displayRow, key, "selected") || [];
          const isActive = activeStrategies.includes(key);
          const status = isActive
            ? resultText(
                getStrategyRowValue(displayRow, key, "success"),
                getStrategyRowValue(displayRow, key, "pass"),
                getStrategyRowValue(displayRow, key, "confirmed"),
                getStrategyRowValue(displayRow, key, "error")
              )
            : "未运行";
          const members = isActive ? (selected.length ? selected.map((id) => `A${id}`).join("、") : "--") : "未运行";
          const errorText = isActive ? formatError(getStrategyRowValue(displayRow, key, "error")) : "未运行";
          const reasonText = isActive ? getStrategyReason(displayRow, key) : "未运行";
          return `
            <article class="focus-strategy-card ${key} ${isActive ? "" : "is-inactive"}">
              <div class="focus-strategy-card-head">
                <strong>${strategyStyles[key].label}</strong>
                <span class="focus-strategy-count">${isActive ? `${selected.length} 架` : "未运行"}</span>
              </div>
              <div class="focus-strategy-meta">
                <div class="focus-strategy-item"><span>状态</span><b>${status}</b></div>
                <div class="focus-strategy-item"><span>误差</span><b>${errorText}</b></div>
                <div class="focus-strategy-item"><span>子群</span><b>${members}</b></div>
                <div class="focus-strategy-item focus-strategy-item-block"><span>原因</span><b>${reasonText}</b></div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    const hotRows = rows
      .slice()
      .sort((left, right) => {
        const dispatchGap =
          (getStrategyRowValue(right, strategyKey, "selected") || []).length -
          (getStrategyRowValue(left, strategyKey, "selected") || []).length;
        if (dispatchGap) return dispatchGap;
        if (right.priority !== left.priority) return right.priority - left.priority;
        return right.uncertainty - left.uncertainty;
      })
      .slice(0, 4);

    refs.hotTargetList.innerHTML = hotRows.length
      ? hotRows
          .map((row) => {
            const selected = getStrategyRowValue(row, strategyKey, "selected") || [];
            const status = resultText(
              getStrategyRowValue(row, strategyKey, "success"),
              getStrategyRowValue(row, strategyKey, "pass"),
              getStrategyRowValue(row, strategyKey, "confirmed"),
              getStrategyRowValue(row, strategyKey, "error")
            );
            return `
              <div class="hot-target-item ${row.target_id === focusedTargetId ? "is-focused" : ""}" data-target-id="${row.target_id}">
                <div class="hot-target-head">
                  <strong>T${row.target_id}</strong>
                  <span class="hot-target-badge">${selected.length} 架派机</span>
                </div>
                <div class="hot-target-meta">
                  优先级 ${row.priority} · 不确定半径 ${row.uncertainty.toFixed(1)} m · ${status}<br />
                  当前最佳策略：${pickBestMethod(row)}<br />
                  主要原因：${getStrategyReason(row, strategyKey)}
                </div>
              </div>
            `;
          })
          .join("")
      : '<div class="hot-target-empty">当前没有可展示的热点目标。</div>';
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function nextPaint() {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  function syncModalScrollLock() {
    const singleOpen = refs.sceneModal && !refs.sceneModal.classList.contains("hidden");
    const compareOpen = refs.compareModal && !refs.compareModal.classList.contains("hidden");
    document.body.style.overflow = singleOpen || compareOpen ? "hidden" : "";
  }

  async function sendJson(url, method, payload) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function deleteSession(sessionId) {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    } catch (error) {
      console.warn("delete session failed", error);
    }
  }

  function appendUnique(list, item, key) {
    if (!item) return;
    if (!list.length || list[list.length - 1][key] !== item[key]) {
      list.push(item);
    }
  }

  function mergeIncrement(payload) {
    clientState.environment = payload.environment;
    clientState.snapshot = payload.snapshot;
    clientState.narrative = payload.narrative;
    clientState.config = {
      ...(clientState.config || defaultConfig),
      execution_mode: payload.execution_mode || getExecutionMode(clientState.config || defaultConfig),
    };

    strategyKeys.forEach((key) => {
      const bundle = payload[`${key}_state`];
      appendUnique(clientState.frames[key], bundle.current_frame, "step");
      appendUnique(clientState.histories[key], bundle.history_point, "step");
    });

    if (focusedTargetId !== null && !getFocusedRow()) {
      focusedTargetId = null;
    }
    updateActionState();

    const activeFrames = clientState.frames[getMainStrategyKey(clientState.config)] || [];
    playbackIndex = Math.max(activeFrames.length - 1, 0);
  }

  function updateProgress(progress, message) {
    const ratio = Math.max(0, Math.min(1, progress ? progress.ratio : 0));
    refs.progressBar.style.width = `${(ratio * 100).toFixed(1)}%`;
    refs.progressPercent.textContent = `${(ratio * 100).toFixed(1)}%`;
    refs.progressLabel.textContent = message;
  }

  function setStrategyCard(key, summary) {
    const card = refs.cards[key];
    if (!card || !summary) return;
    card.success.textContent = formatPercent(summary.success_rate);
    card.coverage.textContent = formatPercent(summary.pass_rate ?? summary.coverage_rate);
    card.error.textContent = formatError(summary.mean_error);
    card.energy.textContent = formatNumber(summary.energy_used, 1);
    card.dispatch.textContent = formatNumber(summary.avg_dispatch, 1);
    card.meta.textContent = `覆盖 ${formatPercent(summary.coverage_rate)} | 确认 ${formatPercent(
      summary.confirmation_rate ?? summary.success_rate
    )} | 时效 ${formatNumber(summary.avg_info_age, 2, " 步")}`;
  }

  function renderSummary(snapshot) {
    setStrategyCard("smart", snapshot.smart);
    setStrategyCard("random", snapshot.random);
    setStrategyCard("full", snapshot.full);
  }

  function renderSummaryExplainers() {
    if (!refs.metricGlossaryBlocks.length && !refs.runFactsBlocks.length) {
      return;
    }

    const config = clientState.config || defaultConfig;
    const mainStrategy = getMainStrategyKey(config);
    const snapshot = clientState.snapshot;
    const summary = snapshot ? snapshot[mainStrategy] : null;
    const infoAgeText = summary ? formatNumber(summary.avg_info_age, 2, " 步") : "--";
    const delayText = `${Number(config.comm_delay_steps || 0)} 步`;
    const lossText = `${(Number(config.packet_loss_rate || 0) * 100).toFixed(0)}%`;
    const confirmationText = `${Number(config.min_observations || 0)} 次`;
    const weatherPreset = String(config.weather_preset || "clear");
    const weatherLabel =
      {
        clear: "晴空",
        haze: "薄雾",
        rain: "降雨",
        storm: "雷暴",
      }[weatherPreset] || "晴空";

    const glossaryHtml = `
      <div class="summary-explainer-item">
        <strong>信息时效</strong>
        <p>表示当前用于融合定位的观测，相对当前仿真步平均滞后了多少步。数值越小，说明平台拿到的是越“新鲜”的观测。</p>
      </div>
      <div class="summary-explainer-item">
        <strong>通信延迟</strong>
        <p>表示观测数据从无人机发出到平台可用于融合，最多会被推迟多少个仿真步。</p>
      </div>
      <div class="summary-explainer-item">
        <strong>天气扰动</strong>
        <p>天气会同时影响感知距离、侦察视场、测量噪声、链路丢包与飞行机动，因此会直接改变协同感知质量。</p>
      </div>
    `;

    const runFactsHtml = `
      <div class="summary-explainer-item">
        <strong>当前平均信息时效：${infoAgeText}</strong>
        <p>${
          summary
            ? Number(summary.avg_info_age) <= 0.01
              ? "当前融合结果几乎全部来自本步新采集观测，说明态势更新接近实时。"
              : "当前融合结果中包含一定滞后观测，数值越大说明态势刷新越慢。"
            : "运行仿真后，这里会显示当前策略的平均信息时效。"
        }</p>
      </div>
      <div class="summary-explainer-item">
        <strong>当前通信延迟配置：${delayText}</strong>
        <p>${
          Number(config.comm_delay_steps || 0) === 0
            ? "0 步表示只要观测没丢包，就会在同一步直接送达并参与融合，不会额外排队等待。"
            : `当前允许观测最多延迟 ${delayText} 后才参与融合，所以旧观测会拉高信息时效。`
        }</p>
      </div>
      <div class="summary-explainer-item">
        <strong>链路丢包与确认门限</strong>
        <p>当前链路丢包率为 ${lossText}，最少需要 ${confirmationText} 观测确认。丢包越高、确认门限越高，目标越难稳定确认。</p>
      </div>
      <div class="summary-explainer-item">
        <strong>当前天气：${weatherLabel}</strong>
        <p>${
          weatherPreset === "clear"
            ? "晴空条件下感知链路最稳定，适合观察算法本身的调度与融合能力。"
            : weatherPreset === "haze"
              ? "薄雾会缩短有效感知距离并增大测量噪声，适合验证弱可见环境下的稳健性。"
              : weatherPreset === "rain"
                ? "降雨会进一步削弱感知与链路质量，并提升飞行能耗，适合模拟恶劣天气巡检场景。"
                : "雷暴会同时压缩感知范围、提高丢包与延迟，并增强机动扰动，是最高复杂度天气场景。"
        }</p>
      </div>
    `;

    refs.metricGlossaryBlocks.forEach((node) => {
      node.innerHTML = glossaryHtml;
    });
    refs.runFactsBlocks.forEach((node) => {
      node.innerHTML = runFactsHtml;
    });
  }

  function applyExecutionModeLayout() {
    const mode = getExecutionMode(clientState.config || defaultConfig);
    const active = getActiveStrategies(clientState.config || defaultConfig);
    const mainStrategy = getMainStrategyKey(clientState.config || defaultConfig);

    refs.strategyCards.forEach((card) => {
      const visible = active.includes(card.dataset.strategyCard);
      card.classList.toggle("is-hidden", !visible);
    });

    refs.strategyBand.style.gridTemplateColumns = `repeat(${Math.max(active.length, 1)}, minmax(0, 1fr))`;
    refs.timelinePanel.classList.toggle("panel-hidden", active.length === 1);
    refs.baselinePanel.classList.toggle("panel-hidden", active.length !== 3);
    refs.analysisGrid.classList.remove("panel-hidden");
    refs.analysisGrid.classList.toggle("single-mode", active.length === 1);
    refs.openCompareModalBtn.classList.toggle("is-hidden", active.length !== 3);
    if (active.length !== 3 && refs.compareModal && !refs.compareModal.classList.contains("hidden")) {
      closeCompareModal();
    }

    const titleMap = {
      smart: "RADS 协同态势沙盘",
      random: "随机派遣态势沙盘",
      full: "全量派遣态势沙盘",
    };
    const descMap = {
      smart: "主视图展示 RADS 的 3D 侦察态势、动态子群选择与目标融合结果。",
      random: "主视图展示随机派遣在当前场景下的 3D 感知结果与派机过程。",
      full: "主视图展示全量派遣在当前场景下的 3D 感知结果与协同覆盖情况。",
    };
    refs.battlefieldTitle.textContent = active.length === 3 ? "RADS 协同态势沙盘" : titleMap[mainStrategy];
    refs.battlefieldDesc.textContent =
      active.length === 3
        ? "主视图展示 3D 侦察态势、障碍遮挡阴影、动态子群选择与目标融合结果。"
        : descMap[mainStrategy];
    refs.comparisonText.dataset.mode = mode;
  }

  function getModeStatusText(config, phase = "idle") {
    const active = getActiveStrategies(config);
    if (phase === "starting") {
      return active.length === 3 ? "正在创建三策略对比场景并初始化联合仿真，请稍候。" : "正在创建单算法实验场景并初始化仿真，请稍候。";
    }
    return active.length === 3
      ? "点击“运行仿真”后，平台将同步推进三种算法，并自动生成精度与能耗对比结论。"
      : "点击“运行仿真”后，平台将以当前选中的单个算法独立推进场景，并展示其感知效果与能耗表现。";
  }

  function pickBestMethod(row) {
    const candidates = [
      {
        label: "RADS",
        error: row.smart_error,
        success: row.smart_success,
        passHit: row.smart_pass,
        confirmed: row.smart_confirmed,
      },
      {
        label: "随机派遣",
        error: row.random_error,
        success: row.random_success,
        passHit: row.random_pass,
        confirmed: row.random_confirmed,
      },
      {
        label: "全量派遣",
        error: row.full_error,
        success: row.full_success,
        passHit: row.full_pass,
        confirmed: row.full_confirmed,
      },
    ].filter((item) => item.error !== null && item.error !== undefined);

    if (!candidates.length) {
      return "--";
    }

    candidates.sort((left, right) => {
      if (left.success !== right.success) return Number(right.success) - Number(left.success);
      if (left.passHit !== right.passHit) return Number(right.passHit) - Number(left.passHit);
      if (left.confirmed !== right.confirmed) return Number(right.confirmed) - Number(left.confirmed);
      return left.error - right.error;
    });
    return candidates[0].label;
  }

  function pickBestMethod(row) {
    const candidates = [
      {
        label: "RADS",
        error: row.smart_error,
        success: row.smart_success,
        passHit: row.smart_pass,
        confirmed: row.smart_confirmed,
      },
      {
        label: "随机派遣",
        error: row.random_error,
        success: row.random_success,
        passHit: row.random_pass,
        confirmed: row.random_confirmed,
      },
      {
        label: "全量派遣",
        error: row.full_error,
        success: row.full_success,
        passHit: row.full_pass,
        confirmed: row.full_confirmed,
      },
    ].filter((item) => item.error !== null && item.error !== undefined);

    if (!candidates.length) {
      return "--";
    }

    candidates.sort((left, right) => {
      if (left.success !== right.success) return Number(right.success) - Number(left.success);
      if (left.passHit !== right.passHit) return Number(right.passHit) - Number(left.passHit);
      if (left.confirmed !== right.confirmed) return Number(right.confirmed) - Number(left.confirmed);
      return left.error - right.error;
    });
    return candidates[0].label;
  }

  function resultText(success, passHit, confirmed, error) {
    if (success) return "严格成功";
    if (passHit) return confirmed ? "达标未稳" : "达标未确认";
    if (confirmed) return "已确认未达标";
    if (error !== null && error !== undefined) return "已观测未达标";
    return "未感知";
  }

  function renderTables(snapshot) {
    if (!snapshot.rows.length) {
      refs.comparisonRows.innerHTML = '<tr><td colspan="5">等待仿真数据</td></tr>';
      refs.detailRows.innerHTML = '<tr><td colspan="12">等待仿真数据</td></tr>';
      return;
    }

    refs.comparisonRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr>
            <td>T${row.target_id}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
            <td>${pickBestMethod(row)}</td>
          </tr>
        `
      )
      .join("");

    refs.detailRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr>
            <td>T${row.target_id}</td>
            <td>${row.priority}</td>
            <td>${row.uncertainty.toFixed(1)} m</td>
            <td>${row.smart_selected.length} 架</td>
            <td>${row.random_selected.length} 架</td>
            <td>${row.full_selected.length} 架</td>
            <td>${resultText(row.smart_success, row.smart_pass, row.smart_confirmed, row.smart_error)}</td>
            <td>${resultText(row.random_success, row.random_pass, row.random_confirmed, row.random_error)}</td>
            <td>${resultText(row.full_success, row.full_pass, row.full_confirmed, row.full_error)}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
          </tr>
        `
      )
      .join("");
  }

  function resultText(success, passHit, confirmed, error) {
    if (success) return "严格成功";
    if (passHit) return confirmed ? "达标未稳" : "达标未确认";
    if (confirmed) return "已确认未达标";
    if (error !== null && error !== undefined) return "已观测未达标";
    return "未感知";
  }

  function renderTables(snapshot) {
    if (!snapshot.rows.length) {
      refs.comparisonRows.innerHTML = '<tr><td colspan="5">等待仿真数据</td></tr>';
      refs.detailRows.innerHTML = '<tr><td colspan="12">等待仿真数据</td></tr>';
      updateActionState();
      return;
    }

    refs.comparisonRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
            <td>T${row.target_id}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
            <td>${pickBestMethod(row)}</td>
          </tr>
        `
      )
      .join("");

    refs.detailRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
            <td>T${row.target_id}</td>
            <td>${row.priority}</td>
            <td>${row.uncertainty.toFixed(1)} m</td>
            <td>${row.smart_selected.length} 架</td>
            <td>${row.random_selected.length} 架</td>
            <td>${row.full_selected.length} 架</td>
            <td>${resultText(row.smart_success, row.smart_pass, row.smart_confirmed, row.smart_error)}</td>
            <td>${resultText(row.random_success, row.random_pass, row.random_confirmed, row.random_error)}</td>
            <td>${resultText(row.full_success, row.full_pass, row.full_confirmed, row.full_error)}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
          </tr>
        `
      )
      .join("");

    updateActionState();
  }

  function resultText(success, passHit, confirmed, error) {
    if (success) return "严格成功";
    if (passHit) return confirmed ? "达标未稳" : "达标未确认";
    if (confirmed) return "已确认未达标";
    if (error !== null && error !== undefined) return "已观测未达标";
    return "未形成有效观测";
  }

  function csvEscape(value) {
    if (value === null || value === undefined) {
      return "";
    }
    const text = String(value);
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function csvRow(values) {
    return values.map(csvEscape).join(",");
  }

  function csvPercent(value, digits = 1) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const number = Number(value);
    return Number.isFinite(number) ? (number * 100).toFixed(digits) : "";
  }

  function csvNumber(value, digits = 2) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : "";
  }

  function exportWeatherLabel(preset) {
    return (
      {
        clear: "晴空",
        haze: "薄雾",
        rain: "降雨",
        storm: "雷暴",
      }[String(preset || "clear")] || "晴空"
    );
  }

  function exportModeLabel(mode) {
    return (
      {
        compare_all: "三算法对比",
        smart_only: "仅 RADS",
        random_only: "仅随机派遣",
        full_only: "仅全量派遣",
      }[mode] || "三算法对比"
    );
  }

  function exportStrategyLabel(key) {
    return (
      {
        smart: "RADS 动态子群",
        random: "随机派遣",
        full: "全量派遣",
      }[key] || key
    );
  }

  function exportSelectedMembers(selected) {
    return selected && selected.length ? selected.map((id) => `A${id}`).join("、") : "--";
  }

  function timestampStamp() {
    const now = new Date();
    const parts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ];
    return `${parts[0]}${parts[1]}${parts[2]}_${parts[3]}${parts[4]}${parts[5]}`;
  }

  function getAnalysisDom() {
    const primaryPanel = refs.comparisonRows ? refs.comparisonRows.closest(".panel") : null;
    const secondaryPanel = refs.detailRows ? refs.detailRows.closest(".panel") : null;
    return {
      primaryTitle: primaryPanel ? primaryPanel.querySelector(".panel-head h2") : null,
      primaryDesc: primaryPanel ? primaryPanel.querySelector(".panel-head p") : null,
      primaryHead: refs.comparisonRows ? refs.comparisonRows.closest("table").querySelector("thead") : null,
      secondaryTitle: secondaryPanel ? secondaryPanel.querySelector(".panel-head h2") : null,
      secondaryDesc: secondaryPanel ? secondaryPanel.querySelector(".panel-head p") : null,
      secondaryHead: refs.detailRows ? refs.detailRows.closest("table").querySelector("thead") : null,
    };
  }

  function renderTables(snapshot) {
    const activeStrategies = getActiveStrategies(clientState.config || defaultConfig);
    const mainStrategy = getMainStrategyKey(clientState.config || defaultConfig);
    const strategyLabel = strategyStyles[mainStrategy].label;
    const dom = getAnalysisDom();

    if (activeStrategies.length === 1) {
      const selectedKey = `${mainStrategy}_selected`;
      const observationsKey = `${mainStrategy}_observations`;
      const infoAgeKey = `${mainStrategy}_info_age`;
      const successKey = `${mainStrategy}_success`;
      const passKey = `${mainStrategy}_pass`;
      const confirmedKey = `${mainStrategy}_confirmed`;
      const errorKey = `${mainStrategy}_error`;
      const reasonKey = `${mainStrategy}_reason`;

      if (dom.primaryTitle) {
        dom.primaryTitle.textContent = `${strategyLabel} 任务结果`;
      }
      if (dom.primaryDesc) {
        dom.primaryDesc.textContent = "单算法模式下按目标展示派机规模、观测状态和定位误差。";
      }
      if (dom.secondaryTitle) {
        dom.secondaryTitle.textContent = `${strategyLabel} 子群明细`;
      }
      if (dom.secondaryDesc) {
        dom.secondaryDesc.textContent = "展示当前算法针对每个目标的子群成员、观测数和信息时效。";
      }
      if (dom.primaryHead) {
        dom.primaryHead.innerHTML = `
          <tr>
            <th>目标</th>
            <th>优先级</th>
            <th>不确定半径</th>
            <th>派机数量</th>
            <th>观测数</th>
            <th>状态</th>
            <th>误差</th>
          </tr>
        `;
      }
      if (dom.secondaryHead) {
        dom.secondaryHead.innerHTML = `
          <tr>
            <th>目标</th>
            <th>子群成员</th>
            <th>观测数</th>
            <th>信息时效</th>
            <th>状态</th>
            <th>误差</th>
            <th>原因</th>
          </tr>
        `;
      }

      if (!snapshot.rows.length) {
        refs.comparisonRows.innerHTML = '<tr><td colspan="7">等待仿真数据</td></tr>';
        refs.detailRows.innerHTML = '<tr><td colspan="7">等待仿真数据</td></tr>';
        updateActionState();
        return;
      }

      refs.comparisonRows.innerHTML = snapshot.rows
        .map((row) => {
          const selected = row[selectedKey] || [];
          return `
            <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
              <td>T${row.target_id}</td>
              <td>${row.priority}</td>
              <td>${row.uncertainty.toFixed(1)} m</td>
              <td>${selected.length} 架</td>
              <td>${row[observationsKey] ?? 0}</td>
              <td>${resultText(row[successKey], row[passKey], row[confirmedKey], row[errorKey])}</td>
              <td>${formatError(row[errorKey])}</td>
            </tr>
          `;
        })
        .join("");

      refs.detailRows.innerHTML = snapshot.rows
        .map((row) => {
          const selected = row[selectedKey] || [];
          const members = selected.length ? selected.map((id) => `A${id}`).join("、") : "--";
          return `
            <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
              <td>T${row.target_id}</td>
              <td>${members}</td>
              <td>${row[observationsKey] ?? 0}</td>
              <td>${formatNumber(row[infoAgeKey], 2, " 步")}</td>
              <td title="${row[reasonKey] || ""}">${resultText(row[successKey], row[passKey], row[confirmedKey], row[errorKey])}</td>
              <td>${formatError(row[errorKey])}</td>
              <td class="reason-cell">${row[reasonKey] || "--"}</td>
            </tr>
          `;
        })
        .join("");

      updateActionState();
      return;
    }

    if (dom.primaryTitle) {
      dom.primaryTitle.textContent = "任务级精度对照";
    }
    if (dom.primaryDesc) {
      dom.primaryDesc.textContent = "比较每个目标在三种策略下的定位误差表现。";
    }
    if (dom.secondaryTitle) {
      dom.secondaryTitle.textContent = "多任务对照明细";
    }
    if (dom.secondaryDesc) {
      dom.secondaryDesc.textContent = "统计派机规模、感知结果和融合误差，方便实验分析与答辩展示。";
    }
    if (dom.primaryHead) {
      dom.primaryHead.innerHTML = `
        <tr>
          <th>目标</th>
          <th>RADS 误差</th>
          <th>随机误差</th>
          <th>全量误差</th>
          <th>最佳方法</th>
        </tr>
      `;
    }
    if (dom.secondaryHead) {
      dom.secondaryHead.innerHTML = `
        <tr>
          <th>目标</th>
          <th>优先级</th>
          <th>不确定半径</th>
          <th>RADS 派机</th>
          <th>随机派机</th>
          <th>全量派机</th>
          <th>RADS 状态</th>
          <th>随机状态</th>
          <th>全量状态</th>
          <th>RADS 误差</th>
          <th>随机误差</th>
          <th>全量误差</th>
        </tr>
      `;
    }

    if (!snapshot.rows.length) {
      refs.comparisonRows.innerHTML = '<tr><td colspan="5">等待仿真数据</td></tr>';
      refs.detailRows.innerHTML = '<tr><td colspan="12">等待仿真数据</td></tr>';
      updateActionState();
      return;
    }

    refs.comparisonRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
            <td>T${row.target_id}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
            <td>${pickBestMethod(row)}</td>
          </tr>
        `
      )
      .join("");

    refs.detailRows.innerHTML = snapshot.rows
      .map(
        (row) => `
          <tr data-target-id="${row.target_id}" class="${row.target_id === focusedTargetId ? "is-focused" : ""}">
            <td>T${row.target_id}</td>
            <td>${row.priority}</td>
            <td>${row.uncertainty.toFixed(1)} m</td>
            <td>${row.smart_selected.length} 架</td>
            <td>${row.random_selected.length} 架</td>
            <td>${row.full_selected.length} 架</td>
            <td title="${row.smart_reason || ""}">${resultText(row.smart_success, row.smart_pass, row.smart_confirmed, row.smart_error)}</td>
            <td title="${row.random_reason || ""}">${resultText(row.random_success, row.random_pass, row.random_confirmed, row.random_error)}</td>
            <td title="${row.full_reason || ""}">${resultText(row.full_success, row.full_pass, row.full_confirmed, row.full_error)}</td>
            <td>${formatError(row.smart_error)}</td>
            <td>${formatError(row.random_error)}</td>
            <td>${formatError(row.full_error)}</td>
          </tr>
        `
      )
      .join("");

    updateActionState();
  }

  function buildCsvText() {
    if (!clientState.snapshot) {
      return "";
    }

    const config = clientState.config || defaultConfig || {};
    const snapshot = clientState.snapshot;
    const mode = getExecutionMode(config);
    const activeStrategies = getActiveStrategies(config);
    const mainStrategy = getMainStrategyKey(config);
    const lines = [];

    lines.push(csvRow(["实验配置摘要"]));
    lines.push(csvRow(["参数", "数值"]));
    [
      ["导出时间", timestampStamp()],
      ["运行模式", exportModeLabel(mode)],
      ["天气类型", exportWeatherLabel(config.weather_preset)],
      ["随机种子", config.seed ?? ""],
      ["无人机数量", config.drone_count ?? ""],
      ["目标数量", config.target_count ?? ""],
      ["障碍物数量", config.obstacle_count ?? ""],
      ["仿真步数", config.run_steps ?? ""],
      ["感知半径(m)", config.sensor_range ?? ""],
      ["侦察视场角(°)", config.sensor_fov_deg ?? ""],
      ["通信半径(m)", config.comm_range ?? ""],
      ["传感器噪声", config.sensor_noise ?? ""],
      ["链路丢包率(%)", csvPercent(config.packet_loss_rate, 0)],
      ["链路延迟(步)", config.comm_delay_steps ?? ""],
      ["融合半径(m)", config.merge_radius ?? ""],
      ["最少确认观测数", config.min_observations ?? ""],
      ["故障率(%)", csvPercent(config.fault_rate, 1)],
    ].forEach((row) => lines.push(csvRow(row)));

    lines.push("");
    lines.push(csvRow(["策略核心指标"]));
    lines.push(
      csvRow([
        "策略",
        "严格成功率(%)",
        "定位达标率(%)",
        "确认率(%)",
        "平均定位误差(m)",
        "累计能耗",
        "平均派机数量",
        "平均信息时效(步)",
      ])
    );

    activeStrategies.forEach((strategyKey) => {
      const summary = snapshot[strategyKey];
      if (!summary) {
        return;
      }
      lines.push(
        csvRow([
          exportStrategyLabel(strategyKey),
          csvPercent(summary.success_rate),
          csvPercent(summary.pass_rate),
          csvPercent(summary.confirmation_rate),
          csvNumber(summary.mean_error, 2),
          csvNumber(summary.energy_used, 1),
          csvNumber(summary.avg_dispatch, 1),
          csvNumber(summary.avg_info_age, 2),
        ])
      );
    });

    lines.push("");

    if (activeStrategies.length === 1) {
      const key = mainStrategy;
      lines.push(csvRow([`${exportStrategyLabel(key)}任务级关键结果`]));
      lines.push(
        csvRow([
          "目标编号",
          "优先级",
          "不确定半径(m)",
          "派机数量",
          "观测数",
          "信息时效(步)",
          "状态",
          "定位误差(m)",
          "派机成员",
          "主要原因",
        ])
      );

      snapshot.rows.forEach((row) => {
        const selected = row[`${key}_selected`] || [];
        lines.push(
          csvRow([
            `T${row.target_id}`,
            row.priority,
            csvNumber(row.uncertainty, 1),
            selected.length,
            row[`${key}_observations`] ?? 0,
            csvNumber(row[`${key}_info_age`], 2),
            resultText(row[`${key}_success`], row[`${key}_pass`], row[`${key}_confirmed`], row[`${key}_error`]),
            csvNumber(row[`${key}_error`], 2),
            selected.length ? selected.map((id) => `A${id}`).join("、") : "--",
            row[`${key}_reason`] || "--",
          ])
        );
      });

      lines.push("");
      lines.push(csvRow([`${exportStrategyLabel(key)}任务精细对比`]));
      lines.push(
        csvRow([
          "目标编号",
          "策略",
          "派机成员",
          "派机数量",
          "观测数",
          "信息时效(步)",
          "状态",
          "定位误差(m)",
          "主要原因",
        ])
      );

      snapshot.rows.forEach((row) => {
        const selected = row[`${key}_selected`] || [];
        lines.push(
          csvRow([
            `T${row.target_id}`,
            exportStrategyLabel(key),
            exportSelectedMembers(selected),
            selected.length,
            row[`${key}_observations`] ?? 0,
            csvNumber(row[`${key}_info_age`], 2),
            resultText(row[`${key}_success`], row[`${key}_pass`], row[`${key}_confirmed`], row[`${key}_error`]),
            csvNumber(row[`${key}_error`], 2),
            row[`${key}_reason`] || "--",
          ])
        );
      });
    } else {
      lines.push(csvRow(["任务级关键结果"]));
      lines.push(
        csvRow([
          "目标编号",
          "优先级",
          "不确定半径(m)",
          "RADS状态",
          "RADS误差(m)",
          "RADS派机数",
          "随机状态",
          "随机误差(m)",
          "随机派机数",
          "全量状态",
          "全量误差(m)",
          "全量派机数",
          "当前最优策略",
        ])
      );

      snapshot.rows.forEach((row) => {
        lines.push(
          csvRow([
            `T${row.target_id}`,
            row.priority,
            csvNumber(row.uncertainty, 1),
            resultText(row.smart_success, row.smart_pass, row.smart_confirmed, row.smart_error),
            csvNumber(row.smart_error, 2),
            row.smart_selected.length,
            resultText(row.random_success, row.random_pass, row.random_confirmed, row.random_error),
            csvNumber(row.random_error, 2),
            row.random_selected.length,
            resultText(row.full_success, row.full_pass, row.full_confirmed, row.full_error),
            csvNumber(row.full_error, 2),
            row.full_selected.length,
            pickBestMethod(row),
          ])
        );
      });

      lines.push("");
      lines.push(csvRow(["任务精细对比"]));
      lines.push(
        csvRow([
          "目标编号",
          "策略",
          "派机成员",
          "派机数量",
          "观测数",
          "信息时效(步)",
          "状态",
          "定位误差(m)",
          "主要原因",
        ])
      );

      snapshot.rows.forEach((row) => {
        activeStrategies.forEach((strategyKey) => {
          const selected = row[`${strategyKey}_selected`] || [];
          lines.push(
            csvRow([
              `T${row.target_id}`,
              exportStrategyLabel(strategyKey),
              exportSelectedMembers(selected),
              selected.length,
              row[`${strategyKey}_observations`] ?? 0,
              csvNumber(row[`${strategyKey}_info_age`], 2),
              resultText(
                row[`${strategyKey}_success`],
                row[`${strategyKey}_pass`],
                row[`${strategyKey}_confirmed`],
                row[`${strategyKey}_error`]
              ),
              csvNumber(row[`${strategyKey}_error`], 2),
              row[`${strategyKey}_reason`] || "--",
            ])
          );
        });
      });
    }

    return lines.join("\r\n");
  }

  function exportCsv() {
    const csvText = buildCsvText();
    if (!csvText) {
      return;
    }

    const blob = new Blob([`\ufeff${csvText}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `态势感知实验结果_${timestampStamp()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function drawPlaceholder(canvas, text) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f4f8fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d8e2eb";
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    ctx.fillStyle = "#64748b";
    ctx.font = '14px "Microsoft YaHei UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
  }

  function markScenePending(canvas, text) {
    if (!canvas) {
      return;
    }
    canvas.dataset.sceneStatus = text || "";
    canvas.title = text || "";
  }

  function clearScenePending(canvas) {
    if (!canvas) {
      return;
    }
    delete canvas.dataset.sceneStatus;
    canvas.title = "";
  }

  function drawMainScene(strategyKey, frame) {
    drawStrategyScene(strategyKey, smartScene3D, refs.smartCanvas, frame, true, {
      compact: false,
      trailLength: 10,
      emptyText: "运行仿真后显示 3D 感知回放",
      hudTitle: `${strategyStyles[strategyKey].label} 3D`,
    });
  }

  function buildTrailBundle(strategyKey, frameIndex, trailLength) {
    const frames = clientState.frames[strategyKey] || [];
    if (!frames.length) {
      return { uavs: [], targets: [] };
    }

    const startIndex = Math.max(0, frameIndex - trailLength + 1);
    const windowFrames = frames.slice(startIndex, frameIndex + 1);
    const uavMap = new Map();
    const targetMap = new Map();

    windowFrames.forEach((frame) => {
      frame.uavs.forEach((uav) => {
        if (!uavMap.has(uav.id)) {
          uavMap.set(uav.id, { id: uav.id, failed: uav.failed, points: [] });
        }
        const bundle = uavMap.get(uav.id);
        bundle.failed = uav.failed;
        bundle.points.push({ x: uav.x, y: uav.y, z: uav.z });
      });

      frame.targets.forEach((target) => {
        if (!targetMap.has(target.id)) {
          targetMap.set(target.id, { id: target.id, points: [] });
        }
        targetMap.get(target.id).points.push({ x: target.x, y: target.y, z: target.z });
      });
    });

    return {
      uavs: Array.from(uavMap.values()).filter((item) => item.points.length > 1),
      targets: Array.from(targetMap.values()).filter((item) => item.points.length > 1),
    };
  }

  function drawStrategyScene(strategyKey, controller, canvas, frame, showLabels, options) {
    const settings = options || {};
    if (!frame || !clientState.environment) {
      if (controller) {
        clearScenePending(canvas);
        controller.drawEmpty(settings.emptyText || "运行仿真后显示 3D 回放");
      } else {
        markScenePending(
          canvas,
          sceneInitError
            ? `3D 场景初始化失败：${sceneInitError.message}`
            : settings.emptyText || "3D 模块初始化中"
        );
      }
      return;
    }

    if (controller) {
      clearScenePending(canvas);
      controller.render({
        environment: clientState.environment,
        frame,
        config: clientState.config || defaultConfig,
        style: strategyStyles[strategyKey],
        showLabels,
        compact: Boolean(settings.compact),
        hudTitle: settings.hudTitle,
        showHud: settings.showHud !== false,
        trails: buildTrailBundle(strategyKey, playbackIndex, settings.trailLength || 10),
        focusedTargetId,
      });
      return;
    }

    markScenePending(
      canvas,
      sceneInitError ? `3D 场景初始化失败：${sceneInitError.message}` : "3D 模块初始化中，请稍候刷新"
    );
  }

  function getSceneDescriptor(strategyKey) {
    if (strategyKey === "random") {
      return {
        title: "随机派遣 单独视图",
        hint: "该窗口单独展示随机派遣在当前回放帧下的 3D 感知态势。",
        compact: false,
        trailLength: 7,
        hudTitle: "Random Focus",
      };
    }
    if (strategyKey === "full") {
      return {
        title: "全量派遣 单独视图",
        hint: "该窗口单独展示全量派遣在当前回放帧下的 3D 感知态势。",
        compact: false,
        trailLength: 7,
        hudTitle: "Full Focus",
      };
    }
    return {
      title: "RADS 协同态势 单独视图",
      hint: "该窗口单独展示 RADS 在当前回放帧下的 3D 协同感知态势。",
      compact: false,
      trailLength: 12,
      hudTitle: "RADS Focus",
    };
  }

  function renderExpandedScene() {
    if (!expandedSceneKey || !refs.sceneModal || refs.sceneModal.classList.contains("hidden")) {
      return;
    }
    if (!ensureSceneControllers() || !expandedScene3D) {
      return;
    }
    const descriptor = getSceneDescriptor(expandedSceneKey);
    const frames = clientState.frames[expandedSceneKey] || [];
    const frame = frames.length ? frames[Math.max(0, Math.min(playbackIndex, frames.length - 1))] : null;
    if (!frame || !clientState.environment) {
      expandedScene3D.drawEmpty(`${descriptor.title}：等待仿真数据`);
      return;
    }
    expandedScene3D.render({
      environment: clientState.environment,
      frame,
      config: clientState.config || defaultConfig,
      style: strategyStyles[expandedSceneKey],
      showLabels: true,
      compact: descriptor.compact,
      hudTitle: descriptor.hudTitle,
      showHud: true,
      trails: buildTrailBundle(expandedSceneKey, playbackIndex, descriptor.trailLength),
      focusedTargetId,
    });
  }

  function openSceneModal(strategyKey) {
    expandedSceneKey = strategyKey;
    const descriptor = getSceneDescriptor(strategyKey);
    refs.sceneModalTitle.textContent = descriptor.title;
    refs.sceneModalHint.textContent = descriptor.hint;
    refs.sceneModal.classList.remove("hidden");
    refs.sceneModal.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    renderExpandedScene();
  }

  function closeSceneModal() {
    expandedSceneKey = null;
    refs.sceneModal.classList.add("hidden");
    refs.sceneModal.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
  }

  function renderCompareModalScenes() {
    if (!refs.compareModal || refs.compareModal.classList.contains("hidden")) {
      return;
    }
    if (!ensureSceneControllers()) {
      return;
    }
    const strategyList = ["smart", "random", "full"];
    strategyList.forEach((strategyKey) => {
      const controller = compareScene3D[strategyKey];
      const frames = clientState.frames[strategyKey] || [];
      const frame = frames.length ? frames[Math.max(0, Math.min(playbackIndex, frames.length - 1))] : null;
      if (!controller) {
        return;
      }
      if (!frame || !clientState.environment) {
        controller.drawEmpty(`${strategyStyles[strategyKey].label}：等待仿真数据`);
        return;
      }
      controller.render({
        environment: clientState.environment,
        frame,
        config: clientState.config || defaultConfig,
        style: strategyStyles[strategyKey],
        showLabels: true,
        compact: false,
        hudTitle: `${strategyStyles[strategyKey].label} 对比视图`,
        showHud: true,
        trails: buildTrailBundle(strategyKey, playbackIndex, 8),
        focusedTargetId,
      });
    });
  }

  function openCompareModal() {
    refs.compareModal.classList.remove("hidden");
    refs.compareModal.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    renderCompareModalScenes();
  }

  function closeCompareModal() {
    refs.compareModal.classList.add("hidden");
    refs.compareModal.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
  }

  function drawTimeline() {
    const canvas = refs.timelineCanvas;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const left = 52;
    const top = 20;
    const right = width - 18;
    const bottom = height - 30;
    const plotWidth = right - left;
    const plotHeight = bottom - top;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7fafc";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#d9e3ec";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i += 1) {
      const y = top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = '11px "Microsoft YaHei UI", sans-serif';
      ctx.fillText(`${100 - i * 20}%`, 8, y + 4);
    }

    const activeStrategies = getActiveStrategies(clientState.config || defaultConfig);
    const primaryHistory = clientState.histories[getMainStrategyKey(clientState.config || defaultConfig)] || [];
    if (!primaryHistory.length) {
      ctx.fillStyle = "#64748b";
      ctx.font = '14px "Microsoft YaHei UI", sans-serif';
      ctx.fillText(activeStrategies.length === 1 ? "单算法运行后，这里会绘制当前算法的成功率曲线。" : "运行仿真后，这里会逐步绘制三种策略的成功率曲线。", 120, height / 2);
      return;
    }

    const maxIndex = Math.max(primaryHistory.length - 1, 1);
    const lines = [
      { key: "smart", color: "#155eef" },
      { key: "random", color: "#ea580c" },
      { key: "full", color: "#475569" },
    ].filter((line) => activeStrategies.includes(line.key));

    lines.forEach((line) => {
      const history = clientState.histories[line.key];
      if (!history.length) return;
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      history.forEach((point, index) => {
        const x = left + (plotWidth * index) / maxIndex;
        const y = top + plotHeight * (1 - point.success_rate);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const lastPoint = history[history.length - 1];
      const lastX = left + (plotWidth * (history.length - 1)) / maxIndex;
      const lastY = top + plotHeight * (1 - lastPoint.success_rate);
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function trianglePoints(x, y, heading, scale) {
    const shape = [
      [11 * scale, 0],
      [-8 * scale, 6 * scale],
      [-3 * scale, 0],
      [-8 * scale, -6 * scale],
    ];
    return shape.map(([px, py]) => [
      x + px * Math.cos(heading) - py * Math.sin(heading),
      y + px * Math.sin(heading) + py * Math.cos(heading),
    ]);
  }

  function drawPolygon(ctx, points, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawEnvironment(ctx, canvas, environment) {
    if (!environment) return;
    const cellW = canvas.width / environment.cols;
    const cellH = canvas.height / environment.rows;
    environment.obstacles.forEach((obstacle) => {
      ctx.fillStyle = "#111827";
      ctx.fillRect(obstacle.col * cellW, obstacle.row * cellH, obstacle.width * cellW, obstacle.height * cellH);
    });
  }

  function drawState(canvas, frame, strategyKey, showLabels) {
    if (!frame || !clientState.environment) {
      drawPlaceholder(canvas, "等待回放数据");
      return;
    }

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const environment = clientState.environment;
    const mapSize = environment.map_size || 1000;
    const sensorRange = clientState.config ? clientState.config.sensor_range : 180;
    const sensorFovDeg = clientState.config ? clientState.config.sensor_fov_deg : 110;
    const style = strategyStyles[strategyKey];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7fafc";
    ctx.fillRect(0, 0, width, height);

    const gridSize = showLabels ? 32 : 28;
    ctx.strokeStyle = "#e3ebf3";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    drawEnvironment(ctx, canvas, environment);

    const mapX = (value) => (value / mapSize) * width;
    const mapY = (value) => (value / mapSize) * height;
    const sensorRadiusPx = (sensorRange / mapSize) * width;

    frame.targets.forEach((target) => {
      const x = mapX(target.x);
      const y = mapY(target.y);
      const uncertainty = (target.uncertainty / mapSize) * width;

      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(x, y, uncertainty, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x, y + 7);
      ctx.stroke();

      if (target.last_success) {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (target.last_estimate) {
        const ex = mapX(target.last_estimate[0]);
        const ey = mapY(target.last_estimate[1]);
        ctx.fillStyle = style.estimate;
        ctx.fillRect(ex - 4, ey - 4, 8, 8);
      }

      if (showLabels) {
        ctx.fillStyle = "#0f172a";
        ctx.font = '11px "Microsoft YaHei UI", sans-serif';
        ctx.fillText(`T${target.id}`, x + 10, y - 10);
      }
    });

    frame.uavs.forEach((uav) => {
      const x = mapX(uav.x);
      const y = mapY(uav.y);
      const droneColor = uav.failed ? "#9aa8b8" : style.drone;

      if (uav.assignment !== null && !uav.failed) {
        const halfFov = (sensorFovDeg * Math.PI) / 360;
        ctx.fillStyle = style.sensor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, sensorRadiusPx, uav.heading - halfFov, uav.heading + halfFov);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = style.link;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(uav.heading - halfFov) * sensorRadiusPx, y + Math.sin(uav.heading - halfFov) * sensorRadiusPx);
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(uav.heading + halfFov) * sensorRadiusPx, y + Math.sin(uav.heading + halfFov) * sensorRadiusPx);
        ctx.stroke();

        const target = frame.targets.find((item) => item.id === uav.assignment);
        if (target) {
          ctx.strokeStyle = style.link;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(mapX(target.x), mapY(target.y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      drawPolygon(ctx, trianglePoints(x, y, uav.heading, showLabels ? 1 : 0.85), droneColor);
      if (showLabels) {
        ctx.fillStyle = "#334155";
        ctx.font = '10px "Microsoft YaHei UI", sans-serif';
        ctx.fillText(`A${uav.id}`, x + 10, y + 10);
      }
    });
  }

  function renderPlayback() {
    const mainStrategy = getMainStrategyKey(clientState.config || defaultConfig);
    const mainFrames = clientState.frames[mainStrategy] || [];
    if (!mainFrames.length) {
      drawMainScene(mainStrategy, null);
      drawStrategyScene("random", randomScene3D, refs.randomCanvas, null, false, {
        compact: true,
        trailLength: 5,
        emptyText: "随机基线 3D 回放",
        hudTitle: "Random 3D",
      });
      drawStrategyScene("full", fullScene3D, refs.fullCanvas, null, false, {
        compact: true,
        trailLength: 5,
        emptyText: "全量基线 3D 回放",
        hudTitle: "Full 3D",
      });
      refs.frameSlider.max = "0";
      refs.frameSlider.value = "0";
      refs.frameLabel.textContent = "回放帧 0";
      refs.playbackInfo.textContent = "第 0 帧 / 共 0 帧";
      renderBattlefieldInsights();
      renderExpandedScene();
      renderCompareModalScenes();
      return;
    }

    const maxIndex = Math.max(mainFrames.length - 1, 0);
    playbackIndex = Math.max(0, Math.min(maxIndex, playbackIndex));
    drawMainScene(mainStrategy, mainFrames[playbackIndex]);
    drawStrategyScene("random", randomScene3D, refs.randomCanvas, clientState.frames.random[playbackIndex], false, {
      compact: true,
      trailLength: 5,
      hudTitle: "Random 3D",
    });
    drawStrategyScene("full", fullScene3D, refs.fullCanvas, clientState.frames.full[playbackIndex], false, {
      compact: true,
      trailLength: 5,
      hudTitle: "Full 3D",
    });

    refs.frameSlider.max = String(maxIndex);
    refs.frameSlider.value = String(playbackIndex);
    refs.frameLabel.textContent = `回放帧 ${playbackIndex}`;
    refs.playbackInfo.textContent = `第 ${playbackIndex} 帧 / 共 ${maxIndex} 帧`;

    const currentFrame = mainFrames[playbackIndex];
    const totalSteps = clientState.config ? clientState.config.run_steps : maxIndex;
    refs.currentStepInfo.textContent = `当前步数 ${currentFrame.step} / ${totalSteps}`;
    renderBattlefieldInsights();
    renderExpandedScene();
    renderCompareModalScenes();
  }

  function stopReplay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    refs.playBtn.textContent = "播放回放";
  }

  function toggleReplay() {
    const mainFrames = clientState.frames[getMainStrategyKey(clientState.config || defaultConfig)] || [];
    if (!mainFrames.length) return;
    if (playTimer) {
      stopReplay();
      return;
    }
    refs.playBtn.textContent = "暂停回放";
    playTimer = window.setInterval(() => {
      const maxIndex = mainFrames.length - 1;
      if (playbackIndex >= maxIndex) {
        stopReplay();
        return;
      }
      playbackIndex += 1;
      renderPlayback();
    }, 220);
  }

  function renderAll() {
    if (!clientState.snapshot) return;
    ensureSceneControllers();
    applyExecutionModeLayout();
    renderSummary(clientState.snapshot);
    renderSummaryExplainers();
    renderTables(clientState.snapshot);
    refs.comparisonText.textContent = clientState.narrative;
    drawTimeline();
    renderPlayback();
    updateActionState();
  }

  function resetMetrics() {
    strategyKeys.forEach((key) => {
      const card = refs.cards[key];
      card.meta.textContent = "等待仿真";
      card.success.textContent = "0%";
      card.coverage.textContent = "0%";
      card.error.textContent = "--";
      card.energy.textContent = "--";
      card.dispatch.textContent = "--";
    });
  }

  function renderEmptyState() {
    ensureSceneControllers();
    applyExecutionModeLayout();
    resetMetrics();
    renderSummaryExplainers();
    refs.comparisonRows.innerHTML = '<tr><td colspan="5">等待仿真数据</td></tr>';
    refs.detailRows.innerHTML = '<tr><td colspan="12">等待仿真数据</td></tr>';
    refs.currentStepInfo.textContent = "当前步数 0 / 0";
    refs.playbackInfo.textContent = "第 0 帧 / 共 0 帧";
    refs.frameLabel.textContent = "回放帧 0";
    drawPlaceholder(refs.timelineCanvas, "运行仿真后显示策略收益时间线");
    drawMainScene(getMainStrategyKey(clientState.config || defaultConfig), null);
    drawStrategyScene("random", randomScene3D, refs.randomCanvas, null, false, {
      compact: true,
      trailLength: 8,
      emptyText: "随机基线 3D 回放",
      hudTitle: "Random 3D",
    });
    drawStrategyScene("full", fullScene3D, refs.fullCanvas, null, false, {
      compact: true,
      trailLength: 8,
      emptyText: "全量基线 3D 回放",
      hudTitle: "Full 3D",
    });
    renderBattlefieldInsights();
    renderExpandedScene();
    renderCompareModalScenes();
    updateActionState();
  }

  async function runSimulation() {
    activeRunToken += 1;
    const runToken = activeRunToken;
    stopReplay();

    if (currentSessionId) {
      await deleteSession(currentSessionId);
    }
    currentSessionId = null;

    clientState = createEmptyState();
    clientState.config = readForm();
    refs.runBtn.disabled = true;
    refs.comparisonText.textContent = getModeStatusText(clientState.config, "starting");
    renderEmptyState();
    updateProgress({ ratio: 0 }, "正在创建仿真会话...");

    try {
      const startPayload = await sendJson("/api/sessions", "POST", clientState.config);
      if (runToken !== activeRunToken) return;

      currentSessionId = startPayload.session_id;
      mergeIncrement(startPayload);
      renderAll();
      updateProgress(startPayload.progress, "场景已创建，正在逐步推进复杂环境仿真...");
      await nextPaint();

      let finished = startPayload.progress.finished;
      while (!finished) {
        if (runToken !== activeRunToken) {
          return;
        }

        const increment = await sendJson(`/api/sessions/${currentSessionId}/advance`, "POST", { steps: 1 });
        if (runToken !== activeRunToken) {
          return;
        }

        mergeIncrement(increment);
        renderAll();
        finished = increment.progress.finished;
        updateProgress(
          increment.progress,
          finished
            ? "仿真完成，三策略对照结果已生成。"
            : `正在推进第 ${increment.progress.current_step} 步场景演化...`
        );
        await nextPaint();
        await delay(60);
      }
    } catch (error) {
      refs.comparisonText.textContent = `仿真失败：${error.message}`;
      updateProgress({ ratio: 0 }, "仿真失败");
    } finally {
      refs.runBtn.disabled = false;
      if (currentSessionId) {
        await deleteSession(currentSessionId);
        currentSessionId = null;
      }
    }
  }

  refs.runBtn.addEventListener("click", runSimulation);
  refs.executionModeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      clientState.config = {
        ...(clientState.config || defaultConfig),
        execution_mode: getExecutionModeValue(),
      };
      stopReplay();
      playbackIndex = 0;
      refs.comparisonText.textContent = getModeStatusText(clientState.config);
      applyExecutionModeLayout();
      renderEmptyState();
    });
  });
  refs.smartCanvas.addEventListener("click", () => openSceneModal(getMainStrategyKey(clientState.config || defaultConfig)));
  refs.randomCanvas.addEventListener("click", () => openSceneModal("random"));
  refs.fullCanvas.addEventListener("click", () => openSceneModal("full"));
  refs.topViewBtn.addEventListener("click", () => {
    ensureSceneControllers();
    if (smartScene3D) {
      smartScene3D.topView();
    }
  });
  refs.resetViewBtn.addEventListener("click", () => {
    ensureSceneControllers();
    if (smartScene3D) {
      smartScene3D.resetView();
    }
  });
  refs.openCompareModalBtn.addEventListener("click", openCompareModal);
  refs.sceneModalClose.addEventListener("click", closeSceneModal);
  refs.sceneModalBackdrop.addEventListener("click", closeSceneModal);
  refs.sceneModalTopBtn.addEventListener("click", () => {
    ensureSceneControllers();
    if (expandedScene3D) {
      expandedScene3D.topView();
    }
  });
  refs.sceneModalResetViewBtn.addEventListener("click", () => {
    ensureSceneControllers();
    if (expandedScene3D) {
      expandedScene3D.resetView();
    }
  });
  refs.compareModalClose.addEventListener("click", closeCompareModal);
  refs.compareModalBackdrop.addEventListener("click", closeCompareModal);
  refs.compareModalTopBtn.addEventListener("click", () => {
    ensureSceneControllers();
    ["smart", "random", "full"].forEach((key) => {
      if (compareScene3D[key]) {
        compareScene3D[key].topView();
      }
    });
  });
  refs.compareModalResetViewBtn.addEventListener("click", () => {
    ensureSceneControllers();
    ["smart", "random", "full"].forEach((key) => {
      if (compareScene3D[key]) {
        compareScene3D[key].resetView();
      }
    });
  });

  refs.resetBtn.addEventListener("click", async () => {
    activeRunToken += 1;
    stopReplay();
    if (currentSessionId) {
      await deleteSession(currentSessionId);
      currentSessionId = null;
    }
    fillForm(defaultConfig);
    clientState = createEmptyState();
    applyFocusTarget(null);
    playbackIndex = 0;
    refs.frameSlider.value = "0";
    refs.comparisonText.textContent =
      getModeStatusText(defaultConfig);
    updateProgress({ ratio: 0 }, "准备就绪");
    renderEmptyState();
  });

  refs.prevFrameBtn.addEventListener("click", () => {
    stopReplay();
    playbackIndex -= 1;
    renderPlayback();
  });

  refs.nextFrameBtn.addEventListener("click", () => {
    stopReplay();
    playbackIndex += 1;
    renderPlayback();
  });

  refs.playBtn.addEventListener("click", toggleReplay);

  refs.frameSlider.addEventListener("input", (event) => {
    stopReplay();
    playbackIndex = Number(event.target.value);
    renderPlayback();
  });

  function handleTargetRowClick(event) {
    const row = event.target.closest("[data-target-id]");
    if (!row) return;
    toggleFocusTarget(row.dataset.targetId);
  }

  refs.comparisonRows.addEventListener("click", handleTargetRowClick);
  refs.detailRows.addEventListener("click", handleTargetRowClick);
  if (refs.hotTargetList) {
    refs.hotTargetList.addEventListener("click", handleTargetRowClick);
  }

  refs.clearFocusBtn.addEventListener("click", () => {
    applyFocusTarget(null);
    if (clientState.snapshot) {
      renderTables(clientState.snapshot);
      renderPlayback();
    }
  });

  refs.exportCsvBtn.addEventListener("click", exportCsv);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (refs.sceneModal && !refs.sceneModal.classList.contains("hidden")) {
        closeSceneModal();
      }
      if (refs.compareModal && !refs.compareModal.classList.contains("hidden")) {
        closeCompareModal();
      }
    }
  });

  window.__uavAppSceneReadyHandler = () => {
    ensureSceneControllers();
    if (clientState.snapshot) {
      renderAll();
    } else {
      renderEmptyState();
    }
    renderExpandedScene();
    renderCompareModalScenes();
  };

  fillForm(defaultConfig);
  updateProgress({ ratio: 0 }, "准备就绪");
  refs.comparisonText.textContent =
    getModeStatusText(defaultConfig);
  renderEmptyState();
  }

  startApp();
  window.addEventListener("scene3d-ready", () => {
    if (typeof window.__uavAppSceneReadyHandler === "function") {
      window.__uavAppSceneReadyHandler();
    }
  });
})();
