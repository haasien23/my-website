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
const OUT_DIR = path.join(ROOT, "output", "defense_ppt_reportstyle");
const LOGO = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-cropped.png");
const FIG = (...parts) => path.join(ROOT, "output", "figures", ...parts);
const DESKTOP = path.join(os.homedir(), "Desktop");
const PPTX_PATH = path.join(DESKTOP, "基于集群的多任务协同态势感知平台_本科毕设答辩_研究报告风格版.pptx");
fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  page: "F4F6F9",
  white: "FFFFFF",
  navy: "073066",
  navy2: "0C4380",
  blue: "2F6DB3",
  lightBlue: "EAF1FA",
  midBlue: "C9D8EB",
  red: "A5362E",
  red2: "C34B43",
  ink: "172033",
  gray: "4C596A",
  gray2: "718096",
  line: "C8D3E1",
  line2: "E1E7F0",
  pale: "F8FAFD",
  green: "4C7C59",
  gold: "C59A3D",
};

const FONT = "Microsoft YaHei";
const W = 13.333;
const H = 7.5;

function addText(slide, text, opts = {}) {
  slide.addText(text, {
    fontFace: FONT,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    color: C.ink,
    ...opts,
  });
}

function note(title, lines) {
  return `【${title}】\n${lines.join("\n")}`;
}

function page(slide) {
  slide.background = { color: C.page };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.28,
    y: 0.18,
    w: 12.78,
    h: 7.08,
    line: { color: "DCE3ED", width: 0.7 },
    fill: { color: C.white },
    shadow: { type: "outer", color: "B9C3D0", opacity: 0.13, blur: 1, angle: 45, distance: 1 },
  });
}

function header(slide, no, title, desc) {
  page(slide);
  addText(slide, String(no).padStart(2, "0"), {
    x: 0.55,
    y: 0.43,
    w: 0.46,
    h: 0.24,
    fontSize: 17.5,
    bold: true,
    color: C.navy,
  });
  addText(slide, title, {
    x: 1.08,
    y: 0.41,
    w: 8.95,
    h: 0.28,
    fontSize: 17,
    bold: true,
    color: C.ink,
  });
  addText(slide, desc, {
    x: 0.57,
    y: 0.79,
    w: 10.85,
    h: 0.2,
    fontSize: 8.9,
    color: C.gray,
  });
  slide.addImage({ path: LOGO, x: 10.7, y: 0.34, w: 1.95, h: 0.56 });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 1.08,
    w: 12.1,
    h: 0,
    line: { color: C.navy, width: 1.0 },
  });
  footer(slide, no);
}

function footer(slide, no) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 6.86,
    w: 12.1,
    h: 0,
    line: { color: C.line2, width: 0.8 },
  });
  addText(slide, "资料来源：毕业论文初稿、平台实验输出与代码实现整理", {
    x: 0.58,
    y: 6.98,
    w: 5.5,
    h: 0.14,
    fontSize: 6.8,
    color: C.gray2,
  });
  addText(slide, String(no).padStart(2, "0"), {
    x: 12.25,
    y: 6.97,
    w: 0.38,
    h: 0.15,
    fontSize: 7.6,
    color: C.gray2,
    align: "right",
  });
}

function box(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: opts.line || C.line, width: opts.width || 0.8 },
    fill: { color: opts.fill || C.white },
  });
}

function band(slide, x, y, w, h, text, opts = {}) {
  box(slide, x, y, w, h, { fill: opts.fill || C.lightBlue, line: opts.line || C.midBlue });
  addText(slide, text, {
    x: x + 0.12,
    y: y + h / 2 - 0.11,
    w: w - 0.24,
    h: 0.22,
    fontSize: opts.fontSize || 10.4,
    bold: opts.bold ?? true,
    color: opts.color || C.navy,
    align: opts.align || "center",
  });
}

function bullet(slide, text, x, y, w, opts = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y: y + 0.07,
    w: 0.055,
    h: 0.055,
    line: { color: opts.color || C.red },
    fill: { color: opts.color || C.red },
  });
  addText(slide, text, {
    x: x + 0.14,
    y,
    w,
    h: opts.h || 0.22,
    fontSize: opts.fontSize || 9.4,
    color: opts.textColor || C.ink,
    bold: opts.bold || false,
  });
}

function bulletList(slide, items, x, y, w, opts = {}) {
  const gap = opts.gap || 0.28;
  items.forEach((item, i) => bullet(slide, item, x, y + i * gap, w, opts));
}

function panel(slide, x, y, w, h, title, items, opts = {}) {
  box(slide, x, y, w, h, { fill: opts.fill || C.white, line: opts.line || C.line });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.07,
    h,
    line: { color: opts.accent || C.red },
    fill: { color: opts.accent || C.red },
  });
  addText(slide, title, {
    x: x + 0.16,
    y: y + 0.14,
    w: w - 0.28,
    h: 0.21,
    fontSize: opts.titleSize || 10.8,
    bold: true,
    color: opts.titleColor || C.navy,
  });
  bulletList(slide, items, x + 0.17, y + 0.46, w - 0.34, {
    fontSize: opts.fontSize || 8.9,
    gap: opts.gap || 0.25,
    h: opts.itemH || 0.2,
    color: opts.bulletColor || C.red,
  });
}

function stat(slide, x, y, w, h, value, label, sub, opts = {}) {
  box(slide, x, y, w, h, { fill: opts.fill || C.white, line: opts.line || C.line });
  addText(slide, value, {
    x: x + 0.09,
    y: y + 0.13,
    w: w - 0.18,
    h: 0.31,
    fontSize: opts.valueSize || 17,
    bold: true,
    color: opts.color || C.navy,
    align: "center",
  });
  addText(slide, label, {
    x: x + 0.08,
    y: y + 0.52,
    w: w - 0.16,
    h: 0.18,
    fontSize: opts.labelSize || 8.6,
    bold: true,
    color: C.ink,
    align: "center",
  });
  addText(slide, sub, {
    x: x + 0.08,
    y: y + 0.78,
    w: w - 0.16,
    h: 0.16,
    fontSize: opts.subSize || 7.1,
    color: C.gray2,
    align: "center",
  });
}

function table(slide, x, y, colWs, rowH, rows, opts = {}) {
  const headerFill = opts.headerFill || C.navy;
  const totalW = colWs.reduce((a, b) => a + b, 0);
  let yy = y;
  rows.forEach((row, r) => {
    let xx = x;
    row.forEach((cell, c) => {
      const fill = r === 0 ? headerFill : (r % 2 === 0 ? (opts.altFill || C.pale) : C.white);
      box(slide, xx, yy, colWs[c], rowH, { fill, line: opts.line || C.line, width: 0.7 });
      addText(slide, String(cell), {
        x: xx + 0.07,
        y: yy + rowH / 2 - (r === 0 ? 0.09 : 0.085),
        w: colWs[c] - 0.14,
        h: 0.18,
        fontSize: r === 0 ? (opts.headerSize || 8.2) : (opts.fontSize || 8.2),
        bold: r === 0,
        color: r === 0 ? C.white : C.ink,
        align: opts.aligns?.[c] || (c === 0 ? "left" : "center"),
      });
      xx += colWs[c];
    });
    yy += rowH;
  });
  return { x, y, w: totalW, h: rows.length * rowH };
}

function flow(slide, nodes, x, y, w, h, opts = {}) {
  const gap = opts.gap || 0.1;
  const nw = (w - gap * (nodes.length - 1)) / nodes.length;
  nodes.forEach((node, i) => {
    const nx = x + i * (nw + gap);
    box(slide, nx, y, nw, h, { fill: i === opts.highlight ? C.lightBlue : C.white, line: C.midBlue });
    addText(slide, node[0], {
      x: nx + 0.08,
      y: y + 0.12,
      w: nw - 0.16,
      h: 0.18,
      fontSize: opts.titleSize || 9.1,
      bold: true,
      color: C.navy,
      align: "center",
    });
    addText(slide, node[1], {
      x: nx + 0.08,
      y: y + 0.43,
      w: nw - 0.16,
      h: h - 0.52,
      fontSize: opts.fontSize || 7.2,
      color: C.gray,
      align: "center",
    });
    if (i < nodes.length - 1) {
      slide.addShape(pptx.ShapeType.rightArrow, {
        x: nx + nw - 0.05,
        y: y + h / 2 - 0.08,
        w: 0.19,
        h: 0.16,
        line: { color: C.red, transparency: 100 },
        fill: { color: C.red },
      });
    }
  });
}

function factorStrip(slide, factors, x, y, w, h) {
  box(slide, x, y, w, h, { fill: C.white, line: C.line });
  const n = factors.length;
  const cellW = w / n;
  factors.forEach((f, i) => {
    const xx = x + i * cellW;
    if (i > 0) slide.addShape(pptx.ShapeType.line, { x: xx, y: y + 0.1, w: 0, h: h - 0.2, line: { color: C.line2, width: 0.8 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: xx + 0.18, y: y + 0.18, w: 0.34, h: 0.34, line: { color: C.navy }, fill: { color: C.lightBlue } });
    addText(slide, String(i + 1), { x: xx + 0.18, y: y + 0.24, w: 0.34, h: 0.12, fontSize: 7.6, bold: true, color: C.navy, align: "center" });
    addText(slide, f[0], { x: xx + 0.62, y: y + 0.17, w: cellW - 0.75, h: 0.2, fontSize: 9.2, bold: true, color: C.navy });
    addText(slide, f[1], { x: xx + 0.62, y: y + 0.45, w: cellW - 0.75, h: 0.36, fontSize: 7.2, color: C.gray });
  });
}

function chartOpts(x, y, w, h, titleText, maxVal = 100) {
  return {
    x,
    y,
    w,
    h,
    showTitle: true,
    title: titleText,
    titleFontFace: FONT,
    titleFontSize: 10,
    titleColor: C.ink,
    showLegend: true,
    legendPos: "b",
    legendFontFace: FONT,
    legendFontSize: 7,
    valAxis: { minVal: 0, maxVal, majorUnit: maxVal === 100 ? 20 : undefined },
    catAxis: { labelFontFace: FONT, labelFontSize: 7.8 },
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 7.5,
    showValue: true,
    dataLabelPosition: "outEnd",
  };
}

function miniNetwork(slide, x, y, s = 1) {
  const pts = [[0, .58], [.58, .32], [1.08, .72], [1.72, .22], [2.2, .56], [2.86, .18], [3.35, .48]].map(([a, b]) => [x + a * s, y + b * s]);
  [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6]].forEach(([a,b])=>{
    slide.addShape(pptx.ShapeType.line, { x: pts[a][0], y: pts[a][1], w: pts[b][0]-pts[a][0], h: pts[b][1]-pts[a][1], line: { color: C.midBlue, width: 1 } });
  });
  pts.forEach((p,i)=>slide.addShape(pptx.ShapeType.ellipse,{x:p[0]-0.04,y:p[1]-0.04,w:0.08,h:0.08,line:{color:i%2?C.red:C.navy},fill:{color:i%2?C.red:C.navy}}));
}

// 01 Cover
{
  const s = pptx.addSlide();
  page(s);
  s.addImage({ path: LOGO, x: 0.6, y: 0.42, w: 2.75, h: 0.8 });
  addText(s, "本科毕业设计（论文）答辩", { x: 9.2, y: 0.46, w: 2.8, h: 0.24, fontSize: 13, bold: true, color: C.navy, align: "right" });
  addText(s, "信息工程学院 / 计算机科学与技术", { x: 8.8, y: 0.78, w: 3.2, h: 0.18, fontSize: 8.8, color: C.gray, align: "right" });
  slideLine(s, 0.6, 1.38, 11.95, C.navy, 1.2);
  addText(s, "基于集群的多任务协同\n态势感知平台", { x: 0.75, y: 2.02, w: 6.6, h: 0.86, fontSize: 30, bold: true, color: C.navy });
  addText(s, "面向复杂环境下无人机集群多目标协同感知，完成场景建模、RADS 动态子群调度、Web 平台实现与多组实验验证。", {
    x: 0.78, y: 3.15, w: 7.05, h: 0.36, fontSize: 12.2, color: C.gray,
  });
  stat(s, 0.82, 4.0, 1.55, 1.02, "24", "无人机", "默认集群规模", { color: C.navy });
  stat(s, 2.55, 4.0, 1.55, 1.02, "6", "动态目标", "默认任务规模", { color: C.red });
  stat(s, 4.28, 4.0, 1.55, 1.02, "34", "障碍物", "复杂场景约束", { color: C.navy });
  stat(s, 6.01, 4.0, 1.55, 1.02, "70.8%", "RADS成功率", "默认场景结果", { color: C.red });
  box(s, 8.25, 2.0, 3.85, 2.9, { fill: C.pale, line: C.midBlue });
  addText(s, "研究主线", { x: 8.5, y: 2.22, w: 1.6, h: 0.22, fontSize: 12.5, bold: true, color: C.navy });
  flow(s, [["建模", "复杂环境"], ["调度", "RADS"], ["融合", "严格成功"], ["验证", "三策略对比"]], 8.48, 2.72, 3.15, 0.78, { fontSize: 6.7, titleSize: 8.2 });
  miniNetwork(s, 8.9, 4.05, 0.85);
  addText(s, "学生：贺小双    指导教师：陈益杉 副教授    答辩日期：2026年6月", { x: 0.8, y: 6.48, w: 8.5, h: 0.18, fontSize: 10.4, color: C.ink });
  addText(s, "01", { x: 12.18, y: 6.48, w: 0.35, h: 0.16, fontSize: 7.6, color: C.gray2, align: "right" });
  s.addNotes(note("封面页", [
    "各位老师好，我的毕业设计题目是《基于集群的多任务协同态势感知平台》。",
    "这项工作围绕无人机集群在复杂环境下的多目标协同感知展开，内容包括复杂场景建模、RADS 动态子群调度、Web 平台实现以及实验验证。",
    "接下来我将按照研究背景、问题定义、方法设计、平台实现、实验结果和创新总结进行汇报。"
  ]));
}

function slideLine(slide, x, y, w, color = C.line, width = 0.8) {
  slide.addShape(pptx.ShapeType.line, { x, y, w, h: 0, line: { color, width } });
}

// 02 Agenda
{
  const s = pptx.addSlide();
  header(s, 2, "答辩结构：从现实需求到平台验证形成闭环", "汇报按“背景问题—方法设计—平台实现—实验验证—总结展望”展开，控制在 8-10 分钟。");
  table(s, 0.78, 1.42, [1.05, 3.1, 4.15, 2.5], 0.47, [
    ["序号", "汇报部分", "核心回答", "建议时长"],
    ["01", "研究背景与问题分析", "为什么需要动态协同态势感知，现有方法不足在哪里", "约2分钟"],
    ["02", "系统建模与总体设计", "复杂任务环境如何抽象，平台如何支撑实验闭环", "约1.5分钟"],
    ["03", "RADS 方法设计", "如何量化目标需求、节点效用和动态派机预算", "约2.5分钟"],
    ["04", "平台实现与实验验证", "平台做到了什么，实验结果说明了什么", "约3分钟"],
    ["05", "创新点与结论展望", "本科毕设成果、创新贡献与后续改进方向", "约1分钟"],
  ], { headerSize: 8.5, fontSize: 8.5, aligns: ["center", "left", "left", "center"] });
  factorStrip(s, [
    ["主线清晰", "按答辩老师最关心的逻辑组织内容"],
    ["证据充分", "每个核心结论都配有模型、流程或实验数据"],
    ["页面饱满", "采用图表、表格、因素条和指标卡组织信息"],
    ["口头友好", "页面承载证据，细节放入演讲者注释"],
  ], 0.78, 4.78, 11.75, 0.92);
  panel(s, 0.78, 5.95, 11.75, 0.62, "答辩记忆点", [
    "RADS 的价值不是所有单项指标都超过全量派遣，而是在接近全量感知效果的同时明显降低资源消耗。"
  ], { fontSize: 9.3, gap: 0.25, titleSize: 10.2 });
  s.addNotes(note("答辩结构", [
    "本次汇报分为五个部分。首先说明无人机集群协同态势感知的研究背景和问题。",
    "中间部分介绍系统建模、总体架构和 RADS 动态子群选择方法。",
    "后半部分展示平台实现和实验数据，最后总结创新点、不足和未来工作。"
  ]));
}

// 03 Background
{
  const s = pptx.addSlide();
  header(s, 3, "研究背景：复杂任务推动无人机集群从单机感知走向协同态势感知", "在巡检、救援、侦察等任务中，单机能力受覆盖、续航和视场限制，多机协同成为提升感知质量的重要方向。");
  s.addChart(pptx.ChartType.line, [
    { name: "任务复杂度", labels: ["单目标", "多目标", "动态目标", "强约束环境"], values: [20, 42, 68, 90] },
    { name: "单机可支撑度", labels: ["单目标", "多目标", "动态目标", "强约束环境"], values: [82, 58, 36, 22] },
  ], { ...chartOpts(0.78, 1.36, 5.45, 2.35, "任务复杂度提升与单机支撑度变化（概念化）"), ser: [{ color: C.red }, { color: C.blue }] });
  table(s, 6.55, 1.37, [1.48, 1.62, 1.62, 1.62], 0.36, [
    ["应用场景", "任务特点", "感知需求", "协同价值"],
    ["灾害救援", "范围大、变化快", "目标搜索与定位", "多点并行覆盖"],
    ["安防巡检", "周期性、重复性", "异常目标识别", "提高巡检效率"],
    ["应急侦察", "环境未知", "快速态势更新", "提升冗余可靠性"],
    ["区域监测", "目标分散", "持续跟踪", "减少盲区"],
  ], { headerSize: 7.5, fontSize: 7.4 });
  factorStrip(s, [
    ["覆盖范围", "多机分布式部署扩大感知区域"],
    ["并行能力", "多个目标可同时被不同子群跟踪"],
    ["系统冗余", "节点故障后仍可由其他节点补位"],
    ["信息融合", "多源观测可降低单点噪声影响"],
    ["可视化验证", "平台能够呈现过程而非只给结果"],
  ], 0.78, 4.18, 11.75, 0.88);
  panel(s, 0.78, 5.32, 11.75, 0.84, "本课题切入点", [
    "研究对象不是单机航迹控制，而是复杂环境中“哪些无人机参与、如何协同感知、结果如何验证”的任务级平台问题。"
  ], { fontSize: 9.2, titleSize: 10.4 });
  s.addNotes(note("研究背景", [
    "无人机集群相比单架无人机，可以扩大覆盖范围、提高并行执行能力，并增强系统冗余。",
    "但是随着任务从单目标、静态环境走向多目标和复杂环境，单机方式越来越难以稳定满足态势感知需求。",
    "因此，本课题选择从平台和算法两方面入手，研究复杂环境下无人机集群的多任务协同态势感知问题。"
  ]));
}

// 04 Problem
{
  const s = pptx.addSlide();
  header(s, 4, "问题定义：核心矛盾是有限无人机资源与多目标动态感知需求之间的匹配", "复杂环境下不能简单认为“派出越多越好”，需要在成功率、误差、能耗和派机数量之间取得平衡。");
  flow(s, [
    ["目标需求变化", "优先级、速度、不确定性随时间变化"],
    ["节点能力差异", "位置、能量、链路、故障状态不同"],
    ["环境约束影响", "障碍、视线、天气、绕障路径代价"],
    ["调度决策生成", "选择合适子群而非随机或全量"],
    ["融合结果评价", "确认数、误差、一致性和资源消耗"],
  ], 0.78, 1.35, 11.75, 0.88, { titleSize: 8.6, fontSize: 6.9, highlight: 3 });
  table(s, 0.78, 2.58, [2.25, 3.35, 3.35, 2.8], 0.43, [
    ["研究问题", "具体表现", "若不处理的后果", "本文处理方式"],
    ["多目标竞争", "多个目标同时争夺有限无人机", "关键目标感知不足", "目标需求评分"],
    ["环境可达性", "直线距离近但路径或视线不可达", "无效派机增加", "路径/视线约束"],
    ["通信不稳定", "丢包、延迟、半径限制影响观测送达", "融合信息不足或过时", "链路质量评分"],
    ["评价不完整", "只看覆盖或误差难以解释资源代价", "结论片面", "多指标对比"],
  ], { headerSize: 7.8, fontSize: 7.7, aligns: ["left", "left", "left", "left"] });
  panel(s, 0.78, 5.05, 3.65, 1.02, "本文关注的核心问题", [
    "如何在多约束动态环境下，按目标需求和节点能力选择无人机子群"
  ], { fontSize: 9.2, titleSize: 10.4 });
  panel(s, 4.84, 5.05, 3.65, 1.02, "本文不展开的问题", [
    "不重点研究真实飞控动力学、图像识别模型和硬件通信协议"
  ], { fontSize: 9.2, titleSize: 10.4, accent: C.navy });
  panel(s, 8.9, 5.05, 3.63, 1.02, "答辩应强调", [
    "毕业设计成果是算法设计、可运行平台和实验验证的综合闭环"
  ], { fontSize: 9.2, titleSize: 10.4 });
  s.addNotes(note("问题定义", [
    "本课题关注的核心矛盾，是多目标任务不断变化，而无人机资源、能量、通信和环境条件都是有限的。",
    "因此，简单随机派遣会导致资源错配，全量派遣虽然效果高但能耗和派机规模过大。",
    "本文提出的思路是让平台在每个仿真步根据目标需求和节点能力动态选择感知子群。"
  ]));
}

// 05 Research route
{
  const s = pptx.addSlide();
  header(s, 5, "研究目标与技术路线：完成模型、算法、平台和实验的闭环验证", "本文不是单独写公式或单独做页面，而是围绕可运行系统组织完整毕业设计成果。");
  flow(s, [
    ["需求分析", "明确复杂环境、多目标和可视化要求"],
    ["场景建模", "任务区域、障碍、天气、通信和故障"],
    ["RADS 方法", "目标需求、节点效用、动态预算"],
    ["平台实现", "Python 后端 + WebGL 前端"],
    ["实验验证", "三策略对比与多变量扰动"],
  ], 0.78, 1.35, 11.75, 0.9, { titleSize: 8.8, fontSize: 6.9, highlight: 2 });
  table(s, 0.78, 2.62, [2.05, 3.4, 3.35, 2.95], 0.42, [
    ["研究目标", "实现内容", "对应文件/模块", "输出成果"],
    ["复杂场景建模", "构建无人机、目标、障碍、天气、通信状态", "core.py / pathfinding.py", "可配置仿真世界"],
    ["动态子群调度", "设计 RADS 目标需求与节点效用评分", "src/simulation/core.py", "每步派机方案"],
    ["协同感知融合", "模拟探测、丢包、延迟和稳健融合", "core.py", "严格成功指标"],
    ["Web 平台展示", "实现参数配置、三维沙盘、对比展示和导出", "server.py / app.js / scene3d", "可运行答辩平台"],
  ], { headerSize: 7.8, fontSize: 7.6, aligns: ["left", "left", "left", "left"] });
  factorStrip(s, [
    ["可配置", "参数区控制无人机、目标、障碍、通信等变量"],
    ["可回放", "后端逐步推进，前端同步展示过程"],
    ["可对比", "RADS、随机派遣和全量派遣同场比较"],
    ["可分析", "输出任务级指标和失败原因"],
    ["可导出", "实验结果支持 CSV 导出与论文分析"],
  ], 0.78, 5.33, 11.75, 0.88);
  s.addNotes(note("研究目标与技术路线", [
    "本文的技术路线可以概括为需求分析、场景建模、RADS 方法设计、平台实现和实验验证五个环节。",
    "研究目标不仅包括算法，还包括一个可配置、可回放、可对比、可分析和可导出的实验平台。",
    "这样可以把论文中的理论设计、代码实现和实验结论统一起来。"
  ]));
}

// 06 Architecture
{
  const s = pptx.addSlide();
  header(s, 6, "系统架构：前端展示、会话管理和仿真计算分层组织", "平台采用轻量级前后端分离结构，保证算法计算、实验会话和可视化交互职责清晰。");
  table(s, 0.78, 1.35, [1.45, 3.6, 3.6, 3.1], 0.48, [
    ["层级", "主要职责", "关键模块", "答辩展示价值"],
    ["表示层", "参数配置、三维态势、指标卡、任务表格、CSV 导出", "templates/index.html, static/app.js", "让老师直观看到系统成果"],
    ["业务层", "接口路由、会话创建、逐步推进、结果组织", "src/web/server.py, sessions.py", "把前端操作转换为实验过程"],
    ["仿真层", "环境生成、路径规划、策略调度、感知融合、指标统计", "src/simulation/core.py, pathfinding.py", "承载论文核心算法和实验"],
  ], { headerSize: 8.0, fontSize: 7.9, aligns: ["center", "left", "left", "left"] });
  s.addImage({ path: FIG("ch3", "fig3-2_system_architecture.png"), x: 1.1, y: 3.38, w: 5.45, h: 2.1 });
  panel(s, 6.9, 3.35, 2.65, 1.05, "架构优势", [
    "前端只负责交互与展示",
    "后端统一管理实验状态",
    "仿真模块便于替换策略"
  ], { fontSize: 8.5, gap: 0.21, titleSize: 10 });
  panel(s, 9.85, 3.35, 2.65, 1.05, "实现映射", [
    "app.py 作为启动入口",
    "server.py 提供接口",
    "core.py 执行核心仿真"
  ], { fontSize: 8.5, gap: 0.21, titleSize: 10, accent: C.navy });
  panel(s, 6.9, 4.75, 5.6, 0.98, "运行闭环", [
    "用户设置参数后，后端创建独立实验会话；每次推进返回统一快照，前端据此更新三维场景、指标卡和任务级表格。"
  ], { fontSize: 8.8, titleSize: 10 });
  s.addNotes(note("系统架构", [
    "平台采用前后端分离结构，表示层负责参数配置和三维展示，业务层负责接口和会话，仿真层负责核心算法。",
    "这种结构可以把页面交互和算法计算分开，降低模块耦合。",
    "在答辩中，这一页用于说明平台不是简单静态页面，而是包含完整后端计算和前端展示的系统。"
  ]));
}

// 07 Scenario modeling
{
  const s = pptx.addSlide();
  header(s, 7, "场景建模：统一表达无人机、目标、障碍、天气和通信扰动", "复杂环境约束被纳入同一仿真世界，为后续 RADS 调度提供状态输入。");
  addText(s, "E(t) = {区域Ω、障碍O、无人机U(t)、目标T(t)、天气W(t)、通信C(t)}", { x: 0.9, y: 1.28, w: 6.4, h: 0.24, fontSize: 11.8, bold: true, color: C.navy });
  addText(s, "有效观测不仅取决于距离，还取决于视线遮挡、视场角、探测概率、链路送达和信息时效。", { x: 0.9, y: 1.62, w: 6.4, h: 0.2, fontSize: 8.9, color: C.gray });
  table(s, 7.55, 1.25, [1.35, 1.4, 1.42, 1.45], 0.35, [
    ["对象", "状态变量", "约束", "输出"],
    ["无人机", "位置/能量/故障", "速度/通信/感知", "候选节点"],
    ["目标", "位置/速度/优先级", "不确定性", "任务需求"],
    ["环境", "障碍/天气", "视线/噪声/延迟", "代价修正"],
  ], { headerSize: 7.2, fontSize: 7.1 });
  s.addImage({ path: FIG("ch7", "fig7-3_multi_strategy_world.png"), x: 0.95, y: 2.15, w: 5.45, h: 3.45 });
  factorStrip(s, [
    ["路径代价", "障碍影响绕行距离"],
    ["视线可达", "遮挡决定是否有效观测"],
    ["天气扰动", "影响半径、噪声和链路"],
    ["链路质量", "影响观测送达与融合"],
  ], 6.7, 3.03, 5.78, 0.82);
  panel(s, 6.7, 4.12, 2.72, 1.18, "建模目的", [
    "让实验接近真实任务约束",
    "为算法评分提供状态输入",
    "支撑多变量对比实验"
  ], { fontSize: 8.3, gap: 0.22, titleSize: 9.8 });
  panel(s, 9.75, 4.12, 2.72, 1.18, "区别于理想模型", [
    "不只看直线距离",
    "不假设通信一定可靠",
    "不忽略节点故障"
  ], { fontSize: 8.3, gap: 0.22, titleSize: 9.8, accent: C.navy });
  s.addNotes(note("场景建模", [
    "平台把任务区域、障碍物、无人机、目标、天气和通信条件统一放在一个仿真世界中。",
    "这样，无人机能否有效观测目标，不再只由距离决定，还会受到视线遮挡、视场角、丢包、延迟等因素影响。",
    "这种建模方式为 RADS 后续进行节点效用评估提供了更完整的状态输入。"
  ]));
}

// 08 Entity constraints
{
  const s = pptx.addSlide();
  header(s, 8, "状态与约束：从几何可达、信息可达和任务可达三方面刻画协同感知", "无人机是否适合执行某个目标任务，需要同时判断路径、视线、能量、链路和目标紧迫度。");
  table(s, 0.78, 1.28, [1.7, 2.6, 3.05, 4.4], 0.43, [
    ["约束类型", "计算对象", "典型判断", "对调度的影响"],
    ["几何可达", "无人机-目标距离、绕障路径", "路径越长，移动代价越高", "降低远距离或绕行节点的效用"],
    ["视线可达", "障碍遮挡与视场角", "视线被遮挡时观测不可用", "避免把节点派给不可见目标"],
    ["信息可达", "通信半径、丢包、延迟", "链路差会减少有效观测", "优先选择链路可靠节点"],
    ["任务可达", "目标优先级、不确定性、速度", "需求高的目标需要更多确认", "动态扩大关键目标子群"],
  ], { headerSize: 7.9, fontSize: 7.8, aligns: ["center", "left", "left", "left"] });
  factorStrip(s, [
    ["路径", "基于障碍栅格估计绕障距离"],
    ["视线", "判断目标与无人机之间是否无遮挡"],
    ["通信", "半径、丢包与延迟影响观测送达"],
    ["能量", "低能节点被降低使用优先级"],
    ["任务", "高优先级目标获得更高资源需求"],
  ], 0.78, 3.82, 11.75, 0.88);
  panel(s, 0.78, 5.05, 5.75, 0.9, "约束进入算法的方式", [
    "几何、链路和任务因素被转化为目标需求评分与节点效用评分，使派机决策具备可解释依据。"
  ], { fontSize: 9.0, titleSize: 10.2 });
  panel(s, 6.78, 5.05, 5.75, 0.9, "答辩表达建议", [
    "这里重点强调：本文不是只画了无人机，而是把复杂约束放入仿真与调度计算中。"
  ], { fontSize: 9.0, titleSize: 10.2, accent: C.navy });
  s.addNotes(note("状态与约束", [
    "本页从几何可达、视线可达、信息可达和任务可达四个方面说明模型约束。",
    "这些约束不是只用于画图，而是会进入后续 RADS 的评分和调度过程。",
    "例如，路径太长、视线被遮挡、链路质量差或能量过低的无人机会被降低调度优先级。"
  ]));
}

// 09 RADS overview
{
  const s = pptx.addSlide();
  header(s, 9, "RADS 方法：用风险感知的动态子群选择替代随机派遣和全量派遣", "算法每个仿真步重新评估目标需求与节点效用，以较低资源投入维持较高感知质量。");
  flow(s, [
    ["状态更新", "目标运动、能量衰减、故障检查"],
    ["目标需求", "优先级、不确定性、速度与近期失败"],
    ["节点效用", "覆盖、能量、链路、路径与视线"],
    ["动态预算", "根据任务压力决定派机上限"],
    ["子群生成", "贪心选择高效节点并分配目标"],
    ["融合评价", "观测融合与严格成功统计"],
  ], 0.78, 1.3, 11.75, 0.85, { titleSize: 8.2, fontSize: 6.4, highlight: 4 });
  table(s, 0.78, 2.48, [1.9, 3.3, 3.25, 3.3], 0.42, [
    ["策略", "决策依据", "优势", "不足"],
    ["随机派遣", "按预算随机选择无人机", "实现简单，资源投入可控", "忽略目标需求和节点质量"],
    ["全量派遣", "尽量使用所有可用节点", "成功率和误差通常较好", "能耗大，派机规模过高"],
    ["RADS", "目标需求 + 节点效用 + 动态预算", "资源效率高，结果可解释", "依赖评分权重与场景参数"],
  ], { headerSize: 8.0, fontSize: 7.8, aligns: ["center", "left", "left", "left"] });
  stat(s, 0.85, 4.85, 1.72, 0.95, "70.8%", "默认成功率", "接近全量 72.9%", { color: C.red });
  stat(s, 2.82, 4.85, 1.72, 0.95, "47.6%", "能耗降低", "相较全量派遣", { color: C.navy });
  stat(s, 4.79, 4.85, 1.72, 0.95, "54.1%", "派机减少", "9.4 vs 20.5", { color: C.navy });
  panel(s, 7.1, 4.62, 5.1, 1.18, "核心判断", [
    "RADS 不是追求“派得最多”，而是追求“派得更准”：让高需求目标获得足够资源，同时避免低效冗余观测。"
  ], { fontSize: 9.0, titleSize: 10.5 });
  s.addNotes(note("RADS 方法概览", [
    "RADS 是本文的核心调度方法，可以理解为风险感知的动态子群选择。",
    "它每一步都先更新环境和节点状态，然后计算目标需求和无人机效用，再根据动态预算选择合适子群。",
    "与随机派遣相比，它有明确的评分依据；与全量派遣相比，它能显著降低能耗和派机规模。"
  ]));
}

// 10 Demand utility
{
  const s = pptx.addSlide();
  header(s, 10, "评分设计：目标需求刻画任务紧迫度，节点效用刻画执行适配度", "RADS 将复杂约束转化为可比较的评分，使每次派机都有可解释依据。");
  band(s, 0.78, 1.28, 5.65, 0.54, "目标需求评分：Rj = 0.45Pj + 0.40Qj + 0.15Mj + ξj", { fontSize: 10.4 });
  band(s, 6.88, 1.28, 5.65, 0.54, "节点效用评分：Uij = f(覆盖、能量、链路、路径、视线、冗余)", { fontSize: 10.4 });
  table(s, 0.78, 2.08, [1.42, 2.0, 2.0, 2.0, 2.0, 2.33], 0.38, [
    ["维度", "优先级", "不确定性", "运动强度", "链路/能量", "路径/视线"],
    ["含义", "任务重要程度", "目标状态不确定", "位置变化速度", "节点可持续能力", "是否能有效接近并观测"],
    ["影响", "提高目标需求", "提高确认需求", "提高更新压力", "提高/降低节点效用", "过滤无效候选节点"],
    ["结果", "关键目标优先", "不确定目标多观测", "动态目标及时跟踪", "避免弱节点过度使用", "减少被遮挡或绕行过远节点"],
  ], { headerSize: 7.4, fontSize: 7.3, aligns: ["center", "center", "center", "center", "center", "center"] });
  factorStrip(s, [
    ["目标侧", "回答“哪个目标更需要资源”"],
    ["节点侧", "回答“哪架无人机更适合”"],
    ["环境侧", "回答“这次观测是否可能有效”"],
    ["资源侧", "回答“是否值得继续投入”"],
  ], 0.78, 4.28, 11.75, 0.86);
  panel(s, 0.78, 5.38, 5.75, 0.82, "调度意义", [
    "评分把多个异构因素统一到同一决策框架中，使 RADS 能按目标需求主动调整派机子群。"
  ], { fontSize: 8.8, titleSize: 10.2 });
  panel(s, 6.78, 5.38, 5.75, 0.82, "可解释意义", [
    "任务失败时可回溯观测数量、误差、路径、链路和目标需求，便于实验分析。"
  ], { fontSize: 8.8, titleSize: 10.2, accent: C.navy });
  s.addNotes(note("目标需求与节点效用", [
    "目标需求评分用于判断目标当前需要多少感知资源，主要考虑优先级、不确定性和运动强度。",
    "节点效用评分用于判断某架无人机是否适合观察某个目标，综合覆盖、能量、链路、路径和视线等因素。",
    "这样，RADS 的派机结果不是随机产生，而是可以解释为目标需求和节点适配度共同作用的结果。"
  ]));
}

// 11 Dynamic budget
{
  const s = pptx.addSlide();
  header(s, 11, "动态预算：派机规模随任务压力和系统状态自适应调整", "预算机制控制每一步最多投入多少无人机，避免固定派机带来的资源不足或冗余浪费。");
  flow(s, [
    ["估计任务压力", "目标数量、优先级、失败历史"],
    ["评估系统状态", "可用节点、平均能量、链路质量"],
    ["计算派机预算", "约束在最小与最大预算之间"],
    ["目标排序", "优先处理高需求目标"],
    ["候选筛选", "排除故障、低能、不可达节点"],
    ["贪心选择", "按效用选择子群"],
  ], 0.78, 1.28, 11.75, 0.82, { titleSize: 8.1, fontSize: 6.4, highlight: 2 });
  table(s, 0.78, 2.42, [2.0, 3.2, 3.1, 3.45], 0.42, [
    ["步骤", "输入", "处理逻辑", "输出"],
    ["1. 目标需求排序", "目标优先级、速度、不确定性", "从高需求到低需求处理", "目标处理序列"],
    ["2. 预算确定", "任务压力、能量、链路、近期结果", "动态调整派机上限", "本步预算 B(t)"],
    ["3. 节点候选", "无人机状态、路径、视线、链路", "过滤不可用或低效节点", "候选集合"],
    ["4. 子群生成", "候选效用得分", "贪心选择并更新预算", "目标-无人机分配"],
  ], { headerSize: 7.8, fontSize: 7.6, aligns: ["center", "left", "left", "left"] });
  panel(s, 0.78, 5.05, 3.65, 1.02, "相比固定派机", [
    "能在任务压力上升时扩大子群，任务压力下降时减少冗余投入"
  ], { fontSize: 8.8, titleSize: 10.2 });
  panel(s, 4.84, 5.05, 3.65, 1.02, "相比随机派机", [
    "预算相近，但节点选择不随机，而是优先选择高效用候选"
  ], { fontSize: 8.8, titleSize: 10.2, accent: C.navy });
  panel(s, 8.9, 5.05, 3.63, 1.02, "相比全量派机", [
    "减少低价值重复观测，显著降低平均派机数量和累计能耗"
  ], { fontSize: 8.8, titleSize: 10.2 });
  s.addNotes(note("动态预算与子群生成", [
    "动态预算用于决定每个仿真步最多派出多少无人机，它由任务压力和系统状态共同影响。",
    "在预算确定后，算法按目标需求排序，再对候选无人机进行效用评分和贪心选择。",
    "这样既能在复杂任务时保证足够资源，又能避免全量派遣的过度消耗。"
  ]));
}

// 12 Fusion
{
  const s = pptx.addSlide();
  header(s, 12, "感知融合：严格成功指标同时考察确认、误差和一致性", "平台不只判断“是否看见目标”，而是继续判断观测是否可靠、是否及时、融合误差是否达标。");
  flow(s, [
    ["感知触发", "距离、视场、视线同时满足"],
    ["概率探测", "按环境和噪声生成观测"],
    ["链路传输", "丢包与延迟影响送达"],
    ["稳健融合", "加权融合并抑制异常观测"],
    ["严格判定", "确认数、误差、一致性达标"],
  ], 0.78, 1.28, 11.75, 0.85, { titleSize: 8.6, fontSize: 6.7, highlight: 4 });
  table(s, 0.78, 2.48, [1.8, 2.65, 2.85, 4.45], 0.42, [
    ["判定环节", "输入", "判定标准", "作用"],
    ["有效观测", "无人机位置、目标位置、障碍", "范围内、视线无遮挡、视场角满足", "过滤无效或不可能观测"],
    ["观测送达", "链路质量、丢包率、延迟", "观测未丢失且时效可接受", "保证融合信息可用"],
    ["融合误差", "多机观测位置", "融合位置误差低于阈值", "保证结果精度"],
    ["一致性", "多源观测残差", "观测之间差异不过大", "减少异常值影响"],
  ], { headerSize: 7.8, fontSize: 7.6, aligns: ["center", "left", "left", "left"] });
  band(s, 0.95, 5.1, 3.25, 0.54, "融合位置 = Σ wi zi / Σ wi", { fontSize: 10.2 });
  band(s, 5.0, 5.1, 3.25, 0.54, "误差 ej = ||融合位置 - 真实位置||", { fontSize: 10.2 });
  band(s, 9.05, 5.1, 3.25, 0.54, "严格成功 = 确认 ∧ 达标 ∧ 一致", { fontSize: 10.2 });
  s.addNotes(note("感知融合与成功判定", [
    "平台中的成功判定比较严格。首先要满足感知条件，包括距离、视场角和视线无遮挡。",
    "探测成功后还要考虑链路传输过程中的丢包和延迟，只有有效观测才能参与融合。",
    "最终的严格成功需要确认数、定位误差和观测一致性同时满足，因此比单纯覆盖率更能反映协同感知质量。"
  ]));
}

// 13 Platform implementation
{
  const s = pptx.addSlide();
  header(s, 13, "平台实现：形成参数配置、三维沙盘、策略对比和数据导出的实验闭环", "平台支持从场景参数输入到实验过程回放，再到任务级分析与 CSV 结果导出。");
  s.addImage({ path: FIG("ch7", "fig7-8_scene3d_structure.png"), x: 0.78, y: 1.3, w: 5.65, h: 3.18 });
  table(s, 6.75, 1.3, [1.5, 2.15, 2.15], 0.38, [
    ["模块", "核心能力", "对应实现"],
    ["参数配置", "无人机、目标、障碍、通信、天气", "static/app.js"],
    ["三维沙盘", "无人机、目标、障碍、链路、轨迹", "scene3d-webgl.mjs"],
    ["会话仿真", "逐步推进、多策略同步", "sessions.py"],
    ["指标展示", "成功率、误差、能耗、派机数量", "core.py"],
    ["结果导出", "任务级结果与对比数据", "server.py"],
  ], { headerSize: 7.6, fontSize: 7.4, aligns: ["center", "left", "left"] });
  factorStrip(s, [
    ["可运行", "不是静态展示，后端真实计算"],
    ["可观察", "三维态势可展示过程变化"],
    ["可比较", "三策略共享同一环境快照"],
    ["可解释", "任务级数据支撑失败分析"],
  ], 0.78, 4.78, 11.75, 0.85);
  panel(s, 0.78, 5.86, 11.75, 0.48, "答辩强调", [
    "平台价值在于把算法、场景和实验连接起来，使论文结论能通过运行过程与结果数据共同支撑。"
  ], { fontSize: 8.8, titleSize: 9.6, gap: 0.2 });
  s.addNotes(note("平台实现", [
    "平台实现包括前端可视化和后端仿真两部分。",
    "前端支持参数配置、三维沙盘、指标展示和数据导出；后端负责实验会话、仿真推进、策略调度和结果统计。",
    "这一页需要强调，本毕设不是只写算法或只做网页，而是实现了可以运行和展示实验过程的平台。"
  ]));
}

// 14 Experiment setup
{
  const s = pptx.addSlide();
  header(s, 14, "实验设计：统一场景下比较 RADS、随机派遣和全量派遣", "实验从效果指标和资源指标两个角度评价，重点验证 RADS 的综合平衡能力。");
  table(s, 0.78, 1.28, [1.65, 3.2, 3.05, 3.85], 0.42, [
    ["策略", "含义", "对照作用", "预期表现"],
    ["RADS", "基于目标需求和节点效用动态选择子群", "本文方法", "成功率较高，资源消耗低"],
    ["随机派遣", "在相近预算下随机选择无人机", "无智能调度基线", "资源可控但稳定性差"],
    ["全量派遣", "尽量派出全部可用无人机", "高资源投入基线", "成功率高但能耗和派机规模大"],
  ], { headerSize: 7.9, fontSize: 7.8, aligns: ["center", "left", "left", "left"] });
  factorStrip(s, [
    ["严格成功率", "综合确认数、误差和一致性"],
    ["平均误差", "衡量融合定位精度"],
    ["累计能耗", "衡量资源消耗强度"],
    ["平均派机数", "衡量调度规模"],
    ["信息时效", "衡量观测是否及时"],
  ], 0.78, 3.28, 11.75, 0.86);
  table(s, 0.78, 4.55, [1.8, 2.45, 2.45, 2.45, 2.6], 0.36, [
    ["变量类别", "默认场景", "任务规模", "环境扰动", "通信条件"],
    ["设置", "24机/6目标/34障碍", "目标数 6→10", "晴空/薄雾/降雨/雷暴；障碍34→50", "半径300→500；丢包0→10%；延迟0→2"],
    ["目的", "验证基础效果", "验证负载适应性", "验证复杂环境鲁棒性", "验证信息共享影响"],
  ], { headerSize: 7.4, fontSize: 7.2, aligns: ["center", "center", "center", "center", "center"] });
  s.addNotes(note("实验设计", [
    "实验采用三策略对比：RADS、随机派遣和全量派遣。",
    "评价指标既包括严格成功率和平均误差，也包括累计能耗和平均派机数量。",
    "实验变量包括任务规模、天气、障碍复杂度和通信条件，用于观察方法在不同约束下的表现。"
  ]));
}

// 15 Default result
{
  const s = pptx.addSlide();
  header(s, 15, "默认场景结果：RADS 成功率接近全量派遣，但资源消耗明显更低", "默认设置下，RADS 在效果与资源之间取得较好平衡，是本文最核心的实验结论。");
  s.addChart(pptx.ChartType.bar, [
    { name: "严格成功率", labels: ["RADS", "随机派遣", "全量派遣"], values: [70.8, 16.7, 72.9] },
  ], { ...chartOpts(0.78, 1.3, 4.95, 2.6, "默认场景严格成功率（%）"), showLegend: false, ser: [{ color: C.navy }] });
  table(s, 6.05, 1.3, [1.65, 1.55, 1.55, 1.55], 0.38, [
    ["指标", "RADS", "随机派遣", "全量派遣"],
    ["严格成功率", "70.8%", "16.7%", "72.9%"],
    ["平均误差", "9.52m", "较高", "8.07m"],
    ["累计能耗", "1120.4", "接近RADS", "2138.5"],
    ["平均派机数", "9.4", "相近预算", "20.5"],
  ], { headerSize: 7.5, fontSize: 7.5, aligns: ["left", "center", "center", "center"] });
  stat(s, 0.85, 4.32, 1.65, 0.92, "70.8%", "RADS成功率", "仅低全量2.1pp", { color: C.red });
  stat(s, 2.72, 4.32, 1.65, 0.92, "47.6%", "能耗降低", "相较全量派遣", { color: C.navy });
  stat(s, 4.59, 4.32, 1.65, 0.92, "54.1%", "派机降低", "9.4 vs 20.5", { color: C.navy });
  stat(s, 6.46, 4.32, 1.65, 0.92, "9.52m", "平均误差", "接近全量8.07m", { color: C.red });
  panel(s, 8.55, 4.24, 3.75, 1.1, "结果解释", [
    "RADS 通过筛选高效节点，避免把大量资源投入低价值观测；因此成功率接近全量，但能耗和派机数量显著下降。"
  ], { fontSize: 8.5, titleSize: 10.2 });
  s.addNotes(note("默认场景结果", [
    "默认场景下，RADS 的严格成功率为 70.8%，全量派遣为 72.9%，两者差距只有 2.1 个百分点。",
    "但资源消耗上，RADS 的累计能耗比全量派遣低约 47.6%，平均派机数量也从 20.5 降到 9.4。",
    "这说明 RADS 的优势不是单纯提高某一个指标，而是在接近全量感知效果的同时明显节省资源。"
  ]));
}

// 16 Task scale
{
  const s = pptx.addSlide();
  header(s, 16, "任务规模实验：目标数量增加后，RADS 通过扩大子群保持相对稳定", "当目标数从 6 增加到 10 时，任务压力上升，RADS 的成功率下降幅度较小。");
  s.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["6目标", "10目标"], values: [70.8, 68.0] },
    { name: "随机派遣", labels: ["6目标", "10目标"], values: [16.7, 21.8] },
    { name: "全量派遣", labels: ["6目标", "10目标"], values: [72.9, 58.3] },
  ], { ...chartOpts(0.78, 1.28, 5.45, 2.65, "任务规模变化下严格成功率（%）"), ser: [{ color: C.red }, { color: C.blue }, { color: C.navy }] });
  table(s, 6.55, 1.28, [1.8, 1.55, 1.55, 1.55], 0.39, [
    ["指标", "6目标", "10目标", "变化"],
    ["RADS成功率", "70.8%", "68.0%", "-2.8pp"],
    ["全量成功率", "72.9%", "58.3%", "-14.6pp"],
    ["RADS平均派机", "9.4", "14.3", "+4.9"],
    ["结论", "压力较低", "压力升高", "RADS主动扩容"],
  ], { headerSize: 7.4, fontSize: 7.4, aligns: ["left", "center", "center", "center"] });
  factorStrip(s, [
    ["任务压力增加", "目标数量上升导致无人机资源竞争"],
    ["RADS 调整", "动态预算扩大派机子群"],
    ["成功率保持", "RADS 仅下降 2.8 个百分点"],
    ["资源变化可解释", "平均派机数随目标规模上升"],
  ], 0.78, 4.35, 11.75, 0.88);
  panel(s, 0.78, 5.5, 11.75, 0.58, "答辩表达", [
    "这一页重点说明 RADS 不是固定规模算法，而是能够感知任务压力变化并调整资源投入。"
  ], { fontSize: 8.9, titleSize: 10 });
  s.addNotes(note("任务规模实验", [
    "任务规模实验将目标数量从 6 个增加到 10 个，在无人机数量不变的情况下任务压力明显上升。",
    "RADS 的严格成功率只下降 2.8 个百分点，同时平均派机数量上升到 14.3，说明算法会主动扩大子群。",
    "这体现了 RADS 对任务规模变化的适应性。"
  ]));
}

// 17 Weather obstacle
{
  const s = pptx.addSlide();
  header(s, 17, "环境扰动实验：天气会压低系统上限，障碍影响路径与视线可达性", "天气、障碍等外部扰动会影响所有策略，但 RADS 仍能通过路径和视线判断减少无效派机。");
  s.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [70.8, 60.8, 48.3, 34.2] },
    { name: "随机派遣", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [16.7, 9.2, 8.3, 6.7] },
    { name: "全量派遣", labels: ["晴空", "薄雾", "降雨", "雷暴"], values: [72.9, 74.6, 67.9, 50.0] },
  ], { ...chartOpts(0.78, 1.28, 5.45, 2.48, "天气扰动下严格成功率（%）"), ser: [{ color: C.red }, { color: C.blue }, { color: C.navy }] });
  s.addChart(pptx.ChartType.line, [
    { name: "RADS", labels: ["34障碍", "50障碍"], values: [70.8, 68.8] },
    { name: "随机派遣", labels: ["34障碍", "50障碍"], values: [16.7, 19.6] },
    { name: "全量派遣", labels: ["34障碍", "50障碍"], values: [72.9, 74.6] },
  ], { ...chartOpts(6.65, 1.28, 5.45, 2.48, "障碍数量变化下严格成功率（%）"), ser: [{ color: C.red }, { color: C.blue }, { color: C.navy }] });
  table(s, 0.78, 4.08, [2.2, 3.1, 3.1, 3.35], 0.39, [
    ["实验变量", "关键现象", "原因解释", "对 RADS 的说明"],
    ["天气恶化", "RADS 70.8%→34.2%", "半径、噪声、链路和时效同时受影响", "极端环境仍会压低上限"],
    ["障碍增加", "RADS 70.8%→68.8%", "绕障路径和视线约束改变候选质量", "路径/视线评分提高稳定性"],
    ["综合判断", "RADS 始终高于随机派遣", "动态筛选有效节点", "证明调度不是随机行为"],
  ], { headerSize: 7.6, fontSize: 7.5, aligns: ["center", "left", "left", "left"] });
  s.addNotes(note("天气与障碍实验", [
    "天气扰动实验中，随着环境从晴空到雷暴，RADS 成功率明显下降，说明极端天气会压低系统上限。",
    "障碍实验中，障碍数量从 34 增加到 50 后，RADS 成功率变化较小，说明路径和视线约束有助于减少无效派机。",
    "总体来看，RADS 在复杂环境下仍明显优于随机派遣。"
  ]));
}

// 18 Communication
{
  const s = pptx.addSlide();
  header(s, 18, "通信条件实验：链路半径、丢包和延迟直接影响融合信息质量", "协同感知依赖观测信息能否及时送达，因此通信条件是影响严格成功率的重要因素。");
  s.addChart(pptx.ChartType.line, [{ name: "RADS", labels: ["300m", "400m", "500m"], values: [70.8, 81.7, 78.3] }], {
    ...chartOpts(0.78, 1.28, 3.65, 2.1, "通信半径（%）"), showLegend: false, ser: [{ color: C.red }]
  });
  s.addChart(pptx.ChartType.line, [{ name: "RADS", labels: ["0%", "4%", "10%"], values: [77.9, 70.8, 65.0] }], {
    ...chartOpts(4.82, 1.28, 3.65, 2.1, "丢包率（%）"), showLegend: false, ser: [{ color: C.navy }]
  });
  s.addChart(pptx.ChartType.line, [{ name: "RADS", labels: ["0步", "1步", "2步"], values: [70.8, 65.4, 60.0] }], {
    ...chartOpts(8.86, 1.28, 3.65, 2.1, "通信延迟（%）"), showLegend: false, ser: [{ color: C.green }]
  });
  table(s, 0.78, 3.92, [2.2, 3.05, 3.05, 3.45], 0.39, [
    ["通信变量", "实验现象", "机制解释", "对平台设计的启示"],
    ["通信半径", "300m→400m 时成功率提升到 81.7%", "更多观测能及时汇入融合", "链路覆盖能提升协同效率"],
    ["丢包率", "0%→10% 时成功率降至 65.0%", "有效观测数量减少", "融合质量依赖可靠传输"],
    ["通信延迟", "0→2步时成功率降至 60.0%", "观测时效下降，状态滞后", "时效应进入协同评价"],
  ], { headerSize: 7.5, fontSize: 7.4, aligns: ["center", "left", "left", "left"] });
  s.addNotes(note("通信条件实验", [
    "通信条件实验分别考察通信半径、丢包率和延迟。",
    "通信半径从 300 米增加到 400 米时，RADS 成功率有明显提升；但继续增加到 500 米后收益趋于稳定。",
    "丢包率和延迟升高都会降低成功率，因为观测信息无法及时有效参与融合。"
  ]));
}

// 19 Overall
{
  const s = pptx.addSlide();
  header(s, 19, "综合结果：RADS 的优势在于接近全量效果，同时显著降低资源投入", "多组实验平均结果显示，RADS 不是单项指标绝对最优，而是综合平衡更适合有限资源场景。");
  s.addChart(pptx.ChartType.bar, [
    { name: "平均严格成功率", labels: ["RADS", "随机派遣", "全量派遣"], values: [64.9, 17.1, 70.3] },
  ], { ...chartOpts(0.78, 1.28, 4.3, 2.38, "平均严格成功率（%）", 80), showLegend: false, ser: [{ color: C.navy }] });
  s.addChart(pptx.ChartType.bar, [
    { name: "平均累计能耗", labels: ["RADS", "随机派遣", "全量派遣"], values: [1060.4, 1103.0, 2143.4] },
  ], { ...chartOpts(5.32, 1.28, 4.3, 2.38, "平均累计能耗", 2400), showLegend: false, ser: [{ color: C.red }] });
  stat(s, 10.1, 1.36, 1.85, 0.93, "64.9%", "RADS平均成功率", "随机为17.1%", { color: C.red });
  stat(s, 10.1, 2.52, 1.85, 0.93, "49.5%", "能耗占比", "约为全量一半", { color: C.navy });
  table(s, 0.78, 4.02, [1.75, 1.55, 1.55, 1.55, 1.7, 1.6, 1.6], 0.36, [
    ["策略", "成功率", "达标率", "确认率", "误差(m)", "能耗", "派机数"],
    ["RADS", "64.9", "64.9", "65.4", "10.90", "1060.4", "8.8"],
    ["随机", "17.1", "17.1", "17.8", "14.83", "1103.0", "10.9"],
    ["全量", "70.3", "70.3", "71.0", "8.66", "2143.4", "20.4"],
  ], { headerSize: 7.2, fontSize: 7.2, aligns: ["left", "center", "center", "center", "center", "center", "center"] });
  panel(s, 0.78, 5.78, 11.75, 0.5, "综合判断", [
    "全量派遣在误差上更优，但资源成本过高；随机派遣资源可控但成功率低；RADS 在成功率和资源消耗之间取得更合理平衡。"
  ], { fontSize: 8.5, titleSize: 9.6 });
  s.addNotes(note("综合结果", [
    "综合多组实验平均结果，RADS 的平均严格成功率为 64.9%，明显高于随机派遣的 17.1%，接近全量派遣的 70.3%。",
    "全量派遣的误差更低，但平均能耗为 2143.4，约为 RADS 的两倍。",
    "因此，RADS 的优势在于以更低资源成本保持较高协同感知质量。"
  ]));
}

// 20 Discussion
{
  const s = pptx.addSlide();
  header(s, 20, "方法讨论：RADS 有效的关键在于把“任务需求”和“节点质量”同时纳入决策", "实验现象可以从目标侧、节点侧、环境侧和评价侧四个角度解释。");
  table(s, 0.78, 1.28, [1.8, 3.15, 3.35, 3.45], 0.42, [
    ["分析角度", "RADS 的处理", "实验中的体现", "结论含义"],
    ["目标侧", "高优先级、高不确定、高速度目标获得更高需求", "任务规模增大时主动扩大派机", "调度具有任务适应性"],
    ["节点侧", "根据能量、链路、覆盖和路径评分筛选节点", "默认场景派机数仅 9.4", "资源投入更精准"],
    ["环境侧", "障碍、视线、天气和通信进入评分或判定", "障碍增加时成功率变化较小", "减少无效派机"],
    ["评价侧", "严格成功率、误差、能耗、派机数共同评价", "接近全量效果但能耗约减半", "体现综合平衡"],
  ], { headerSize: 7.8, fontSize: 7.7, aligns: ["center", "left", "left", "left"] });
  factorStrip(s, [
    ["不是随机", "节点选择有评分依据"],
    ["不是全量", "资源预算约束派机规模"],
    ["不是静态", "每个仿真步重新计算"],
    ["不是单指标", "效果与资源联合评价"],
  ], 0.78, 3.95, 11.75, 0.86);
  panel(s, 0.78, 5.1, 3.65, 1.0, "适用场景", [
    "资源有限但需要保持较高态势感知质量的多目标任务"
  ], { fontSize: 9.0, titleSize: 10.2 });
  panel(s, 4.84, 5.1, 3.65, 1.0, "边界条件", [
    "极端天气或严重通信受限时，系统上限仍会下降"
  ], { fontSize: 9.0, titleSize: 10.2, accent: C.navy });
  panel(s, 8.9, 5.1, 3.63, 1.0, "改进方向", [
    "后续可通过参数优化和批量实验进一步提高稳定性"
  ], { fontSize: 9.0, titleSize: 10.2 });
  s.addNotes(note("方法讨论", [
    "从实验结果看，RADS 有效的关键在于同时考虑目标需求和节点质量。",
    "它不是随机派遣，因为节点选择有评分依据；也不是全量派遣，因为存在资源预算约束。",
    "但也要说明，极端天气和严重通信受限仍会降低系统上限，这是后续工作需要继续优化的方向。"
  ]));
}

// 21 Innovation
{
  const s = pptx.addSlide();
  header(s, 21, "创新点与不足：本文贡献集中在复杂约束建模、动态子群调度和可解释平台验证", "本科毕设的创新不追求脱离系统的单点公式，而是强调模型、算法、平台和实验的整体完成度。");
  table(s, 0.78, 1.28, [1.8, 3.35, 3.1, 3.5], 0.42, [
    ["创新点", "具体内容", "解决问题", "答辩表述"],
    ["平台创新", "构建复杂约束下无人机集群协同态势感知平台", "避免算法脱离运行场景", "实现了可运行、可回放、可导出的系统"],
    ["方法创新", "提出 RADS 动态子群选择方法", "解决随机派机和全量派机的不足", "以目标需求和节点效用指导派机"],
    ["建模创新", "统一纳入障碍、天气、丢包、延迟和故障", "提升实验场景复杂度", "不是理想环境下的简单对比"],
    ["评价创新", "三策略对比、任务级分析和三维可视化", "增强结果解释能力", "用过程和数据共同支撑结论"],
  ], { headerSize: 7.8, fontSize: 7.6, aligns: ["center", "left", "left", "left"] });
  panel(s, 0.78, 4.58, 3.75, 1.08, "当前不足", [
    "仍属于论文级仿真平台",
    "未接入真实飞控和图像级传感器模型",
    "参数权重仍依赖经验设置"
  ], { fontSize: 8.2, gap: 0.21, titleSize: 10.2 });
  panel(s, 4.82, 4.58, 3.75, 1.08, "原因说明", [
    "本科毕设时间与硬件条件有限",
    "课题重点放在算法-平台-实验闭环",
    "保留后续扩展接口"
  ], { fontSize: 8.2, gap: 0.21, titleSize: 10.2, accent: C.navy });
  panel(s, 8.86, 4.58, 3.67, 1.08, "后续改进", [
    "增加批量实验与统计检验",
    "优化权重参数",
    "探索接入 ROS/PX4"
  ], { fontSize: 8.2, gap: 0.21, titleSize: 10.2 });
  s.addNotes(note("创新点与不足", [
    "本文的创新点主要包括四个方面：复杂约束平台、RADS 动态子群调度方法、统一仿真建模以及任务级可解释评价。",
    "不足之处也需要主动说明：当前平台仍是论文级仿真，尚未接入高保真动力学和真实传感器模型。",
    "后续可以通过批量实验、参数优化和对接 ROS/PX4 进一步完善。"
  ]));
}

// 22 Conclusion
{
  const s = pptx.addSlide();
  header(s, 22, "总结：本文完成了从复杂场景建模到平台实验验证的完整毕业设计闭环", "RADS 能在接近全量派遣感知效果的同时显著降低能耗和派机规模，体现出较好的综合应用价值。");
  stat(s, 0.88, 1.42, 1.8, 0.98, "1套", "可运行平台", "Web仿真与可视化", { color: C.navy });
  stat(s, 2.95, 1.42, 1.8, 0.98, "3类", "对比策略", "RADS/随机/全量", { color: C.red });
  stat(s, 5.02, 1.42, 1.8, 0.98, "多组", "扰动实验", "任务/天气/障碍/通信", { color: C.navy });
  stat(s, 7.09, 1.42, 1.8, 0.98, "47.6%", "能耗降低", "默认场景相较全量", { color: C.red });
  stat(s, 9.16, 1.42, 1.8, 0.98, "49.5%", "平均能耗占比", "综合实验约为全量一半", { color: C.navy });
  table(s, 0.78, 2.85, [2.05, 4.7, 4.95], 0.43, [
    ["总结项", "完成情况", "结论"],
    ["模型", "建立包含障碍、天气、通信、故障的多目标协同感知场景", "为复杂约束下实验验证提供基础"],
    ["算法", "设计 RADS 目标需求、节点效用和动态预算机制", "能够按任务压力选择感知子群"],
    ["平台", "实现后端仿真、三维展示、三策略对比和结果导出", "支撑答辩演示与论文实验"],
    ["实验", "完成默认场景及任务规模、天气、障碍、通信条件实验", "验证 RADS 的综合平衡能力"],
  ], { headerSize: 7.8, fontSize: 7.6, aligns: ["center", "left", "left"] });
  addText(s, "谢谢各位老师，请批评指正！", { x: 3.75, y: 5.7, w: 5.8, h: 0.36, fontSize: 20, bold: true, color: C.navy, align: "center" });
  s.addNotes(note("总结", [
    "最后总结全文：本文完成了复杂场景建模、RADS 算法设计、Web 平台实现和多组实验验证。",
    "实验结果表明，RADS 相比随机派遣具有明显优势，相比全量派遣能够以更低能耗和更少派机数量获得接近的感知效果。",
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
