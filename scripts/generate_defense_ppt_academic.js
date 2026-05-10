const path = require("path");
const fs = require("fs");
const os = require("os");
const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333, height: 7.5 });
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

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "defense_ppt_academic");
const LOGO = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-cropped.png");
const DESKTOP = path.join(os.homedir(), "Desktop");
const PPTX_PATH = path.join(DESKTOP, "基于集群的多任务协同态势感知平台_本科毕设答辩_学术增强版.pptx");
fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  navy: "082B59",
  navy2: "123C72",
  red: "A5322B",
  red2: "B9473D",
  gray: "4B5563",
  gray2: "6B7280",
  line: "C8D2E1",
  pale: "F6F8FC",
  pale2: "EEF3FA",
  white: "FFFFFF",
  ink: "1F2937",
  gold: "C99B4E",
  green: "527D3C",
};
const FONT = "Microsoft YaHei";

function addText(slide, txt, opt) {
  slide.addText(txt, {
    fontFace: FONT,
    margin: 0,
    fit: "shrink",
    breakLine: false,
    ...opt,
  });
}

function note(title, lines) {
  return `【${title}】\n${lines.join("\n")}`;
}

function header(slide, no, section = "本科毕业设计答辩") {
  slide.addImage({ path: LOGO, x: 0.35, y: 0.16, w: 2.28, h: 0.66 });
  slide.addShape(pptx.ShapeType.line, {
    x: 2.86,
    y: 0.49,
    w: 9.82,
    h: 0,
    line: { color: C.red, width: 1.2 },
  });
  addText(slide, section, {
    x: 10.35,
    y: 0.22,
    w: 2.25,
    h: 0.24,
    fontSize: 9.5,
    color: C.gray,
    align: "right",
  });
  footer(slide, no);
}

function footer(slide, no) {
  addCampusLine(slide);
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.30, w: 10.82, h: 0.09, line: { color: C.navy }, fill: { color: C.navy } });
  slide.addShape(pptx.ShapeType.rect, { x: 11.05, y: 7.30, w: 2.28, h: 0.09, line: { color: C.red }, fill: { color: C.red } });
  addText(slide, "基于集群的多任务协同态势感知平台", {
    x: 0.52,
    y: 7.02,
    w: 4.2,
    h: 0.16,
    fontSize: 7.8,
    color: "8593A5",
  });
  addText(slide, String(no).padStart(2, "0"), {
    x: 12.42,
    y: 7.0,
    w: 0.38,
    h: 0.16,
    fontSize: 8.5,
    color: C.gray,
    align: "right",
  });
}

function addCampusLine(slide) {
  const y = 6.63;
  const line = { color: "DDE5EF", width: 0.75, transparency: 8 };
  const buildings = [
    [0.3, y + 0.17, 0.85, 0.27], [1.35, y + 0.04, 0.58, 0.4], [2.12, y + 0.16, 0.92, 0.28],
    [3.28, y + 0.02, 0.6, 0.42], [4.15, y + 0.18, 0.92, 0.26], [5.33, y + 0.12, 0.75, 0.32],
    [8.62, y + 0.18, 0.78, 0.26], [9.72, y + 0.10, 0.92, 0.34], [11.55, y - 0.18, 0.3, 0.62],
    [12.25, y + 0.16, 0.82, 0.28],
  ];
  buildings.forEach(([x, yy, w, h]) => {
    slide.addShape(pptx.ShapeType.rect, { x, y: yy, w, h, line, fill: { color: C.white, transparency: 100 } });
  });
  slide.addShape(pptx.ShapeType.triangle, { x: 11.5, y: y - 0.34, w: 0.42, h: 0.22, line, fill: { color: C.white, transparency: 100 } });
  slide.addShape(pptx.ShapeType.line, { x: 0.25, y: y + 0.45, w: 12.85, h: 0, line });
  [0.88, 1.15, 6.18, 6.5, 8.1, 8.4, 12.65].forEach((x) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.2, w: 0.18, h: 0.18, line, fill: { color: C.white, transparency: 100 } });
    slide.addShape(pptx.ShapeType.line, { x: x + 0.09, y: y + 0.38, w: 0, h: 0.11, line });
  });
}

function title(slide, txt, sub) {
  addText(slide, txt, {
    x: 0.72,
    y: 1.0,
    w: 4.8,
    h: 0.42,
    fontSize: 20,
    color: C.navy,
    bold: true,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.72,
    y: 1.50,
    w: 1.18,
    h: 0.04,
    line: { color: C.red },
    fill: { color: C.red },
  });
  if (sub) {
    addText(slide, sub, {
      x: 2.05,
      y: 1.42,
      w: 8.9,
      h: 0.28,
      fontSize: 10.2,
      color: C.gray,
    });
  }
}

function base(titleText, no, section, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  header(slide, no, section);
  title(slide, titleText, subtitle);
  return slide;
}

function bullet(slide, txt, x, y, w, opts = {}) {
  const color = opts.color || C.red;
  slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.11, w: 0.08, h: 0.08, line: { color }, fill: { color } });
  addText(slide, txt, {
    x: x + 0.2,
    y,
    w,
    h: opts.h || 0.28,
    fontSize: opts.fontSize || 13.5,
    color: opts.textColor || C.ink,
    bold: opts.bold || false,
  });
}

function bullets(slide, items, x, y, w, opts = {}) {
  const gap = opts.gap || 0.42;
  items.forEach((t, i) => bullet(slide, t, x, y + i * gap, w, opts));
}

function panel(slide, x, y, w, h, head, items, opts = {}) {
  const bodyFontSize = Math.max(opts.fontSize || 11.8, 11.2);
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: opts.line || "AEBBD0", width: 1.05 },
    fill: { color: opts.fill || C.white },
  });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, line: { color: opts.accent || C.red }, fill: { color: opts.accent || C.red } });
  addText(slide, head, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.32,
    h: 0.32,
    fontSize: opts.headSize || 14.5,
    bold: true,
    color: opts.headColor || C.navy,
  });
  bullets(slide, items, x + 0.22, y + 0.68, w - 0.45, {
    fontSize: bodyFontSize,
    gap: opts.gap || 0.35,
    h: opts.itemH || 0.28,
    color: opts.bulletColor || C.red,
  });
}

function slideBox(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: opts.line || "B8C4D6", width: opts.width || 1 },
    fill: { color: opts.fill || C.white },
  });
}

function smallPanel(slide, x, y, w, h, head, body) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, line: { color: "B8C4D6", width: 1 }, fill: { color: C.white } });
  addText(slide, head, { x: x + 0.16, y: y + 0.16, w: w - 0.32, h: 0.28, fontSize: 13.5, bold: true, color: C.navy });
  addText(slide, body, { x: x + 0.16, y: y + 0.56, w: w - 0.32, h: h - 0.7, fontSize: 11.5, color: C.ink, breakLine: false });
}

function metric(slide, x, y, w, h, value, label, noteText) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h, line: { color: "B8C4D6", width: 1 }, fill: { color: C.white } });
  addText(slide, value, { x: x + 0.1, y: y + 0.2, w: w - 0.2, h: 0.38, fontSize: 19, color: C.red, bold: true, align: "center" });
  addText(slide, label, { x: x + 0.15, y: y + 0.72, w: w - 0.3, h: 0.26, fontSize: 10.5, color: C.navy, bold: true, align: "center" });
  addText(slide, noteText, { x: x + 0.15, y: y + 1.05, w: w - 0.3, h: 0.22, fontSize: 9.2, color: C.gray, align: "center" });
}

function flow(slide, nodes, x, y, w, h) {
  const gap = 0.18;
  const nw = (w - (nodes.length - 1) * gap) / nodes.length;
  nodes.forEach((n, i) => {
    const nx = x + i * (nw + gap);
    slide.addShape(pptx.ShapeType.rect, { x: nx, y, w: nw, h, line: { color: "AEBBD0", width: 1 }, fill: { color: C.white } });
    addText(slide, n[0], { x: nx + 0.12, y: y + 0.18, w: nw - 0.24, h: 0.28, fontSize: 12.5, bold: true, color: C.navy, align: "center" });
    addText(slide, n[1], { x: nx + 0.13, y: y + 0.56, w: nw - 0.26, h: h - 0.7, fontSize: 10.1, color: C.gray, align: "center" });
    if (i < nodes.length - 1) {
      slide.addShape(pptx.ShapeType.rightArrow, { x: nx + nw - 0.03, y: y + h / 2 - 0.12, w: 0.28, h: 0.24, line: { color: C.red, transparency: 100 }, fill: { color: C.red } });
    }
  });
}

function addFormula(slide, x, y, w, text, desc) {
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.62, line: { color: "B8C4D6" }, fill: { color: C.pale } });
  addText(slide, text, { x: x + 0.15, y: y + 0.16, w: w - 0.3, h: 0.22, fontSize: 14, bold: true, color: C.navy, align: "center" });
  if (desc) addText(slide, desc, { x, y: y + 0.69, w, h: 0.2, fontSize: 9.4, color: C.gray, align: "center" });
}

function addNetwork(slide, x, y, s = 1) {
  const pts = [[0, .8], [.75, .45], [1.5, .95], [2.15, .35], [2.85, .85], [3.48, .28], [4.1, .72]].map(([a, b]) => [x + a * s, y + b * s]);
  [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6]].forEach(([a,b])=>{
    slide.addShape(pptx.ShapeType.line, { x: pts[a][0], y: pts[a][1], w: pts[b][0]-pts[a][0], h: pts[b][1]-pts[a][1], line: { color: "B6C2D2", width: 1.1, transparency: 25 } });
  });
  pts.forEach((p,i)=>slide.addShape(pptx.ShapeType.ellipse,{x:p[0]-0.045,y:p[1]-0.045,w:0.09,h:0.09,line:{color:i%2?C.red:C.navy},fill:{color:i%2?C.red:C.navy,transparency:5}}));
}

function sectionSlide(no, chapterNo, chapterTitle, desc) {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  header(slide, no, "章节过渡");

  const guide = {
    1: {
      question: ["为什么需要多机协同而非单机执行", "复杂环境如何削弱感知可靠性", "本文研究问题如何界定"],
      handle: ["多目标并行", "障碍/天气/通信", "调度-感知-融合闭环"],
      output: ["研究背景", "问题边界", "技术路线"],
      link: "承接关系：从现实应用需求出发，收敛到“有限资源下如何动态选择感知子群”的核心问题。",
    },
    2: {
      question: ["平台如何表达复杂任务区域", "哪些状态变量会影响调度决策", "系统架构如何支撑实验闭环"],
      handle: ["场景状态建模", "路径与视线约束", "前后端分层架构"],
      output: ["默认参数", "状态模型", "系统总体架构"],
      link: "承接关系：先把环境和系统边界建清楚，再让算法在同一模型内进行调度和验证。",
    },
    3: {
      question: ["目标需求如何量化", "无人机效用如何比较", "派机规模如何随任务压力变化"],
      handle: ["目标风险评分", "节点效用函数", "动态预算与贪心选择"],
      output: ["RADS 思路", "需求/效用公式", "调度流程"],
      link: "承接关系：把多因素约束转换为可计算的评分，使每一步派机都有明确依据。",
    },
    4: {
      question: ["平台是否形成可运行成果", "实验如何保证三策略公平比较", "结果能否支撑本文结论"],
      handle: ["三策略同步仿真", "多变量扰动实验", "效果-资源综合评价"],
      output: ["功能模块", "实验指标", "结果与创新点"],
      link: "承接关系：通过平台运行过程和实验数据，证明 RADS 的资源效率与综合稳定性。",
    },
  }[chapterNo];

  addText(slide, String(chapterNo).padStart(2, "0"), { x: 0.9, y: 1.45, w: 1.9, h: 0.92, fontSize: 54, bold: true, color: C.navy, align: "center" });
  addText(slide, "CHAPTER", { x: 3.08, y: 1.48, w: 2.0, h: 0.24, fontSize: 14.5, bold: true, color: C.red });
  addText(slide, chapterTitle, { x: 3.08, y: 1.88, w: 7.5, h: 0.44, fontSize: 23.5, bold: true, color: C.navy });
  slide.addShape(pptx.ShapeType.line, { x: 3.08, y: 2.48, w: 5.1, h: 0, line: { color: C.red, width: 1.2 } });
  addText(slide, desc, { x: 3.08, y: 2.72, w: 7.8, h: 0.44, fontSize: 13.5, color: C.gray, breakLine: false });
  addNetwork(slide, 9.4, 2.45, 0.72);

  panel(slide, 0.85, 3.55, 3.55, 1.55, "本章回答", guide.question, { fontSize: 11.2, gap: 0.31 });
  panel(slide, 4.88, 3.55, 3.55, 1.55, "方法抓手", guide.handle, { fontSize: 11.2, gap: 0.31, accent: C.navy });
  panel(slide, 8.9, 3.55, 3.25, 1.55, "汇报落点", guide.output, { fontSize: 11.2, gap: 0.31, accent: C.red });
  addText(slide, guide.link, {
    x: 0.95,
    y: 5.52,
    w: 11.35,
    h: 0.34,
    fontSize: 12.5,
    bold: true,
    color: C.navy,
    align: "center",
  });
  return slide;
}

// 1 Cover
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  slide.addImage({ path: LOGO, x: 0.45, y: 0.25, w: 3.15, h: 0.92 });
  slide.addShape(pptx.ShapeType.line, { x: 3.92, y: 0.45, w: 0, h: 0.62, line: { color: C.red, width: 2 } });
  addText(slide, "本科毕业设计（论文）答辩\n信息工程学院", { x: 4.15, y: 0.43, w: 3.3, h: 0.62, fontSize: 14.5, color: C.gray });
  addText(slide, "THESIS DEFENSE", { x: 1.3, y: 2.48, w: 2.4, h: 0.3, fontSize: 14, color: C.red, bold: true });
  addText(slide, "基于集群的多任务协同\n态势感知平台", { x: 1.3, y: 2.87, w: 7.0, h: 1.05, fontSize: 32, bold: true, color: C.navy });
  slide.addShape(pptx.ShapeType.line, { x: 1.3, y: 4.18, w: 5.1, h: 0, line: { color: C.red, width: 1.3 } });
  bullets(slide, ["学生：贺小双", "专业班级：计算机科学与技术（22级）", "指导教师：陈益杉 副教授", "答辩日期：2026年6月"], 1.35, 4.58, 4.5, { fontSize: 13.2, gap: 0.39, color: C.navy });
  addNetwork(slide, 8.6, 4.15, 1.1);
  footer(slide, 1);
  slide.addNotes(note("封面页", [
    "各位老师好，我的毕业设计题目是《基于集群的多任务协同态势感知平台》。",
    "这项工作围绕复杂环境下无人机集群多目标协同感知展开，既包括核心算法 RADS，也包括可运行的 Web 仿真与可视化平台。",
    "下面我将按照研究背景、问题分析、方法设计、平台实现、实验验证和总结展望几个部分进行汇报。"
  ]));
}

// 2 Agenda
{
  const s = base("目录", 2, "答辩目录", "围绕研究逻辑展开：为什么做、解决什么、怎么实现、结果如何、价值在哪。");
  const items = ["研究背景与问题分析", "系统建模与总体设计", "RADS 动态子群选择方法", "平台实现与实验验证", "创新点、结论与展望"];
  items.forEach((it, i) => {
    const y = 1.82 + i * 0.72;
    s.addShape(pptx.ShapeType.rect, { x: 4.0, y, w: 0.48, h: 0.4, line: { color: C.navy }, fill: { color: C.navy } });
    addText(s, String(i + 1).padStart(2, "0"), { x: 4.09, y: y + 0.08, w: 0.3, h: 0.16, fontSize: 10.5, bold: true, color: C.white, align: "center" });
    addText(s, it, { x: 4.85, y: y + 0.06, w: 4.9, h: 0.24, fontSize: 14.5, bold: true, color: C.ink });
    s.addShape(pptx.ShapeType.line, { x: 4.85, y: y + 0.48, w: 4.6, h: 0, line: { color: C.line, width: 0.8 } });
  });
  addText(s, "建议答辩节奏：背景与问题约2分钟，方法与平台约4分钟，实验与总结约4分钟。", { x: 2.1, y: 5.82, w: 9.4, h: 0.32, fontSize: 13, color: C.gray, align: "center" });
  s.addNotes(note("目录页", [
    "这一页是汇报目录。我会先说明为什么需要研究无人机集群协同态势感知，然后分析现有方法不足。",
    "随后介绍复杂场景建模、RADS 动态子群选择算法和平台实现。",
    "最后通过三类策略对比和多种环境实验说明算法效果，并总结创新点与不足。"
  ]));
}

// 3 Section
{
  const s = sectionSlide(3, 1, "第一章 研究背景与问题分析", "本章说明课题来源、现实需求以及复杂环境下多任务协同态势感知的关键矛盾。");
  s.addNotes(note("章节页：研究背景", ["下面进入第一部分，研究背景与问题分析。这里重点回答两个问题：为什么要做无人机集群协同感知，以及现有方法在复杂环境下有哪些不足。"]));
}

// 4 Research background
{
  const s = base("研究背景与应用价值", 4, "第一章 研究背景", "无人机集群逐步从单机执行走向多机协同，复杂环境下的态势感知质量直接影响任务效果。");
  panel(s, 0.72, 1.82, 3.75, 2.2, "应用需求提升", [
    "安防巡检、灾害救援、边境监测、应急侦察等场景需要大范围快速覆盖",
    "单架无人机容易受到续航、视场和载荷能力限制，难以长期稳定完成任务",
    "集群化可以提升区域覆盖、任务并行和系统冗余能力"
  ], { fontSize: 11.2, gap: 0.38 });
  panel(s, 4.8, 1.82, 3.75, 2.2, "环境复杂性增强", [
    "目标具有移动性和不确定性，目标位置、速度、优先级会随时间变化",
    "场景中存在障碍遮挡、视线受限、禁入区域和绕障路径代价",
    "通信链路还会受到距离、天气、丢包和延迟影响"
  ], { fontSize: 11.2, gap: 0.38 });
  panel(s, 8.88, 1.82, 3.75, 2.2, "平台验证必要性", [
    "仅有理论公式不利于观察算法在动态场景中的实际行为",
    "需要把调度、运动、感知、通信、融合和评价放在同一流程中验证",
    "可视化平台能够支撑论文实验、结果解释和答辩展示"
  ], { fontSize: 11.2, gap: 0.38 });
  addFormula(s, 1.2, 4.62, 10.9, "态势感知 = 环境状态 + 目标状态 + 集群状态 + 任务执行状态", "核心目标是形成持续、准确、可更新的全局理解，而不是一次性静态输出。");
  s.addNotes(note("研究背景与应用价值", [
    "无人机集群在巡检、救援、侦察等场景中有明显应用价值，因为它能够扩大覆盖范围并提升并行处理能力。",
    "但真实环境并不理想，目标会移动，障碍会遮挡，通信链路也可能丢包或延迟。",
    "因此，本文需要研究的是一个包含调度、感知、融合和可视化验证的完整平台，而不是单一算法片段。"
  ]));
}

// 5 Existing problems
{
  const s = base("现有方法存在的问题", 5, "第一章 研究背景", "把已有无人机集群感知方法放到复杂任务环境中看，仍存在模型、调度和评价三类不足。");
  flow(s, [
    ["理想化建模", "常假设通信稳定、障碍影响弱、节点始终可用"],
    ["静态资源分配", "固定规模派机难以适应目标需求变化"],
    ["局部指标评价", "只看精度或覆盖率，忽略能耗与时效"],
    ["展示解释不足", "缺少三维过程回放和任务级失败原因分析"],
  ], 0.9, 1.85, 11.5, 1.15);
  panel(s, 0.9, 3.55, 3.45, 1.55, "问题一：环境约束考虑不充分", [
    "障碍遮挡、视场角、天气扰动、链路波动和节点故障往往被弱化",
    "算法在理想条件下有效，不代表在复杂场景中稳定"
  ], { fontSize: 10.8, gap: 0.36 });
  panel(s, 4.92, 3.55, 3.45, 1.55, "问题二：任务调度缺少动态性", [
    "多目标任务中，不同目标的优先级与不确定性不同",
    "固定派机或随机派机容易造成资源错配"
  ], { fontSize: 10.8, gap: 0.36 });
  panel(s, 8.95, 3.55, 3.45, 1.55, "问题三：实验论证不够直观", [
    "单纯数值结果很难解释某个目标为何成功或失败",
    "答辩展示需要把指标、过程和空间关系联系起来"
  ], { fontSize: 10.8, gap: 0.36 });
  s.addNotes(note("现有方法存在的问题", [
    "现有方法的不足主要体现在三方面：环境建模偏理想、资源分配不够灵活、实验展示不够完整。",
    "多任务条件下，如果仍然按固定规模或随机方式派机，就很难根据目标需求和节点状态进行有效调整。",
    "因此，本课题需要构建一个更完整的平台，并设计能够动态选择感知子群的调度方法。"
  ]));
}

// 6 Research content
{
  const s = base("研究内容与技术路线", 6, "第一章 研究背景", "本文采用“复杂场景建模—RADS 算法设计—平台实现—实验验证”的技术路线。");
  flow(s, [
    ["需求分析", "明确复杂环境与答辩展示需求"],
    ["场景建模", "无人机、目标、障碍、天气、通信与故障"],
    ["RADS调度", "目标需求评估、节点效用评分、动态预算"],
    ["平台实现", "后端仿真引擎 + 前端三维态势沙盘"],
    ["实验验证", "默认场景、多变量扰动、三策略比较"],
  ], 0.72, 1.85, 11.9, 1.25);
  panel(s, 0.95, 3.72, 3.25, 1.52, "研究内容一", ["构建复杂环境仿真模型，使实验能够表达障碍、视线、通信和故障等因素"], { fontSize: 11.2, gap: 0.35 });
  panel(s, 5.0, 3.72, 3.25, 1.52, "研究内容二", ["设计 RADS 动态子群选择方法，在任务需求与资源消耗之间取得平衡"], { fontSize: 11.2, gap: 0.35 });
  panel(s, 9.05, 3.72, 3.25, 1.52, "研究内容三", ["实现可配置、可回放、可对比和可导出的协同态势感知平台"], { fontSize: 11.2, gap: 0.35 });
  s.addNotes(note("研究内容与技术路线", [
    "本文的研究内容可以概括为四个步骤：先分析需求，再构建复杂场景模型，然后设计 RADS 算法，最后实现平台并进行实验验证。",
    "平台需要具备参数配置、三维展示、三策略比较、任务级分析和结果导出能力。",
    "通过这条技术路线，论文从理论分析落实到可运行系统和实验数据。"
  ]));
}

// 7 Section
{
  const s = sectionSlide(7, 2, "第二章 系统建模与总体设计", "本章说明平台如何表达复杂环境，以及前后端如何组织为一个完整实验系统。");
  s.addNotes(note("章节页：系统建模", ["下面进入第二部分，系统建模与总体设计。这里会说明平台中的任务区域、无人机、目标、障碍、通信和天气如何建模，以及整体系统架构。"]));
}

// 8 Architecture
{
  const s = base("系统总体架构设计", 8, "第二章 系统建模", "平台采用轻量级前后端分离结构，将界面展示、会话管理和仿真计算分层组织。");
  const rows = [
    ["表示层", "参数配置、运行控制、三维态势沙盘、指标卡片、任务级表格、CSV 导出"],
    ["业务控制层", "HTTP 接口、实验会话创建与推进、统一快照组织、多轮实验隔离"],
    ["仿真计算层", "环境生成、路径规划、三策略调度、感知判定、观测融合、指标统计"],
  ];
  rows.forEach((r, i) => {
    const y = 1.86 + i * 1.1;
    s.addShape(pptx.ShapeType.rect, { x: 0.98, y, w: 11.4, h: 0.85, line: { color: C.line }, fill: { color: i === 1 ? C.pale : C.white } });
    s.addShape(pptx.ShapeType.rect, { x: 0.98, y, w: 1.55, h: 0.85, line: { color: i === 1 ? C.red : C.navy }, fill: { color: i === 1 ? C.red : C.navy } });
    addText(s, r[0], { x: 1.16, y: y + 0.25, w: 1.2, h: 0.24, fontSize: 13, bold: true, color: C.white, align: "center" });
    addText(s, r[1], { x: 2.85, y: y + 0.25, w: 8.9, h: 0.25, fontSize: 13, color: C.ink });
  });
  addText(s, "实现映射：app.py → src/web/server.py → src/web/sessions.py → src/simulation/core.py / pathfinding.py", {
    x: 1.0, y: 5.52, w: 11.2, h: 0.35, fontSize: 12.2, color: C.navy, bold: true, align: "center"
  });
  s.addNotes(note("系统总体架构设计", [
    "平台整体分为表示层、业务控制层和仿真计算层。",
    "表示层负责用户交互和结果展示，业务控制层负责会话和接口，仿真计算层负责核心模型和算法。",
    "这种分层结构使系统功能边界清晰，也便于后续增加新的策略、指标或展示模块。"
  ]));
}

// 9 Scenario model
{
  const s = base("复杂场景与状态建模", 9, "第二章 系统建模", "平台将任务区域、无人机、动态目标、障碍物、天气和通信链路统一到同一实验场景中。");
  addFormula(s, 0.95, 1.82, 5.5, "E(t) = (Ω, O, U(t), T(t), W)", "整体实验场景由任务区域、障碍、无人机、目标和天气状态组成");
  addFormula(s, 6.85, 1.82, 5.5, "Vij(t)=1 ⇔ line(ui,tj)∩O=∅", "视线可达性决定目标是否有可能被当前无人机有效观测");
  panel(s, 0.85, 3.08, 2.75, 1.72, "任务区域", ["地图尺度 1320", "栅格规模 33×33", "障碍物占用单元不可通行"], { fontSize: 10.8, gap: 0.32 });
  panel(s, 3.95, 3.08, 2.75, 1.72, "无人机状态", ["位置、航向、高度", "剩余能量和可用状态", "速度/感知/通信偏置"], { fontSize: 10.8, gap: 0.32 });
  panel(s, 7.05, 3.08, 2.75, 1.72, "目标状态", ["位置与速度", "优先级", "不确定性半径"], { fontSize: 10.8, gap: 0.32 });
  panel(s, 10.15, 3.08, 2.25, 1.72, "扰动因素", ["天气", "丢包", "延迟", "故障"], { fontSize: 10.8, gap: 0.28 });
  addText(s, "建模意义：调度不再只看几何距离，而是同时考虑路径、视线、链路和节点可用性。", {
    x: 1.0, y: 5.48, w: 11.1, h: 0.32, fontSize: 13, color: C.navy, bold: true, align: "center"
  });
  s.addNotes(note("复杂场景与状态建模", [
    "在场景建模中，整体环境由任务区域、障碍物、无人机状态、目标状态和天气状态共同构成。",
    "无人机和目标之间是否能形成有效观测，不仅取决于距离，还取决于中间是否有障碍遮挡。",
    "这种建模方式让后续 RADS 调度能够考虑更多真实约束，而不是停留在理想平面距离。"
  ]));
}

// 10 Parameters
{
  const s = base("默认实验参数设置", 10, "第二章 系统建模", "默认场景属于中等规模、多目标、带障碍与通信扰动的协同感知实验环境。");
  const headers = ["参数类别", "默认设置", "作用说明"];
  const rows = [
    ["场景规模", "地图 1320；栅格 33×33；障碍 34 个", "控制空间范围与绕障复杂度"],
    ["集群任务", "无人机 24 架；动态目标 6 个；仿真 40 步", "形成多目标并行感知压力"],
    ["感知条件", "感知半径 180m；视场角 120°；噪声 8.0", "决定目标是否可被有效观测"],
    ["通信条件", "通信半径 300m；丢包率 4%；延迟 0 步", "决定观测能否及时参与融合"],
    ["扰动条件", "节点故障率 6%；天气支持晴空/薄雾/降雨/雷暴", "模拟复杂环境下系统不确定性"],
  ];
  s.addTable([headers, ...rows], {
    x: 0.75, y: 1.82, w: 11.8, h: 3.7,
    colW: [2.0, 4.6, 5.2],
    rowH: [0.45, 0.55, 0.55, 0.55, 0.55, 0.55],
    border: { type: "solid", color: C.line, pt: 0.8 },
    margin: 0.08,
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    valign: "mid",
    fill: { color: C.white },
    autoFit: false,
    bold: false,
    fit: "shrink",
  });
  addText(s, "说明：这些参数可在平台前端调整，用于形成任务规模、障碍复杂度、天气和通信条件的对比实验。", {
    x: 1.0, y: 5.72, w: 11.1, h: 0.32, fontSize: 12.2, color: C.navy, bold: true, align: "center"
  });
  s.addNotes(note("默认实验参数设置", [
    "本页列出默认实验参数。默认场景包含 24 架无人机、6 个目标、34 个障碍物，并设置感知半径、视场角、通信半径和故障率。",
    "这些参数一方面保证实验具有一定复杂度，另一方面又适合本科毕业设计阶段进行可控验证。",
    "后续实验会在默认参数基础上改变任务规模、天气、障碍和通信条件。"
  ]));
}

// 11 Section RADS
{
  const s = sectionSlide(11, 3, "第三章 RADS 动态子群选择方法", "本章介绍核心算法：如何根据目标风险、节点能力和环境代价动态选择无人机子群。");
  s.addNotes(note("章节页：RADS 方法", ["下面进入第三部分，RADS 动态子群选择方法。这里是本课题的核心，重点说明如何计算目标需求、无人机效用和动态派机预算。"]));
}

// 12 RADS overview
{
  const s = base("RADS 算法设计思想", 12, "第三章 RADS 方法", "RADS 的核心是每一步重新判断目标需要多少资源，以及哪些无人机最适合参与。");
  flow(s, [
    ["目标需求", "优先级、不确定性、运动强度"],
    ["节点能力", "覆盖、能量、链路质量"],
    ["环境代价", "绕障路径、视线遮挡、天气扰动"],
    ["动态预算", "按任务压力调整派机规模"],
    ["子群生成", "贪心选择高效节点并分配目标"],
  ], 0.72, 1.86, 11.9, 1.25);
  panel(s, 0.9, 3.72, 3.45, 1.55, "为什么不是随机派遣", ["随机策略不能区分节点质量", "容易选到路径远、链路差或被遮挡的无人机"], { fontSize: 11.2 });
  panel(s, 4.92, 3.72, 3.45, 1.55, "为什么不是全量派遣", ["全量派遣成功率较高，但能耗和派机规模很大", "低质量冗余观测还可能增加融合负担"], { fontSize: 11.2 });
  panel(s, 8.95, 3.72, 3.45, 1.55, "RADS 的目标", ["在较小资源投入下保持较高感知质量", "使派机结果与目标需求和节点能力更匹配"], { fontSize: 11.2 });
  s.addNotes(note("RADS 算法设计思想", [
    "RADS 是风险感知动态子群选择方法，它的核心不是固定派机，而是在每个仿真步中重新计算。",
    "算法先评估目标需求，再评估无人机能力和环境代价，然后根据动态预算选择子群。",
    "与随机派遣相比，RADS 有明确的效用评分；与全量派遣相比，RADS 更强调资源利用效率。"
  ]));
}

// 13 Demand utility
{
  const s = base("目标需求与无人机效用评估", 13, "第三章 RADS 方法", "算法把任务紧迫度和节点适配度转化为可比较的评分，为派机决策提供依据。");
  addFormula(s, 0.8, 1.82, 5.8, "Rj(t)=0.45Pj+0.40Qj+0.15Mj+ξj", "目标紧急度由优先级、不确定性、速度强度和随机扰动共同决定");
  addFormula(s, 6.9, 1.82, 5.65, "Uij(t)=f(C,E,L,R,S,D,Γ)", "节点效用综合覆盖、能量、链路、需求、视线和路径惩罚等因素");
  panel(s, 0.85, 3.15, 3.45, 1.55, "目标需求项", ["优先级高：任务重要性更强", "不确定性大：需要更多观测支撑", "运动更快：状态更新压力更高"], { fontSize: 11.3, gap: 0.32 });
  panel(s, 4.95, 3.15, 3.45, 1.55, "节点效用项", ["覆盖能力：距离与路径代价共同影响", "剩余能量：避免过度消耗低能节点", "链路质量：提高观测送达概率"], { fontSize: 11.3, gap: 0.32 });
  panel(s, 9.05, 3.15, 3.45, 1.55, "约束修正项", ["视线无遮挡时提高候选优先级", "绕障路径长时降低效用", "冗余过多时抑制继续派机"], { fontSize: 11.3, gap: 0.32 });
  addText(s, "评分意义：将复杂环境中的多因素约束转化为统一的调度依据。", { x: 1.0, y: 5.45, w: 11.0, h: 0.35, fontSize: 13, bold: true, color: C.navy, align: "center" });
  s.addNotes(note("目标需求与无人机效用评估", [
    "目标需求主要由优先级、不确定性和运动强度决定。优先级高、不确定性大、运动快的目标会获得更高需求。",
    "无人机效用则综合覆盖能力、剩余能量、链路质量、视线条件和绕障路径代价。",
    "这样算法就能把复杂约束转化为可比较的评分，从而选择更合适的无人机参与感知。"
  ]));
}

// 14 Budget process
{
  const s = base("动态预算与子群生成流程", 14, "第三章 RADS 方法", "动态预算决定本步派出多少无人机，子群生成决定这些无人机具体分配给哪些目标。");
  addFormula(s, 0.85, 1.78, 5.55, "B(t)=clip(round(B*(t)), Bmin, Bmax)", "派机预算由任务压力、平均能量、平均链路和近期表现综合决定");
  flow(s, [
    ["计算目标需求", "为每个目标估计需求规模"],
    ["排序目标", "优先处理紧急度更高的目标"],
    ["筛选候选节点", "排除故障、低能和不可达节点"],
    ["贪心选择", "按效用得分选取子群成员"],
    ["更新状态", "运动、感知、融合和指标统计"],
  ], 0.72, 3.0, 11.9, 1.1);
  panel(s, 0.9, 4.85, 3.6, 1.1, "动态性", ["每个仿真步都会重新计算，适应目标运动和环境变化"], { fontSize: 11.2 });
  panel(s, 4.85, 4.85, 3.6, 1.1, "约束性", ["预算受可用节点、任务需求和资源状态共同限制"], { fontSize: 11.2 });
  panel(s, 8.8, 4.85, 3.6, 1.1, "可解释性", ["每个目标可记录派机成员、观测数、误差和失败原因"], { fontSize: 11.2 });
  s.addNotes(note("动态预算与子群生成流程", [
    "动态预算用于决定当前步最多派出多少无人机。预算不是固定值，而是由任务压力、能量状态、链路质量和近期表现共同影响。",
    "在确定预算后，算法按目标紧急度排序，再从候选无人机中选择效用最高的节点。",
    "因此，RADS 既能避免全量派遣的高消耗，也比随机派遣更有针对性。"
  ]));
}

// 15 Fusion
{
  const s = base("多机观测融合与成功判定", 15, "第三章 RADS 方法", "严格成功由确认数、定位误差和观测一致性共同决定，比单纯覆盖率更能反映感知质量。");
  flow(s, [
    ["感知条件", "距离、视线、视场角"],
    ["概率探测", "命中后生成带噪观测"],
    ["链路传输", "丢包、延迟、信息时效"],
    ["稳健融合", "加权中心、残差抑制、融合半径"],
    ["严格成功", "确认 + 达标 + 一致性"],
  ], 0.72, 1.85, 11.9, 1.18);
  addFormula(s, 0.95, 3.55, 3.6, "ẑj = Σwi zi / Σwi", "多源观测加权融合");
  addFormula(s, 4.85, 3.55, 3.6, "ej = ||ẑj - tj||", "计算融合位置误差");
  addFormula(s, 8.75, 3.55, 3.6, "S = C ∧ P ∧ G", "确认、达标、一致性同时满足");
  addText(s, "该机制使平台不仅能回答“是否观测到”，还能回答“观测是否可靠、是否及时、是否一致”。", {
    x: 1.0, y: 5.25, w: 11.1, h: 0.35, fontSize: 13, bold: true, color: C.navy, align: "center"
  });
  s.addNotes(note("多机观测融合与成功判定", [
    "平台中的感知流程包括条件判断、概率探测、链路传输和多机融合。",
    "观测会受到噪声影响，也可能因为链路丢包或延迟无法及时参与融合。",
    "最终的严格成功不是只要看见目标就成功，而是需要确认数、定位误差和一致性同时满足。"
  ]));
}

// 16 Section platform experiment
{
  const s = sectionSlide(16, 4, "第四章 平台实现与实验验证", "本章展示平台实现成果，并通过三策略对比和多场景实验验证 RADS 的综合效果。");
  s.addNotes(note("章节页：平台与实验", ["下面进入第四部分，平台实现与实验验证。这里先说明平台功能，再用默认场景、任务规模、天气、障碍和通信条件实验验证 RADS 的效果。"]));
}

// 17 Platform implementation
{
  const s = base("平台实现与功能模块", 17, "第四章 平台与实验", "平台围绕“参数配置—仿真运行—态势回放—任务分析—数据导出”形成完整实验闭环。");
  flow(s, [
    ["参数配置", "无人机、目标、障碍、通信、天气、故障"],
    ["会话创建", "后端生成独立实验世界并注入运行时扰动"],
    ["逐步仿真", "三策略同步推进，返回当前快照"],
    ["三维展示", "主视图、基线窗口、任务高亮联动"],
    ["结果导出", "核心指标、目标级结果、精细对比 CSV"],
  ], 0.72, 1.82, 11.9, 1.22);
  panel(s, 0.95, 3.75, 3.45, 1.42, "后端模块", ["server.py：接口路由与参数解析", "sessions.py：实验会话生命周期", "core.py/pathfinding.py：仿真与路径规划"], { fontSize: 10.8, gap: 0.3 });
  panel(s, 4.92, 3.75, 3.45, 1.42, "前端模块", ["index.html：页面结构", "app.js：参数读取、状态更新与导出", "scene3d-webgl.mjs：三维沙盘渲染"], { fontSize: 10.8, gap: 0.3 });
  panel(s, 8.9, 3.75, 3.45, 1.42, "平台价值", ["可以观察过程而不只是结果", "可以对比策略而不只是单算法展示", "可以导出数据支撑论文分析"], { fontSize: 10.8, gap: 0.3 });
  s.addNotes(note("平台实现与功能模块", [
    "平台实现包括后端仿真引擎和前端可视化交互。",
    "后端负责实验会话、场景生成、策略调度和指标统计；前端负责参数配置、三维展示、任务级分析和结果导出。",
    "平台不是一次性输出结果，而是支持逐步推进和回放，因此能够观察算法运行过程。"
  ]));
}

// 18 Experiment design
{
  const s = base("实验设计与评价指标", 18, "第四章 平台与实验", "实验在统一场景下比较 RADS、随机派遣和全量派遣，从效果与资源两个角度评价。");
  panel(s, 0.75, 1.8, 3.6, 2.0, "对比策略", [
    "RADS：根据目标需求和节点效用动态选择感知子群",
    "随机派遣：使用相近预算，但随机抽取执行节点",
    "全量派遣：尽量投入所有可用无人机，作为高资源基线",
  ], { fontSize: 10.8, gap: 0.36 });
  panel(s, 4.85, 1.8, 3.6, 2.0, "核心指标", [
    "严格成功率：确认数、误差、一致性同时满足",
    "平均定位误差：融合位置与真实位置的偏差",
    "累计能耗与平均派机数量：衡量资源投入强度",
  ], { fontSize: 10.8, gap: 0.36 });
  panel(s, 8.95, 1.8, 3.55, 2.0, "实验变量", [
    "任务规模：目标数量从 6 增加到 10",
    "环境复杂度：天气、障碍物数量变化",
    "通信条件：半径、丢包率、延迟变化",
  ], { fontSize: 10.8, gap: 0.36 });
  addFormula(s, 1.25, 4.45, 3.2, "SR=Nsuccess/Nattempt", "严格成功率");
  addFormula(s, 5.05, 4.45, 3.2, "ē=Σei/n", "平均定位误差");
  addFormula(s, 8.85, 4.45, 3.2, "D̄=Ndispatch/H", "平均派机数量");
  s.addNotes(note("实验设计与评价指标", [
    "实验选择三种策略进行比较：RADS、随机派遣和全量派遣。",
    "评价指标包括严格成功率、定位达标率、平均误差、累计能耗、平均派机数量和信息时效。",
    "其中严格成功率是综合指标，需要确认数、误差和一致性同时满足，比单纯覆盖率更严格。"
  ]));
}

// 19 Default results
{
  const s = base("默认场景实验结果", 19, "第四章 平台与实验", "默认场景下，RADS 的成功率接近全量派遣，但能耗和平均派机数量明显更低。");
  s.addChart(pptx.ChartType.bar, [{ name: "严格成功率", labels: ["RADS", "随机", "全量"], values: [70.8, 16.7, 72.9] }], {
    x: 0.8, y: 1.82, w: 5.8, h: 3.2,
    showTitle: true, title: "严格成功率对比（%）",
    showLegend: false, showValue: true,
    valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
    catAxis: { labelFontFace: FONT, labelFontSize: 11 },
    dataLabelPosition: "outEnd",
    ser: [{ color: C.red2 }],
  });
  metric(s, 7.0, 1.85, 2.25, 1.25, "70.8%", "RADS 成功率", "接近全量 72.9%");
  metric(s, 9.85, 1.85, 2.25, 1.25, "47.6%", "能耗降低", "相较全量派遣");
  metric(s, 7.0, 3.48, 2.25, 1.25, "9.52m", "平均误差", "全量为 8.07m");
  metric(s, 9.85, 3.48, 2.25, 1.25, "9.4", "平均派机", "全量为 20.5");
  addText(s, "结论：RADS 不是通过增加节点数量取得结果，而是通过更有效的节点筛选获得接近全量派遣的感知效果。", {
    x: 0.95, y: 5.45, w: 11.4, h: 0.34, fontSize: 13, color: C.navy, bold: true, align: "center"
  });
  s.addNotes(note("默认场景实验结果", [
    "默认场景下，RADS 的严格成功率为 70.8%，与全量派遣的 72.9% 非常接近，而随机派遣只有 16.7%。",
    "全量派遣在平均误差上略好，但它的能耗和派机规模明显更高。",
    "RADS 的累计能耗比全量派遣降低约 47.6%，平均派机数量也从 20.5 降到 9.4，说明其资源利用效率更高。"
  ]));
}

// 20 Multi-scenario results
{
  const s = base("多场景实验结果", 20, "第四章 平台与实验", "在任务规模、天气、障碍和通信条件变化下，RADS 保持了较好的综合稳定性。");
  const miniLine = (x, y, titleText, labels, values, desc, color = C.red) => {
    slideBox(s, x, y, 5.58, 1.88);
    addText(s, titleText, { x: x + 0.18, y: y + 0.14, w: 2.9, h: 0.24, fontSize: 13, bold: true, color: C.navy });
    addText(s, desc, { x: x + 3.0, y: y + 0.16, w: 2.25, h: 0.22, fontSize: 10.3, color: C.gray, align: "right" });
    s.addChart(pptx.ChartType.line, [{ name: "RADS", labels, values }], {
      x: x + 0.25, y: y + 0.48, w: 5.05, h: 1.18,
      showLegend: false,
      showValue: true,
      dataLabelPosition: "t",
      valAxis: { minVal: 0, maxVal: 100, majorUnit: 20 },
      catAxis: { labelFontFace: FONT, labelFontSize: 9.5 },
      valAxisLabelFontFace: FONT,
      valAxisLabelFontSize: 9,
      showCatName: true,
      ser: [{ color, line: { color, width: 2.4 }, marker: { symbol: "circle", size: 5 } }],
    });
  };

  miniLine(0.75, 1.82, "任务规模", ["6目标", "10目标"], [70.8, 68.0], "仅下降 2.8pp", C.navy);
  miniLine(6.95, 1.82, "天气扰动", ["晴空", "薄雾", "降雨", "雷暴"], [70.8, 60.8, 48.3, 34.2], "极端天气压低上限", C.red);
  miniLine(0.75, 4.0, "障碍复杂度", ["34障碍", "50障碍"], [70.8, 68.8], "变化幅度较小", C.navy2);
  miniLine(6.95, 4.0, "通信半径", ["300m", "400m", "500m"], [70.8, 81.7, 78.3], "400m 时收益明显", C.green);
  addText(s, "补充实验：丢包率 0%→10% 时 RADS 成功率由 77.9% 降至 65.0%；通信延迟 0→2 步时由 70.8% 降至 60.0%。", {
    x: 0.9,
    y: 5.98,
    w: 11.45,
    h: 0.28,
    fontSize: 12.2,
    color: C.navy,
    bold: true,
    align: "center",
  });
  s.addNotes(note("多场景实验结果", [
    "多场景实验主要考察任务规模、天气、障碍复杂度和通信条件变化。",
    "任务规模增加时，RADS 通过扩大派机子群保持成功率相对稳定。",
    "天气恶化时，所有策略都会下降，尤其雷暴条件下影响明显。",
    "障碍和通信实验说明，路径代价、视线条件和链路质量对协同感知结果有重要影响。"
  ]));
}

// 21 Overall + innovation
{
  const s = base("综合分析与创新点", 21, "第五章 总结", "RADS 的优势不是单项指标绝对最优，而是在感知效果与资源投入之间取得更合理平衡。");
  s.addChart(pptx.ChartType.bar, [{ name: "平均严格成功率", labels: ["RADS", "随机", "全量"], values: [64.9, 17.1, 70.3] }], {
    x: 0.8, y: 1.82, w: 4.75, h: 3.1,
    showTitle: true, title: "平均严格成功率（%）",
    showLegend: false, showValue: true,
    valAxis: { minVal: 0, maxVal: 80, majorUnit: 20 },
    ser: [{ color: C.red2 }],
  });
  metric(s, 5.9, 1.9, 1.8, 1.1, "64.9%", "RADS 平均成功率", "随机为17.1%");
  metric(s, 8.0, 1.9, 1.8, 1.1, "49.5%", "能耗占比", "约为全量一半");
  metric(s, 10.1, 1.9, 1.8, 1.1, "8.8", "平均派机数量", "全量为20.4");
  panel(s, 5.9, 3.42, 2.0, 1.45, "创新点一", ["面向复杂约束的无人机集群协同态势感知平台"], { fontSize: 10.4, gap: 0.28 });
  panel(s, 8.1, 3.42, 2.0, 1.45, "创新点二", ["RADS 动态子群选择方法，兼顾目标需求和节点能力"], { fontSize: 10.4, gap: 0.28 });
  panel(s, 10.3, 3.42, 2.0, 1.45, "创新点三", ["三策略对比、任务级分析和三维可视化展示机制"], { fontSize: 10.4, gap: 0.28 });
  addText(s, "综合判断：随机派遣简单但不稳定；全量派遣精度较高但资源代价大；RADS 更符合低资源高质量协同感知目标。", {
    x: 0.95, y: 5.45, w: 11.3, h: 0.34, fontSize: 12.5, color: C.navy, bold: true, align: "center"
  });
  s.addNotes(note("综合分析与创新点", [
    "综合多组实验结果，RADS 的平均严格成功率显著高于随机派遣，接近全量派遣。",
    "同时，RADS 的能耗和平均派机数量远低于全量派遣，体现出较好的资源利用效率。",
    "本文创新点包括复杂约束建模平台、RADS 动态子群方法，以及三策略对比和任务级可解释展示机制。"
  ]));
}

// 22 Conclusion
{
  const s = base("总结与展望", 22, "第五章 总结", "本文完成了从模型、算法、平台到实验的完整闭环，但仍有进一步扩展空间。");
  panel(s, 0.75, 1.78, 2.85, 2.1, "研究成果", [
    "完成无人机集群多任务协同态势感知平台",
    "实现 RADS、随机派遣、全量派遣三策略对比",
    "支持三维态势展示、任务级分析与 CSV 导出"
  ], { fontSize: 10.6, gap: 0.34 });
  panel(s, 3.95, 1.78, 2.85, 2.1, "实验结论", [
    "RADS 明显优于随机派遣",
    "成功率接近全量派遣，资源消耗明显更低",
    "在任务规模和通信条件变化下表现较稳定"
  ], { fontSize: 10.6, gap: 0.34 });
  panel(s, 7.15, 1.78, 2.85, 2.1, "存在不足", [
    "当前仍属于论文级仿真平台",
    "尚未接入高保真飞行动力学和图像级传感器模型",
    "RADS 参数权重仍需要更多场景校准"
  ], { fontSize: 10.6, gap: 0.34 });
  panel(s, 10.35, 1.78, 2.15, 2.1, "未来工作", [
    "增加批量实验与统计分析",
    "优化调度参数",
    "探索对接 ROS/PX4"
  ], { fontSize: 10.6, gap: 0.34 });
  addText(s, "谢谢各位老师，请批评指正！", { x: 3.4, y: 5.3, w: 6.5, h: 0.48, fontSize: 22, bold: true, color: C.navy, align: "center" });
  s.addNotes(note("总结与展望", [
    "最后总结本文工作：我完成了复杂场景建模、RADS 算法设计、平台实现和多组实验验证。",
    "实验结果表明，RADS 能够明显优于随机派遣，并在接近全量派遣成功率的同时显著降低资源消耗。",
    "不足之处是当前平台仍属于论文级仿真，后续可以继续接入更高保真的飞行动力学、传感器模型和 ROS/PX4 平台。",
    "我的汇报到此结束，谢谢各位老师，请批评指正。"
  ]));
}

async function main() {
  await pptx.writeFile({ fileName: PPTX_PATH, compression: true });
  const copy = path.join(OUT_DIR, path.basename(PPTX_PATH));
  fs.copyFileSync(PPTX_PATH, copy);
  console.log(PPTX_PATH);
  console.log(copy);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
