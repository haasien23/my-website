const path = require("path");
const fs = require("fs");
const os = require("os");
const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
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
pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "CUSTOM_WIDE";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "defense_ppt");
const LOGO = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-cropped.png");
const DESKTOP = path.join(os.homedir(), "Desktop");
const PPTX_PATH = path.join(DESKTOP, "基于集群的多任务协同态势感知平台_本科毕设答辩.pptx");
fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  navy: "0B2E5F",
  navy2: "173E73",
  red: "9F3129",
  red2: "B9473D",
  gray: "5B6675",
  lightGray: "EEF2F7",
  midGray: "CDD6E2",
  pale: "F7F9FC",
  white: "FFFFFF",
  gold: "D2A657",
  ink: "1E293B",
};

const FONT = "Microsoft YaHei";
const W = 13.333;
const H = 7.5;

function addText(slide, text, opts) {
  slide.addText(text, {
    fontFace: FONT,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    ...opts,
  });
}

function addHeader(slide, pageNo, section = "本科毕业设计答辩") {
  slide.addImage({ path: LOGO, x: 0.42, y: 0.15, w: 2.05, h: 0.6 });
  slide.addShape(pptx.ShapeType.line, {
    x: 2.68,
    y: 0.47,
    w: 9.85,
    h: 0,
    line: { color: C.red, width: 1.2 },
  });
  addText(slide, section, {
    x: 10.2,
    y: 0.2,
    w: 2.35,
    h: 0.22,
    fontSize: 8.8,
    color: C.gray,
    align: "right",
  });
  addFooter(slide, pageNo);
}

function addFooter(slide, pageNo) {
  addCampusLine(slide);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 7.31,
    w: 10.72,
    h: 0.08,
    line: { color: C.navy },
    fill: { color: C.navy },
  });
  slide.addShape(pptx.ShapeType.parallelogram, {
    x: 10.62,
    y: 7.31,
    w: 0.55,
    h: 0.08,
    line: { color: C.white, transparency: 100 },
    fill: { color: C.white },
    rotate: 0,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 11.08,
    y: 7.31,
    w: 2.25,
    h: 0.08,
    line: { color: C.red },
    fill: { color: C.red },
  });
  addText(slide, "基于集群的多任务协同态势感知平台", {
    x: 0.55,
    y: 6.98,
    w: 4.3,
    h: 0.16,
    fontSize: 6.8,
    color: "8B99AA",
  });
  addText(slide, String(pageNo).padStart(2, "0"), {
    x: 12.42,
    y: 6.95,
    w: 0.35,
    h: 0.18,
    fontSize: 7.5,
    color: C.gray,
    align: "right",
  });
}

function addCampusLine(slide) {
  const y = 6.66;
  const line = { color: "D9E0EA", width: 0.7, transparency: 15 };
  const x0 = 0.35;
  const buildings = [
    [x0, y + 0.16, 0.95, 0.28],
    [1.35, y + 0.05, 0.55, 0.39],
    [2.05, y + 0.13, 0.88, 0.31],
    [3.15, y + 0.01, 0.6, 0.43],
    [4.0, y + 0.18, 0.92, 0.26],
    [5.18, y + 0.1, 0.75, 0.34],
    [9.1, y + 0.18, 0.75, 0.26],
    [10.2, y + 0.1, 0.92, 0.34],
    [11.35, y + 0.0, 0.55, 0.44],
    [12.08, y + 0.16, 0.8, 0.28],
  ];
  buildings.forEach(([x, yy, w, h]) => {
    slide.addShape(pptx.ShapeType.rect, { x, y: yy, w, h, line, fill: { color: C.white, transparency: 100 } });
    for (let i = 1; i < 3; i++) {
      slide.addShape(pptx.ShapeType.line, { x: x + (w * i) / 3, y: yy, w: 0, h, line });
    }
  });
  slide.addShape(pptx.ShapeType.line, { x: 0.25, y: y + 0.45, w: 12.8, h: 0, line });
  // A simple campus tower mark on the right.
  slide.addShape(pptx.ShapeType.rect, { x: 11.52, y: y - 0.18, w: 0.28, h: 0.62, line, fill: { color: C.white, transparency: 100 } });
  slide.addShape(pptx.ShapeType.triangle, { x: 11.47, y: y - 0.34, w: 0.38, h: 0.22, line, fill: { color: C.white, transparency: 100 } });
  // A few trees, kept very light.
  [0.8, 1.05, 6.15, 6.45, 8.55, 8.85, 12.45].forEach((x) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.2, w: 0.18, h: 0.18, line, fill: { color: C.white, transparency: 100 } });
    slide.addShape(pptx.ShapeType.line, { x: x + 0.09, y: y + 0.37, w: 0, h: 0.12, line });
  });
}

function addTitle(slide, title, subtitle) {
  addText(slide, title, {
    x: 0.72,
    y: 0.98,
    w: 5.8,
    h: 0.42,
    fontSize: 18,
    bold: true,
    color: C.navy,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.72,
    y: 1.48,
    w: 1.22,
    h: 0.035,
    line: { color: C.red },
    fill: { color: C.red },
  });
  if (subtitle) {
    addText(slide, subtitle, {
      x: 2.08,
      y: 1.41,
      w: 6.7,
      h: 0.18,
      fontSize: 8.2,
      color: C.gray,
    });
  }
}

function addBulletList(slide, items, x, y, w, opts = {}) {
  const fs = opts.fontSize || 11.2;
  const gap = opts.gap || 0.36;
  items.forEach((item, i) => {
    const yy = y + i * gap;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: yy + 0.07,
      w: 0.07,
      h: 0.07,
      line: { color: opts.color || C.red },
      fill: { color: opts.color || C.red },
    });
    addText(slide, item, {
      x: x + 0.18,
      y: yy,
      w,
      h: gap * 0.83,
      fontSize: fs,
      color: opts.textColor || C.ink,
      fit: "shrink",
    });
  });
}

function addNumberedList(slide, items, x, y, w, opts = {}) {
  const gap = opts.gap || 0.63;
  items.forEach((item, i) => {
    const yy = y + i * gap;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: yy,
      w: 0.45,
      h: 0.34,
      line: { color: C.navy },
      fill: { color: C.navy },
    });
    addText(slide, String(i + 1).padStart(2, "0"), {
      x: x + 0.07,
      y: yy + 0.06,
      w: 0.31,
      h: 0.16,
      fontSize: 9.5,
      bold: true,
      color: C.white,
      align: "center",
    });
    addText(slide, item, {
      x: x + 0.75,
      y: yy + 0.03,
      w,
      h: 0.24,
      fontSize: opts.fontSize || 12,
      color: C.ink,
      bold: true,
    });
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.75,
      y: yy + 0.38,
      w: 4.55,
      h: 0,
      line: { color: C.midGray, width: 0.6 },
    });
  });
}

function addInfoBox(slide, x, y, w, h, title, bullets, opts = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: opts.border || "BAC6D8", width: 1 },
    fill: { color: opts.fill || C.white, transparency: opts.transparency ?? 0 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.07,
    h,
    line: { color: opts.accent || C.red },
    fill: { color: opts.accent || C.red },
  });
  addText(slide, title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.3,
    h: 0.25,
    fontSize: opts.titleSize || 12,
    bold: true,
    color: opts.titleColor || C.navy,
  });
  addBulletList(slide, bullets, x + 0.2, y + 0.65, w - 0.45, {
    fontSize: opts.fontSize || 8.4,
    gap: opts.gap || 0.28,
    color: opts.bulletColor || C.red,
    textColor: opts.textColor || C.ink,
  });
}

function addMetric(slide, x, y, w, h, value, label, sub = "") {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: "B8C4D6", width: 1 },
    fill: { color: C.white },
  });
  addText(slide, value, { x: x + 0.15, y: y + 0.2, w: w - 0.3, h: 0.36, fontSize: 18, bold: true, color: C.red, align: "center" });
  addText(slide, label, { x: x + 0.16, y: y + 0.72, w: w - 0.32, h: 0.28, fontSize: 8.2, bold: true, color: C.navy, align: "center" });
  if (sub) {
    addText(slide, sub, { x: x + 0.18, y: y + 1.02, w: w - 0.36, h: 0.18, fontSize: 6.8, color: C.gray, align: "center" });
  }
}

function addFlow(slide, labels, y, x = 0.78, w = 11.78, nodeH = 0.92) {
  const gap = 0.18;
  const nodeW = (w - gap * (labels.length - 1)) / labels.length;
  labels.forEach((node, i) => {
    const nx = x + i * (nodeW + gap);
    slide.addShape(pptx.ShapeType.rect, {
      x: nx,
      y,
      w: nodeW,
      h: nodeH,
      line: { color: "AEBBD0", width: 1 },
      fill: { color: C.white },
    });
    addText(slide, node.title, {
      x: nx + 0.12,
      y: y + 0.16,
      w: nodeW - 0.24,
      h: 0.24,
      fontSize: 10.4,
      bold: true,
      color: C.navy,
      align: "center",
    });
    addText(slide, node.desc, {
      x: nx + 0.14,
      y: y + 0.48,
      w: nodeW - 0.28,
      h: 0.32,
      fontSize: 7.1,
      color: C.gray,
      align: "center",
      fit: "shrink",
    });
    if (i < labels.length - 1) {
      slide.addShape(pptx.ShapeType.rightArrow, {
        x: nx + nodeW - 0.02,
        y: y + 0.34,
        w: 0.28,
        h: 0.22,
        line: { color: C.red, transparency: 100 },
        fill: { color: C.red },
      });
    }
  });
}

function addMiniNetwork(slide, x, y, scale = 1) {
  const pts = [
    [x, y + 0.9], [x + 0.7 * scale, y + 0.55 * scale], [x + 1.3 * scale, y + 1.0 * scale],
    [x + 1.95 * scale, y + 0.35 * scale], [x + 2.45 * scale, y + 0.85 * scale],
    [x + 3.05 * scale, y + 0.25 * scale], [x + 3.55 * scale, y + 0.72 * scale],
  ];
  const edges = [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6]];
  edges.forEach(([a, b]) => {
    slide.addShape(pptx.ShapeType.line, {
      x: pts[a][0],
      y: pts[a][1],
      w: pts[b][0] - pts[a][0],
      h: pts[b][1] - pts[a][1],
      line: { color: "BAC6D8", width: 1.2, transparency: 25 },
    });
  });
  pts.forEach((p, idx) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: p[0] - 0.045,
      y: p[1] - 0.045,
      w: 0.09,
      h: 0.09,
      line: { color: idx % 2 ? C.red : C.navy, transparency: 15 },
      fill: { color: idx % 2 ? C.red : C.navy, transparency: 20 },
    });
  });
}

function noteFor(title, lines) {
  return `【${title}】\n` + lines.join("\n");
}

function slideBase(title, pageNo, section, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addHeader(slide, pageNo, section);
  addTitle(slide, title, subtitle);
  return slide;
}

// 1. Cover
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  slide.addImage({ path: LOGO, x: 0.62, y: 0.33, w: 3.45, h: 1.0 });
  slide.addShape(pptx.ShapeType.line, { x: 4.45, y: 0.5, w: 0, h: 0.62, line: { color: C.red, width: 2 } });
  addText(slide, "本科毕业设计（论文）答辩\n信息工程学院", {
    x: 4.67,
    y: 0.46,
    w: 2.8,
    h: 0.6,
    fontSize: 14,
    color: C.gray,
    breakLine: false,
    fit: "shrink",
  });
  addText(slide, "THESIS DEFENSE", { x: 1.35, y: 2.55, w: 2.1, h: 0.25, fontSize: 12, bold: true, color: C.red });
  addText(slide, "基于集群的多任务协同\n态势感知平台", {
    x: 1.35,
    y: 2.9,
    w: 7.0,
    h: 0.98,
    fontSize: 30,
    bold: true,
    color: C.navy,
    breakLine: false,
    fit: "shrink",
  });
  slide.addShape(pptx.ShapeType.line, { x: 1.35, y: 4.1, w: 4.8, h: 0, line: { color: C.red, width: 1.2 } });
  addBulletList(slide, [
    "学生：贺小双",
    "专业班级：计算机科学与技术（22级）",
    "指导教师：陈益杉 副教授",
    "答辩日期：2026年6月",
  ], 1.38, 4.55, 4.2, { fontSize: 11, gap: 0.36, color: C.navy });
  addMiniNetwork(slide, 8.7, 4.25, 1.1);
  addCampusLine(slide);
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.31, w: 10.72, h: 0.08, line: { color: C.navy }, fill: { color: C.navy } });
  slide.addShape(pptx.ShapeType.rect, { x: 11.08, y: 7.31, w: 2.25, h: 0.08, line: { color: C.red }, fill: { color: C.red } });
  slide.addNotes(noteFor("封面页", [
    "各位老师好，我的毕业设计题目是《基于集群的多任务协同态势感知平台》。",
    "这项工作不是单纯做一个展示页面，而是围绕无人机集群在复杂环境下如何完成多目标协同感知，完成了场景建模、算法设计、平台实现和实验验证。",
    "接下来我会从研究背景、问题分析、方法设计、实验结果和创新总结几个方面进行汇报。",
  ]));
}

// 2. Agenda
{
  const slide = slideBase("目录", 2, "答辩目录");
  addNumberedList(slide, [
    "背景意义：为什么要研究无人机集群协同态势感知",
    "问题分析：复杂环境下多任务感知面临哪些难点",
    "方法设计：RADS 动态子群选择与感知融合机制",
    "实验验证：三策略对比及不同场景下的性能变化",
    "创新总结：系统成果、不足与后续改进方向",
  ], 4.15, 1.72, 5.55, { fontSize: 11.6, gap: 0.66 });
  addText(slide, "汇报主线：问题提出 → 方法构建 → 平台实现 → 数据验证 → 结论收束", {
    x: 2.5,
    y: 5.62,
    w: 8.5,
    h: 0.35,
    fontSize: 11,
    color: C.gray,
    align: "center",
  });
  slide.addNotes(noteFor("目录页", [
    "本次汇报分为五个部分。",
    "首先说明研究背景和现实需求，然后分析已有方法在复杂环境中的不足。",
    "中间部分重点介绍我设计的 RADS 动态子群选择方法以及平台实现，后面通过实验结果说明它的效果。",
    "最后总结创新点、当前不足和后续可以继续完善的方向。",
  ]));
}

// 3. Research background
{
  const slide = slideBase("研究背景", 3, "第一章 研究背景", "无人机集群从单机执行走向多机协同，态势感知质量成为任务成败关键。");
  addInfoBox(slide, 0.75, 1.85, 3.75, 2.05, "应用需求", [
    "安防巡检、灾害救援、边境监测等任务需要大范围覆盖",
    "多无人机协同能够提升并行处理、系统冗余和区域感知能力",
    "任务环境通常动态变化，单机感知很难长期保持稳定",
  ], { fontSize: 8.5 });
  addInfoBox(slide, 4.85, 1.85, 3.75, 2.05, "复杂约束", [
    "目标持续运动，空间位置和不确定性会不断变化",
    "障碍遮挡、视场限制、链路丢包和天气扰动影响观测质量",
    "节点还存在能量衰减和随机故障，资源并非始终可用",
  ], { fontSize: 8.5 });
  addInfoBox(slide, 8.95, 1.85, 3.55, 2.05, "研究价值", [
    "需要在感知质量与资源消耗之间取得平衡",
    "平台化仿真可以让算法过程更可观察、更可解释",
    "为后续无人系统协同控制和实验验证提供基础",
  ], { fontSize: 8.5 });
  addMiniNetwork(slide, 7.8, 4.72, 0.95);
  addText(slide, "核心判断：复杂环境中的态势感知，不只是“发现目标”，还要持续、准确、可更新。", {
    x: 0.88,
    y: 5.2,
    w: 6.8,
    h: 0.36,
    fontSize: 11,
    color: C.navy,
    bold: true,
  });
  slide.addNotes(noteFor("研究背景", [
    "无人机集群相比单架无人机，最大的优势是覆盖范围更大、任务并行能力更强、系统冗余更高。",
    "但在真实任务场景中，目标会移动，环境中会存在遮挡和禁入区域，通信链路也会受到距离、天气和丢包影响。",
    "因此，本课题关注的是复杂环境下如何组织无人机集群形成持续、准确、可更新的态势感知能力。",
  ]));
}

// 4. Research problem
{
  const slide = slideBase("研究问题", 4, "第一章 研究背景", "本课题关注的不是派出越多无人机越好，而是如何派出更合适的子群。");
  addInfoBox(slide, 0.85, 1.78, 3.55, 2.15, "多目标并行", [
    "多个目标同时存在，任务之间会竞争无人机资源",
    "目标优先级、运动速度和不确定性不同，需求强度也不同",
    "固定规模派机容易导致关键目标资源不足",
  ]);
  addInfoBox(slide, 4.85, 1.78, 3.55, 2.15, "环境受限", [
    "直线距离近，不代表实际路径代价低",
    "障碍可能遮挡视线，视场角会限制探测方向",
    "链路丢包和延迟会影响观测是否能用于融合",
  ]);
  addInfoBox(slide, 8.85, 1.78, 3.55, 2.15, "评价综合", [
    "只看定位精度，会忽略资源消耗",
    "只看覆盖率，也不能说明观测是否可靠",
    "需要同时比较成功率、误差、能耗和派机规模",
  ]);
  addFlow(slide, [
    { title: "目标需求", desc: "优先级 / 不确定性" },
    { title: "节点能力", desc: "能量 / 链路 / 位置" },
    { title: "调度决策", desc: "选择合适子群" },
    { title: "融合评价", desc: "误差 / 时效 / 一致性" },
  ], 4.65, 1.15, 11.0, 0.82);
  slide.addNotes(noteFor("研究问题", [
    "本页总结本课题真正要解决的问题：不是简单把所有无人机都派出去，而是在多目标、多约束的情况下决定派谁、派多少、派到哪里。",
    "如果只按固定规则分配，可能造成关键目标感知不足，也可能让一般目标占用过多资源。",
    "所以本文把目标需求、节点能力和环境约束一起纳入调度过程，并用多指标评价最终效果。",
  ]));
}

// 5. Goals and route
{
  const slide = slideBase("研究目标与技术路线", 5, "第一章 研究背景", "围绕“建模、算法、平台、实验”形成闭环。");
  addFlow(slide, [
    { title: "需求分析", desc: "明确复杂环境和平台功能需求" },
    { title: "模型设计", desc: "构建无人机、目标、障碍和通信模型" },
    { title: "RADS调度", desc: "动态选择参与感知的无人机子群" },
    { title: "平台实现", desc: "前后端联动与三维可视化展示" },
    { title: "实验分析", desc: "三策略、多场景、综合指标对比" },
  ], 1.95, 0.72, 11.85, 1.05);
  addInfoBox(slide, 1.0, 3.55, 3.35, 1.65, "目标一：复杂环境仿真", [
    "统一表达障碍、天气、链路、故障等因素",
    "支持多目标、多无人机同步推进",
  ], { fontSize: 8.3, gap: 0.3 });
  addInfoBox(slide, 5.0, 3.55, 3.35, 1.65, "目标二：动态子群调度", [
    "基于目标需求和节点能力生成派机结果",
    "在感知效果和资源消耗之间取得平衡",
  ], { fontSize: 8.3, gap: 0.3 });
  addInfoBox(slide, 9.0, 3.55, 3.35, 1.65, "目标三：可视化验证", [
    "支持三策略对比、任务级分析和结果导出",
    "为论文实验和答辩展示提供依据",
  ], { fontSize: 8.3, gap: 0.3 });
  slide.addNotes(noteFor("研究目标与技术路线", [
    "本课题按四个层次推进：先做复杂场景建模，再设计 RADS 动态子群调度方法，然后实现一个可运行平台，最后用实验数据验证效果。",
    "平台目标不是只展示一个算法结果，而是要支持参数配置、三维回放、任务级分析和 CSV 导出。",
    "这样可以把算法设计和实验展示联系起来，形成一个完整的毕业设计成果。",
  ]));
}

// 6. Architecture
{
  const slide = slideBase("系统总体架构", 6, "第二章 方法与系统设计", "采用轻量级前后端分离结构，后端负责仿真，前端负责展示与交互。");
  const layers = [
    ["表示层", "参数配置、三维态势沙盘、指标卡片、任务级表格、结果导出"],
    ["业务控制层", "HTTP接口、实验会话、步进控制、统一快照组织"],
    ["仿真计算层", "环境建模、路径规划、策略调度、感知融合、指标统计"],
  ];
  layers.forEach(([name, desc], i) => {
    const y = 1.85 + i * 1.18;
    slide.addShape(pptx.ShapeType.rect, { x: 1.05, y, w: 11.25, h: 0.88, line: { color: "AEBBD0" }, fill: { color: i === 1 ? "F7F9FC" : C.white } });
    slide.addShape(pptx.ShapeType.rect, { x: 1.05, y, w: 1.55, h: 0.88, line: { color: i === 1 ? C.red : C.navy }, fill: { color: i === 1 ? C.red : C.navy } });
    addText(slide, name, { x: 1.2, y: y + 0.28, w: 1.25, h: 0.24, fontSize: 12, bold: true, color: C.white, align: "center" });
    addText(slide, desc, { x: 2.9, y: y + 0.26, w: 8.85, h: 0.24, fontSize: 11, color: C.ink });
  });
  addText(slide, "关键实现文件：app.py / src_web.server / sessions / simulation.core / pathfinding", {
    x: 1.1,
    y: 5.55,
    w: 10.7,
    h: 0.32,
    fontSize: 9.5,
    color: C.gray,
    align: "center",
  });
  slide.addNotes(noteFor("系统总体架构", [
    "平台整体采用前后端分离的方式。",
    "表示层面向用户，负责参数输入、态势展示和结果查看；业务控制层负责接口请求和实验会话管理；仿真计算层负责算法和模型。",
    "这样的结构让前端不用关心算法细节，后端也不用处理复杂页面布局，系统模块之间职责比较清晰。",
  ]));
}

// 7. Scenario modeling
{
  const slide = slideBase("复杂场景建模", 7, "第二章 方法与系统设计", "平台将任务区域、障碍物、无人机、动态目标、通信链路和天气扰动统一建模。");
  addInfoBox(slide, 0.8, 1.75, 2.65, 2.35, "场景基础", [
    "地图尺度：1320",
    "栅格规模：33×33",
    "默认障碍：34 个",
  ], { fontSize: 9.2, gap: 0.34 });
  addInfoBox(slide, 3.85, 1.75, 2.65, 2.35, "集群与目标", [
    "无人机数量：24 架",
    "目标数量：6 个",
    "目标具备优先级和不确定性",
  ], { fontSize: 9.2, gap: 0.34 });
  addInfoBox(slide, 6.9, 1.75, 2.65, 2.35, "感知通信", [
    "感知半径：180 m",
    "侦察视场：120°",
    "通信半径：300 m",
  ], { fontSize: 9.2, gap: 0.34 });
  addInfoBox(slide, 9.95, 1.75, 2.65, 2.35, "动态扰动", [
    "链路丢包：4%",
    "节点故障：6%",
    "天气：晴空 / 薄雾 / 降雨 / 雷暴",
  ], { fontSize: 9.2, gap: 0.34 });
  addText(slide, "建模目标：让实验不再停留在理想平面，而是能表达“路径、视线、链路、故障”共同作用。", {
    x: 1.05,
    y: 4.95,
    w: 11.0,
    h: 0.35,
    fontSize: 11.2,
    bold: true,
    color: C.navy,
    align: "center",
  });
  slide.addNotes(noteFor("复杂场景建模", [
    "为了让算法验证更贴近实际任务，我把无人机、目标、障碍、通信和天气放在同一个仿真环境里。",
    "默认实验是中等规模场景：24 架无人机、6 个动态目标、34 个障碍物，感知半径和通信半径都有明确限制。",
    "这些因素共同影响最终能不能形成有效观测，因此它们都需要进入后续调度和融合过程。",
  ]));
}

// 8. RADS core
{
  const slide = slideBase("RADS 方法核心", 8, "第二章 方法与系统设计", "RADS 的基本思想是根据当前任务风险和节点能力动态组织感知子群。");
  addInfoBox(slide, 0.85, 1.78, 3.4, 2.05, "目标需求评估", [
    "目标优先级越高，需求越强",
    "目标不确定性越大，需要更多观测支撑",
    "目标运动越快，调度紧迫度越高",
  ], { fontSize: 8.6 });
  addInfoBox(slide, 4.95, 1.78, 3.4, 2.05, "无人机效用评分", [
    "考虑覆盖能力、剩余能量和链路质量",
    "引入绕障路径代价和视线可达性",
    "避免低质量节点带来无效冗余",
  ], { fontSize: 8.6 });
  addInfoBox(slide, 9.05, 1.78, 3.4, 2.05, "动态预算生成", [
    "根据任务压力和系统状态调整派机规模",
    "不是所有节点全量参与",
    "每个仿真步都重新计算子群成员",
  ], { fontSize: 8.6 });
  addFlow(slide, [
    { title: "目标风险", desc: "优先级 + 不确定性 + 速度" },
    { title: "节点能力", desc: "覆盖 + 能量 + 链路" },
    { title: "环境代价", desc: "路径 + 视线 + 天气" },
    { title: "动态子群", desc: "派谁 / 派多少 / 派给谁" },
  ], 4.5, 1.35, 10.7, 0.86);
  slide.addNotes(noteFor("RADS 方法核心", [
    "RADS 可以理解为风险感知的动态子群选择方法。",
    "它先判断每个目标当前需要多少感知资源，再判断每架无人机是否适合执行对应目标任务。",
    "这里不仅考虑距离，还考虑剩余能量、链路质量、绕障路径和视线遮挡。",
    "最终算法在每个仿真步重新选择参与感知的无人机子群。",
  ]));
}

// 9. RADS process
{
  const slide = slideBase("RADS 调度流程", 9, "第二章 方法与系统设计", "算法以离散仿真步推进，调度结果随目标与环境状态动态更新。");
  addFlow(slide, [
    { title: "状态更新", desc: "目标移动 / 能量变化 / 故障更新" },
    { title: "需求计算", desc: "优先级 / 不确定性 / 运动强度" },
    { title: "效用评估", desc: "覆盖 / 链路 / 能量 / 路径代价" },
    { title: "子群生成", desc: "按动态预算选择高效节点" },
    { title: "指标更新", desc: "观测、融合、成功率和能耗统计" },
  ], 1.85, 0.75, 11.85, 1.1);
  addInfoBox(slide, 1.0, 3.55, 3.35, 1.58, "与随机派遣区别", [
    "随机策略也使用预算，但不看节点效用",
    "RADS 会优先选择更可能形成有效观测的节点",
  ], { fontSize: 8.4, gap: 0.3 });
  addInfoBox(slide, 5.0, 3.55, 3.35, 1.58, "与全量派遣区别", [
    "全量派遣尽量投入所有可用无人机",
    "RADS 更强调资源利用效率和任务匹配",
  ], { fontSize: 8.4, gap: 0.3 });
  addInfoBox(slide, 9.0, 3.55, 3.35, 1.58, "实现特点", [
    "每一步重算，支持动态重规划",
    "可在同一场景下与两类基线同步对比",
  ], { fontSize: 8.4, gap: 0.3 });
  slide.addNotes(noteFor("RADS 调度流程", [
    "这一页是 RADS 的运行流程。",
    "每个仿真步开始时，平台会更新目标运动、无人机能量和故障状态。",
    "随后计算目标需求和无人机效用，再根据动态预算生成派机子群。",
    "最后进入运动、观测、融合和指标统计，从而形成连续的仿真过程。",
  ]));
}

// 10. Sensing fusion
{
  const slide = slideBase("感知融合与成功判定", 10, "第二章 方法与系统设计", "平台的成功判定不是“看见就成功”，而是确认、精度和一致性共同满足。");
  addFlow(slide, [
    { title: "感知条件", desc: "距离可达 / 视线无遮挡 / 视场角满足" },
    { title: "观测生成", desc: "概率探测命中后生成带噪测量" },
    { title: "链路传输", desc: "考虑丢包、延迟和信息时效" },
    { title: "稳健融合", desc: "加权融合并抑制异常观测" },
    { title: "严格成功", desc: "确认数 + 误差 + 一致性达标" },
  ], 1.82, 0.75, 11.85, 1.05);
  addInfoBox(slide, 0.95, 3.55, 3.45, 1.65, "为什么要融合", [
    "单机观测存在噪声和遮挡影响",
    "多机观测可以互相补充，提高稳定性",
  ], { fontSize: 8.5, gap: 0.32 });
  addInfoBox(slide, 4.95, 3.55, 3.45, 1.65, "为什么要严格判定", [
    "仅有观测不代表定位可靠",
    "需要同时看观测数、误差和一致性",
  ], { fontSize: 8.5, gap: 0.32 });
  addInfoBox(slide, 8.95, 3.55, 3.45, 1.65, "输出指标", [
    "严格成功率、定位达标率、确认率",
    "平均误差、累计能耗、平均信息时效",
  ], { fontSize: 8.5, gap: 0.32 });
  slide.addNotes(noteFor("感知融合与成功判定", [
    "在平台中，目标进入感知半径并不一定成功，还要满足视线无遮挡和视场角条件。",
    "探测成功后会生成带噪观测，并继续模拟链路丢包和延迟。",
    "最终融合不是简单平均，而是对观测权重进行修正，抑制异常观测。",
    "严格成功需要确认数、定位误差和一致性同时满足，因此这个指标更能反映协同感知质量。",
  ]));
}

// 11. Platform implementation
{
  const slide = slideBase("平台实现成果", 11, "第三章 平台实现", "最终实现了一个支持参数配置、三维回放、三策略对比和结果导出的 Web 平台。");
  addInfoBox(slide, 0.8, 1.72, 3.55, 2.05, "后端仿真引擎", [
    "Python 实现场景生成、状态推进和指标统计",
    "支持 RADS、随机派遣、全量派遣三策略同步推进",
    "会话机制保证多轮实验互不干扰",
  ], { fontSize: 8.4 });
  addInfoBox(slide, 4.85, 1.72, 3.55, 2.05, "前端展示交互", [
    "HTML/CSS/JavaScript 实现参数配置和结果展示",
    "WebGL 三维沙盘展示无人机、目标和障碍环境",
    "支持回放控制、目标高亮和多视图比较",
  ], { fontSize: 8.4 });
  addInfoBox(slide, 8.9, 1.72, 3.55, 2.05, "实验分析能力", [
    "输出策略核心指标和目标级任务详情",
    "支持 CSV 数据导出，便于论文图表整理",
    "平台结果可以直接支撑实验章节和答辩展示",
  ], { fontSize: 8.4 });
  addText(slide, "主要模块：src/simulation/core.py、pathfinding.py、src/web/server.py、static/app.js、scene3d-webgl.mjs", {
    x: 0.95,
    y: 4.72,
    w: 11.3,
    h: 0.35,
    fontSize: 10,
    color: C.navy,
    align: "center",
    bold: true,
  });
  slide.addNotes(noteFor("平台实现成果", [
    "平台实现部分主要分为后端仿真和前端展示两部分。",
    "后端负责复杂环境建模、三种策略调度、路径规划、感知融合和指标统计。",
    "前端负责参数配置、三维态势展示、回放控制、任务级分析和结果导出。",
    "这使得本毕设不是停留在算法公式，而是形成了一个可以实际运行和演示的系统。",
  ]));
}

// 12. Experiment design
{
  const slide = slideBase("实验设计", 12, "第四章 实验验证", "实验在同一场景下比较 RADS、随机派遣与全量派遣三种策略。");
  addInfoBox(slide, 0.85, 1.78, 3.5, 2.1, "对比策略", [
    "RADS：根据目标需求和节点效用动态选择子群",
    "随机派遣：使用同类预算但随机选择节点",
    "全量派遣：尽量投入所有可用无人机作为高资源基线",
  ], { fontSize: 8.4 });
  addInfoBox(slide, 4.85, 1.78, 3.5, 2.1, "评价指标", [
    "严格成功率、定位达标率、确认率",
    "平均定位误差、累计能耗、平均派机数量",
    "平均信息时效用于反映通信延迟影响",
  ], { fontSize: 8.4 });
  addInfoBox(slide, 8.85, 1.78, 3.5, 2.1, "实验变量", [
    "任务规模：目标数量由 6 增加到 10",
    "环境条件：天气、障碍复杂度",
    "通信条件：通信半径、丢包率、延迟",
  ], { fontSize: 8.4 });
  addText(slide, "公平性设计：三种策略运行在同一地图、同一目标初始状态、同一障碍和天气条件下。", {
    x: 1.0,
    y: 4.72,
    w: 11.2,
    h: 0.38,
    fontSize: 11,
    color: C.navy,
    bold: true,
    align: "center",
  });
  slide.addNotes(noteFor("实验设计", [
    "实验采用三策略对比方式，重点看 RADS 是否能在感知效果和资源消耗之间取得平衡。",
    "随机派遣作为缺乏精确调度的基线，全量派遣作为高资源投入的基线。",
    "为了保证对比公平，三种策略使用同一场景参数和同一环境约束，差异主要来自调度方式本身。",
  ]));
}

// 13. Default result
{
  const slide = slideBase("默认场景实验结果", 13, "第四章 实验验证", "RADS 成功率接近全量派遣，但能耗和派机规模明显更低。");
  const data = [
    { name: "严格成功率", labels: ["RADS", "随机", "全量"], values: [70.8, 16.7, 72.9] },
  ];
  slide.addChart(pptx.ChartType.bar, data, {
    x: 0.85,
    y: 1.75,
    w: 6.2,
    h: 3.2,
    showTitle: true,
    title: "严格成功率对比（%）",
    showLegend: false,
    showValue: true,
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    catAxis: { labelFontFace: FONT, labelFontSize: 9 },
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 8,
    dataLabelPosition: "outEnd",
    ser: [{ color: C.navy }],
  });
  addMetric(slide, 7.45, 1.78, 2.15, 1.25, "70.8%", "RADS 严格成功率", "与全量差距 2.1 个百分点");
  addMetric(slide, 10.05, 1.78, 2.15, 1.25, "47.6%", "能耗降低", "相较全量派遣");
  addMetric(slide, 7.45, 3.48, 2.15, 1.25, "9.52m", "平均定位误差", "全量为 8.07m");
  addMetric(slide, 10.05, 3.48, 2.15, 1.25, "9.4", "平均派机数量", "全量为 20.5");
  addText(slide, "结论：RADS 不是依靠增加节点数量，而是通过更有效的节点选择取得接近全量派遣的感知效果。", {
    x: 1.0,
    y: 5.35,
    w: 11.1,
    h: 0.36,
    fontSize: 10.8,
    bold: true,
    color: C.navy,
    align: "center",
  });
  slide.addNotes(noteFor("默认场景实验结果", [
    "默认场景下，RADS 的严格成功率为 70.8%，全量派遣为 72.9%，两者差距只有 2.1 个百分点，而随机派遣只有 16.7%。",
    "从误差看，全量派遣最好，RADS 次之，随机派遣最差，这符合三类策略特点。",
    "但资源消耗上，RADS 的累计能耗比全量派遣降低约 47.6%，平均派机数量也从 20.5 降到 9.4。",
    "这说明 RADS 的优势在于用更少资源取得接近全量派遣的效果。",
  ]));
}

// 14. Task scale
{
  const slide = slideBase("任务规模实验", 14, "第四章 实验验证", "目标数量增加后，RADS 会主动扩大子群，使成功率保持相对平稳。");
  slide.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["6目标", "10目标"], values: [70.8, 68.0] },
    { name: "随机派遣", labels: ["6目标", "10目标"], values: [16.7, 21.8] },
    { name: "全量派遣", labels: ["6目标", "10目标"], values: [72.9, 58.3] },
  ], {
    x: 0.85,
    y: 1.72,
    w: 6.25,
    h: 3.25,
    showTitle: true,
    title: "任务规模变化下严格成功率（%）",
    showLegend: true,
    legendPos: "b",
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    lineSize: 2,
    ser: [{ color: C.navy }, { color: C.red }, { color: "7D8793" }],
  });
  addInfoBox(slide, 7.55, 1.82, 4.55, 1.08, "实验设置", [
    "无人机数量保持 24 架，目标数由 6 增加到 10",
    "任务负载系数由 0.25 提升到约 0.42",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 3.1, 4.55, 1.08, "RADS 表现", [
    "严格成功率只下降 2.8 个百分点",
    "平均派机数量从 9.4 增至 14.3，说明会主动投入更多资源",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 4.38, 4.55, 1.08, "对比结论", [
    "全量派遣在高负载下下降更明显",
    "RADS 在任务扩展时综合稳定性更好",
  ], { fontSize: 8.4, gap: 0.28 });
  slide.addNotes(noteFor("任务规模实验", [
    "任务规模实验将目标数量从 6 个增加到 10 个，无人机数量保持不变，因此任务负载明显上升。",
    "RADS 的严格成功率只下降 2.8 个百分点，同时平均派机数量上升，说明算法会根据任务压力主动扩大感知子群。",
    "全量派遣虽然投入资源多，但在扩展任务规模下成功率下降更明显。",
    "因此，在任务规模变化时，RADS 体现出较好的适应性。",
  ]));
}

// 15. Weather
{
  const slide = slideBase("天气扰动实验", 15, "第四章 实验验证", "天气恶化会降低感知半径、增加噪声和延迟，三种策略均受到影响。");
  slide.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [70.8, 60.8, 48.3, 34.2] },
    { name: "随机派遣", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [16.7, 9.2, 8.3, 6.7] },
    { name: "全量派遣", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [72.9, 74.6, 67.9, 50.0] },
  ], {
    x: 0.85,
    y: 1.72,
    w: 6.25,
    h: 3.25,
    showTitle: true,
    title: "天气变化下严格成功率（%）",
    showLegend: true,
    legendPos: "b",
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    lineSize: 2,
    ser: [{ color: C.navy }, { color: C.red }, { color: "7D8793" }],
  });
  addInfoBox(slide, 7.55, 1.82, 4.55, 1.08, "天气影响机制", [
    "感知半径收缩、视场角变化、观测噪声增大",
    "链路质量下降，丢包率和延迟增加",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 3.1, 4.55, 1.08, "实验现象", [
    "RADS 从晴空 70.8% 降至雷暴 34.2%",
    "随机派遣始终最低，极端天气下只有 6.7%",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 4.38, 4.55, 1.08, "分析结论", [
    "极端扰动会压低所有策略上限",
    "RADS 仍明显优于随机派遣，但不能完全抵消天气影响",
  ], { fontSize: 8.4, gap: 0.28 });
  slide.addNotes(noteFor("天气扰动实验", [
    "天气实验设置了晴空、薄雾、降雨和雷暴四类条件。",
    "随着天气恶化，感知半径、视场、噪声、链路质量和延迟都会受到影响，因此三种策略整体都有下降趋势。",
    "RADS 在雷暴条件下降到 34.2%，说明极端环境仍会明显削弱系统性能。",
    "但它仍明显高于随机派遣，说明动态选择链路和路径条件较好的节点仍然有价值。",
  ]));
}

// 16. Obstacles
{
  const slide = slideBase("障碍环境实验", 16, "第四章 实验验证", "障碍物会影响路径代价和可见性，RADS 将绕障距离和视线条件纳入调度。");
  slide.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["34障碍", "50障碍"], values: [70.8, 68.8] },
    { name: "随机派遣", labels: ["34障碍", "50障碍"], values: [16.7, 19.6] },
    { name: "全量派遣", labels: ["34障碍", "50障碍"], values: [72.9, 74.6] },
  ], {
    x: 0.85,
    y: 1.72,
    w: 6.25,
    h: 3.25,
    showTitle: true,
    title: "障碍复杂度下严格成功率（%）",
    showLegend: true,
    legendPos: "b",
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    lineSize: 2,
    ser: [{ color: C.navy }, { color: C.red }, { color: "7D8793" }],
  });
  addInfoBox(slide, 7.55, 1.82, 4.55, 1.08, "实验设置", [
    "障碍物数量由 34 个增加到 50 个",
    "其余参数保持不变，观察障碍密度影响",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 3.1, 4.55, 1.08, "RADS 表现", [
    "严格成功率从 70.8% 小幅变为 68.8%",
    "平均误差从 9.52 m 增至 10.21 m",
  ], { fontSize: 8.4, gap: 0.28 });
  addInfoBox(slide, 7.55, 4.38, 4.55, 1.08, "调度意义", [
    "只看欧氏距离容易选到被遮挡节点",
    "引入路径代价和视线判断可减少无效派机",
  ], { fontSize: 8.4, gap: 0.28 });
  slide.addNotes(noteFor("障碍环境实验", [
    "障碍环境实验将障碍物数量从 34 个增加到 50 个。",
    "RADS 的成功率只发生小幅变化，平均误差略有增加，整体仍比较稳定。",
    "这是因为 RADS 在调度时考虑了绕障路径代价和视线可达性，而不是只看直线距离。",
    "因此，在存在遮挡和绕障成本时，动态子群选择能够减少一部分无效派机。",
  ]));
}

// 17. Communication
{
  const slide = slideBase("通信条件实验", 17, "第四章 实验验证", "通信半径、丢包率和延迟决定观测结果能否及时参与融合。");
  slide.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["300m", "400m", "500m"], values: [70.8, 81.7, 78.3] },
  ], {
    x: 0.85,
    y: 1.72,
    w: 6.25,
    h: 3.25,
    showTitle: true,
    title: "通信半径变化下 RADS 严格成功率（%）",
    showLegend: false,
    legendPos: "b",
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    lineSize: 2,
    ser: [{ color: C.navy }],
  });
  addInfoBox(slide, 7.55, 1.82, 4.55, 1.08, "通信半径", [
    "300 m 到 400 m 时，RADS 由 70.8% 提升到 81.7%",
    "继续扩大到 500 m 后增益趋于饱和",
  ], { fontSize: 8.2, gap: 0.28 });
  addInfoBox(slide, 7.55, 3.1, 4.55, 1.08, "链路丢包", [
    "丢包率从 0% 到 10%，RADS 由 77.9% 降至 65.0%",
    "有效观测减少会直接削弱融合质量",
  ], { fontSize: 8.2, gap: 0.28 });
  addInfoBox(slide, 7.55, 4.38, 4.55, 1.08, "通信延迟", [
    "延迟从 0 步到 2 步，RADS 降至 60.0%",
    "信息时效变差，融合结果更依赖滞后观测",
  ], { fontSize: 8.2, gap: 0.28 });
  slide.addNotes(noteFor("通信条件实验", [
    "通信条件实验分别考察通信半径、链路丢包率和通信延迟。",
    "通信半径适度扩大可以提升信息共享效率，但超过一定范围后收益会趋于饱和。",
    "丢包率升高会减少有效观测数量，通信延迟会降低观测的新鲜程度。",
    "RADS 在调度时考虑链路质量，因此在不同通信条件下整体表现比较稳定。",
  ]));
}

// 18. Overall analysis
{
  const slide = slideBase("综合结果分析", 18, "第四章 实验验证", "RADS 的优势不是单项绝对最优，而是在效果与资源之间取得更合理平衡。");
  slide.addChart(pptx.ChartType.bar, [
    { name: "平均严格成功率", labels: ["RADS", "随机", "全量"], values: [64.9, 17.1, 70.3] },
  ], {
    x: 0.85,
    y: 1.72,
    w: 6.25,
    h: 3.25,
    showTitle: true,
    title: "多组实验平均严格成功率（%）",
    showLegend: false,
    legendPos: "b",
    valAxis: { minVal: 0, maxVal: 80, majorUnit: 20 },
    ser: [{ color: C.navy }],
  });
  addMetric(slide, 7.45, 1.78, 2.15, 1.25, "64.9%", "平均严格成功率", "显著高于随机 17.1%");
  addMetric(slide, 10.05, 1.78, 2.15, 1.25, "49.5%", "平均能耗占比", "约为全量派遣的一半");
  addMetric(slide, 7.45, 3.48, 2.15, 1.25, "10.91m", "平均定位误差", "低于随机，高于全量");
  addMetric(slide, 10.05, 3.48, 2.15, 1.25, "8.8", "平均派机数量", "全量为 20.4");
  addText(slide, "综合判断：随机派遣简单但不稳定；全量派遣精度高但代价大；RADS 更符合低资源高质量协同感知目标。", {
    x: 0.95,
    y: 5.35,
    w: 11.3,
    h: 0.38,
    fontSize: 10.6,
    bold: true,
    color: C.navy,
    align: "center",
  });
  slide.addNotes(noteFor("综合结果分析", [
    "把多组实验平均后，RADS 的平均严格成功率为 64.9%，明显高于随机派遣的 17.1%，接近全量派遣的 70.3%。",
    "在平均误差上，全量派遣最好，RADS 次之，随机派遣最差。",
    "但能耗和派机数量上，RADS 明显低于全量派遣，平均能耗只有全量派遣的约 49.5%。",
    "因此，RADS 的价值不在于所有单项指标都最优，而在于综合表现更均衡。",
  ]));
}

// 19. Innovation
{
  const slide = slideBase("创新点", 19, "第五章 创新点与总结", "本课题的创新主要体现在复杂建模、动态调度和可解释平台三个层面。");
  addInfoBox(slide, 0.85, 1.75, 2.75, 2.28, "平台创新", [
    "实现可运行、可配置、可回放的协同态势感知平台",
    "支持三策略同步对比和实验结果导出",
  ], { fontSize: 8.5, gap: 0.34 });
  addInfoBox(slide, 3.95, 1.75, 2.75, 2.28, "算法创新", [
    "提出 RADS 动态子群选择方法",
    "综合目标需求、节点能力和环境约束生成派机结果",
  ], { fontSize: 8.5, gap: 0.34 });
  addInfoBox(slide, 7.05, 1.75, 2.75, 2.28, "建模创新", [
    "将障碍遮挡、路径代价、天气扰动、链路丢包和故障统一建模",
    "增强实验场景的真实性和可分析性",
  ], { fontSize: 8.5, gap: 0.3 });
  addInfoBox(slide, 10.15, 1.75, 2.4, 2.28, "评价创新", [
    "不只看总体指标，还提供任务级分析",
    "通过三维展示解释策略差异和失败原因",
  ], { fontSize: 8.5, gap: 0.3 });
  addText(slide, "一句话概括：把“算法效果”放进可运行平台和可解释实验流程中进行验证。", {
    x: 1.25,
    y: 4.95,
    w: 10.8,
    h: 0.38,
    fontSize: 11.2,
    bold: true,
    color: C.navy,
    align: "center",
  });
  slide.addNotes(noteFor("创新点", [
    "本课题的创新点可以从四个方面说明。",
    "第一是平台层面，完成了一个可运行、可配置、可回放、可导出的综合实验平台。",
    "第二是算法层面，提出了 RADS 动态子群选择方法，把目标需求和节点能力结合起来。",
    "第三是建模层面，把障碍、天气、丢包、延迟和故障纳入统一仿真。",
    "第四是评价层面，平台不仅输出总体指标，也支持任务级分析和三维场景解释。",
  ]));
}

// 20. Conclusion
{
  const slide = slideBase("总结与展望", 20, "第五章 创新点与总结", "本文完成了从模型、算法、平台到实验的闭环验证。");
  addInfoBox(slide, 0.75, 1.74, 2.95, 2.28, "研究成果", [
    "完成无人机集群多任务协同态势感知平台",
    "实现 RADS、随机派遣和全量派遣三策略对比",
    "形成可视化展示、任务级分析和数据导出能力",
  ], { fontSize: 8.3, gap: 0.28 });
  addInfoBox(slide, 3.95, 1.74, 2.95, 2.28, "实验结论", [
    "RADS 明显优于随机派遣",
    "成功率接近全量派遣，资源消耗远低于全量派遣",
    "在任务规模和通信条件变化下表现较稳定",
  ], { fontSize: 8.3, gap: 0.28 });
  addInfoBox(slide, 7.15, 1.74, 2.95, 2.28, "存在不足", [
    "当前仍属于论文级仿真平台",
    "尚未接入高保真飞行动力学和真实传感器模型",
    "RADS 参数权重仍具有经验性",
  ], { fontSize: 8.3, gap: 0.28 });
  addInfoBox(slide, 10.35, 1.74, 2.25, 2.28, "未来工作", [
    "扩展批量实验与统计分析",
    "优化参数权重和调度策略",
    "探索对接 ROS/PX4 等平台",
  ], { fontSize: 8.3, gap: 0.28 });
  addText(slide, "谢谢各位老师，请批评指正！", {
    x: 3.45,
    y: 5.22,
    w: 6.45,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: C.navy,
    align: "center",
  });
  slide.addNotes(noteFor("总结与展望", [
    "最后做一个总结：本课题完成了复杂场景建模、RADS 算法设计、Web 平台实现和多组实验分析。",
    "实验结果说明，RADS 相比随机派遣有明显优势，相比全量派遣能以更低资源消耗获得接近的感知效果。",
    "当前系统仍属于论文级仿真平台，后续可以继续引入更高保真的动力学模型、真实传感器模型，并进一步优化算法参数。",
    "我的汇报到此结束，谢谢各位老师，请批评指正。",
  ]));
}

async function main() {
  await pptx.writeFile({ fileName: PPTX_PATH, compression: true });
  const copyPath = path.join(OUT_DIR, "基于集群的多任务协同态势感知平台_本科毕设答辩.pptx");
  fs.copyFileSync(PPTX_PATH, copyPath);
  console.log(PPTX_PATH);
  console.log(copyPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
