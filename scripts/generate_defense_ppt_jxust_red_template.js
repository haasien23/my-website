const fs = require("fs");
const os = require("os");
const path = require("path");
const JSZip = require("jszip");
const pptxgen = require("pptxgenjs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "defense_ppt_jxust_red_template");
const SLIDE_DIR = path.join(OUT_DIR, "slides");
const DESKTOP = path.join(os.homedir(), "Desktop");
const PPTX_PATH = path.join(DESKTOP, "基于集群的多任务协同态势感知平台_本科毕设答辩_江理红棕校园模板版.pptx");
const COPY_PATH = path.join(OUT_DIR, path.basename(PPTX_PATH));
const MONTAGE_PATH = path.join(OUT_DIR, "pptx_preview_montage.png");
const QA_PATH = path.join(OUT_DIR, "qa_report.json");
const LOCAL_BROWSER = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((candidate) => fs.existsSync(candidate));

const LOGO = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-cropped.png");
const LOGO_TRANSPARENT = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-transparent.png");
const DOC_IMG = path.join(ROOT, "output", "thesis_docx_images");
const FIG = (...parts) => path.join(ROOT, "output", "figures", ...parts);

fs.mkdirSync(SLIDE_DIR, { recursive: true });

const C = {
  navy: "#5b1717",
  navy2: "#7b2420",
  blue: "#244f86",
  red: "#8f1d1d",
  red2: "#b13a32",
  ink: "#211b1b",
  gray: "#6b5b55",
  pale: "#fbf8f4",
  pale2: "#f4ece4",
  line: "#decfbd",
  line2: "#efe4d8",
  gold: "#b88a52",
  green: "#507b58",
  white: "#ffffff",
};

const ASSETS = {
  logo: safeDataUri(LOGO_TRANSPARENT) || dataUri(LOGO),
  arch: dataUri(path.join(DOC_IMG, "image8.png")),
  scenario: dataUri(path.join(DOC_IMG, "image11.png")),
  radsFlow: dataUri(path.join(DOC_IMG, "image10.png")),
  platform: dataUri(path.join(DOC_IMG, "image16.png")),
  runtimeView: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_runtime_complete_view.png")) || dataUri(path.join(DOC_IMG, "image16.png")),
  runtimeFull: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_runtime_complete_full.png")) || dataUri(path.join(DOC_IMG, "image16.png")),
  runtimeMap: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_runtime_mapping_crop.png")) || dataUri(path.join(DOC_IMG, "image16.png")),
  runtimeResult: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_runtime_result_crop.png")) || dataUri(path.join(DOC_IMG, "image16.png")),
  taskAnalysis: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_task_analysis_crop.png")) || dataUri(path.join(DOC_IMG, "image18.png")),
  taskTables: safeDataUri(path.join(ROOT, "output", "runtime_screenshots", "platform_task_tables_crop.png")) || dataUri(path.join(DOC_IMG, "image18.png")),
  coverScene: safeDataUri(path.join(OUT_DIR, "assets", "cover-scene.png")),
  campusGate: safeDataUri(path.join(ROOT, "output", "jxust_sanjiang_southgate", "sanjiang_south_gate.jpg")),
  campusWide: safeDataUri(path.join(ROOT, "output", "jxust_online_assets", "jxust_official_02.jpg")),
  campusSymbol: safeDataUri(path.join(ROOT, "output", "jxust_online_assets", "jxust_official_06.jpg")),
  uavConcept: dataUri(path.join(DOC_IMG, "image4.png")),
  weather: dataUri(path.join(DOC_IMG, "image5.png")),
  fusion: dataUri(path.join(DOC_IMG, "image7.png")),
  engine: dataUri(path.join(DOC_IMG, "image9.png")),
  figArch: safeDataUri(FIG("ch3", "fig3-2_system_architecture.png")),
  figRuntime: safeDataUri(FIG("ch3", "fig3-6_runtime_flow.png")),
  figTask: safeDataUri(FIG("ch8", "line_task_scale.png")),
  figWeather: safeDataUri(FIG("ch8", "line_weather.png")),
  figOverall: safeDataUri(FIG("ch8", "tab8-5_overall_results.png")),
};

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function dataUri(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing asset: ${file}`);
  return `data:${mimeOf(file)};base64,${fs.readFileSync(file).toString("base64")}`;
}

function safeDataUri(file) {
  return fs.existsSync(file) ? dataUri(file) : "";
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bullets(items, cls = "") {
  return `<ul class="bullets ${cls}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function panel(title, body, cls = "") {
  return `<section class="panel ${cls}" data-fit><h3>${title}</h3>${body}</section>`;
}

function smallPanel(title, lines, accent = "blue") {
  return `<section class="mini-panel ${accent}" data-fit>
    <h3>${title}</h3>
    ${bullets(lines, "tight")}
  </section>`;
}

function metric(value, label, caption, accent = "blue") {
  return `<div class="metric ${accent}" data-fit>
    <div class="metric-value">${value}</div>
    <div class="metric-label">${label}</div>
    <div class="metric-caption">${caption}</div>
  </div>`;
}

function formula(text, caption = "") {
  return `<div class="formula" data-fit><div>${text}</div>${caption ? `<p>${caption}</p>` : ""}</div>`;
}

function table(headers, rows, cls = "") {
  return `<table class="data-table ${cls}" data-fit>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function flow(items, cls = "") {
  return `<div class="process ${cls}">
    ${items.map((item, i) => `<div class="process-step" data-fit><b>${String(i + 1).padStart(2, "0")}</b><span>${item}</span></div>`).join("<div class=\"arrow\">→</div>")}
  </div>`;
}

function imageBox(src, caption = "", cls = "") {
  return `<figure class="image-box ${cls}" data-fit>
    <img src="${src}" />
    ${caption ? `<figcaption>${caption}</figcaption>` : ""}
  </figure>`;
}

function barChart({ title, categories, series, max = 100, height = 450, width = 850, note = "" }) {
  const pad = { l: 76, r: 28, t: 116, b: 104 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const groupW = plotW / categories.length;
  const colors = [C.navy, C.red, C.blue, C.gold];
  let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img">
    <text x="${pad.l}" y="32" class="chart-title">${title}</text>`;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + plotH - (plotH * i) / 4;
    const val = Math.round((max * i) / 4);
    svg += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" class="grid-line"/><text x="${pad.l - 14}" y="${y + 7}" text-anchor="end" class="axis-label">${val}</text>`;
  }
  svg += `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + plotH}" class="axis-line"/><line x1="${pad.l}" y1="${pad.t + plotH}" x2="${width - pad.r}" y2="${pad.t + plotH}" class="axis-line"/>`;
  const barW = Math.min(46, (groupW - 34) / series.length);
  const gap = 8;
  const groupBarsW = series.length * barW + (series.length - 1) * gap;
  series.forEach((s, si) => {
    categories.forEach((cat, ci) => {
      const value = s.values[ci];
      const tickX = pad.l + groupW * ci + groupW / 2;
      const x = tickX - groupBarsW / 2 + si * (barW + gap);
      const h = Math.max(2, (value / max) * plotH);
      const y = pad.t + plotH - h;
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${colors[si]}" rx="3"/><text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" class="value-label">${value}${s.suffix || ""}</text>`;
    });
  });
  categories.forEach((cat, ci) => {
    const x = pad.l + groupW * ci + groupW / 2;
    svg += `<text x="${x}" y="${height - 48}" text-anchor="middle" class="axis-label">${cat}</text>`;
  });
  const legendX = pad.l;
  const legendY = 72;
  series.forEach((s, i) => {
    svg += `<rect x="${legendX + i * 150}" y="${legendY - 16}" width="18" height="18" fill="${colors[i]}"/><text x="${legendX + i * 150 + 26}" y="${legendY}" class="legend-label">${s.name}</text>`;
  });
  if (note) svg += `<text x="${width - pad.r}" y="${height - 16}" text-anchor="end" class="note-label">${note}</text>`;
  svg += `</svg>`;
  return `<div class="chart-card" data-fit>${svg}</div>`;
}

function lineChart({ title, categories, series, max = 100, min = 0, height = 360, width = 820, note = "", labelMode = "auto" }) {
  const pad = { l: 116, r: 64, t: 112, b: 76 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const colors = [C.navy, C.red, C.blue, C.gold];
  const scaleY = (v) => pad.t + plotH - ((v - min) / (max - min)) * plotH;
  let svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img">
    <text x="${pad.l}" y="32" class="chart-title">${title}</text>`;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + plotH - (plotH * i) / 4;
    const val = Math.round(min + ((max - min) * i) / 4);
    svg += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" class="grid-line"/><text x="${pad.l - 14}" y="${y + 7}" text-anchor="end" class="axis-label">${val}</text>`;
  }
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => {
      const x = pad.l + (plotW * i) / (categories.length - 1 || 1);
      const y = scaleY(v);
      return [x, y, v];
    });
    svg += `<polyline points="${pts.map((p) => `${p[0]},${p[1]}`).join(" ")}" fill="none" stroke="${colors[si]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach(([x, y], pi) => {
      const markerR = pi === 0 || pi === pts.length - 1 ? 7 : 4.5;
      svg += `<circle cx="${x}" cy="${y}" r="${markerR}" fill="${colors[si]}" stroke="white" stroke-width="2"/>`;
    });
    pts.forEach(([x, y, v], pi) => {
      const last = pts.length - 1;
      const showAll = labelMode === "all" || (labelMode === "auto" && series.length === 1);
      const showLabel =
        showAll ||
        (labelMode === "end" && pi === last) ||
        (labelMode === "endpoints" && (pi === 0 || pi === last)) ||
        (labelMode === "auto" && series.length > 1 && pi === last);
      if (!showLabel) return;
      const labelY = series.length > 1 && si === 0 ? y + 30 : y - 15;
      const isEnd = pi === last;
      const labelX = isEnd ? x + 22 : x + 48;
      const anchor = isEnd ? "start" : "middle";
      const label = `${v}${s.suffix || ""}`;
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" class="value-label-bg">${label}</text><text x="${labelX}" y="${labelY}" text-anchor="${anchor}" class="value-label">${label}</text>`;
    });
  });
  categories.forEach((cat, i) => {
    const x = pad.l + (plotW * i) / (categories.length - 1 || 1);
    svg += `<text x="${x}" y="${height - 36}" text-anchor="middle" class="axis-label">${cat}</text>`;
  });
  series.forEach((s, i) => {
    svg += `<rect x="${pad.l + i * 140}" y="56" width="18" height="18" fill="${colors[i]}"/><text x="${pad.l + 26 + i * 140}" y="72" class="legend-label">${s.name}</text>`;
  });
  if (note) svg += `<text x="${width - pad.r}" y="${height - 14}" text-anchor="end" class="note-label">${note}</text>`;
  svg += `</svg>`;
  return `<div class="chart-card" data-fit>${svg}</div>`;
}

function slideShell(no, title, subtitle, body, cls = "") {
  return `<main class="slide ${cls}">
    <div class="jxust-bg" aria-hidden="true">
      <img class="jxust-bg-logo" src="${ASSETS.logo}" />
      <img class="jxust-bg-photo" src="${ASSETS.campusWide || ASSETS.logo}" />
      <div class="jxust-bg-name">江西理工大学</div>
      <div class="jxust-bg-motto">志存高远 · 责任为先</div>
      <div class="jxust-bg-campus">
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
    <header class="topbar" data-fit>
      <div class="page-no">${String(no).padStart(2, "0")}</div>
      <div class="title-wrap">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </div>
      <img class="school-logo" src="${ASSETS.logo}" />
    </header>
    <section class="body">${body}</section>
    <footer class="footer">志存高远 · 责任为先 | 本科毕业设计（论文）答辩 | 基于集群的多任务协同态势感知平台</footer>
  </main>`;
}

function coverSlide() {
  return `<main class="slide cover">
    <div class="cover-photo-panel"><img src="${ASSETS.campusGate || ASSETS.campusWide || ASSETS.logo}" /></div>
    <div class="cover-diagonal gold"></div>
    <div class="cover-diagonal red"></div>
    <img class="cover-logo" src="${ASSETS.logo}" />
    <div class="cover-watermark">GRADUATION THESIS DEFENSE</div>
    <div class="cover-cn-watermark">毕业论文答辩</div>
    <div class="cover-lineart">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <section class="cover-title-simple" data-fit>
      <div class="cover-kicker">本科毕业设计（论文）答辩</div>
      <h1>基于集群的多任务协同态势感知平台</h1>
      <div class="cover-subtitle">
        <i></i><span>Cluster-based Multi-task Collaborative Situational Awareness Platform</span><i></i>
      </div>
    </section>
    <section class="cover-meta-simple" data-fit>
      <div><b>答辩人</b><span>贺小双</span></div>
      <div><b>学号</b><span>1520223675</span></div>
      <div><b>专业</b><span>计算机科学与技术</span></div>
      <div><b>学院</b><span>信息工程学院</span></div>
      <div><b>指导教师</b><span>陈益杉 副教授</span></div>
      <div><b>答辩时间</b><span>2026年5月</span></div>
    </section>
    <div class="cover-bottom-band"><span>志存高远 · 责任为先 | Jiangxi University of Science and Technology</span></div>
  </main>`;
}

const slides = [
  {
    title: "封面",
    html: coverSlide(),
    notes: [
      "各位老师好，我的毕业设计题目是《基于集群的多任务协同态势感知平台》。",
      "这项工作围绕复杂环境下无人机集群如何完成多目标协同感知展开，重点包括场景建模、RADS 动态子群调度、Web 平台实现和实验验证。",
      "下面我将按照研究背景、问题分析、方法设计、平台实现、实验结果和总结展望进行汇报。",
    ],
  },
  {
    title: "目录",
    html: slideShell(2, "目录：从问题提出到实验验证", "8-10 分钟汇报，重点放在 RADS 原理与实验结论。", `
      <div class="agenda">
        ${[
          ["01", "研究背景与问题分析", "说明为什么多机协同态势感知需要动态调度"],
          ["02", "平台需求与系统建模", "说明平台要模拟哪些对象、约束和运行流程"],
          ["03", "RADS 方法设计", "重点讲目标需求、节点效用、动态预算和子群生成"],
          ["04", "平台实现与实验设计", "说明系统如何落地为可运行 Web 平台"],
          ["05", "实验结果、创新点与结论", "用数据回答效果、资源投入和不足"],
        ].map((row) => `<div class="agenda-row" data-fit><b>${row[0]}</b><strong>${row[1]}</strong><span>${row[2]}</span></div>`).join("")}
      </div>
      <aside class="agenda-side" data-fit>
        <h3>答辩主线</h3>
        <p>围绕复杂场景建模、RADS 调度算法、协同感知融合与实验结果分析，展示一个可运行、可复现、可比较的验证平台。</p>
        <div class="side-equation">模型 → 算法 → 平台 → 数据</div>
      </aside>
    `, "toc"),
    notes: [
      "本次汇报分为五个部分。前两部分讲研究背景、研究问题和系统建模。",
      "第三部分是方法设计，也是本次答辩的重点，我会展开讲 RADS 算法的目标需求、节点效用、动态预算和贪心子群生成过程。",
      "后面展示平台实现和实验设计，最后用多组实验数据总结创新点和不足。",
    ],
  },
  {
    title: "研究背景",
    html: slideShell(3, "研究背景：复杂任务推动集群协同感知", "无人机集群适合执行巡检、搜救、侦察等任务，但真实环境让“看见、传回、算准”同时变难。", `
      <div class="two-col wide-left">
        ${panel("任务需求正在从单点感知转向协同态势理解", `
          <div class="scenario-grid">
            <div data-fit><b>大范围覆盖</b><span>单机覆盖有限，集群可并行展开，减少盲区。</span></div>
            <div data-fit><b>多目标跟踪</b><span>多个动态目标同时出现，需要分配不同感知资源。</span></div>
            <div data-fit><b>持续更新</b><span>态势不是一次性截图，而是随时间滚动更新。</span></div>
            <div data-fit><b>任务冗余</b><span>部分节点故障或链路波动时，集群仍要维持观测能力。</span></div>
          </div>
        `)}
        ${panel("真实约束让协同调度更复杂", `
          ${table(["约束", "对感知的影响", "平台中的体现"], [
            ["障碍物", "遮挡视线、增加绕行距离", "栅格地图、路径代价、视线判定"],
            ["天气", "压缩感知半径、增大噪声", "晴空/雾霾/降雨/雷暴参数"],
            ["通信", "丢包和延迟影响融合时效", "链路质量、丢包率、延迟步数"],
            ["能量/故障", "节点可用性动态变化", "剩余能量、故障率、最低可用能量"],
          ], "compact")}
        `)}
      </div>
      <div class="bottom-strip">
        ${metric("24", "无人机", "默认集群规模")}
        ${metric("6", "动态目标", "默认任务规模", "red")}
        ${metric("34", "障碍物", "默认复杂度")}
        ${metric("4类", "天气扰动", "晴空到雷暴", "red")}
      </div>
    `),
    notes: [
      "无人机集群相比单架无人机，优势在于覆盖范围更大、任务可以并行执行，并且具有一定冗余能力。",
      "但在真实任务中，目标会运动，环境中有障碍物和天气扰动，通信链路还可能丢包或延迟。",
      "所以本文关注的不是简单的单机路径规划，而是在复杂约束下组织多架无人机完成持续的多目标协同感知。",
    ],
  },
  {
    title: "研究问题",
    html: slideShell(4, "研究问题：有限资源如何匹配动态感知需求", "核心不是“派出越多越好”，而是在效果、能耗、派机规模之间取得可解释的平衡。", `
      <div class="problem-layout">
        <section class="problem-core" data-fit>
          <h2>研究问题</h2>
          <p>给定动态目标、复杂环境和有限无人机资源，如何在每个仿真步选择合适的无人机子群，使多目标感知尽量成功，同时降低资源投入？</p>
          ${formula("max 感知成功率与定位质量，min 能耗与派机规模", "约束：障碍、视线、天气、通信、能量、故障")}
          <div class="problem-objectives">
            <div><b>效果目标</b><span>提高严格成功率，降低融合定位误差。</span></div>
            <div><b>资源目标</b><span>控制能耗与平均派机规模，避免无效堆叠。</span></div>
            <div><b>动态目标</b><span>随目标优先级、不确定性和运动状态滚动调整。</span></div>
            <div><b>解释目标</b><span>输出派机依据、失败原因和任务级指标。</span></div>
          </div>
          <div class="problem-thesis">因此本文不是证明“派得越多越好”，而是验证 RADS 是否能在复杂约束下接近全量效果，同时明显降低资源投入。</div>
        </section>
        <section class="compare-box" data-fit>
          <h3>简单策略的局限</h3>
          <div class="compare-row"><b>随机派遣</b><span>资源分配缺少针对性，容易把无人机派到低价值或不可达目标上。</span></div>
          <div class="compare-row"><b>全量派遣</b><span>效果通常较好，但能耗和派机数量偏高，不适合资源受限场景。</span></div>
          <div class="compare-row"><b>固定规则</b><span>难以随目标紧急度、链路状态和能量变化进行实时调整。</span></div>
        </section>
        <section class="question-box" data-fit>
          <h3>本文拆解为三个子问题</h3>
          ${table(["子问题", "要回答什么", "对应设计"], [
            ["目标需求", "哪个目标更急，需要几架无人机？", "优先级 + 不确定性 + 运动强度"],
            ["节点适配", "哪架无人机更适合该目标？", "覆盖、能量、链路、路径、视线"],
            ["资源规模", "每步总共派出多少架？", "动态预算控制派机规模"],
          ], "compact")}
        </section>
      </div>
    `),
    notes: [
      "本课题的核心问题是有限无人机资源和多目标动态感知需求之间如何匹配。",
      "随机派遣的问题是资源错配，全量派遣的问题是资源消耗过高，固定规则又难以适应动态场景。",
      "因此本文把问题拆为目标需求评估、节点适配评分和动态派机规模控制三个部分，并在此基础上设计 RADS 方法。",
    ],
  },
  {
    title: "技术路线",
    html: slideShell(5, "研究内容与技术路线：模型、算法、平台、实验闭环", "毕设工作不是单一公式推导，而是把算法设计落地为可运行、可回放、可对比的平台。", `
      <div class="roadmap" data-fit>
        <div class="road-node start"><b>01</b><strong>研究问题</strong><span>复杂约束下多目标协同感知</span></div>
        <div class="road-arrow">→</div>
        <div class="road-node"><b>02</b><strong>场景模型</strong><span>无人机、目标、障碍、天气、通信</span></div>
        <div class="road-arrow">→</div>
        <div class="road-node core"><b>03</b><strong>RADS 算法</strong><span>需求、效用、预算、子群</span></div>
        <div class="road-arrow">→</div>
        <div class="road-node"><b>04</b><strong>平台实现</strong><span>Web 交互、三维沙盘、会话接口</span></div>
        <div class="road-arrow">→</div>
        <div class="road-node end"><b>05</b><strong>实验验证</strong><span>三策略、多变量、效果-资源评估</span></div>
      </div>
      <div class="method-map">
        <section class="map-block" data-fit>
          <h3>输入层：任务与约束</h3>
          ${bullets(["动态目标状态、优先级与不确定性", "障碍栅格、视线遮挡、天气与链路扰动", "无人机能量、故障与传感能力"], "tight")}
        </section>
        <section class="map-block core" data-fit>
          <h3>方法层：RADS 动态调度</h3>
          ${bullets(["计算目标紧急度与需求量", "计算无人机-目标节点效用", "由任务压力与系统状态给出派机预算", "在预算内贪心生成可解释子群"], "tight")}
        </section>
        <section class="map-block" data-fit>
          <h3>输出层：平台与实验结论</h3>
          ${bullets(["三维回放与多策略同步对比", "严格成功率、误差、能耗、派机规模", "CSV 数据导出与论文图表支撑"], "tight")}
        </section>
      </div>
      <div class="chapter-band" data-fit>
        <span>第3章 需求与总体设计</span>
        <span>第4章 模型与算法</span>
        <span>第5章 平台实现</span>
        <span>第6章 实验与分析</span>
      </div>
    `),
    notes: [
      "本文按照需求分析、场景建模、RADS 调度、平台实现和实验验证的路线推进。",
      "其中场景建模保证实验对象和约束足够完整，RADS 负责动态选择感知子群，平台实现负责把算法过程可视化和数据化。",
      "最后通过多策略、多变量实验验证方法在效果和资源投入上的综合表现。",
    ],
  },
  {
    title: "系统需求",
    html: slideShell(6, "系统需求：面向实验验证的协同感知平台", "平台要让算法可配置、过程可观察、结果可比较，而不是只输出一个最终数字。", `
      <div class="req-v2">
        <section class="req-left">
          ${[
            ["参数配置", "无人机规模、目标数量、天气、通信、障碍、随机种子等实验变量可调整。"],
            ["运行控制", "支持单步推进、连续运行、暂停、重置，并在同一场景下同步比较三种策略。"],
            ["三维态势", "在沙盘中展示无人机、目标、障碍、航迹、链路和感知范围。"],
            ["任务分析", "按目标查看观测数量、融合误差、成功原因和失败原因。"],
            ["指标统计", "记录成功率、达标率、误差、能耗、派机数量和信息时效。"],
            ["结果导出", "导出 CSV 数据，支撑论文表格整理和实验曲线复核。"],
          ].map(([h, p], i) => `<div class="req-chip ${i % 2 ? "blue" : "red"}" data-fit><b><em>${String(i + 1).padStart(2, "0")}</em>${h}</b><span>${p}</span></div>`).join("")}
        </section>
        <section class="req-screen" data-fit>
          <h3>运行界面功能映射</h3>
          <figure class="screen-annotated">
            <img src="${ASSETS.runtimeMap}" />
            <i class="tag t1">01 参数配置</i>
            <i class="tag t2">02 运行控制</i>
            <i class="tag t3">03 三维态势</i>
            <i class="tag t4">04 任务分析</i>
            <i class="tag t5">05 指标统计</i>
            <i class="tag t6">06 结果导出</i>
          </figure>
          <div class="screen-tags" data-fit>
            <span>参数配置</span><span>运行控制</span><span>三维沙盘</span><span>任务分析</span><span>指标统计</span><span>结果导出</span>
          </div>
          <div class="screen-caption">截图对应平台实际运行界面：参数输入、过程回放、三策略对比、任务分析与结果导出形成实验闭环。</div>
        </section>
      </div>
      <div class="nonfunc-v2">
        <div data-fit><b>实时性</b><span>后端按仿真步返回统一快照，前端同步刷新沙盘和指标。</span></div>
        <div data-fit><b>可复现</b><span>随机种子、参数配置和策略状态纳入实验会话。</span></div>
        <div data-fit><b>可扩展</b><span>后续可加入新策略、新天气模型或高保真动力学。</span></div>
      </div>
    `),
    notes: [
      "本页对应论文中的系统需求分析。平台需要支持参数配置、多策略运行、动态仿真回放、三维态势展示、任务级分析和结果导出。",
      "这些功能都对应当前项目中的真实模块，例如前端 app.js、三维场景 scene3d-webgl.mjs、后端会话 sessions.py 和仿真 core.py。",
      "这说明本毕设不是只完成了某个孤立算法，而是完成了较完整的平台功能闭环。",
    ],
  },
  {
    title: "任务级分析",
    html: slideShell(7, "任务级分析：把总体指标追溯到单目标成败原因", "平台在总成功率之外，进一步记录每个目标的策略状态、定位误差、派机成员和原因解释。", `
      <div class="task-analysis-layout">
        <section class="task-shot" data-fit>
          <figure class="task-annotated">
            <img src="${ASSETS.taskAnalysis}" />
            <i class="tag a1">当前帧简报</i>
            <i class="tag a2">目标追踪解析</i>
            <i class="tag a3">派机热点</i>
          </figure>
        </section>
        <section class="task-explain" data-fit>
          <h3>任务分析区域说明</h3>
          <div class="task-steps">
            <div><b>01 当前帧简报</b><span>统计执行无人机、故障节点、已观测目标、已确认目标和严格成功目标。</span></div>
            <div><b>02 目标追踪解析</b><span>对未锁定目标给出三种策略的派机子群、状态、误差和失败原因。</span></div>
            <div><b>03 当前派机热点</b><span>按优先级和不确定半径列出最需要资源的目标，说明调度资源投向。</span></div>
            <div><b>04 任务级精度表</b><span>逐目标比较 RADS、随机、全量的定位误差，标出当前最佳策略。</span></div>
            <div><b>05 多任务明细</b><span>保留目标优先级、派机规模、状态和误差，支持 CSV 导出与结果复核。</span></div>
          </div>
          <div class="task-example">
            <b>示例读法</b>
            <span>T5 目标中，RADS 选择 2 架无人机形成严格成功，定位误差约 2.05m；随机派遣未形成有效观测，说明“派谁参与感知”会直接影响任务质量。</span>
          </div>
        </section>
      </div>
      <div class="task-bottom" data-fit>
        <div class="task-table-mini">
          <h3>任务级精度对照</h3>
          <table>
            <tr><th>目标</th><th>RADS 误差</th><th>随机误差</th><th>全量误差</th><th>最佳方法</th></tr>
            <tr><td>T2</td><td>2.95 m</td><td>12.29 m</td><td>--</td><td>RADS</td></tr>
            <tr><td>T4</td><td>13.31 m</td><td>13.71 m</td><td>--</td><td>RADS</td></tr>
            <tr><td>T5</td><td>2.05 m</td><td>--</td><td>8.22 m</td><td>RADS</td></tr>
          </table>
        </div>
        <div class="task-conclusion">
          <b>页面结论</b>
          <span>任务级分析不是重复总体成功率，而是回答“每个目标为何成败”：是否被确认、由哪些无人机观测、定位误差多少、资源为何投向该目标。</span>
        </div>
      </div>
    `, "task-analysis-page"),
    notes: [
      "这一页不再重复平台功能展示，而是专门讲任务级分析。平台会把总体成功率继续拆到每一个目标，记录状态、误差、子群成员和原因解释。",
      "可以以 T5 为例说明：RADS 选择 2 架无人机形成严格成功，定位误差约 2.05 米；随机派遣未形成有效观测，说明动态选择合适节点比单纯随机派机更可靠。",
      "底部任务表用于实验复核和 CSV 导出，支撑论文中的目标级结果表、误差统计和结论分析。",
    ],
  },
  {
    title: "总体架构",
    html: slideShell(7, "总体架构：前端展示、业务会话、仿真计算分层", "系统采用轻量级前后端分离结构，核心仿真逻辑集中在后端，前端负责交互和态势展示。", `
      <div class="arch-v2">
        <section class="arch-figure">
          <div class="arch-diagram" data-fit>
            <h3>平台总体架构图</h3>
            <div class="arch-main">
              <div class="system-block backend">
                <b>Python 后端</b>
                <span>Web 服务</span>
                <span>实验会话管理</span>
                <span>仿真引擎</span>
                <span>路径规划</span>
                <em>server.py · sessions.py · core.py</em>
              </div>
              <div class="api-bridge">
                <i></i>
                <strong>HTTP / JSON</strong>
                <i></i>
              </div>
              <div class="system-block frontend">
                <b>Web 前端</b>
                <span>参数配置</span>
                <span>指标展示</span>
                <span>任务分析</span>
                <span>三维场景可视化</span>
                <em>index.html · app.js · scene3d.mjs</em>
              </div>
            </div>
            <div class="arch-base">统一实验快照 · 三策略对比状态 · CSV 结果数据</div>
            <p>展示层、业务控制层与仿真计算层分工明确，保证算法运行、界面展示和实验记录一致。</p>
          </div>
        </section>
        <section class="arch-stack">
          <div class="layer ui" data-fit>
            <b>展示层</b>
            <strong>参数配置 · 三维沙盘 · 指标面板</strong>
            <span>templates/index.html、static/app.js、scene3d-webgl.mjs</span>
          </div>
          <div class="layer service" data-fit>
            <b>业务控制层</b>
            <strong>接口路由 · 实验会话 · 快照组织</strong>
            <span>src/web/server.py、sessions.py</span>
          </div>
          <div class="layer sim" data-fit>
            <b>仿真计算层</b>
            <strong>场景建模 · 路径规划 · RADS · 融合评价</strong>
            <span>src/simulation/core.py、pathfinding.py</span>
          </div>
          <div class="arch-value" data-fit>
            <h3>架构价值</h3>
            ${bullets(["算法与展示解耦，便于调试、替换策略和复现实验。", "会话统一管理参数、策略状态和回放帧，支持三策略同步对比。", "每步输出统一快照，使三维场景、指标曲线和任务表格保持一致。"], "tight")}
          </div>
        </section>
      </div>
      <div class="data-loop" data-fit>
        <b>数据闭环</b><span>参数配置</span><i>→</i><span>后端会话</span><i>→</i><span>仿真推进</span><i>→</i><span>统一快照</span><i>→</i><span>可视化与导出</span>
      </div>
    `),
    notes: [
      "平台采用前后端分离的三层结构。表示层面向用户，负责参数配置、三维沙盘和结果展示。",
      "业务控制层负责接口请求、实验会话和数据组织；仿真计算层负责核心模型、路径规划、策略调度和感知融合。",
      "这种结构让平台功能划分清晰，也便于后续扩展新的调度策略或实验指标。",
    ],
  },
  {
    title: "场景建模",
    html: slideShell(8, "复杂场景建模：把任务对象和现实约束放入统一环境", "无人机是否适合某个目标，不只看直线距离，还要看路径、视线、天气、链路和能量。", `
      <div class="model-layout">
        <div>
          ${imageBox(ASSETS.scenario, "论文中的场景建模示意：地图、障碍物、目标、天气与观测关系", "scenario-img")}
        </div>
        <div class="model-right">
          <div class="model-metrics">
            ${metric("1320m", "地图尺寸", "33×33 栅格")}
            ${metric("180m", "感知半径", "默认传感范围", "red")}
            ${metric("120°", "视场角", "影响目标可见性")}
          </div>
          ${panel("状态对象", table(["对象", "核心状态", "作用"], [
            ["无人机", "位置、能量、故障、传感偏置", "决定可用性和观测质量"],
            ["目标", "位置、速度、优先级、不确定性", "决定需求强度"],
            ["环境", "障碍、天气、通信半径、丢包", "决定路径与信息时效"],
          ], "compact"))}
        </div>
      </div>
      <div class="bottom-strip model">
        ${metric("24", "无人机", "默认集群规模")}
        ${metric("6", "动态目标", "默认任务规模", "red")}
        ${metric("34", "障碍物", "默认复杂度")}
        ${metric("40步", "仿真时长", "单次实验步数", "red")}
      </div>
    `),
    notes: [
      "平台把无人机、动态目标、障碍物、天气、通信链路和故障因素统一放入同一仿真场景。",
      "默认实验规模是 24 架无人机、6 个动态目标、34 个障碍物，地图为 1320 米，栅格为 33 乘 33。",
      "RADS 后续的调度评分会直接使用这些状态，而不是只根据直线距离进行派遣。",
    ],
  },
  {
    title: "约束模型",
    html: slideShell(9, "路径、视线、天气与通信：调度前必须先判断“能不能有效观测”", "这些约束进入算法评分和融合判定，是平台区别于静态演示的重要部分。", `
      <div class="constraint-grid">
        ${smallPanel("绕障路径", ["基于障碍栅格构建距离图", "路径不可达时效用直接降为无效", "路径越长，移动代价越高"], "blue")}
        ${smallPanel("视线与视场", ["判断目标是否被障碍遮挡", "结合传感半径与 FOV", "可见性影响观测生成"], "red")}
        ${smallPanel("天气扰动", ["压缩感知半径和视场角", "增加测量噪声和故障概率", "降低链路质量并增加丢包"], "blue")}
        ${smallPanel("通信链路", ["通信半径决定链路强弱", "丢包影响观测送达", "延迟影响信息时效"], "red")}
      </div>
      <div class="constraint-bottom">
        ${imageBox(ASSETS.weather, "论文图示：天气因素对感知、通信、速度和故障概率的综合影响", "weather-img")}
        ${panel("进入算法的位置", table(["约束", "进入 RADS", "进入结果判定"], [
          ["路径距离", "coverage 与 travel_penalty", "无人机运动能耗"],
          ["视线遮挡", "line_bonus 或遮挡惩罚", "是否产生有效观测"],
          ["链路质量", "link 效用项", "丢包/延迟后的融合输入"],
          ["天气强度", "影响半径、噪声、链路、速度", "影响误差与成功率上限"],
        ], "compact"))}
      </div>
    `),
    notes: [
      "本页说明平台中的关键约束。路径代价来自障碍栅格距离图，视线遮挡用于判断目标是否可见。",
      "天气会影响感知半径、视场角、噪声、链路和故障概率；通信丢包和延迟会影响观测能否及时参与融合。",
      "这些约束都进入平台计算，而不是只用于页面展示。",
    ],
  },
  {
    title: "RADS 总览",
    html: slideShell(10, "RADS 总览：每个仿真步重新选择最合适的无人机子群", "RADS 的核心是动态子群选择：把有限资源投给更需要、也更适合的目标-无人机组合。", `
      <div class="rads-overview">
        <div class="rads-left">
          ${formula("RADS = Risk-Aware Dynamic Scheduling / Subgroup Selection", "风险感知动态调度：通过动态子群选择完成资源受限多目标感知。")}
          ${flow(["状态更新", "目标需求", "节点效用", "动态预算", "子群生成", "融合评价"], "vertical-process")}
        </div>
        <div class="rads-right">
          ${imageBox(ASSETS.radsFlow, "论文中的 RADS 调度流程图：需求、效用和预算共同决定派机子群", "rads-img")}
        </div>
      </div>
      <div class="rads-key" data-fit>
        <b>理论解释：</b>
        <span>本质上是一个带资源预算的动态多目标分配问题；RADS 用需求函数描述“目标需要多少观测”，用效用函数描述“哪架无人机更值得派”，再用滚动预算限制每一步的资源投入。</span>
      </div>
      <div class="rads-theory-strip" data-fit>
        <div><b>滚动决策</b><span>每个仿真步重新评估目标状态，而不是一次性静态分配。</span></div>
        <div><b>风险建模</b><span>目标、环境、节点、链路风险都进入评分或判定环节。</span></div>
        <div><b>效用最大化</b><span>优先选择综合效用高、路径和链路更可靠的节点。</span></div>
        <div><b>资源约束</b><span>动态预算控制派机上限，平衡效果与能耗。</span></div>
      </div>
    `),
    notes: [
      "RADS 可以理解为风险感知动态调度，具体实现落点是动态子群选择。",
      "它不是一次性分配，而是在每个仿真步根据目标、环境、节点和链路状态重新计算目标需求、节点效用和派机预算。",
      "最后算法选择合适的无人机子群执行感知任务，目标是在保持感知效果的同时降低资源投入。",
      "如果老师问 RADS 的 R 体现在哪里，可以回答：目标不确定性、障碍/天气、节点能量故障和链路质量都被纳入评分或成功判定。",
    ],
  },
  {
    title: "RADS 原理一",
    html: slideShell(11, "RADS 原理一：目标需求由优先级、不确定性和运动强度共同决定", "先判断“目标当前有多急、需要几架无人机”，再进入后续派机。", `
      <div class="demand-principle">
        <section class="demand-left" data-fit>
          ${formula("R<sub>j</sub>(t)=0.45P<sub>j</sub>+0.40Q<sub>j</sub>+0.15M<sub>j</sub>+ξ<sub>j</sub>", "R 为目标紧急度；P 为优先级，Q 为定位不确定性，M 为运动强度，ξ 为机动扰动项。")}
          <div class="weight-stack">
            <div><b>45%</b><span>优先级 P</span><i style="width:45%"></i></div>
            <div><b>40%</b><span>不确定性 Q</span><i style="width:40%"></i></div>
            <div><b>15%</b><span>运动强度 M</span><i style="width:15%"></i></div>
          </div>
          ${formula("N<sub>j</sub><sup>dem</sup>=clip(ceil(1+2.4R<sub>j</sub>), 1, N<sub>max</sub>)", "将连续紧急度转为离散派机需求，避免所有目标平均分配资源。")}
        </section>
        <section class="demand-visual" data-fit>
          <h3>从目标状态到需求量</h3>
          <div class="target-radar">
            <div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>
            <div class="target-dot">T2</div>
            <span class="radar-label p">高优先级</span>
            <span class="radar-label q">不确定性高</span>
            <span class="radar-label m">运动较快</span>
          </div>
          <div class="demand-levels">
            <div><b>低需求</b><span>1-2 架</span></div>
            <div class="active"><b>中高需求</b><span>3-4 架</span></div>
            <div><b>热点目标</b><span>受预算约束</span></div>
          </div>
        </section>
        <section class="demand-table" data-fit>
          <h3>示例：目标需求分级</h3>
          ${table(["目标", "优先级", "不确定性", "运动", "R", "需求"], [
            ["T0", "3", "18m", "中", "0.72", "3架"],
            ["T2", "3", "42m", "快", "0.94", "4架"],
            ["T5", "1", "20m", "慢", "0.38", "2架"],
          ], "compact")}
          <p class="code-map">代码映射：compute_target_demand(target, config, step)</p>
        </section>
      </div>
      <div class="demand-flow academic" data-fit>
        <div><b>输入状态</b><span>priority / uncertainty / velocity</span></div>
        <div>→</div>
        <div><b>紧急度 R</b><span>衡量当前感知压力</span></div>
        <div>→</div>
        <div><b>需求 N<sup>dem</sup></b><span>约束后续派机数量</span></div>
      </div>
    `),
    notes: [
      "RADS 的第一步是计算目标需求。平台不会默认每个目标都需要同样数量的无人机，而是根据目标状态动态确定。",
      "需求函数主要考虑三个因素：目标优先级、定位不确定性和运动强度。优先级越高、不确定性越大、运动越快，紧急度就越高。",
      "紧急度再通过 clip 和 ceil 转换为需求数量，避免派机数量过低或超过上限。",
    ],
  },
  {
    title: "RADS 原理二",
    html: slideShell(12, "RADS 原理二：节点效用衡量“哪架无人机更适合哪个目标”", "目标需求回答“要多少资源”，节点效用回答“该用哪几架无人机”。", `
      <div class="utility-principle">
        <section class="utility-left" data-fit>
          ${formula("U<sub>ij</sub>=0.28C+0.18E+0.14L+0.18R+0.12S+B<sub>los</sub>−0.06T−0.04D", "综合覆盖、能量、链路、目标紧急度、感知就绪、视线奖励、路程惩罚和冗余惩罚。")}
          <div class="utility-components">
            <div class="pos"><b>正向项</b><span>C 覆盖</span><span>E 能量</span><span>L 链路</span><span>R 紧急</span><span>S 就绪</span></div>
            <div class="neg"><b>修正项</b><span>B<sub>los</sub> 视线</span><span>T 路程</span><span>D 冗余</span></div>
          </div>
          <p class="code-map">代码映射：compute_utility(uav, target, demand, urgency, selected_count, ...)</p>
        </section>
        <section class="utility-matrix" data-fit>
          <h3>候选无人机-目标效用矩阵</h3>
          <div class="matrix-grid">
            <b></b><b>T0</b><b>T2</b><b>T5</b>
            <b>U03</b><span class="hot">0.86</span><span>0.62</span><span>0.41</span>
            <b>U09</b><span>0.58</span><span class="hot">0.91</span><span>0.47</span>
            <b>U14</b><span>0.63</span><span class="warm">0.74</span><span>0.51</span>
            <b>U17</b><span>0.44</span><span>0.55</span><span class="hot">0.79</span>
          </div>
          <div class="matrix-note">高效用单元优先进入子群；已被选择的无人机不再参与其他目标分配。</div>
        </section>
        <section class="utility-right" data-fit>
          <h3>为什么效用函数更适合复杂场景</h3>
          ${table(["维度", "避免的问题", "调度效果"], [
            ["路径/覆盖", "直线近但绕障远", "减少不可达派机"],
            ["能量", "低电量节点过度执行", "延长集群可用时间"],
            ["链路", "观测无法及时回传", "提升融合确认概率"],
            ["冗余", "多个节点扎堆同一目标", "保留预算给其他目标"],
          ], "compact")}
        </section>
      </div>
    `),
    notes: [
      "RADS 的第二步是计算无人机对目标的节点效用。这个效用不是单纯距离，而是综合多种因素。",
      "正向因素包括覆盖能力、剩余能量、链路质量、目标紧急度和感知就绪程度。",
      "同时算法也会考虑视线是否清晰、路径距离是否过长，以及该目标是否已经有足够无人机，避免无效派遣和重复堆叠。",
    ],
  },
  {
    title: "RADS 原理三",
    html: slideShell(13, "RADS 原理三：动态预算控制每一步的总派机规模", "预算机制是 RADS 降低资源投入的关键，它决定本步最多投入多少架无人机。", `
      <div class="budget-principle">
        <section class="budget-left" data-fit>
          ${formula("B(t)=clamp(round(D(t)), B<sub>min</sub>, B<sub>cap</sub>)", "D(t) 由任务压力、系统健康和历史反馈共同决定；B(t) 是本步派机预算。")}
          <div class="budget-factors">
            <div><b>任务压力</b><span>目标数、总紧急度、热点目标</span></div>
            <div><b>系统健康</b><span>平均能量、平均链路、可用节点</span></div>
            <div><b>历史反馈</b><span>最近成功率、上一轮观测质量</span></div>
          </div>
          <div class="budget-eq">高压力 ↑预算　低能量/弱链路 ↓预算　预算不超过可用节点</div>
        </section>
        <section class="budget-center" data-fit>
          <h3>动态预算调节器</h3>
          <svg viewBox="0 0 520 320" class="budget-svg">
            <path d="M70 250 A190 190 0 0 1 450 250" fill="none" stroke="#e3e9f1" stroke-width="34" stroke-linecap="round"/>
            <path d="M70 250 A190 190 0 0 1 278 70" fill="none" stroke="#b33a32" stroke-width="34" stroke-linecap="round"/>
            <path d="M278 70 A190 190 0 0 1 450 250" fill="none" stroke="#082b5f" stroke-width="34" stroke-linecap="round"/>
            <line x1="260" y1="250" x2="338" y2="125" stroke="#082b5f" stroke-width="8" stroke-linecap="round"/>
            <circle cx="260" cy="250" r="12" fill="#082b5f"/>
            <text x="260" y="210" text-anchor="middle" class="gauge-num">B(t)=9</text>
            <text x="260" y="245" text-anchor="middle" class="gauge-label">本步派机预算</text>
            <text x="76" y="286" class="gauge-tick">保守</text>
            <text x="420" y="286" class="gauge-tick">积极</text>
          </svg>
          <div class="budget-caption">预算不是固定比例，而是随场景压力与系统状态滚动变化。</div>
        </section>
        <section class="budget-right" data-fit>
          <h3>预算策略示例</h3>
          ${table(["场景状态", "预算倾向", "解释"], [
            ["目标少、链路弱", "收缩", "减少低质量观测与无效能耗"],
            ["目标多、热点多", "扩张", "优先满足高紧急目标需求"],
            ["能量下降", "抑制", "避免低电量节点继续高强度执行"],
            ["链路改善", "适度扩张", "提高多机观测回传概率"],
          ], "compact")}
          <p class="code-map">代码映射：compute_adaptive_budget(...)</p>
        </section>
      </div>
    `),
    notes: [
      "RADS 的第三步是动态预算。目标需求和节点效用还不够，因为还需要控制每一步总共派出多少架无人机。",
      "预算由任务压力和系统健康度共同决定。任务越紧急，预算会提高；平均能量或链路较差时，预算会被抑制。",
      "这就是 RADS 能够降低能耗和派机规模的关键。它不是盲目少派，而是根据场景压力动态决定派机上限。",
    ],
  },
  {
    title: "RADS 原理四",
    html: slideShell(14, "RADS 原理四：预算约束下的贪心式子群生成", "在每一步预算范围内，优先服务高紧急目标，并选择当前效用最高的可用无人机。", `
      <div class="greedy-principle">
        <section class="pseudo dense" data-fit>
          <h3>贪心式启发子群生成逻辑</h3>
          <ol>
            <li>筛选可用无人机：未故障且能量高于最低阈值。</li>
            <li>计算目标需求与紧急度，按 R 从高到低排序。</li>
            <li>计算本步预算 B(t)，作为总派机上限。</li>
            <li>循环遍历目标：若未满足需求，则从未选无人机中取效用最高者。</li>
            <li>更新 selected、by_target 和剩余预算，直到预算用完或无可行候选。</li>
          </ol>
          <p class="code-map">代码映射：assign_smart()</p>
          <div class="greedy-note-grid">
            <div><b>算法性质</b><span>预算约束下的贪心式启发，不做全局回溯搜索。</span></div>
            <div><b>计算复杂度</b><span>每轮约 O(B×M×N)，B 为预算，M 为目标数，N 为可用无人机数。</span></div>
            <div><b>适用原因</b><span>每步滚动重算，计算量适中，便于平台实时回放。</span></div>
            <div><b>解释优势</b><span>可追踪目标排序、候选评分和剩余预算。</span></div>
          </div>
        </section>
        <section class="assign-visual" data-fit>
          <h3>示例：按效用选取子群</h3>
          <div class="assign-grid">
            <b>目标</b><b>需求</b><b>候选评分</b><b>输出子群</b>
            <span>T2 高紧急</span><span>4架</span><span>U09 0.91 · U14 0.74 · U03 0.62</span><strong>U09、U14、U03</strong>
            <span>T0 中紧急</span><span>3架</span><span>U03 已占用 · U06 0.68 · U11 0.61</span><strong>U06、U11</strong>
            <span>T5 低紧急</span><span>2架</span><span>剩余预算不足，等待下一步</span><strong class="muted">暂缓</strong>
          </div>
          <div class="budget-state">
            <div><b>预算 B(t)</b><span>9 架</span></div>
            <div><b>已选节点</b><span>5 架</span></div>
            <div><b>剩余预算</b><span>4 架</span></div>
          </div>
          <div class="assign-explain">
            <div><b>先服务热点</b><span>T2 紧急度最高，优先获得高效用无人机。</span></div>
            <div><b>避免重复占用</b><span>U03 已被选择后，不再重复分配给 T0。</span></div>
            <div><b>预算保留</b><span>T5 优先级较低，在预算不足时进入下一步滚动决策。</span></div>
          </div>
        </section>
        <section class="subgroup-output" data-fit>
          <h3>输出与解释性</h3>
          <div class="subgroup-badges">
            <div><b>T2 子群</b><span>U09 · U14 · U03</span></div>
            <div><b>T0 子群</b><span>U06 · U11</span></div>
            <div><b>失败原因</b><span>预算不足 / 链路弱 / 路径不可达</span></div>
          </div>
          ${table(["输出对象", "用于平台展示"], [
            ["assignments", "无人机当前目标与运动方向"],
            ["by_target", "每个目标对应的感知子群"],
            ["last_utility / link", "任务级原因分析与调度解释"],
          ], "compact")}
        </section>
      </div>
    `),
    notes: [
      "RADS 的最后一步是子群生成。准确地说，这里采用的是预算约束下的贪心式启发算法。",
      "算法先筛选可用无人机，再按目标紧急度排序；在预算范围内，为尚未满足需求的目标选择当前效用最高的无人机，并把它加入该目标子群。",
      "它不是全局最优求解器，也没有做回溯搜索；优势在于计算量适中、过程可解释，适合本科毕设平台中的实时仿真演示。",
      "如果老师问是不是贪心，可以明确回答：是预算约束下的贪心式启发；每步滚动重算弥补了一次性贪心的静态局限。",
    ],
  },
  {
    title: "感知融合",
    html: slideShell(15, "感知融合与严格成功：覆盖只是开始，融合结果才是最终评价", "平台中的成功判定同时要求观测确认、定位达标和一致性达标，因此比普通覆盖率更严格。", `
      <div class="fusion-layout">
        <section>
          ${flow(["观测生成", "链路传输", "加权融合", "严格判定"], "fusion-process")}
          ${formula("融合位置 = 高质量观测占更大权重；严格成功 = 已确认 + 误差≤32m + 结果一致", "权重表示观测可信度，由测量误差、链路质量、剩余能量和延迟共同决定。")}
          ${panel("融合逻辑", bullets([
            "只有满足距离、视线、视场和探测概率的观测才可能进入候选集合。",
            "观测经过通信链路后，丢包和延迟会影响是否及时参与融合。",
            "融合时会综合观测质量，并削弱离群观测对最终估计的影响。",
          ], "tight"))}
          <div class="fusion-criteria" data-fit>
            <div><b>确认条件</b><span>有效观测数量达到阈值，避免单点偶然观测。</span></div>
            <div><b>精度条件</b><span>融合误差不超过 32m，保证位置估计可用。</span></div>
            <div><b>一致条件</b><span>多机观测分歧受控，降低误判和漂移风险。</span></div>
          </div>
        </section>
        <section>
          ${panel("失败原因可解释", table(["失败类型", "含义", "答辩解释"], [
            ["未确认", "有效观测数量不足", "派机或链路不足导致无法确认"],
            ["误差超阈", "融合位置误差高于 32m", "天气噪声、遮挡或观测几何差"],
            ["一致性不足", "多机观测分歧过大", "观测质量不稳定或目标机动"],
            ["无覆盖", "没有无人机形成有效观测", "调度、路径或视场限制"],
          ], "compact"))}
          ${imageBox(ASSETS.fusion, "论文中的感知融合流程示意", "fusion-img")}
        </section>
      </div>
    `),
    notes: [
      "平台中的感知成功不是简单判断有没有覆盖到目标。首先需要生成有效观测，满足距离、视线和视场等条件。",
      "随后观测还要经过通信链路，丢包和延迟会影响观测是否及时参与融合。",
      "融合部分可以不用按公式推导讲，只要说明：多个无人机都观测到同一目标时，平台不是简单平均，而是让质量更高、链路更可靠、延迟更小的观测占更大权重。",
      "最后严格成功需要确认数量、定位误差和一致性同时满足，所以这个指标比普通覆盖率更严格，也更能反映真实协同感知质量。",
    ],
  },
  {
    title: "平台实现",
    html: slideShell(16, "平台实现：参数配置、三维沙盘、策略对比与数据导出", "最终成果是一个可运行的 Web 平台，能够展示过程、记录指标并支撑论文实验。", `
      <div class="platform-layout">
        ${imageBox(ASSETS.platform, "平台主界面截图：左侧配置，中间三维态势，右侧与底部展示指标和任务分析", "platform-img")}
        <div class="platform-right">
          ${smallPanel("前端交互", ["参数表单", "运行控制", "策略切换", "图表刷新"], "red")}
          ${smallPanel("三维展示", ["无人机航迹", "目标位置", "障碍物", "链路/感知范围"], "blue")}
          ${smallPanel("后端服务", ["实验会话", "单步推进", "快照返回", "CSV 导出"], "red")}
          ${smallPanel("仿真核心", ["RADS 调度", "路径规划", "观测融合", "指标统计"], "blue")}
        </div>
      </div>
    `),
    notes: [
      "这一页展示平台主界面。左侧支持参数配置，中央是三维态势沙盘，右侧和下方展示指标、曲线和任务级分析。",
      "平台支持 RADS、随机派遣和全量派遣三种策略在同一场景下对比。",
      "实验结束后还可以导出 CSV，用于论文表格整理和结果分析。",
    ],
  },
  {
    title: "实验设计",
    html: slideShell(17, "实验设计：三策略对比与多变量验证", "实验将 RADS、随机派遣、全量派遣放在同一场景中比较，重点看效果与资源投入是否平衡。", `
      <div class="experiment-layout">
        ${panel("对比策略", table(["策略", "含义", "作用"], [
          ["RADS", "按需求、效用、预算动态选择子群", "本文方法，验证综合平衡"],
          ["随机派遣", "在可用节点中随机选择派机对象", "弱基线，观察动态评分价值"],
          ["全量派遣", "尽量使用全部可用无人机", "强基线，观察资源消耗代价"],
        ], "compact"))}
        ${panel("评价指标", table(["效果指标", "资源指标", "实验变量"], [
          ["严格成功率", "累计能耗", "任务规模"],
          ["定位达标率", "平均派机数量", "天气/障碍"],
          ["平均定位误差", "信息时效", "通信半径/丢包/延迟"],
        ], "compact"))}
      </div>
      <div class="experiment-checklist" data-fit>
        <div><b>同场景对照</b><span>三种策略使用同一地图、目标轨迹与随机种子。</span></div>
        <div><b>多维指标</b><span>同时比较效果、资源、时效，避免只看单一成功率。</span></div>
        <div><b>变量递进</b><span>默认场景后依次改变任务规模、障碍、天气和通信。</span></div>
        <div><b>结果可复核</b><span>平台导出 CSV，论文图表可由实验数据回溯。</span></div>
      </div>
      <div class="param-row">
        ${metric("24", "无人机", "默认规模")}
        ${metric("6", "目标", "任务数量", "red")}
        ${metric("180m", "感知半径", "传感范围")}
        ${metric("300m", "通信半径", "链路范围", "red")}
        ${metric("4%", "丢包率", "默认通信扰动")}
      </div>
    `),
    notes: [
      "实验选取 RADS、随机派遣和全量派遣三种策略进行比较。",
      "评价指标包括严格成功率、定位达标率、平均误差、累计能耗、平均派机数量和信息时效。",
      "实验变量包括任务规模、天气、障碍复杂度和通信条件，默认参数则用于构建基础对照场景。",
    ],
  },
  {
    title: "默认场景结果",
    html: slideShell(18, "默认场景结果：RADS 接近全量效果，但资源投入显著更低", "默认场景下，RADS 的严格成功率接近全量派遣，同时能耗和派机数量大幅下降。", `
      <div class="default-results">
        ${barChart({
          title: "默认场景：严格成功率与定位误差",
          categories: ["成功率(%)", "误差(m)"],
          max: 80,
          height: 440,
          width: 900,
          series: [
            { name: "RADS", values: [70.8, 9.52] },
            { name: "随机", values: [16.7, 14.83] },
            { name: "全量", values: [72.9, 8.07] },
          ],
          note: "成功率越高越好，误差越低越好",
        })}
        ${barChart({
          title: "默认场景：能耗与平均派机数量",
          categories: ["能耗/20", "派机数"],
          max: 110,
          height: 440,
          width: 900,
          series: [
            { name: "RADS", values: [56.0, 9.4] },
            { name: "随机", values: [55.2, 10.9] },
            { name: "全量", values: [106.9, 20.5] },
          ],
          note: "能耗为缩放显示：原值/20",
        })}
      </div>
      <div class="default-interpret" data-fit>
        <div><b>效果接近</b><span>RADS 成功率 70.8%，与全量 72.9% 只差 2.1 个百分点。</span></div>
        <div><b>误差可控</b><span>RADS 平均误差 9.52m，虽高于全量但明显优于随机派遣。</span></div>
        <div><b>资源节省</b><span>平均派机从 20.5 降到 9.4，能耗约降至全量的 52.4%。</span></div>
      </div>
      <div class="result-strip">
        ${metric("70.8%", "RADS 成功率", "与全量 72.9% 相差 2.1 个百分点")}
        ${metric("47.6%", "能耗降低", "相较全量派遣", "red")}
        ${metric("54.1%", "派机降低", "20.5 → 9.4 架")}
      </div>
    `),
    notes: [
      "默认场景下，RADS 的严格成功率为 70.8%，全量派遣为 72.9%，两者差距只有 2.1 个百分点。",
      "但资源消耗上，RADS 的累计能耗比全量派遣降低约 47.6%，平均派机数量从 20.5 降到 9.4。",
      "这说明 RADS 可以用更少资源获得接近全量派遣的感知效果，这是本文最核心的实验结论之一。",
    ],
  },
  {
    title: "任务规模与障碍",
    html: slideShell(19, "任务规模与障碍实验：RADS 能随任务压力调整派机子群", "目标数量和障碍复杂度变化时，RADS 通过需求、路径和视线评分保持相对稳定。", `
      <div class="two-charts">
        ${lineChart({
          title: "任务规模变化：严格成功率",
          categories: ["6目标", "8目标", "10目标"],
          max: 85,
          height: 390,
          width: 880,
          series: [
            { name: "RADS", values: [70.8, 69.5, 68.0], suffix: "%" },
            { name: "全量", values: [72.9, 65.8, 58.3], suffix: "%" },
          ],
          note: "目标增多后 RADS 成功率下降较小",
          labelMode: "none",
        })}
        ${lineChart({
          title: "障碍复杂度变化：RADS 稳定性",
          categories: ["34障碍", "42障碍", "50障碍"],
          max: 80,
          height: 390,
          width: 880,
          series: [
            { name: "成功率", values: [70.8, 69.6, 68.8], suffix: "%" },
            { name: "误差", values: [9.5, 9.9, 10.2], suffix: "m" },
          ],
          note: "误差曲线用于趋势参考",
          labelMode: "none",
        })}
      </div>
      <div class="variable-strip" data-fit>
        <div><b>任务规模增大</b><span>目标需求总量上升 → 预算扩张 → 派机子群随压力增大。</span></div>
        <div><b>障碍复杂度增大</b><span>路径代价与视线遮挡上升 → 低价值候选被抑制。</span></div>
        <div><b>结论读取方式</b><span>观察成功率是否稳定，同时看误差和派机数量是否失控。</span></div>
      </div>
      <div class="analysis-row">
        ${smallPanel("任务规模结论", ["目标数从 6 增至 10，RADS 成功率约下降 2.8 个百分点。", "派机数量会随目标需求上升，说明动态预算在发挥作用。", "相比全量派遣，RADS 在目标增多后保持更平滑的下降趋势。"], "red")}
        ${smallPanel("障碍实验结论", ["障碍从 34 增至 50，RADS 成功率保持在约 69% 附近。", "路径代价与视线判定能减少不可达或低价值派机。", "误差略升说明环境复杂度确实进入了融合评价。"], "blue")}
      </div>
    `),
    notes: [
      "任务规模实验中，目标数从 6 增加到 10 后，RADS 成功率只下降约 2.8 个百分点，同时派机数量会主动上升。",
      "障碍实验中，障碍物数量从 34 增加到 50 后，RADS 成功率变化较小，定位误差略有上升。",
      "这说明 RADS 能够结合任务压力、路径代价和视线条件调整派机结果。",
    ],
  },
  {
    title: "天气与通信",
    html: slideShell(20, "天气与通信实验：环境扰动会压低上限，链路质量影响融合", "极端天气会降低三种策略的整体上限，通信半径、丢包和延迟会影响观测是否及时参与融合。", `
      <div class="weather-comm-v2">
        <section class="weather-main" data-fit>
          ${lineChart({
            title: "天气扰动下三策略严格成功率",
            categories: ["晴空", "雾霾", "降雨", "雷暴"],
            max: 85,
            height: 560,
            width: 1040,
            series: [
              { name: "RADS", values: [70.8, 60.8, 48.3, 34.2], suffix: "%" },
              { name: "随机", values: [16.7, 9.2, 8.3, 6.7], suffix: "%" },
              { name: "全量", values: [72.9, 74.6, 67.9, 50.0], suffix: "%" },
            ],
            note: "极端天气会同时压低传感、链路和融合上限",
            labelMode: "none",
          })}
        </section>
        <section class="comm-panel" data-fit>
          <h3>通信敏感性：RADS 成功率</h3>
          ${table(["变量", "水平变化", "成功率变化", "理论解释"], [
            ["通信半径", "300m → 400m → 500m", "70.8% → 81.7% → 78.3%", "半径扩大提升观测回传，但过大后边际收益降低。"],
            ["丢包率", "0% → 4% → 10%", "77.9% → 70.8% → 65.0%", "丢包会减少可用于融合的有效观测。"],
            ["通信延迟", "0步 → 1步 → 2步", "70.8% → 65.4% → 60.0%", "延迟会降低信息时效，使动态目标估计滞后。"],
          ], "compact comm-table")}
          <div class="comm-kpis">
            <div><b>+10.9%</b><span>400m 半径最佳提升</span></div>
            <div><b>-12.9%</b><span>10% 丢包相对下降</span></div>
            <div><b>-10.8%</b><span>2步延迟相对下降</span></div>
          </div>
        </section>
      </div>
      <div class="result-note result-note-v2" data-fit><b>结论：</b>天气扰动主要压低系统可观测上限；通信条件则决定观测是否能及时进入融合，因此会直接影响严格成功率。</div>
    `),
    notes: [
      "天气实验中，随着天气从晴空变为雷暴，RADS 成功率从 70.8% 降到 34.2%，说明极端环境会明显降低系统上限。",
      "通信半径从 300 米增加到 400 米时，RADS 成功率提升到 81.7%，说明链路覆盖对协同感知有帮助。",
      "丢包率和延迟升高会降低观测数量和信息时效，从而影响融合结果。",
    ],
  },
  {
    title: "综合结果与创新点",
    html: slideShell(21, "综合结果与创新点：RADS 的价值在于接近全量效果并明显降低资源投入", "多组实验平均结果表明，RADS 不是单项绝对最优，而是效果与资源之间的综合平衡。", `
      <div class="innovation-layout">
        <section>
          ${table(["策略", "严格成功率", "平均误差", "累计能耗", "平均派机"], [
            ["RADS", "<b>64.9%</b>", "10.91 m", "<b>1060.4</b>", "<b>8.8</b>"],
            ["随机派遣", "17.1%", "14.83 m", "1103.0", "10.9"],
            ["全量派遣", "70.3%", "<b>8.66 m</b>", "2143.4", "20.4"],
          ], "overall")}
          <div class="quadrant" data-fit>
            <div class="axis-x">资源投入更高 →</div><div class="axis-y">感知效果更高 ↑</div>
            <div class="point random">随机</div><div class="point rads">RADS</div><div class="point full">全量</div>
          </div>
        </section>
        <section>
          ${panel("创新点归纳", table(["创新点", "具体体现"], [
            ["复杂约束建模", "障碍、天气、通信、能量、故障进入统一仿真"],
            ["RADS 动态子群", "目标需求、节点效用、动态预算联动决策"],
            ["可解释实验平台", "三策略同步对比、任务级原因分析、CSV 导出"],
            ["效果-资源评估", "同时比较成功率、误差、能耗、派机与信息时效"],
          ], "compact"))}
          ${panel("答辩强调", bullets(["RADS 接近全量派遣的成功率，但平均能耗约为全量的 49.5%。", "平台价值在于把算法、场景和实验数据连接起来，让结论有过程依据。", "结果来自统一场景、多指标和导出数据，不是单次截图式展示。"], "tight"))}
        </section>
      </div>
    `),
    notes: [
      "综合多组实验结果，RADS 的平均严格成功率为 64.9%，明显高于随机派遣，接近全量派遣。",
      "在资源消耗方面，RADS 的平均能耗约为全量派遣的一半，平均派机数量也明显更低。",
      "本文创新点包括复杂约束平台、RADS 动态子群方法、统一仿真建模以及三策略对比和任务级分析机制。",
      "答辩时可以强调：创新点不是某一个公式，而是把模型、算法、平台和可复现实验数据串成了完整闭环。",
    ],
  },
  {
    title: "总结与展望",
    html: slideShell(22, "总结与展望：完成从模型、算法、平台到实验的闭环验证", "本文验证了 RADS 在复杂约束下以较低资源投入维持较好协同感知质量的可行性。", `
      <div class="summary-layout">
        <section>
          ${panel("主要结论", bullets([
            "完成了面向复杂约束的无人机集群协同态势感知平台。",
            "设计了 RADS 动态子群选择方法，将目标需求、节点能力和动态预算结合起来。",
            "实验表明 RADS 明显优于随机派遣，并能以显著更低资源投入接近全量派遣效果。",
          ], "tight"))}
          ${panel("不足之处", bullets([
            "当前仍属于论文级仿真平台，飞行动力学和真实通信模型还有简化。",
            "RADS 权重主要依据经验设计，后续可通过更多实验或优化方法自动调参。",
            "实验以平台仿真数据为主，尚未接入真实无人机或真实通信链路。",
            "高并发大规模场景下的运行效率还可以进一步优化。",
          ], "tight") + `
            <div class="limitation-actions">
              <div><b>模型</b><span>提高飞行与通信保真度</span></div>
              <div><b>算法</b><span>权重自动寻优与消融实验</span></div>
              <div><b>验证</b><span>批量实验与真实平台对接</span></div>
            </div>
          `)}
        </section>
        <section>
          ${panel("未来工作", table(["方向", "可改进内容"], [
            ["批量实验", "增加自动化参数扫描与统计显著性分析"],
            ["算法优化", "引入学习型权重、拍卖机制或多目标优化"],
            ["高保真仿真", "加入更真实的飞行约束、传感器模型和通信传播模型"],
            ["工程对接", "探索与 ROS/PX4 或真实无人机实验平台连接"],
          ], "compact") + `<div class="future-note"><b>后续落点：</b>从“可运行验证平台”继续走向“可批量评估、可参数优化、可真实接入”的研究工具。</div>`)}
        </section>
      </div>
    `),
    notes: [
      "最后总结本文工作：我完成了复杂场景建模、RADS 算法设计、Web 平台实现和多组实验验证。",
      "实验结果表明，RADS 相比随机派遣有明显优势，相比全量派遣能够用更低能耗和更少派机数量获得接近的感知效果。",
      "不足之处是当前仍属于论文级仿真，权重也主要依据经验设计。后续可以继续加入批量实验、参数优化、高保真飞行动力学和 ROS/PX4 对接。",
      "如果老师追问不足，要主动承认仿真简化和权重经验性，但同时说明这些不影响本文作为平台型毕设对算法闭环和实验对比的验证价值。",
    ],
  },
  {
    title: "致谢",
    html: slideShell(23, "致谢", "感谢各位老师的聆听与指导。", `
      <div class="thanks-full" data-fit>
        <img src="${ASSETS.logo}" />
        <h2>谢谢各位老师</h2>
        <p>请批评指正</p>
        <span>志存高远 · 责任为先</span>
      </div>
    `, "thanks-page"),
    notes: [
      "我的汇报到此结束，感谢各位老师的聆听，请各位老师批评指正。",
    ],
  },
];

slides[6] = {
  title: "任务级分析",
  html: slideShell(7, "任务级分析：把总体指标追溯到单目标成败原因", "平台不仅给出总体成功率，还能继续追溯到每个目标、每架无人机和每一种失败原因。", `
    <div class="task-analysis-layout">
      <section class="task-shot" data-fit>
        <figure class="task-annotated">
          <img src="${ASSETS.taskAnalysis}" />
          <i class="tag a1">当前帧简报</i>
          <i class="tag a2">目标追踪解析</i>
          <i class="tag a3">派机热点</i>
        </figure>
      </section>
      <section class="task-explain" data-fit>
        <h3>任务分析区运行结果清单</h3>
        <div class="task-steps">
          <div><b>01 当前帧简报</b><span>执行无人机 7 架，故障节点 3 个；已观测目标 4/6，已确认目标 4/6，严格成功目标 4/6。</span></div>
          <div><b>02 目标追踪解析</b><span>系统建议关注 T5；RADS 选 A23、A15 两架，误差 2.05m 并严格成功；随机派遣未形成有效观测；全量派遣误差 8.22m。</span></div>
          <div><b>03 当前派机热点</b><span>T5 分配 2 架，T1、T3、T4 各分配 1 架，说明资源会向高优先级和高不确定目标集中。</span></div>
          <div><b>04 任务级精度表</b><span>T2、T4、T5 是当前表中的样例目标：RADS 在这些目标上误差更小；全量派遣整体精度通常更稳，但资源投入更高。</span></div>
          <div><b>05 多任务明细导出</b><span>保留优先级、不确定半径、派机规模、状态、误差和最佳方法，便于 CSV 导出与论文结果复核。</span></div>
        </div>
      </section>
    </div>
    <div class="task-bottom" data-fit>
      <div class="task-table-mini">
        <h3>任务级精度对照</h3>
        <table>
          <tr><th>目标</th><th>RADS 误差</th><th>随机误差</th><th>全量误差</th><th>当前样例较优</th></tr>
          <tr><td>T2</td><td>2.95 m</td><td>12.29 m</td><td>--</td><td>RADS</td></tr>
          <tr><td>T4</td><td>13.31 m</td><td>13.71 m</td><td>--</td><td>RADS</td></tr>
          <tr><td>T5</td><td>2.05 m</td><td>--</td><td>8.22 m</td><td>RADS</td></tr>
        </table>
      </div>
      <div class="task-conclusion">
        <b>页面结论</b>
        <span>任务级分析不是重复总体成功率，而是回答“每个目标为何成败”：是否被确认、由哪些无人机观测、定位误差多少、资源为何投向该目标。</span>
      </div>
    </div>
  `, "task-analysis-page"),
  notes: [
    "这一页专门解释运行界面中的任务分析区域。首先看当前帧简报，当前执行无人机为 7 架，故障节点为 3 个，已观测、已确认和严格成功目标均为 4/6。",
    "然后看目标追踪解析。以 T5 为例，平台建议优先关注该目标；RADS 选择 A23、A15 两架无人机，定位误差约 2.05 米，形成严格成功；随机派遣没有形成有效观测，全量派遣虽然可用但资源投入更大。",
    "派机热点说明当前资源的投向，T5 获得 2 架无人机，T1、T3、T4 各获得 1 架，体现了 RADS 会把资源集中到更需要感知补偿的目标上。",
    "底部任务表用于复核单目标误差。这里的 T2、T4、T5 是当前截图中的样例目标，RADS 在这些目标上误差更小；但这不等于 RADS 的全局精度一定最高。全量派遣通常因为投入更多无人机，整体精度会更稳甚至更高，代价是能耗和派机数量明显增加。",
  ],
};

slides.splice(17, 0, {
  title: "运行结果解读",
  html: slideShell(18, "运行结果解读：从截图逐区说明平台输出", "运行界面不是静态展示图，而是把参数、过程、指标、任务解释和数据导出组织成可复核实验闭环。", `
    <div class="runtime-layout">
      <section class="runtime-shot" data-fit>
        <figure class="runtime-annotated">
          <img src="${ASSETS.platform}" />
          <i class="tag r1">策略指标卡</i>
          <i class="tag r3">三维沙盘</i>
          <i class="tag r4">收益曲线</i>
          <i class="tag r5">基线观察窗</i>
        </figure>
      </section>
      <section class="runtime-explain" data-fit>
        <h3>截图区域逐项解释</h3>
        <div class="runtime-metrics">
          <div><b>70.8%</b><span>RADS 当前严格成功率</span></div>
          <div><b>40/40</b><span>仿真已完成帧数</span></div>
          <div><b>1120.4</b><span>RADS 累计能耗</span></div>
          <div><b>9.4</b><span>平均派机数量</span></div>
        </div>
        <ul>
          <li>顶部指标卡概括 RADS 当前运行效果，包括严格成功率、累计能耗和平均派机数量。</li>
          <li>顶部指标卡同步比较 RADS、随机、全量三种策略的成功率、误差、能耗和派机数。</li>
          <li>中部三维沙盘展示无人机、目标、障碍、航迹、链路和感知范围。</li>
          <li>右侧曲线观察策略收益随步数变化，右下基线观察窗用于对照不同策略的态势表现。</li>
        </ul>
      </section>
    </div>
    <div class="runtime-bottom">
      <div data-fit><b>过程可观察</b><span>三维沙盘与收益曲线同步展示，便于答辩时说明算法运行过程。</span></div>
      <div data-fit><b>结果可比较</b><span>同一截图中并列三策略结果，能直接回答 RADS 相比随机与全量的差异。</span></div>
      <div data-fit><b>数据可复核</b><span>任务表和 CSV 导出保留单目标误差、派机成员与失败原因，支撑论文图表。</span></div>
    </div>
  `, "runtime-page"),
  notes: [
    "这一页基于平台运行界面解释各区域含义。顶部指标卡概括当前仿真完成后的总体表现，包括严格成功率、累计能耗和平均派机数量。",
    "顶部策略指标卡用于横向比较三种策略。当前截图与上一页保持一致，RADS 严格成功率为 70.8%，累计能耗为 1120.4，平均派机数量为 9.4；随机派遣成功率较低，全量派遣成功率接近但能耗和派机数量明显更高。",
    "中部三维沙盘展示无人机、目标、障碍、航迹、链路和感知范围，便于说明算法不是只输出数字，而是在动态场景中完成协同态势感知。",
    "右侧收益曲线展示策略随仿真步的表现变化，右下基线观察窗用于对比随机派遣和全量派遣的态势效果；任务级明细和 CSV 导出在后续区域支撑单目标复核。",
  ],
});

slides.forEach((slide, index) => {
  slide.html = slide.html.replace(
    /<div class="page-no">\d{2}<\/div>/,
    `<div class="page-no">${String(index + 1).padStart(2, "0")}</div>`
  );
});

function fullHtml(slideHtml) {
  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 1920px; height: 1080px; background: #f0f2f5; }
      body { font-family: "Microsoft YaHei", "Noto Sans CJK SC", "SimHei", Arial, sans-serif; color: ${C.ink}; }
      .slide {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background:
          linear-gradient(135deg, rgba(8,43,95,.035) 0 1px, transparent 1px 32px),
          linear-gradient(32deg, transparent 0 75%, rgba(189,143,53,.085) 75.1% 76.3%, transparent 76.4%),
          radial-gradient(circle at 92% 88%, rgba(179,58,50,.075), transparent 22%),
          radial-gradient(circle at 8% 18%, rgba(8,43,95,.058), transparent 24%),
          linear-gradient(115deg, transparent 0 61%, rgba(8,43,95,.04) 61% 61.7%, transparent 61.7%),
          linear-gradient(180deg, rgba(245,247,251,0.96), rgba(255,255,255,0.985) 18%),
          #fff;
        padding: 54px 80px 54px 80px;
      }
      .slide::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 16px;
        background: linear-gradient(90deg, ${C.navy} 0 73%, ${C.red} 73% 81%, ${C.navy} 81%);
        z-index: 3;
      }
      .slide::after {
        content: "JXUST";
        position: absolute;
        right: 86px;
        bottom: 66px;
        color: rgba(8, 43, 95, 0.055);
        font-size: 128px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 8px;
        z-index: 0;
        pointer-events: none;
      }
      .jxust-bg {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        pointer-events: none;
      }
      .jxust-bg-logo {
        position: absolute;
        right: 104px;
        bottom: 92px;
        width: 620px;
        height: 118px;
        object-fit: contain;
        object-position: right center;
        opacity: .12;
        filter: saturate(.92) contrast(1.03);
      }
      .jxust-bg-name {
        position: absolute;
        left: 86px;
        bottom: 92px;
        color: rgba(179,58,50,.092);
        font-size: 70px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 10px;
        white-space: nowrap;
      }
      .jxust-bg-motto {
        position: absolute;
        right: 24px;
        top: 190px;
        width: 34px;
        height: 650px;
        color: rgba(8,43,95,.16);
        font-size: 25px;
        line-height: 1.22;
        font-weight: 900;
        letter-spacing: 5px;
        text-align: center;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
      .jxust-bg-campus {
        position: absolute;
        left: 80px;
        right: 80px;
        bottom: 52px;
        height: 142px;
        opacity: .54;
        border-bottom: 2px solid rgba(8,43,95,.18);
      }
      .jxust-bg-campus::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 32px;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(8,43,95,.20), transparent);
      }
      .jxust-bg-campus::after {
        content: "";
        position: absolute;
        right: 146px;
        bottom: 0;
        width: 52px;
        height: 124px;
        border: 2px solid rgba(8,43,95,.22);
        border-bottom: none;
        background:
          repeating-linear-gradient(90deg, transparent 0 12px, rgba(8,43,95,.08) 12px 15px),
          linear-gradient(180deg, rgba(8,43,95,.035), rgba(8,43,95,.01));
      }
      .jxust-bg-campus span {
        position: absolute;
        bottom: 0;
        border: 2px solid rgba(8,43,95,.18);
        border-bottom: none;
        background:
          repeating-linear-gradient(180deg, transparent 0 17px, rgba(8,43,95,.055) 17px 20px),
          linear-gradient(180deg, rgba(8,43,95,.035), rgba(8,43,95,.006));
      }
      .jxust-bg-campus span:nth-child(1) { left: 12px; width: 110px; height: 62px; }
      .jxust-bg-campus span:nth-child(2) { left: 148px; width: 82px; height: 96px; }
      .jxust-bg-campus span:nth-child(3) { left: 256px; width: 136px; height: 74px; }
      .jxust-bg-campus span:nth-child(4) { right: 310px; width: 118px; height: 84px; }
      .jxust-bg-campus span:nth-child(5) { right: 42px; width: 120px; height: 58px; }
      .jxust-bg-campus span:nth-child(6) {
        left: 50%;
        width: 164px;
        height: 70px;
        transform: translateX(-50%);
        border-color: rgba(179,58,50,.18);
      }
      .topbar {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 82px 1fr 330px;
        gap: 24px;
        align-items: start;
        height: 96px;
        border-bottom: 2px solid ${C.navy};
        padding-bottom: 16px;
      }
      .topbar::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -3px;
        width: 118px;
        height: 4px;
        background: ${C.red};
      }
      .page-no {
        color: ${C.navy};
        font-weight: 800;
        font-size: 40px;
        line-height: 1;
        letter-spacing: 0;
      }
      .title-wrap h1 {
        margin: 0;
        color: ${C.navy};
        font-size: 34px;
        line-height: 1.22;
        font-weight: 800;
        letter-spacing: 0;
      }
      .title-wrap p {
        margin: 9px 0 0;
        color: ${C.gray};
        font-size: 24px;
        line-height: 1.3;
        letter-spacing: 0;
      }
      .school-logo {
        width: 330px;
        height: 64px;
        object-fit: contain;
        object-position: right top;
      }
      .body {
        position: absolute;
        z-index: 2;
        left: 80px;
        right: 80px;
        top: 168px;
        bottom: 54px;
      }
      .footer {
        position: absolute;
        z-index: 2;
        left: 80px;
        right: 80px;
        bottom: 22px;
        color: #6e7a88;
        font-size: 16px;
        line-height: 1;
      }
      .panel, .mini-panel, .chart-card, .image-box, .metric, .problem-core, .compare-box, .question-box,
      .req-item, .agenda-row, .agenda-side, .thesis-map, .rads-key, .rads-theory-strip, .demand-flow,
      .subgroup-diagram, .result-note, .thanks, .thanks-full {
        background: rgba(255,255,255,0.96);
        border: 2px solid ${C.line};
        border-radius: 8px;
        box-shadow: 0 10px 24px rgba(8,43,95,.055);
      }
      .panel {
        padding: 22px 24px;
      }
      .panel h3, .mini-panel h3 {
        margin: 0 0 14px;
        color: ${C.navy};
        font-size: 30px;
        line-height: 1.22;
        font-weight: 800;
      }
      .panel h3::after, .mini-panel h3::after {
        content: "";
        display: block;
        width: 58px;
        height: 4px;
        background: ${C.red};
        margin-top: 10px;
      }
      .mini-panel {
        padding: 20px 22px;
        border-left: 10px solid ${C.navy};
      }
      .mini-panel.red { border-left-color: ${C.red}; }
      .mini-panel.blue { border-left-color: ${C.navy}; }
      .bullets {
        margin: 0;
        padding-left: 28px;
      }
      .bullets li {
        margin: 8px 0;
        font-size: 26px;
        line-height: 1.42;
        color: ${C.ink};
      }
      .bullets.tight li { font-size: 25px; line-height: 1.36; margin: 6px 0; }
      .bullets li::marker { color: ${C.red}; font-size: 0.8em; }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 24px;
        line-height: 1.34;
      }
      .data-table th {
        background: ${C.navy};
        color: white;
        padding: 12px 14px;
        font-size: 23px;
        text-align: left;
        font-weight: 800;
        border: 1px solid ${C.navy};
      }
      .data-table td {
        padding: 11px 14px;
        border: 1px solid ${C.line};
        vertical-align: top;
        color: ${C.ink};
        overflow-wrap: anywhere;
      }
      .data-table tr:nth-child(even) td { background: ${C.pale}; }
      .data-table.compact { font-size: 23px; }
      .data-table.compact th { font-size: 22px; padding: 10px 12px; }
      .data-table.compact td { padding: 10px 12px; }
      .data-table.small-text { font-size: 22px; }
      .data-table.overall th, .data-table.overall td { text-align: center; font-size: 25px; padding: 14px 12px; }
      .metric {
        min-height: 116px;
        padding: 18px 18px 14px;
        text-align: center;
        border-top: 6px solid ${C.navy};
      }
      .metric.red { border-top-color: ${C.red}; }
      .metric-value {
        color: ${C.navy};
        font-size: 42px;
        line-height: 1;
        font-weight: 900;
      }
      .metric.red .metric-value { color: ${C.red}; }
      .metric-label {
        margin-top: 10px;
        font-size: 24px;
        font-weight: 800;
        color: ${C.ink};
      }
      .metric-caption {
        margin-top: 8px;
        font-size: 21px;
        color: ${C.gray};
      }
      .formula {
        border: 2px solid ${C.line};
        border-left: 10px solid ${C.red};
        background: ${C.pale};
        border-radius: 8px;
        padding: 20px 24px;
        margin-bottom: 18px;
      }
      .formula > div {
        color: ${C.navy};
        font-size: 31px;
        line-height: 1.34;
        font-weight: 800;
      }
      .formula p {
        margin: 10px 0 0;
        color: ${C.gray};
        font-size: 22px;
        line-height: 1.38;
      }
      .process {
        display: flex;
        align-items: stretch;
        gap: 10px;
      }
      .process-step {
        flex: 1;
        min-height: 118px;
        padding: 18px 16px;
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: white;
        text-align: center;
      }
      .process-step b {
        display: block;
        color: ${C.red};
        font-size: 26px;
        line-height: 1;
        margin-bottom: 13px;
      }
      .process-step span {
        display: block;
        color: ${C.navy};
        font-size: 26px;
        line-height: 1.26;
        font-weight: 800;
      }
      .arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${C.navy};
        font-size: 30px;
        font-weight: 800;
      }
      .image-box {
        margin: 0;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .image-box img {
        max-width: 100%;
        max-height: calc(100% - 42px);
        object-fit: contain;
      }
      .image-box figcaption {
        color: ${C.gray};
        font-size: 21px;
        line-height: 1.25;
        text-align: center;
      }
      .chart-card {
        padding: 12px;
        background: white;
      }
      .chart-svg {
        width: 100%;
        height: 100%;
        display: block;
        font-family: "Microsoft YaHei", "Noto Sans CJK SC", "SimHei", Arial, sans-serif;
      }
      .chart-title { fill: ${C.navy}; font-weight: 800; font-size: 30px; }
      .grid-line { stroke: ${C.line2}; stroke-width: 2; }
      .axis-line { stroke: #a9b8ca; stroke-width: 2.5; }
      .axis-label { fill: ${C.gray}; font-size: 22px; }
      .value-label { fill: ${C.ink}; font-size: 22px; font-weight: 800; }
      .value-label-bg { fill: none; stroke: white; stroke-width: 8; stroke-linejoin: round; font-size: 22px; font-weight: 800; }
      .legend-label { fill: ${C.ink}; font-size: 22px; }
      .note-label { fill: ${C.gray}; font-size: 20px; }

      .cover {
        padding: 0;
        background:
          linear-gradient(145deg, rgba(8,43,95,.055) 0 18%, transparent 18.2% 100%),
          linear-gradient(330deg, rgba(8,43,95,.96) 0 5.8%, transparent 6% 100%),
          linear-gradient(142deg, transparent 0 85%, rgba(8,43,95,.96) 85.2% 100%),
          #ffffff;
      }
      .cover::before {
        height: 12px;
        background: linear-gradient(90deg, ${C.navy} 0 68%, ${C.red} 68% 76%, ${C.gold} 76% 100%);
      }
      .cover::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 84% 80%, rgba(189,143,53,.12), transparent 24%),
          repeating-linear-gradient(132deg, rgba(8,43,95,.04) 0 1px, transparent 1px 32px);
        z-index: 0;
      }
      .cover-logo {
        position: absolute;
        left: 84px;
        top: 48px;
        width: 430px;
        height: 84px;
        object-fit: contain;
        object-position: left center;
        z-index: 2;
      }
      .cover-school-stamp {
        position: absolute;
        right: 92px;
        top: 56px;
        padding: 12px 24px 13px;
        border-top: 3px solid ${C.red};
        border-bottom: 3px solid ${C.navy};
        color: ${C.navy};
        font-size: 24px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 4px;
        z-index: 2;
        background: rgba(255,255,255,.72);
      }
      .cover-watermark {
        position: absolute;
        left: 122px;
        bottom: 168px;
        color: rgba(8, 43, 95, 0.055);
        font-size: 178px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 12px;
        z-index: 1;
      }
      .cover-cn-watermark {
        position: absolute;
        right: 118px;
        bottom: 258px;
        color: rgba(179,58,50,.075);
        font-size: 72px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 12px;
        z-index: 1;
        writing-mode: vertical-rl;
      }
      .cover-lineart {
        position: absolute;
        right: 150px;
        bottom: 118px;
        width: 620px;
        height: 142px;
        z-index: 1;
        opacity: .28;
        border-bottom: 2px solid ${C.line};
      }
      .cover-lineart span {
        position: absolute;
        bottom: 0;
        width: 72px;
        border: 2px solid ${C.line};
        border-bottom: none;
        background: linear-gradient(180deg, rgba(8,43,95,.04), rgba(8,43,95,.01));
      }
      .cover-lineart span:nth-child(1) { left: 20px; height: 76px; }
      .cover-lineart span:nth-child(2) { left: 118px; height: 106px; }
      .cover-lineart span:nth-child(3) { left: 236px; height: 88px; }
      .cover-lineart span:nth-child(4) { left: 362px; height: 124px; }
      .cover-lineart span:nth-child(5) { left: 492px; height: 66px; }
      .cover-title-simple {
        position: absolute;
        left: 120px;
        right: 120px;
        top: 210px;
        text-align: center;
        z-index: 2;
      }
      .cover-title-simple .cover-kicker {
        color: ${C.red};
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 28px;
        letter-spacing: 1.5px;
      }
      .cover-title-simple h1 {
        margin: 0;
        color: ${C.navy};
        font-size: 66px;
        line-height: 1.16;
        font-weight: 900;
        letter-spacing: 0;
      }
      .cover-subtitle {
        margin: 26px auto 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 22px;
        color: ${C.gray};
        font-size: 25px;
        line-height: 1.1;
      }
      .cover-subtitle i {
        display: block;
        width: 180px;
        height: 3px;
        background: linear-gradient(90deg, transparent, ${C.gold});
      }
      .cover-subtitle i:last-child { background: linear-gradient(90deg, ${C.gold}, transparent); }
      .cover-meta-simple {
        position: absolute;
        left: 280px;
        right: 280px;
        top: 592px;
        height: 224px;
        z-index: 2;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px 28px;
        padding: 18px 24px;
        background: rgba(255,255,255,.9);
        border-top: 2px solid ${C.line};
        border-bottom: 2px solid ${C.line};
      }
      .cover-meta-simple div {
        border-left: 5px solid ${C.navy};
        padding: 8px 0 8px 18px;
        min-height: 78px;
      }
      .cover-meta-simple div:nth-child(2n) { border-left-color: ${C.red}; }
      .cover-meta-simple b {
        display: block;
        color: ${C.navy};
        font-size: 20px;
        line-height: 1;
        margin-bottom: 10px;
      }
      .cover-meta-simple span {
        color: ${C.ink};
        font-size: 25px;
        line-height: 1.25;
        font-weight: 800;
      }
      .cover-bottom-band {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 70px;
        z-index: 2;
        display: grid;
        place-items: center;
        background: linear-gradient(90deg, ${C.navy} 0 72%, ${C.red} 72% 82%, ${C.gold} 82% 100%);
        color: rgba(255,255,255,.88);
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 1px;
      }

      .toc .body { display: grid; grid-template-columns: 1.42fr 0.70fr; gap: 34px; }
      .agenda { display: grid; gap: 16px; }
      .agenda-row {
        min-height: 112px;
        display: grid;
        grid-template-columns: 90px 360px 1fr;
        align-items: center;
        gap: 22px;
        padding: 18px 26px;
        border-left: 8px solid transparent;
      }
      .agenda-row:nth-child(odd) { border-left-color: ${C.navy}; }
      .agenda-row:nth-child(even) { border-left-color: ${C.red}; }
      .agenda-row b {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        background: ${C.navy};
        color: white;
        font-size: 28px;
      }
      .agenda-row strong { color: ${C.navy}; font-size: 28px; }
      .agenda-row span { color: ${C.gray}; font-size: 24px; line-height: 1.36; }
      .agenda-side {
        padding: 40px 34px;
        border-top: 6px solid ${C.navy};
        background: linear-gradient(180deg, #fff, rgba(245,247,251,.94));
      }
      .agenda-side h3 { color: ${C.navy}; font-size: 34px; margin: 0 0 26px; }
      .agenda-side p { font-size: 25px; line-height: 1.58; margin: 0; color: ${C.ink}; }
      .side-equation {
        margin-top: 44px;
        padding: 26px;
        text-align: center;
        background: ${C.navy};
        color: white;
        font-size: 32px;
        font-weight: 800;
      }

      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
      .wide-left { grid-template-columns: 1.04fr 0.96fr; height: 626px; }
      .scenario-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .scenario-grid div {
        min-height: 168px;
        padding: 22px;
        background: ${C.pale};
        border-left: 8px solid ${C.red};
      }
      .scenario-grid b { display: block; color: ${C.navy}; font-size: 28px; margin-bottom: 14px; }
      .scenario-grid span { color: ${C.ink}; font-size: 24px; line-height: 1.45; }
      .bottom-strip {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 22px;
      }
      .bottom-strip .metric { min-height: 128px; }

      .problem-layout { display: grid; grid-template-columns: 0.94fr 0.78fr; grid-template-rows: 0.9fr 1fr; gap: 28px; height: 100%; }
      .problem-core { grid-row: 1 / span 2; padding: 30px 38px; border-left: 12px solid ${C.navy}; }
      .problem-core h2 { margin: 0 0 20px; color: ${C.navy}; font-size: 38px; }
      .problem-core p { margin: 0 0 22px; font-size: 30px; line-height: 1.48; }
      .problem-objectives {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .problem-objectives div {
        min-height: 104px;
        padding: 14px 16px;
        border: 1px solid ${C.line};
        border-top: 5px solid ${C.navy};
        background: ${C.pale};
      }
      .problem-objectives div:nth-child(even) { border-top-color: ${C.red}; }
      .problem-objectives b {
        display: block;
        color: ${C.navy};
        font-size: 25px;
        margin-bottom: 8px;
      }
      .problem-objectives span {
        display: block;
        color: ${C.ink};
        font-size: 23px;
        line-height: 1.32;
      }
      .problem-thesis {
        margin-top: 14px;
        padding: 14px 18px;
        border-left: 8px solid ${C.red};
        background: ${C.pale};
        color: ${C.ink};
        font-size: 23px;
        line-height: 1.28;
        font-weight: 700;
      }
      .compare-box, .question-box { padding: 24px; }
      .compare-box h3, .question-box h3 { margin: 0 0 18px; color: ${C.navy}; font-size: 29px; }
      .compare-row { display: grid; grid-template-columns: 130px 1fr; gap: 18px; padding: 13px 0; border-bottom: 1px solid ${C.line2}; }
      .compare-row b { color: ${C.red}; font-size: 24px; }
      .compare-row span { font-size: 24px; line-height: 1.36; }

      .route { margin-bottom: 30px; }
      .route-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
      .route-grid .mini-panel { min-height: 326px; }
      .roadmap {
        height: 190px;
        display: grid;
        grid-template-columns: 1fr 44px 1fr 44px 1fr 44px 1fr 44px 1fr;
        align-items: stretch;
        gap: 0;
        margin-bottom: 24px;
      }
      .road-node {
        position: relative;
        padding: 22px 20px;
        border: 2px solid ${C.line};
        border-top: 7px solid ${C.navy};
        background: linear-gradient(180deg, #ffffff, ${C.pale});
        border-radius: 8px;
      }
      .road-node.core { border-top-color: ${C.red}; box-shadow: inset 0 0 0 2px rgba(179,58,50,.08); }
      .road-node b { display: block; color: ${C.red}; font-size: 25px; line-height: 1; margin-bottom: 14px; }
      .road-node strong { display: block; color: ${C.navy}; font-size: 27px; line-height: 1.22; margin-bottom: 12px; }
      .road-node span { display: block; color: ${C.gray}; font-size: 21px; line-height: 1.28; }
      .road-arrow { display: grid; place-items: center; color: ${C.navy}; font-size: 34px; font-weight: 900; }
      .method-map {
        height: 442px;
        display: grid;
        grid-template-columns: 0.95fr 1.1fr 0.95fr;
        gap: 24px;
      }
      .map-block {
        padding: 24px 26px;
        border: 2px solid ${C.line};
        border-left: 10px solid ${C.navy};
        border-radius: 8px;
        background: white;
      }
      .map-block.core { border-left-color: ${C.red}; background: linear-gradient(180deg, #ffffff, #fbfcfe); }
      .map-block h3 { margin: 0 0 20px; color: ${C.navy}; font-size: 31px; line-height: 1.18; }
      .map-block .bullets.tight li { font-size: 28px; line-height: 1.36; margin: 10px 0; }
      .chapter-band {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 88px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        align-items: center;
      }
      .chapter-band span {
        height: 58px;
        display: grid;
        place-items: center;
        border: 2px solid ${C.line};
        border-bottom: 5px solid ${C.navy};
        background: ${C.pale};
        color: ${C.navy};
        font-size: 23px;
        font-weight: 800;
      }
      .thesis-map {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        min-height: 92px;
        padding: 24px 28px;
        display: flex;
        align-items: center;
        gap: 28px;
        background: ${C.pale};
      }
      .thesis-map b { color: ${C.navy}; font-size: 25px; }
      .thesis-map span { color: ${C.ink}; font-size: 24px; }

      .requirement-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
      }
      .req-item {
        min-height: 182px;
        padding: 24px 26px;
        border-left: 10px solid ${C.navy};
      }
      .req-item.red { border-left-color: ${C.red}; }
      .req-item b { display: block; color: ${C.navy}; font-size: 28px; margin-bottom: 16px; }
      .req-item span { display: block; color: ${C.ink}; font-size: 24px; line-height: 1.45; }
      .nonfunc { position: absolute; left: 0; right: 0; bottom: 0; }
      .req-v2 {
        display: grid;
        grid-template-columns: 0.78fr 1.22fr;
        gap: 28px;
        height: 676px;
      }
      .req-left {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      .req-chip {
        min-height: 206px;
        padding: 22px 20px;
        border: 2px solid ${C.line};
        border-left: 9px solid ${C.navy};
        border-radius: 8px;
        background: white;
      }
      .req-chip.red { border-left-color: ${C.red}; }
      .req-chip.blue { border-left-color: ${C.navy}; }
      .req-chip b { display: flex; align-items: center; gap: 12px; color: ${C.navy}; font-size: 26px; margin-bottom: 14px; }
      .req-chip b em {
        display: inline-grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: ${C.red};
        color: #fff;
        font-style: normal;
        font-size: 18px;
        font-family: Georgia, "Times New Roman", serif;
      }
      .req-chip span { display: block; color: ${C.ink}; font-size: 24px; line-height: 1.36; }
      .req-screen {
        padding: 18px 22px 20px;
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: #fff;
      }
      .req-screen h3 { margin: 0 0 13px; color: ${C.navy}; font-size: 29px; line-height: 1.2; }
      .screen-annotated {
        position: relative;
        margin: 0;
        height: 475px;
        border: 1px solid ${C.line};
        background: ${C.pale};
        overflow: hidden;
        display: flex;
        align-items: flex-start;
        justify-content: center;
      }
      .screen-annotated img { width: 100%; height: 100%; object-fit: cover; object-position: center top; filter: saturate(.96) contrast(1.03); }
      .screen-annotated .tag {
        position: absolute;
        padding: 8px 12px;
        background: rgba(8,43,95,.92);
        color: white;
        font-style: normal;
        font-weight: 800;
        font-size: 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(8,43,95,.22);
      }
      .screen-annotated .tag::after {
        content: "";
        position: absolute;
        left: 16px;
        bottom: -8px;
        border: 8px solid transparent;
        border-top-color: rgba(8,43,95,.92);
        border-bottom: 0;
      }
      .screen-annotated .t1 { left: 38px; top: 102px; }
      .screen-annotated .t2 { left: 112px; top: 230px; background: rgba(179,58,50,.92); }
      .screen-annotated .t2::after { border-top-color: rgba(179,58,50,.92); }
      .screen-annotated .t3 { left: 365px; top: 278px; }
      .screen-annotated .t4 { right: 104px; top: 270px; background: rgba(179,58,50,.92); }
      .screen-annotated .t4::after { border-top-color: rgba(179,58,50,.92); }
      .screen-annotated .t5 { left: 382px; top: 54px; }
      .screen-annotated .t6 { left: 710px; bottom: 64px; background: rgba(179,58,50,.92); }
      .screen-annotated .t6::after { border-top-color: rgba(179,58,50,.92); }
      .screen-tags {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      }
      .screen-tags span {
        padding: 7px 8px;
        background: ${C.pale};
        border: 1px solid ${C.line};
        color: ${C.navy};
        font-size: 20px;
        line-height: 1.1;
        font-weight: 800;
        text-align: center;
      }
      .screen-tags span:nth-child(even) { color: ${C.red}; }
      .screen-caption { margin-top: 10px; color: ${C.gray}; font-size: 21px; line-height: 1.28; }
      .nonfunc-v2 {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .nonfunc-v2 div {
        min-height: 132px;
        padding: 22px 24px;
        border: 2px solid ${C.line};
        border-top: 6px solid ${C.navy};
        border-radius: 8px;
        background: ${C.pale};
      }
      .nonfunc-v2 div:nth-child(2) { border-top-color: ${C.red}; }
      .nonfunc-v2 b { display: block; color: ${C.navy}; font-size: 26px; margin-bottom: 10px; }
      .nonfunc-v2 span { display: block; color: ${C.ink}; font-size: 24px; line-height: 1.32; }

      .runtime-page .body {
        display: grid;
        grid-template-rows: 1fr 142px;
        gap: 20px;
      }
      .runtime-layout {
        display: grid;
        grid-template-columns: 1.36fr 0.86fr;
        gap: 24px;
        min-height: 0;
      }
      .runtime-shot, .runtime-explain, .runtime-bottom > div {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: rgba(255,255,255,.965);
        box-shadow: 0 12px 26px rgba(91,23,23,.055);
      }
      .runtime-shot { padding: 16px; min-height: 0; overflow: hidden; }
      .runtime-annotated {
        position: relative;
        height: 100%;
        margin: 0;
        overflow: hidden;
        border-radius: 6px;
        border: 1px solid ${C.line};
        background: ${C.pale};
      }
      .runtime-annotated img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center center;
        filter: saturate(.97) contrast(1.03);
      }
      .runtime-annotated .tag {
        position: absolute;
        padding: 8px 12px;
        border-radius: 4px;
        background: rgba(91,23,23,.93);
        color: #fff;
        font-size: 20px;
        font-weight: 900;
        font-style: normal;
        box-shadow: 0 5px 14px rgba(91,23,23,.25);
      }
      .runtime-annotated .tag::after {
        content: "";
        position: absolute;
        left: 18px;
        bottom: -8px;
        border: 8px solid transparent;
        border-top-color: rgba(91,23,23,.93);
        border-bottom: 0;
      }
      .runtime-annotated .r1 { right: 30px; top: 24px; }
      .runtime-annotated .r2 { left: 54px; top: 72px; background: rgba(36,79,134,.94); }
      .runtime-annotated .r2::after { border-top-color: rgba(36,79,134,.94); }
      .runtime-annotated .r3 { left: 350px; top: 310px; }
      .runtime-annotated .r4 { right: 70px; top: 326px; background: rgba(36,79,134,.94); }
      .runtime-annotated .r4::after { border-top-color: rgba(36,79,134,.94); }
      .runtime-annotated .r5 { left: 560px; bottom: 94px; }
      .runtime-explain {
        padding: 24px 28px;
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        gap: 14px;
      }
      .runtime-explain h3 {
        margin: 0;
        color: ${C.navy};
        font-size: 30px;
        line-height: 1.2;
      }
      .runtime-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .runtime-metrics div {
        padding: 15px 14px;
        border: 1px solid ${C.line};
        background: ${C.pale};
        min-height: 92px;
      }
      .runtime-metrics b {
        display: block;
        color: ${C.red};
        font-size: 34px;
        line-height: 1.05;
        font-family: Georgia, "Times New Roman", serif;
      }
      .runtime-metrics span { display: block; margin-top: 7px; color: ${C.ink}; font-size: 20px; line-height: 1.2; font-weight: 700; }
      .runtime-explain ul { margin: 0; padding-left: 24px; color: ${C.ink}; font-size: 23px; line-height: 1.38; }
      .runtime-explain li { margin: 0 0 8px; }
      .runtime-bottom {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }
      .runtime-bottom > div {
        padding: 18px 22px;
        border-top: 6px solid ${C.red};
      }
      .runtime-bottom > div:nth-child(2) { border-top-color: ${C.navy}; }
      .runtime-bottom b { display: block; color: ${C.navy}; font-size: 25px; margin-bottom: 8px; }
      .runtime-bottom span { display: block; color: ${C.ink}; font-size: 22px; line-height: 1.28; }

      .task-analysis-page .body {
        display: grid;
        grid-template-rows: 1fr 194px;
        gap: 16px;
      }
      .task-analysis-layout {
        display: grid;
        grid-template-columns: 1.16fr 1fr;
        gap: 24px;
        min-height: 0;
      }
      .task-shot, .task-explain, .task-bottom > div {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: rgba(255,255,255,.965);
        box-shadow: 0 12px 26px rgba(91,23,23,.055);
      }
      .task-shot { padding: 16px; min-height: 0; overflow: hidden; }
      .task-annotated {
        position: relative;
        height: 100%;
        margin: 0;
        overflow: hidden;
        border-radius: 6px;
        border: 1px solid ${C.line};
        background: ${C.pale};
      }
      .task-annotated img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        filter: saturate(.97) contrast(1.03);
      }
      .task-annotated .tag {
        position: absolute;
        padding: 8px 12px;
        border-radius: 4px;
        background: rgba(91,23,23,.94);
        color: #fff;
        font-size: 20px;
        font-weight: 900;
        font-style: normal;
        box-shadow: 0 5px 14px rgba(91,23,23,.25);
      }
      .task-annotated .tag::after {
        content: "";
        position: absolute;
        left: 18px;
        bottom: -8px;
        border: 8px solid transparent;
        border-top-color: rgba(91,23,23,.94);
        border-bottom: 0;
      }
      .task-annotated .a1 { left: 40px; top: 48px; background: rgba(36,79,134,.94); }
      .task-annotated .a1::after { border-top-color: rgba(36,79,134,.94); }
      .task-annotated .a2 { left: 70px; top: 262px; }
      .task-annotated .a3 { right: 48px; bottom: 180px; background: rgba(36,79,134,.94); }
      .task-annotated .a3::after { border-top-color: rgba(36,79,134,.94); }
      .task-explain {
        padding: 22px 26px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 14px;
      }
      .task-explain h3 {
        margin: 0;
        color: ${C.navy};
        font-size: 30px;
        line-height: 1.15;
      }
      .task-steps {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .task-steps div {
        padding: 12px 14px;
        border-left: 7px solid ${C.red};
        background: ${C.pale};
        border-top: 1px solid ${C.line};
        border-right: 1px solid ${C.line};
        border-bottom: 1px solid ${C.line};
      }
      .task-steps div:nth-child(even) { border-left-color: ${C.navy}; }
      .task-steps b {
        display: block;
        color: ${C.navy};
        font-size: 22px;
        line-height: 1.15;
        margin-bottom: 5px;
      }
      .task-steps span {
        display: block;
        color: ${C.ink};
        font-size: 19px;
        line-height: 1.25;
      }
      .task-example {
        padding: 14px 16px;
        background: rgba(91,23,23,.06);
        border: 1px solid ${C.line};
      }
      .task-example b { display: block; color: ${C.red}; font-size: 23px; margin-bottom: 6px; }
      .task-example span { display: block; color: ${C.ink}; font-size: 20px; line-height: 1.28; }
      .task-bottom {
        display: grid;
        grid-template-columns: 1.32fr .88fr;
        gap: 18px;
      }
      .task-table-mini { padding: 10px 16px; }
      .task-table-mini h3 {
        margin: 0 0 6px;
        color: ${C.navy};
        font-size: 23px;
      }
      .task-table-mini table {
        width: 100%;
        border-collapse: collapse;
        font-size: 16px;
        color: ${C.ink};
      }
      .task-table-mini th {
        background: ${C.navy};
        color: white;
        padding: 5px 8px;
        text-align: left;
      }
      .task-table-mini td {
        padding: 5px 8px;
        border-bottom: 1px solid ${C.line};
      }
      .task-conclusion {
        padding: 16px 20px;
        border-top: 6px solid ${C.red};
      }
      .task-conclusion b {
        display: block;
        color: ${C.navy};
        font-size: 24px;
        margin-bottom: 7px;
      }
      .task-conclusion span {
        display: block;
        color: ${C.ink};
        font-size: 20px;
        line-height: 1.25;
      }

      .arch-layout { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 28px; height: 100%; }
      .arch-img img { max-height: 690px; }
      .arch-right { display: grid; grid-template-rows: auto 1fr; gap: 22px; }
      .arch-v2 {
        display: grid;
        grid-template-columns: 1.02fr 0.98fr;
        gap: 28px;
        height: 690px;
      }
      .arch-figure .image-box { padding: 18px; }
      .arch-figure .arch-img img { max-height: 590px; }
      .arch-diagram {
        height: 100%;
        padding: 26px 30px;
        border: 2px solid ${C.line};
        border-radius: 8px;
        background:
          linear-gradient(180deg, rgba(248,250,253,.92), rgba(255,255,255,.98)),
          repeating-linear-gradient(90deg, rgba(203,215,230,.18) 0 1px, transparent 1px 54px);
      }
      .arch-diagram h3 {
        margin: 0 0 28px;
        color: ${C.navy};
        font-size: 31px;
        line-height: 1.2;
      }
      .arch-main {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 130px 1fr;
        gap: 18px;
        align-items: center;
      }
      .system-block {
        min-height: 415px;
        padding: 22px;
        border: 3px solid ${C.line};
        border-top: 8px solid ${C.navy};
        border-radius: 10px;
        background: white;
        display: grid;
        grid-template-rows: auto repeat(4, 1fr) auto;
        gap: 12px;
      }
      .system-block.frontend { border-top-color: ${C.red}; }
      .system-block b {
        display: grid;
        place-items: center;
        height: 54px;
        background: ${C.navy};
        color: white;
        border-radius: 4px;
        font-size: 25px;
        line-height: 1;
      }
      .system-block.frontend b { background: ${C.red}; }
      .system-block span {
        display: grid;
        place-items: center;
        min-height: 54px;
        background: ${C.pale};
        color: ${C.ink};
        border: 1px solid ${C.line};
        border-radius: 4px;
        font-size: 25px;
        font-weight: 800;
      }
      .system-block em {
        display: block;
        color: ${C.gray};
        font-style: normal;
        font-size: 20px;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .api-bridge {
        height: 160px;
        display: grid;
        grid-template-rows: 1fr auto 1fr;
        align-items: center;
        justify-items: center;
        color: ${C.navy};
      }
      .api-bridge i {
        width: 92px;
        height: 3px;
        background: ${C.navy};
        position: relative;
      }
      .api-bridge i:first-child::before,
      .api-bridge i:last-child::after {
        content: "";
        position: absolute;
        top: -7px;
        border: 8px solid transparent;
      }
      .api-bridge i:first-child::before { left: -4px; border-right-color: ${C.navy}; }
      .api-bridge i:last-child::after { right: -4px; border-left-color: ${C.navy}; }
      .api-bridge strong {
        padding: 10px 12px;
        color: ${C.navy};
        font-size: 23px;
        line-height: 1.2;
        text-align: center;
      }
      .arch-base {
        margin-top: 28px;
        height: 58px;
        display: grid;
        place-items: center;
        background: ${C.navy};
        color: white;
        border-radius: 4px;
        font-size: 25px;
        font-weight: 800;
      }
      .arch-diagram p {
        margin: 18px 0 0;
        color: ${C.gray};
        font-size: 22px;
        line-height: 1.35;
        text-align: center;
      }
      .arch-stack { display: grid; grid-template-rows: repeat(3, 116px) 1fr; gap: 16px; }
      .layer {
        padding: 18px 22px;
        border-radius: 8px;
        border: 2px solid ${C.line};
        background: white;
        border-left: 10px solid ${C.navy};
      }
      .layer.service { border-left-color: ${C.red}; }
      .layer b { display: block; color: ${C.red}; font-size: 22px; line-height: 1; margin-bottom: 8px; }
      .layer strong { display: block; color: ${C.navy}; font-size: 27px; line-height: 1.18; margin-bottom: 8px; }
      .layer span { display: block; color: ${C.gray}; font-size: 21px; line-height: 1.22; overflow-wrap: anywhere; }
      .arch-value {
        padding: 20px 22px;
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: ${C.pale};
      }
      .arch-value h3 { margin: 0 0 12px; color: ${C.navy}; font-size: 27px; line-height: 1.2; }
      .data-loop {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        min-height: 122px;
        display: grid;
        grid-template-columns: 150px 1fr 34px 1fr 34px 1fr 34px 1fr 34px 1fr;
        gap: 10px;
        align-items: center;
        padding: 20px 24px;
        border: 2px solid ${C.line};
        border-left: 10px solid ${C.red};
        border-radius: 8px;
        background: white;
      }
      .data-loop b { color: ${C.navy}; font-size: 27px; }
      .data-loop span { display: grid; place-items: center; height: 56px; background: ${C.pale}; border: 1px solid ${C.line}; color: ${C.ink}; font-size: 24px; font-weight: 800; }
      .data-loop i { color: ${C.red}; font-size: 28px; font-weight: 900; font-style: normal; text-align: center; }

      .model-layout { display: grid; grid-template-columns: 0.98fr 1fr; gap: 28px; height: 620px; }
      .scenario-img img { max-height: 535px; }
      .model-right { display: grid; gap: 20px; }
      .model-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
      .bottom-strip.model { grid-template-columns: repeat(4, 1fr); }

      .constraint-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
      .constraint-grid .mini-panel { min-height: 280px; }
      .constraint-bottom {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 505px;
        display: grid;
        grid-template-columns: 0.88fr 1.12fr;
        gap: 26px;
      }
      .weather-img img { max-height: 400px; }

      .rads-overview { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 28px; height: 545px; }
      .vertical-process {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }
      .vertical-process .arrow { display: none; }
      .vertical-process .process-step {
        min-height: 86px;
        padding: 14px 16px;
        display: grid;
        grid-template-columns: 56px 1fr;
        align-items: center;
        text-align: left;
        border-left: 6px solid ${C.navy};
        background: linear-gradient(180deg, #fff, ${C.pale});
      }
      .vertical-process .process-step:nth-of-type(4n+1) { border-left-color: ${C.red}; }
      .vertical-process .process-step b { margin: 0; font-size: 24px; }
      .vertical-process .process-step span { font-size: 25px; }
      .rads-img img { max-height: 470px; }
      .rads-key {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 154px;
        padding: 14px 20px;
        border-left: 10px solid ${C.red};
        font-size: 23px;
        line-height: 1.24;
      }
      .rads-key b { color: ${C.navy}; }
      .rads-theory-strip {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 132px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
        overflow: hidden;
      }
      .rads-theory-strip div {
        padding: 14px 16px;
        border-left: 1px solid ${C.line};
      }
      .rads-theory-strip div:first-child { border-left: none; }
      .rads-theory-strip b {
        display: block;
        color: ${C.navy};
        font-size: 22px;
        margin-bottom: 7px;
      }
      .rads-theory-strip span {
        display: block;
        color: ${C.ink};
        font-size: 19px;
        line-height: 1.22;
      }

      .principle-layout { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 30px; }
      .demand-flow {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        min-height: 150px;
        display: grid;
        grid-template-columns: 1fr 70px 1fr 70px 1fr;
        align-items: center;
        gap: 0;
        padding: 22px 28px;
      }
      .demand-flow div { text-align: center; }
      .demand-flow div:nth-child(2), .demand-flow div:nth-child(4) { color: ${C.red}; font-size: 44px; font-weight: 900; }
      .demand-flow b { display: block; color: ${C.navy}; font-size: 29px; margin-bottom: 10px; }
      .demand-flow span { color: ${C.gray}; font-size: 24px; }
      .demand-principle {
        display: grid;
        grid-template-columns: 0.9fr 0.7fr 0.9fr;
        gap: 24px;
        height: 610px;
      }
      .demand-left, .demand-visual, .demand-table {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: white;
        padding: 22px 24px;
      }
      .demand-left { display: grid; grid-template-rows: auto 1fr auto; gap: 18px; border-left: 10px solid ${C.red}; }
      .demand-left .formula { margin: 0; padding: 18px 20px; }
      .demand-left .formula > div { font-size: 28px; }
      .demand-left .formula p { font-size: 22px; }
      .weight-stack { display: grid; gap: 13px; align-content: center; }
      .weight-stack div { position: relative; min-height: 76px; padding: 12px 14px; background: ${C.pale}; border: 1px solid ${C.line}; }
      .weight-stack b { color: ${C.red}; font-size: 27px; margin-right: 14px; }
      .weight-stack span { color: ${C.navy}; font-size: 24px; font-weight: 800; }
      .weight-stack i { display: block; height: 8px; margin-top: 12px; background: ${C.navy}; border-radius: 20px; }
      .demand-visual h3, .demand-table h3, .utility-matrix h3, .utility-right h3,
      .budget-center h3, .budget-right h3, .assign-visual h3, .subgroup-output h3 {
        margin: 0 0 18px;
        color: ${C.navy};
        font-size: 30px;
        line-height: 1.2;
      }
      .target-radar {
        position: relative;
        height: 330px;
        margin: 6px 0 20px;
        background: radial-gradient(circle at center, rgba(36,102,168,.07), transparent 62%);
      }
      .target-radar .ring {
        position: absolute;
        left: 50%;
        top: 50%;
        border: 2px dashed ${C.line};
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
      .target-radar .r1 { width: 110px; height: 110px; }
      .target-radar .r2 { width: 210px; height: 210px; }
      .target-radar .r3 { width: 300px; height: 300px; }
      .target-dot {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 86px;
        height: 86px;
        transform: translate(-50%, -50%);
        display: grid;
        place-items: center;
        background: ${C.red};
        color: white;
        border-radius: 50%;
        font-size: 30px;
        font-weight: 900;
      }
      .radar-label {
        position: absolute;
        padding: 8px 12px;
        background: ${C.navy};
        color: white;
        border-radius: 4px;
        font-size: 20px;
        font-weight: 800;
      }
      .radar-label.p { left: 22px; top: 44px; }
      .radar-label.q { right: 18px; top: 126px; background: ${C.red}; }
      .radar-label.m { left: 54px; bottom: 40px; }
      .demand-levels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .demand-levels div { min-height: 82px; padding: 12px; border: 1px solid ${C.line}; background: ${C.pale}; text-align: center; }
      .demand-levels div.active { border-top: 6px solid ${C.red}; background: white; }
      .demand-levels b { display: block; color: ${C.navy}; font-size: 22px; margin-bottom: 8px; }
      .demand-levels span { color: ${C.gray}; font-size: 19px; }
      .code-map { margin: 16px 0 0; color: ${C.gray}; font-size: 21px; line-height: 1.25; }
      .demand-flow.academic { min-height: 132px; }

      .utility-layout { display: grid; grid-template-columns: 0.88fr 1.12fr; gap: 30px; height: 100%; }
      .utility-formula { display: grid; grid-template-rows: auto 1fr; gap: 18px; }
      .utility-formula .formula > div { font-size: 29px; }
      .utility-principle {
        display: grid;
        grid-template-columns: 0.92fr 0.86fr 1.02fr;
        gap: 24px;
        height: 100%;
      }
      .utility-left, .utility-matrix, .utility-right {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: white;
        padding: 22px 24px;
      }
      .utility-left { border-left: 10px solid ${C.red}; }
      .utility-left .formula { margin: 0 0 20px; padding: 18px 20px; }
      .utility-left .formula > div { font-size: 27px; }
      .utility-left .formula p { font-size: 22px; }
      .utility-components { display: grid; grid-template-columns: 1fr 0.84fr; gap: 14px; }
      .utility-components div { min-height: 286px; padding: 16px; background: ${C.pale}; border: 1px solid ${C.line}; }
      .utility-components b { display: block; color: ${C.navy}; font-size: 24px; margin-bottom: 14px; }
      .utility-components span { display: block; margin: 10px 0; padding: 8px 10px; background: white; color: ${C.ink}; font-size: 22px; font-weight: 800; border-left: 5px solid ${C.navy}; }
      .utility-components .neg span { border-left-color: ${C.red}; }
      .matrix-grid {
        display: grid;
        grid-template-columns: 88px repeat(3, 1fr);
        gap: 8px;
      }
      .matrix-grid b, .matrix-grid span, .matrix-grid strong {
        min-height: 72px;
        display: grid;
        place-items: center;
        border: 1px solid ${C.line};
        background: ${C.pale};
        color: ${C.navy};
        font-size: 23px;
        font-weight: 800;
      }
      .matrix-grid span { color: ${C.ink}; background: white; }
      .matrix-grid .hot { background: ${C.red}; color: white; }
      .matrix-grid .warm { background: #f4dfdd; color: ${C.red}; }
      .matrix-note {
        margin-top: 18px;
        padding: 16px;
        border-left: 8px solid ${C.navy};
        background: ${C.pale};
        color: ${C.ink};
        font-size: 23px;
        line-height: 1.32;
      }

      .budget-layout { display: grid; grid-template-columns: 1fr 0.95fr; gap: 30px; height: 100%; }
      .budget-loop {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 26px;
      }
      .budget-loop div {
        min-height: 194px;
        padding: 26px;
        border: 2px solid ${C.line};
        border-top: 8px solid ${C.navy};
        background: white;
      }
      .budget-loop div:nth-child(2), .budget-loop div:nth-child(3) { border-top-color: ${C.red}; }
      .budget-loop b { display: block; color: ${C.navy}; font-size: 29px; margin-bottom: 18px; }
      .budget-loop span { color: ${C.ink}; font-size: 24px; line-height: 1.44; }
      .budget-principle {
        display: grid;
        grid-template-columns: 0.92fr 0.78fr 0.94fr;
        gap: 24px;
        height: 100%;
      }
      .budget-left, .budget-center, .budget-right {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: white;
        padding: 22px 24px;
      }
      .budget-left { border-left: 10px solid ${C.red}; }
      .budget-left .formula { margin: 0 0 18px; padding: 18px 20px; }
      .budget-left .formula > div { font-size: 29px; }
      .budget-left .formula p { font-size: 22px; }
      .budget-factors { display: grid; gap: 14px; }
      .budget-factors div { min-height: 112px; padding: 18px; border: 1px solid ${C.line}; background: ${C.pale}; }
      .budget-factors b { display: block; color: ${C.navy}; font-size: 24px; margin-bottom: 10px; }
      .budget-factors span { display: block; color: ${C.ink}; font-size: 22px; line-height: 1.3; }
      .budget-eq { margin-top: 18px; padding: 16px; background: ${C.navy}; color: white; font-size: 23px; line-height: 1.28; font-weight: 800; }
      .budget-svg { width: 100%; height: 340px; display: block; }
      .gauge-num { fill: ${C.navy}; font-size: 42px; font-weight: 900; }
      .gauge-label, .gauge-tick { fill: ${C.gray}; font-size: 24px; font-weight: 700; }
      .budget-caption { padding: 18px; background: ${C.pale}; border-left: 8px solid ${C.red}; color: ${C.ink}; font-size: 24px; line-height: 1.3; }

      .greedy-layout { display: grid; grid-template-columns: 0.98fr 1.02fr; gap: 30px; height: 100%; }
      .pseudo { padding: 26px 30px; border-left: 10px solid ${C.red}; }
      .pseudo h3 { margin: 0 0 20px; color: ${C.navy}; font-size: 31px; }
      .pseudo ol { margin: 0; padding-left: 34px; }
      .pseudo li { font-size: 25px; line-height: 1.52; margin: 12px 0; }
      .greedy-principle {
        display: grid;
        grid-template-columns: 0.86fr 1.16fr 0.9fr;
        gap: 24px;
        height: 100%;
      }
      .pseudo.dense, .assign-visual, .subgroup-output {
        border: 2px solid ${C.line};
        border-radius: 8px;
        background: white;
        padding: 22px 24px;
      }
      .pseudo.dense { border-left: 10px solid ${C.red}; }
      .pseudo.dense h3 { font-size: 29px; margin-bottom: 18px; }
      .pseudo.dense li { font-size: 24px; line-height: 1.36; margin: 10px 0; }
      .greedy-note-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .greedy-note-grid div {
        min-height: 78px;
        padding: 10px 12px;
        background: ${C.pale};
        border-left: 7px solid ${C.navy};
      }
      .greedy-note-grid div:nth-child(2) { border-left-color: ${C.red}; }
      .greedy-note-grid b {
        display: block;
        color: ${C.navy};
        font-size: 20px;
        margin-bottom: 6px;
      }
      .greedy-note-grid span {
        display: block;
        color: ${C.ink};
        font-size: 18px;
        line-height: 1.25;
      }
      .assign-grid {
        display: grid;
        grid-template-columns: 0.78fr 0.58fr 1.62fr 1fr;
        gap: 0;
        border: 1px solid ${C.line};
        margin-bottom: 18px;
      }
      .assign-grid b, .assign-grid span, .assign-grid strong {
        min-height: 80px;
        padding: 12px 14px;
        border: 1px solid ${C.line};
        display: flex;
        align-items: center;
        color: ${C.ink};
        font-size: 22px;
        line-height: 1.26;
      }
      .assign-grid b {
        min-height: 50px;
        background: ${C.navy};
        color: white;
        font-size: 22px;
        font-weight: 800;
      }
      .assign-grid strong {
        background: ${C.pale};
        color: ${C.navy};
        font-weight: 900;
      }
      .assign-grid strong.muted { color: ${C.red}; }
      .budget-state { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .budget-state div { min-height: 86px; padding: 12px; border: 1px solid ${C.line}; background: ${C.pale}; text-align: center; }
      .budget-state b { display: block; color: ${C.navy}; font-size: 22px; margin-bottom: 8px; }
      .budget-state span { color: ${C.red}; font-size: 24px; font-weight: 900; }
      .assign-explain {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .assign-explain div {
        min-height: 126px;
        padding: 14px;
        border: 1px solid ${C.line};
        background: ${C.pale};
      }
      .assign-explain div:nth-child(2) { border-top: 5px solid ${C.red}; }
      .assign-explain b {
        display: block;
        color: ${C.navy};
        font-size: 21px;
        margin-bottom: 8px;
      }
      .assign-explain span {
        color: ${C.ink};
        font-size: 19px;
        line-height: 1.26;
      }
      .subgroup-badges { display: grid; gap: 12px; margin-bottom: 18px; }
      .subgroup-badges div { min-height: 92px; padding: 16px; border: 1px solid ${C.line}; border-left: 8px solid ${C.navy}; background: ${C.pale}; }
      .subgroup-badges div:nth-child(2) { border-left-color: ${C.red}; }
      .subgroup-badges b { display: block; color: ${C.navy}; font-size: 24px; margin-bottom: 8px; }
      .subgroup-badges span { color: ${C.ink}; font-size: 22px; line-height: 1.28; }
      .subgroup-diagram {
        height: 390px;
        margin-bottom: 22px;
        padding: 24px;
        position: relative;
        overflow: hidden;
      }
      .diag-title { color: ${C.navy}; font-size: 30px; font-weight: 800; margin-bottom: 24px; }
      .target-node {
        display: inline-grid;
        place-items: center;
        width: 170px;
        height: 100px;
        margin-right: 30px;
        background: ${C.pale};
        border: 3px solid ${C.line};
        color: ${C.navy};
        font-size: 25px;
        font-weight: 800;
      }
      .target-node.high { border-color: ${C.red}; }
      .target-node span { color: ${C.gray}; font-size: 21px; }
      .uav-line { margin-top: 24px; display: flex; gap: 16px; }
      .uav-line b {
        min-width: 82px;
        padding: 12px 16px;
        background: ${C.navy};
        color: white;
        font-size: 24px;
        text-align: center;
      }
      .uav-line.muted b { background: ${C.red}; }
      .diag-caption { position: absolute; left: 24px; right: 24px; bottom: 20px; color: ${C.gray}; font-size: 24px; }

      .fusion-layout { display: grid; grid-template-columns: 0.98fr 1.02fr; gap: 30px; height: 100%; }
      .fusion-process { margin-bottom: 20px; }
      .fusion-process .process-step { min-height: 110px; }
      .fusion-layout .formula { padding: 16px 18px; margin-bottom: 16px; }
      .fusion-layout .formula > div { font-size: 26px; }
      .fusion-layout .formula p { font-size: 21px; }
      .fusion-img { height: 265px; margin-top: 20px; }
      .fusion-img img { max-height: 210px; }
      .fusion-criteria {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .fusion-criteria div {
        min-height: 148px;
        padding: 16px;
        border: 1px solid ${C.line};
        border-top: 6px solid ${C.navy};
        background: ${C.pale};
      }
      .fusion-criteria div:nth-child(2) { border-top-color: ${C.red}; }
      .fusion-criteria b {
        display: block;
        color: ${C.navy};
        font-size: 23px;
        margin-bottom: 8px;
      }
      .fusion-criteria span {
        display: block;
        color: ${C.ink};
        font-size: 21px;
        line-height: 1.28;
      }

      .platform-layout { display: grid; grid-template-columns: 1.28fr 0.72fr; gap: 28px; height: 100%; }
      .platform-img img { max-height: 720px; }
      .platform-right { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .platform-right .mini-panel { min-height: 322px; }

      .experiment-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
      .experiment-layout .panel { min-height: 406px; }
      .experiment-checklist {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 178px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
      }
      .experiment-checklist div {
        min-height: 152px;
        padding: 18px;
        border: 2px solid ${C.line};
        border-top: 6px solid ${C.navy};
        background: rgba(255,255,255,.96);
      }
      .experiment-checklist div:nth-child(even) { border-top-color: ${C.red}; }
      .experiment-checklist b {
        display: block;
        color: ${C.navy};
        font-size: 24px;
        margin-bottom: 10px;
      }
      .experiment-checklist span {
        color: ${C.ink};
        font-size: 21px;
        line-height: 1.3;
      }
      .param-row {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 20px;
      }
      .param-row .metric { min-height: 140px; }

      .default-results { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
      .default-results .chart-card { height: 455px; }
      .default-interpret {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 178px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }
      .default-interpret div {
        min-height: 128px;
        padding: 18px 20px;
        border: 2px solid ${C.line};
        border-top: 6px solid ${C.navy};
        background: rgba(255,255,255,.96);
      }
      .default-interpret div:nth-child(2) { border-top-color: ${C.red}; }
      .default-interpret b {
        display: block;
        color: ${C.navy};
        font-size: 24px;
        margin-bottom: 8px;
      }
      .default-interpret span {
        color: ${C.ink};
        font-size: 21px;
        line-height: 1.28;
      }
      .result-strip {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
      }
      .result-strip .metric { min-height: 158px; }

      .two-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
      .two-charts .chart-card { height: 410px; }
      .variable-strip {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 264px;
        min-height: 118px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }
      .variable-strip div {
        padding: 16px 18px;
        border: 2px solid ${C.line};
        border-top: 6px solid ${C.navy};
        background: rgba(255,255,255,.96);
      }
      .variable-strip div:nth-child(2) { border-top-color: ${C.red}; }
      .variable-strip b {
        display: block;
        color: ${C.navy};
        font-size: 24px;
        margin-bottom: 8px;
      }
      .variable-strip span {
        color: ${C.ink};
        font-size: 21px;
        line-height: 1.28;
      }
      .analysis-row {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
      .analysis-row .mini-panel { min-height: 240px; }

      .weather-comm {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px 28px;
      }
      .weather-comm .chart-card { height: 345px; }
      .weather-comm .chart-card:nth-child(1), .weather-comm .chart-card:nth-child(2) { height: 365px; }
      .weather-comm-v2 {
        display: grid;
        grid-template-columns: 1.18fr .82fr;
        gap: 28px;
        height: 720px;
      }
      .weather-main .chart-card {
        height: 100%;
      }
      .comm-panel {
        background: rgba(255,255,255,.96);
        border: 2px solid ${C.line};
        border-radius: 8px;
        padding: 20px 22px;
      }
      .comm-panel h3 {
        margin: 0 0 16px;
        color: ${C.navy};
        font-size: 29px;
        line-height: 1.2;
      }
      .comm-table {
        font-size: 22px;
      }
      .comm-table th {
        font-size: 21px;
        padding: 9px 10px;
      }
      .comm-table td {
        font-size: 21px;
        padding: 9px 10px;
        line-height: 1.24;
      }
      .comm-kpis {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .comm-kpis div {
        min-height: 94px;
        padding: 14px 10px;
        text-align: center;
        background: ${C.pale};
        border-top: 5px solid ${C.navy};
      }
      .comm-kpis div:nth-child(2) { border-top-color: ${C.red}; }
      .comm-kpis b {
        display: block;
        color: ${C.navy};
        font-size: 28px;
        line-height: 1;
        margin-bottom: 10px;
      }
      .comm-kpis div:nth-child(2) b { color: ${C.red}; }
      .comm-kpis span {
        display: block;
        color: ${C.gray};
        font-size: 19px;
        line-height: 1.2;
      }
      .result-note {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 19px 24px;
        border-left: 10px solid ${C.red};
        font-size: 25px;
        line-height: 1.36;
      }
      .result-note b { color: ${C.navy}; }
      .result-note-v2 {
        font-size: 26px;
        padding: 16px 22px;
      }

      .innovation-layout { display: grid; grid-template-columns: 0.98fr 1.02fr; gap: 30px; height: 100%; }
      .quadrant {
        position: relative;
        margin-top: 24px;
        height: 360px;
        border: 2px solid ${C.line};
        background:
          linear-gradient(90deg, transparent 49%, ${C.line2} 49% 50%, transparent 50%),
          linear-gradient(0deg, transparent 49%, ${C.line2} 49% 50%, transparent 50%),
          ${C.pale};
      }
      .axis-x, .axis-y { position: absolute; color: ${C.gray}; font-size: 24px; }
      .axis-x { right: 20px; bottom: 14px; }
      .axis-y { left: 20px; top: 14px; }
      .point {
        position: absolute;
        display: grid;
        place-items: center;
        width: 92px;
        height: 92px;
        border-radius: 50%;
        color: white;
        font-size: 24px;
        font-weight: 900;
      }
      .point.random { left: 165px; bottom: 70px; background: #7b8794; }
      .point.rads { left: 360px; top: 82px; background: ${C.red}; width: 112px; height: 112px; }
      .point.full { right: 94px; top: 62px; background: ${C.navy}; }

      .summary-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; height: 100%; }
      .summary-layout > section { display: grid; grid-template-rows: auto 1fr; gap: 22px; }
      .limitation-actions {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .limitation-actions div {
        min-height: 92px;
        padding: 12px;
        border: 1px solid ${C.line};
        border-top: 5px solid ${C.navy};
        background: ${C.pale};
        text-align: center;
      }
      .limitation-actions div:nth-child(2) { border-top-color: ${C.red}; }
      .limitation-actions b {
        display: block;
        color: ${C.navy};
        font-size: 22px;
        margin-bottom: 8px;
      }
      .limitation-actions span {
        color: ${C.ink};
        font-size: 19px;
        line-height: 1.22;
      }
      .future-note {
        margin-top: 20px;
        padding: 18px 20px;
        border-left: 8px solid ${C.red};
        background: ${C.pale};
        color: ${C.ink};
        font-size: 24px;
        line-height: 1.34;
        font-weight: 700;
      }
      .future-note b { color: ${C.navy}; }
      .thanks {
        margin-top: 24px;
        min-height: 180px;
        display: grid;
        place-items: center;
        border: none;
        background: ${C.navy};
        color: white;
        text-align: center;
      }
      .thanks h2 { margin: 0; font-size: 44px; line-height: 1.1; }
      .thanks p { margin: 10px 0 0; font-size: 28px; color: #dbe6f4; }
      .thanks-page .body {
        top: 210px;
        bottom: 96px;
      }
      .thanks-full {
        height: 100%;
        display: grid;
        place-items: center;
        text-align: center;
        background:
          linear-gradient(145deg, rgba(8,43,95,.04), transparent 48%),
          rgba(255,255,255,.95);
        border: none;
      }
      .thanks-full img {
        width: 430px;
        height: 90px;
        object-fit: contain;
        margin-bottom: 34px;
      }
      .thanks-full h2 {
        margin: 0;
        color: ${C.navy};
        font-size: 72px;
        line-height: 1.1;
        font-weight: 900;
      }
      .thanks-full p {
        margin: 20px 0 0;
        color: ${C.gray};
        font-size: 34px;
      }
      .thanks-full span {
        display: inline-block;
        margin-top: 48px;
        padding: 13px 28px;
        border-top: 3px solid ${C.red};
        color: ${C.red};
        font-size: 25px;
        font-weight: 800;
      }

      /* Jiangxi University red-brown campus template skin. Content stays unchanged; this layer only replaces the visual system. */
      .slide {
        background:
          linear-gradient(120deg, rgba(143,29,29,.035) 0 1px, transparent 1px 28px),
          radial-gradient(circle at 88% 8%, rgba(184,138,82,.16), transparent 18%),
          linear-gradient(135deg, rgba(255,255,255,.98), rgba(251,248,244,.98)),
          #fffaf4;
      }
      .slide::before {
        height: 18px;
        background: linear-gradient(90deg, ${C.red} 0 16%, #6d1616 16% 23%, ${C.gold} 23% 29%, ${C.red} 29% 100%);
      }
      .slide::after {
        content: "JXUST";
        right: 92px;
        bottom: 62px;
        color: rgba(91,23,23,.045);
        font-size: 118px;
        letter-spacing: 10px;
      }
      .jxust-bg {
        z-index: 1;
      }
      .jxust-bg::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 430px;
        height: 210px;
        background: linear-gradient(135deg, transparent 0 29%, rgba(184,138,82,.42) 29% 30.4%, rgba(143,29,29,.16) 30.4% 100%);
        opacity: .82;
      }
      .jxust-bg::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: 16px;
        width: 176px;
        height: 126px;
        background: rgba(143,29,29,.92);
        clip-path: polygon(0 0, 100% 100%, 0 100%);
      }
      .jxust-bg-photo {
        position: absolute;
        top: 0;
        right: 0;
        width: 520px;
        height: 218px;
        object-fit: cover;
        object-position: center;
        opacity: .16;
        filter: saturate(.86) contrast(1.02);
        clip-path: polygon(24% 0, 100% 0, 100% 100%, 0 100%);
      }
      .jxust-bg-logo {
        right: 98px;
        bottom: 80px;
        width: 560px;
        opacity: .075;
        filter: sepia(.18) saturate(.9);
      }
      .jxust-bg-name {
        left: 82px;
        bottom: 106px;
        color: rgba(143,29,29,.078);
        font-size: 72px;
        letter-spacing: 14px;
      }
      .jxust-bg-motto {
        right: 24px;
        top: 280px;
        color: rgba(143,29,29,.12);
      }
      .jxust-bg-campus {
        bottom: 52px;
        opacity: .36;
        border-bottom-color: rgba(143,29,29,.18);
      }
      .topbar {
        grid-template-columns: 112px 1fr 286px;
        border-bottom: 2.5px solid ${C.red};
      }
      .topbar::after {
        background: ${C.gold};
        width: 96px;
      }
      .page-no {
        color: ${C.red};
        font-family: Georgia, "Times New Roman", serif;
        font-size: 58px;
        font-weight: 900;
        line-height: .9;
      }
      .title-wrap h1 {
        color: #3a1d1b;
        letter-spacing: 0;
      }
      .title-wrap p {
        color: #6d5b52;
      }
      .school-logo {
        width: 282px;
        height: 58px;
      }
      .footer {
        color: #7b6a60;
        border-top: 1px solid rgba(143,29,29,.16);
      }
      .panel, .mini-panel, .chart-card, .image-box, .metric, .problem-core, .compare-box, .question-box,
      .req-item, .agenda-row, .agenda-side, .thesis-map, .rads-key, .rads-theory-strip, .demand-flow,
      .subgroup-diagram, .result-note, .thanks, .thanks-full,
      .demand-left, .demand-visual, .demand-table, .utility-left, .utility-matrix, .utility-right,
      .budget-left, .budget-center, .budget-right, .pseudo.dense, .assign-visual, .subgroup-output,
      .comm-panel {
        background: rgba(255,255,255,.965);
        border-color: #dccab8;
        box-shadow: 0 12px 26px rgba(91,23,23,.055);
      }
      .panel, .mini-panel, .chart-card, .image-box {
        border-radius: 2px;
      }
      .panel h3, .mini-panel h3,
      .demand-visual h3, .demand-table h3, .utility-matrix h3, .utility-right h3,
      .budget-center h3, .budget-right h3, .assign-visual h3, .subgroup-output h3,
      .comm-panel h3 {
        color: ${C.navy};
      }
      .panel h3::after, .mini-panel h3::after {
        background: ${C.red};
      }
      .data-table th {
        background: ${C.navy};
      }
      .data-table td {
        border-color: #dccab8;
      }
      .formula, .pseudo {
        background: ${C.pale};
        border-color: #dccab8;
        border-left-color: ${C.red};
      }
      .metric b, .chart-title, .axis-x, .axis-y {
        color: ${C.navy};
        fill: ${C.navy};
      }
      .grid-line { stroke: #eadfd4; }
      .axis-line { stroke: #bda994; }
      .cover {
        padding: 0;
        background:
          linear-gradient(120deg, rgba(143,29,29,.035) 0 1px, transparent 1px 30px),
          linear-gradient(180deg, #fffdfa 0%, #fff8ef 100%);
      }
      .cover::before {
        height: 0;
        display: none;
      }
      .cover::after {
        display: none;
      }
      .cover-photo-panel {
        position: absolute;
        right: 0;
        top: 0;
        width: 870px;
        height: 100%;
        clip-path: polygon(23% 0, 100% 0, 100% 100%, 0 100%);
        overflow: hidden;
        z-index: 1;
      }
      .cover-photo-panel img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        filter: saturate(.98) contrast(1.04);
      }
      .cover-photo-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(255,255,255,.10), rgba(255,255,255,0) 38%);
      }
      .cover-diagonal {
        position: absolute;
        z-index: 3;
        pointer-events: none;
      }
      .cover-diagonal.gold {
        left: 918px;
        top: -32px;
        width: 44px;
        height: 1180px;
        background: ${C.gold};
        transform: rotate(26deg);
        opacity: .72;
      }
      .cover-diagonal.red {
        left: 805px;
        bottom: 72px;
        width: 420px;
        height: 390px;
        background: linear-gradient(135deg, rgba(143,29,29,.94), rgba(105,22,20,.82));
        clip-path: polygon(0 100%, 72% 0, 100% 100%);
        opacity: .95;
      }
      .cover-logo {
        left: 78px;
        top: 58px;
        width: 430px;
        z-index: 7;
      }
      .cover-watermark {
        left: 86px;
        top: 354px;
        bottom: auto;
        color: rgba(184,138,82,.82);
        font-size: 20px;
        letter-spacing: 14px;
        font-weight: 600;
        z-index: 5;
      }
      .cover-cn-watermark {
        left: 86px;
        top: 226px;
        right: auto;
        bottom: auto;
        color: rgba(143,29,29,.98);
        font-size: 92px;
        line-height: 1;
        letter-spacing: 8px;
        font-family: "SimSun", "Songti SC", serif;
        font-weight: 900;
        writing-mode: horizontal-tb;
        z-index: 5;
      }
      .cover-lineart {
        left: 74px;
        right: auto;
        bottom: 188px;
        width: 720px;
        height: 96px;
        opacity: .55;
      }
      .cover-lineart::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(184,138,82,.45), transparent);
      }
      .cover-lineart span {
        border-color: rgba(184,138,82,.32);
        background: rgba(184,138,82,.035);
      }
      .cover-title-simple {
        left: 84px;
        right: auto;
        top: 430px;
        width: 742px;
        text-align: left;
        z-index: 5;
      }
      .cover-title-simple .cover-kicker {
        display: none;
      }
      .cover-title-simple h1 {
        color: #2e2522;
        font-size: 44px;
        line-height: 1.24;
        font-family: "Microsoft YaHei", "SimHei", sans-serif;
        letter-spacing: 0;
        padding: 18px 0 18px;
        border-top: 2px solid rgba(184,138,82,.55);
        border-bottom: 2px solid rgba(184,138,82,.55);
      }
      .cover-subtitle {
        justify-content: flex-start;
        margin-top: 18px;
      }
      .cover-subtitle span {
        color: #7b6658;
        font-size: 19px;
        letter-spacing: 3px;
      }
      .cover-subtitle i {
        width: 38px;
        background: ${C.gold};
      }
      .cover-meta-simple {
        left: 84px;
        right: auto;
        top: 690px;
        width: 760px;
        padding: 0;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px 20px;
        background: transparent;
        border: none;
        box-shadow: none;
        z-index: 5;
      }
      .cover-meta-simple div {
        min-height: 54px;
        border-left: none;
        border-top: 2px solid rgba(184,138,82,.42);
        padding: 11px 0 0 0;
      }
      .cover-meta-simple b {
        color: ${C.red};
        font-size: 18px;
      }
      .cover-meta-simple span {
        color: #2b2522;
        font-size: 23px;
      }
      .cover-bottom-band {
        height: 72px;
        background: ${C.red};
        z-index: 8;
        color: #fff5ea;
      }
      .cover-bottom-band span {
        color: #fff5ea;
        font-size: 23px;
        letter-spacing: 14px;
        font-family: "SimSun", "Songti SC", serif;
      }
      .thanks-page .body {
        display: grid;
        place-items: center;
      }
      .thanks-page .thanks-full {
        width: 100%;
        height: 100%;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .thanks-page .thanks-full img {
        width: 520px;
        height: 108px;
        margin-bottom: 48px;
      }
      .thanks-page .thanks-full h2 {
        font-size: 88px;
        line-height: 1.05;
      }
      .thanks-page .thanks-full p {
        margin-top: 30px;
        font-size: 40px;
      }
      .thanks-page .thanks-full span {
        margin-top: 58px;
        background: transparent;
      }
    </style>
  </head>
  <body>${slideHtml}</body>
  </html>`;
}

async function renderSlides() {
  const browser = await chromium.launch({ headless: true, executablePath: LOCAL_BROWSER });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const report = [];

  for (let i = 0; i < slides.length; i += 1) {
    const no = String(i + 1).padStart(2, "0");
    await page.setContent(fullHtml(slides[i].html), { waitUntil: "load" });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const issues = await page.evaluate(() => {
      const slide = document.querySelector(".slide").getBoundingClientRect();
      const checked = Array.from(document.querySelectorAll("[data-fit]"));
      return checked.flatMap((el) => {
        const box = el.getBoundingClientRect();
        const overflowX = el.scrollWidth - el.clientWidth > 3;
        const overflowY = el.scrollHeight - el.clientHeight > 3;
        const outside = box.left < slide.left - 1 || box.top < slide.top - 1 || box.right > slide.right + 1 || box.bottom > slide.bottom + 1;
        if (!overflowX && !overflowY && !outside) return [];
        const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
        return [{ className: el.className, text, overflowX, overflowY, outside, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }];
      });
    });
    if (issues.length) {
      report.push({ slide: i + 1, title: slides[i].title, issues });
      throw new Error(`Slide ${i + 1} layout issues:\n${JSON.stringify(issues, null, 2)}`);
    }
    const slidePath = path.join(SLIDE_DIR, `slide_${no}.png`);
    await page.screenshot({ path: slidePath, type: "png", fullPage: false });
    report.push({ slide: i + 1, title: slides[i].title, image: slidePath, issues: [] });
  }
  await browser.close();
  return report;
}

async function buildMontage() {
  const browser = await chromium.launch({ headless: true, executablePath: LOCAL_BROWSER });
  const page = await browser.newPage({ viewport: { width: 1800, height: 1500 }, deviceScaleFactor: 1 });
  const imgs = slides.map((_, i) => {
    const no = String(i + 1).padStart(2, "0");
    const uri = dataUri(path.join(SLIDE_DIR, `slide_${no}.png`));
    return `<figure><img src="${uri}"/><figcaption>${no} ${esc(slides[i].title)}</figcaption></figure>`;
  }).join("");
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#eef2f7;font-family:"Microsoft YaHei",Arial,sans-serif;}
    .grid{padding:28px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
    figure{margin:0;background:white;border:1px solid #cbd7e6;padding:8px;box-shadow:0 4px 12px rgba(8,43,95,.08)}
    img{width:100%;display:block}
    figcaption{font-size:17px;color:#082b5f;font-weight:700;padding:7px 2px 2px}
  </style><div class="grid">${imgs}</div>`, { waitUntil: "load" });
  await page.screenshot({ path: MONTAGE_PATH, type: "png", fullPage: true });
  await browser.close();
}

async function buildPptx() {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333333, height: 7.5 });
  pptx.layout = "CUSTOM_WIDE";
  pptx.author = "贺小双";
  pptx.company = "江西理工大学";
  pptx.subject = "本科毕业设计答辩";
  pptx.title = "基于集群的多任务协同态势感知平台";
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: "Microsoft YaHei",
    bodyFontFace: "Microsoft YaHei",
    lang: "zh-CN",
  };

  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    const no = String(i + 1).padStart(2, "0");
    slide.addImage({ path: path.join(SLIDE_DIR, `slide_${no}.png`), x: 0, y: 0, w: 13.333333, h: 7.5 });
    slide.addNotes(`【${s.title}】\n${s.notes.join("\n")}`);
  });

  await pptx.writeFile({ fileName: PPTX_PATH, compression: true });
  fs.copyFileSync(PPTX_PATH, COPY_PATH);
}

async function inspectPptx() {
  const zip = await JSZip.loadAsync(fs.readFileSync(PPTX_PATH));
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  const notesFiles = Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f));
  return {
    pptx: PPTX_PATH,
    copy: COPY_PATH,
    montage: MONTAGE_PATH,
    slidesInPptx: slideFiles.length,
    notesInPptx: notesFiles.length,
    expectedSlides: slides.length,
    expectedNotes: slides.length,
  };
}

async function main() {
  const layoutReport = await renderSlides();
  await buildMontage();
  await buildPptx();
  const pptxReport = await inspectPptx();
  const report = {
    generatedAt: new Date().toISOString(),
    layout: layoutReport,
    pptx: pptxReport,
  };
  fs.writeFileSync(QA_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ pptx: PPTX_PATH, copy: COPY_PATH, montage: MONTAGE_PATH, qa: QA_PATH, slides: slides.length, notes: pptxReport.notesInPptx }, null, 2));
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
