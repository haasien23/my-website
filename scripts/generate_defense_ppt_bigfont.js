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
const OUT_DIR = path.join(ROOT, "output", "defense_ppt_bigfont");
const DESKTOP = path.join(os.homedir(), "Desktop");
const LOGO = path.join(ROOT, "output", "ppt_visual_scheme", "jxust-logo-cropped.png");
const DOCIMG = (...parts) => path.join(ROOT, "output", "thesis_docx_images", ...parts);
const FIG = (...parts) => path.join(ROOT, "output", "figures", ...parts);
const PPTX_PATH = path.join(OUT_DIR, "基于集群的多任务协同态势感知平台_本科毕设答辩_大字号源版.pptx");
fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  page: "F2F5F9",
  white: "FFFFFF",
  navy: "062C60",
  navy2: "0A3E7A",
  blue: "2B6CB0",
  pale: "F7FAFE",
  lightBlue: "EAF2FB",
  midBlue: "BED0E6",
  red: "A9362F",
  red2: "C84E45",
  green: "3F7A55",
  gold: "B88A30",
  ink: "172033",
  gray: "4B5563",
  gray2: "6B7280",
  line: "CBD6E4",
  line2: "E4EAF2",
};

const FONT = "Microsoft YaHei";

function addText(s, text, o = {}) {
  s.addText(text, {
    fontFace: FONT,
    margin: 0,
    fit: "shrink",
    breakLine: false,
    color: C.ink,
    ...o,
  });
}

function note(title, lines) {
  return `【${title}】\n${lines.join("\n")}`;
}

function page(s) {
  s.background = { color: C.page };
  s.addShape(pptx.ShapeType.rect, {
    x: 0.22,
    y: 0.16,
    w: 12.9,
    h: 7.12,
    line: { color: "D7E0EA", width: 0.8 },
    fill: { color: C.white },
    shadow: { type: "outer", color: "AAB6C4", opacity: 0.12, blur: 1, angle: 45, distance: 1 },
  });
}

function header(s, no, title, desc) {
  page(s);
  addText(s, String(no).padStart(2, "0"), {
    x: 0.55,
    y: 0.42,
    w: 0.48,
    h: 0.26,
    fontSize: 20,
    bold: true,
    color: C.navy,
  });
  addText(s, title, {
    x: 1.12,
    y: 0.39,
    w: 8.85,
    h: 0.33,
    fontSize: 21,
    bold: true,
    color: C.ink,
  });
  addText(s, desc, {
    x: 0.58,
    y: 0.82,
    w: 10.9,
    h: 0.24,
    fontSize: 12,
    color: C.gray,
  });
  s.addImage({ path: LOGO, x: 10.58, y: 0.32, w: 2.05, h: 0.6 });
  line(s, 0.55, 1.14, 12.08, C.navy, 1.2);
  footer(s, no);
}

function footer(s, no) {
  line(s, 0.55, 6.86, 12.08, C.line2, 0.8);
  addText(s, "资料来源：桌面《毕业论文初稿》插图、平台实验输出与代码实现", {
    x: 0.58,
    y: 6.99,
    w: 6.3,
    h: 0.16,
    fontSize: 8,
    color: C.gray2,
  });
  addText(s, String(no).padStart(2, "0"), {
    x: 12.18,
    y: 6.98,
    w: 0.42,
    h: 0.16,
    fontSize: 9,
    color: C.gray2,
    align: "right",
  });
}

function line(s, x, y, w, color = C.line, width = 0.8) {
  s.addShape(pptx.ShapeType.line, { x, y, w, h: 0, line: { color, width } });
}

function box(s, x, y, w, h, opts = {}) {
  s.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: opts.line || C.line, width: opts.width || 0.9 },
    fill: { color: opts.fill || C.white },
  });
}

function tag(s, x, y, w, h, text, opts = {}) {
  box(s, x, y, w, h, { fill: opts.fill || C.lightBlue, line: opts.line || C.midBlue });
  addText(s, text, {
    x: x + 0.08,
    y: y + h / 2 - 0.13,
    w: w - 0.16,
    h: 0.26,
    fontSize: opts.fontSize || 13,
    bold: opts.bold ?? true,
    color: opts.color || C.navy,
    align: opts.align || "center",
  });
}

function bullet(s, text, x, y, w, opts = {}) {
  s.addShape(pptx.ShapeType.rect, {
    x,
    y: y + 0.1,
    w: 0.075,
    h: 0.075,
    line: { color: opts.color || C.red },
    fill: { color: opts.color || C.red },
  });
  addText(s, text, {
    x: x + 0.17,
    y,
    w,
    h: opts.h || 0.29,
    fontSize: opts.fontSize || 12.5,
    bold: opts.bold || false,
    color: opts.textColor || C.ink,
  });
}

function bullets(s, items, x, y, w, opts = {}) {
  const gap = opts.gap || 0.37;
  items.forEach((t, i) => bullet(s, t, x, y + i * gap, w, opts));
}

function panel(s, x, y, w, h, title, items, opts = {}) {
  box(s, x, y, w, h, { fill: opts.fill || C.white, line: opts.line || C.line });
  s.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.09,
    h,
    line: { color: opts.accent || C.red },
    fill: { color: opts.accent || C.red },
  });
  addText(s, title, {
    x: x + 0.18,
    y: y + 0.16,
    w: w - 0.32,
    h: 0.28,
    fontSize: opts.titleSize || 14,
    bold: true,
    color: opts.titleColor || C.navy,
  });
  bullets(s, items, x + 0.2, y + 0.58, w - 0.42, {
    fontSize: opts.fontSize || 12,
    gap: opts.gap || 0.34,
    h: opts.itemH || 0.28,
    color: opts.bulletColor || C.red,
  });
}

function stat(s, x, y, w, h, value, label, sub, opts = {}) {
  box(s, x, y, w, h, { fill: opts.fill || C.white, line: opts.line || C.line });
  addText(s, value, {
    x: x + 0.08,
    y: y + 0.15,
    w: w - 0.16,
    h: 0.4,
    fontSize: opts.valueSize || 23,
    bold: true,
    color: opts.color || C.navy,
    align: "center",
  });
  addText(s, label, {
    x: x + 0.08,
    y: y + 0.65,
    w: w - 0.16,
    h: 0.22,
    fontSize: opts.labelSize || 11,
    bold: true,
    color: C.ink,
    align: "center",
  });
  addText(s, sub, {
    x: x + 0.08,
    y: y + 0.96,
    w: w - 0.16,
    h: 0.18,
    fontSize: opts.subSize || 9,
    color: C.gray2,
    align: "center",
  });
}

function table(s, x, y, colWs, rowH, rows, opts = {}) {
  let yy = y;
  rows.forEach((row, r) => {
    let xx = x;
    row.forEach((cell, c) => {
      const fill = r === 0 ? (opts.headerFill || C.navy) : (r % 2 === 0 ? (opts.altFill || C.pale) : C.white);
      box(s, xx, yy, colWs[c], rowH, { fill, line: opts.line || C.line, width: 0.7 });
      addText(s, String(cell), {
        x: xx + 0.08,
        y: yy + rowH / 2 - 0.105,
        w: colWs[c] - 0.16,
        h: 0.23,
        fontSize: r === 0 ? (opts.headerSize || 11) : (opts.fontSize || 11),
        bold: r === 0,
        color: r === 0 ? C.white : C.ink,
        align: opts.aligns?.[c] || (c === 0 ? "left" : "center"),
      });
      xx += colWs[c];
    });
    yy += rowH;
  });
}

function flow(s, nodes, x, y, w, h, opts = {}) {
  const gap = opts.gap || 0.12;
  const nw = (w - gap * (nodes.length - 1)) / nodes.length;
  nodes.forEach((n, i) => {
    const nx = x + i * (nw + gap);
    box(s, nx, y, nw, h, { fill: i === opts.highlight ? C.lightBlue : C.white, line: C.midBlue });
    addText(s, n[0], {
      x: nx + 0.09,
      y: y + 0.13,
      w: nw - 0.18,
      h: 0.27,
      fontSize: opts.titleSize || 12,
      bold: true,
      color: C.navy,
      align: "center",
    });
    addText(s, n[1], {
      x: nx + 0.09,
      y: y + 0.52,
      w: nw - 0.18,
      h: h - 0.62,
      fontSize: opts.fontSize || 9.5,
      color: C.gray,
      align: "center",
    });
    if (i < nodes.length - 1) {
      s.addShape(pptx.ShapeType.rightArrow, {
        x: nx + nw - 0.05,
        y: y + h / 2 - 0.08,
        w: 0.2,
        h: 0.16,
        line: { color: C.red, transparency: 100 },
        fill: { color: C.red },
      });
    }
  });
}

function imagePanel(s, img, x, y, w, h, caption, opts = {}) {
  box(s, x, y, w, h, { fill: opts.fill || C.white, line: opts.line || C.line });
  s.addImage({ path: img, x: x + 0.08, y: y + 0.08, w: w - 0.16, h: h - (caption ? 0.42 : 0.16) });
  if (caption) {
    addText(s, caption, {
      x: x + 0.12,
      y: y + h - 0.28,
      w: w - 0.24,
      h: 0.18,
      fontSize: opts.captionSize || 9.8,
      color: C.gray,
      align: "center",
    });
  }
}

function barChart(s, x, y, w, h, title, labels, values, colors, maxVal = 100, unit = "%") {
  box(s, x, y, w, h, { fill: C.white, line: C.line });
  addText(s, title, { x: x + 0.18, y: y + 0.15, w: w - 0.36, h: 0.25, fontSize: 13, bold: true, color: C.navy, align: "center" });
  const baseY = y + h - 0.58;
  const topY = y + 0.58;
  const chartH = baseY - topY;
  const slot = (w - 0.8) / labels.length;
  line(s, x + 0.45, baseY, w - 0.9, C.line, 1);
  labels.forEach((lab, i) => {
    const bh = chartH * values[i] / maxVal;
    const bx = x + 0.55 + i * slot + slot * 0.2;
    const bw = slot * 0.6;
    s.addShape(pptx.ShapeType.rect, {
      x: bx,
      y: baseY - bh,
      w: bw,
      h: bh,
      line: { color: colors[i] || C.navy },
      fill: { color: colors[i] || C.navy },
    });
    addText(s, `${values[i]}${unit}`, { x: bx - 0.1, y: baseY - bh - 0.24, w: bw + 0.2, h: 0.18, fontSize: 10.5, bold: true, color: C.ink, align: "center" });
    addText(s, lab, { x: bx - 0.2, y: baseY + 0.12, w: bw + 0.4, h: 0.18, fontSize: 10.2, color: C.ink, align: "center" });
  });
}

function lineChart(s, x, y, w, h, title, labels, series, maxVal = 100) {
  box(s, x, y, w, h, { fill: C.white, line: C.line });
  addText(s, title, { x: x + 0.18, y: y + 0.13, w: w - 0.36, h: 0.25, fontSize: 12.5, bold: true, color: C.navy, align: "center" });
  const left = x + 0.48;
  const right = x + w - 0.35;
  const top = y + 0.62;
  const bottom = y + h - 0.55;
  line(s, left, bottom, right - left, C.line, 1);
  line(s, left, top, 0, C.line, 1);
  for (let i = 0; i <= 4; i++) {
    const yy = bottom - (bottom - top) * i / 4;
    line(s, left, yy, right - left, C.line2, 0.7);
  }
  labels.forEach((lab, i) => {
    const xx = left + (right - left) * i / Math.max(labels.length - 1, 1);
    addText(s, lab, { x: xx - 0.25, y: bottom + 0.13, w: 0.5, h: 0.18, fontSize: 9.3, color: C.ink, align: "center" });
  });
  series.forEach((ser) => {
    const pts = ser.values.map((v, i) => [
      left + (right - left) * i / Math.max(labels.length - 1, 1),
      bottom - (bottom - top) * v / maxVal,
      v,
    ]);
    for (let i = 0; i < pts.length - 1; i++) {
      s.addShape(pptx.ShapeType.line, {
        x: pts[i][0],
        y: pts[i][1],
        w: pts[i + 1][0] - pts[i][0],
        h: pts[i + 1][1] - pts[i][1],
        line: { color: ser.color, width: 1.8 },
      });
    }
    pts.forEach((p) => {
      s.addShape(pptx.ShapeType.ellipse, { x: p[0] - 0.04, y: p[1] - 0.04, w: 0.08, h: 0.08, line: { color: ser.color }, fill: { color: ser.color } });
      addText(s, String(p[2]), { x: p[0] - 0.18, y: p[1] - 0.24, w: 0.36, h: 0.16, fontSize: 8.4, color: ser.color, bold: true, align: "center" });
    });
  });
  let lx = x + 0.5;
  series.forEach((ser) => {
    s.addShape(pptx.ShapeType.rect, { x: lx, y: y + h - 0.22, w: 0.12, h: 0.06, line: { color: ser.color }, fill: { color: ser.color } });
    addText(s, ser.name, { x: lx + 0.16, y: y + h - 0.25, w: 0.75, h: 0.14, fontSize: 7.8, color: C.gray });
    lx += 0.95;
  });
}

// 1 Cover
{
  const s = pptx.addSlide();
  page(s);
  s.addImage({ path: LOGO, x: 0.62, y: 0.45, w: 2.95, h: 0.86 });
  addText(s, "本科毕业设计（论文）答辩", { x: 8.7, y: 0.5, w: 3.1, h: 0.25, fontSize: 14, bold: true, color: C.navy, align: "right" });
  addText(s, "信息工程学院 / 计算机科学与技术", { x: 8.32, y: 0.84, w: 3.48, h: 0.2, fontSize: 10, color: C.gray, align: "right" });
  line(s, 0.62, 1.48, 11.95, C.navy, 1.2);
  addText(s, "基于集群的多任务协同\n态势感知平台", { x: 0.78, y: 2.03, w: 6.8, h: 1.1, fontSize: 35, bold: true, color: C.navy });
  addText(s, "面向复杂环境下无人机集群多目标协同感知，完成场景建模、RADS 动态子群调度、Web 平台实现与多组实验验证。", {
    x: 0.82, y: 3.43, w: 7.3, h: 0.42, fontSize: 14, color: C.gray,
  });
  stat(s, 0.9, 4.28, 1.65, 1.08, "24", "无人机", "默认集群规模", { color: C.navy });
  stat(s, 2.78, 4.28, 1.65, 1.08, "6", "动态目标", "默认任务规模", { color: C.red });
  stat(s, 4.66, 4.28, 1.65, 1.08, "34", "障碍物", "默认复杂度", { color: C.navy });
  stat(s, 6.54, 4.28, 1.65, 1.08, "70.8%", "RADS成功率", "默认场景", { color: C.red });
  imagePanel(s, DOCIMG("image4.png"), 8.55, 2.18, 3.55, 2.85, "无人机集群协同态势感知示意");
  addText(s, "学生：贺小双    指导教师：陈益杉 副教授    答辩日期：2026年6月", { x: 0.8, y: 6.45, w: 8.8, h: 0.2, fontSize: 11.8, color: C.ink });
  addText(s, "01", { x: 12.16, y: 6.47, w: 0.4, h: 0.16, fontSize: 9, color: C.gray2, align: "right" });
  s.addNotes(note("封面页", [
    "各位老师好，我的毕业设计题目是《基于集群的多任务协同态势感知平台》。",
    "这项工作围绕复杂环境下无人机集群如何完成多目标协同感知展开，重点包括复杂场景建模、RADS 动态子群调度、Web 平台实现和实验验证。",
    "下面我将按照背景问题、系统设计、方法实现、平台展示、实验结果和总结展望进行汇报。"
  ]));
}

// 2 Agenda
{
  const s = pptx.addSlide();
  header(s, 2, "答辩结构：围绕“为什么做、怎么做、结果如何”展开", "总页数控制在 20 页，页面使用大字号与大图，便于答辩现场观看。");
  table(s, 0.88, 1.45, [0.9, 2.45, 5.1, 2.1], 0.56, [
    ["序号", "汇报部分", "核心回答", "建议时长"],
    ["01", "研究背景与问题", "无人机集群为什么需要动态协同态势感知", "约2分钟"],
    ["02", "系统建模与总体设计", "复杂环境、任务状态和平台架构如何组织", "约2分钟"],
    ["03", "RADS 方法设计", "目标需求、节点效用和动态预算如何计算", "约2.5分钟"],
    ["04", "平台实现与实验验证", "平台实现了哪些功能，实验结果说明什么", "约3分钟"],
    ["05", "创新点与结论", "本文成果、创新点、不足和后续工作", "约1分钟"],
  ], { headerSize: 11.5, fontSize: 11.5, aligns: ["center", "left", "left", "center"] });
  panel(s, 0.9, 5.0, 3.45, 1.05, "答辩重点一", ["RADS 不是随机派机，而是按目标需求和节点质量动态选择子群"], { fontSize: 12 });
  panel(s, 4.85, 5.0, 3.45, 1.05, "答辩重点二", ["平台不是静态展示，而是支持参数配置、三维回放和三策略对比"], { fontSize: 12, accent: C.navy });
  panel(s, 8.8, 5.0, 3.45, 1.05, "答辩重点三", ["实验结论是接近全量派遣效果，同时显著降低能耗和派机数量"], { fontSize: 12 });
  s.addNotes(note("目录页", [
    "本次汇报分为五个部分。前两部分讲研究背景、研究问题和系统建模。",
    "第三部分重点介绍 RADS 动态子群选择方法，这是论文的方法核心。",
    "后面展示平台实现和实验结果，最后总结创新点与不足。"
  ]));
}

// 3 Background
{
  const s = pptx.addSlide();
  header(s, 3, "研究背景：复杂任务推动无人机集群从单机感知走向协同感知", "巡检、救援、侦察等场景要求更大覆盖、更强并行能力和更稳定的态势更新。");
  imagePanel(s, DOCIMG("image4.png"), 0.88, 1.4, 5.0, 3.05, "无人机集群协同感知任务场景");
  panel(s, 6.25, 1.42, 2.85, 1.32, "单机局限", ["覆盖范围有限", "视场和续航受限", "遇到遮挡容易形成盲区"], { fontSize: 12, gap: 0.31 });
  panel(s, 9.45, 1.42, 2.85, 1.32, "集群优势", ["多点并行覆盖", "多源观测融合", "节点故障后仍有冗余"], { fontSize: 12, gap: 0.31, accent: C.navy });
  panel(s, 6.25, 3.15, 6.05, 1.45, "复杂环境带来的挑战", [
    "目标持续运动，位置和不确定性动态变化",
    "障碍、天气、丢包、延迟和节点故障会降低有效观测数量"
  ], { fontSize: 12.5, gap: 0.38 });
  tag(s, 0.95, 5.06, 11.1, 0.55, "本文目标：构建一个能运行、能对比、能解释的无人机集群多任务协同态势感知平台", { fontSize: 15 });
  s.addNotes(note("研究背景", [
    "无人机集群相比单架无人机，能够扩大感知范围、提升任务并行能力，并增强系统冗余。",
    "但是在实际任务中，目标会运动，环境中有障碍和天气扰动，通信链路也可能丢包或延迟。",
    "因此，本文关注的是复杂环境下如何组织无人机集群完成多目标协同感知。"
  ]));
}

// 4 Problems
{
  const s = pptx.addSlide();
  header(s, 4, "研究问题：有限无人机资源如何匹配多目标动态感知需求", "本文关注的不是“派出越多越好”，而是在效果和资源之间取得平衡。");
  flow(s, [
    ["目标需求", "优先级、速度、不确定性变化"],
    ["节点状态", "位置、能量、链路、故障不同"],
    ["环境约束", "障碍、视线、天气、通信影响"],
    ["调度决策", "选择合适子群而非随机或全量"],
    ["融合评价", "确认、误差、一致性和资源消耗"],
  ], 0.86, 1.38, 11.45, 1.12, { titleSize: 12.5, fontSize: 10, highlight: 3 });
  table(s, 0.9, 2.95, [2.0, 3.7, 3.7, 2.2], 0.56, [
    ["问题", "具体表现", "可能后果", "本文方法"],
    ["环境建模不足", "障碍、视线、天气、链路常被简化", "算法只在理想条件有效", "统一仿真建模"],
    ["派机策略粗糙", "固定派机或随机派机不看节点质量", "关键目标支持不足", "RADS动态子群"],
    ["评价不完整", "只看成功率或误差，忽略资源代价", "结论不够全面", "多指标对比分析"],
  ], { headerSize: 11, fontSize: 11, aligns: ["left", "left", "left", "left"] });
  panel(s, 0.9, 5.45, 11.4, 0.72, "核心研究问题", [
    "在复杂约束下，如何动态选择合适的无人机子群，使多目标感知质量较高，同时降低能耗和派机规模？"
  ], { fontSize: 12.5, titleSize: 14 });
  s.addNotes(note("研究问题", [
    "本课题的核心问题是有限无人机资源和多目标动态感知需求之间如何匹配。",
    "随机派遣容易造成资源错配，全量派遣虽然效果较好但能耗和派机数量过高。",
    "因此，本文设计 RADS 动态子群选择方法，并通过平台实验验证它的综合效果。"
  ]));
}

// 5 Route
{
  const s = pptx.addSlide();
  header(s, 5, "研究内容：按“模型—算法—平台—实验”形成完整闭环", "毕业设计不是单独写算法或页面，而是把仿真建模、方法设计和系统实现结合起来。");
  flow(s, [
    ["复杂场景建模", "无人机、目标、障碍、天气、通信、故障"],
    ["RADS调度", "目标需求、节点效用、动态预算、贪心选择"],
    ["感知融合", "有效观测、链路传输、多源融合、严格成功"],
    ["平台实现", "Python后端、Web前端、三维态势沙盘"],
    ["实验分析", "三策略对比、多变量扰动、综合结论"],
  ], 0.85, 1.42, 11.45, 1.18, { titleSize: 12, fontSize: 9.6, highlight: 1 });
  imagePanel(s, DOCIMG("image3.png"), 0.95, 3.05, 4.85, 2.6, "平台目标与任务流程图");
  panel(s, 6.2, 3.05, 2.85, 1.1, "输入", ["实验参数", "场景状态", "策略选择"], { fontSize: 12, gap: 0.28 });
  panel(s, 9.45, 3.05, 2.85, 1.1, "处理", ["环境生成", "策略调度", "观测融合"], { fontSize: 12, gap: 0.28, accent: C.navy });
  panel(s, 6.2, 4.55, 2.85, 1.1, "输出", ["成功率", "定位误差", "能耗与派机数"], { fontSize: 12, gap: 0.28 });
  panel(s, 9.45, 4.55, 2.85, 1.1, "展示", ["三维回放", "任务级分析", "CSV导出"], { fontSize: 12, gap: 0.28, accent: C.navy });
  s.addNotes(note("研究内容与技术路线", [
    "本文采用模型、算法、平台和实验四个层次推进。",
    "首先构建复杂场景模型，然后设计 RADS 动态子群调度方法，再实现 Web 平台，最后通过多组实验进行验证。",
    "这样可以形成从理论到系统再到实验数据的完整闭环。"
  ]));
}

// 6 Requirements
{
  const s = pptx.addSlide();
  header(s, 6, "系统需求：平台需要支持配置、运行、回放、对比、分析和导出", "这些需求直接来自论文中的系统需求分析，也对应当前代码实现。");
  table(s, 0.9, 1.35, [2.0, 4.65, 4.65], 0.58, [
    ["功能需求", "具体内容", "对应实现"],
    ["参数配置", "无人机数量、目标数量、障碍数量、感知半径、通信半径、天气、故障率", "templates/index.html / static/app.js"],
    ["多策略运行", "RADS、随机派遣、全量派遣单独运行或同步对比", "src/simulation/core.py"],
    ["动态回放", "逐步推进、暂停、上一帧、下一帧、进度滑动", "src/web/sessions.py"],
    ["三维展示", "无人机、目标、障碍、感知视域、轨迹、派机链路", "static/scene3d-webgl.mjs"],
    ["任务分析", "每个目标的状态、误差、派机数和失败原因", "前端任务表格 + 后端快照"],
    ["结果导出", "配置摘要、核心指标、任务级结果、精细对比 CSV", "server.py / app.js"],
  ], { headerSize: 11, fontSize: 10.8, aligns: ["left", "left", "left"] });
  s.addNotes(note("系统需求", [
    "本页对应论文中的系统需求分析。平台需要支持参数配置、多策略运行、动态仿真回放、三维态势展示、任务级分析和结果导出。",
    "这些功能都对应当前项目中的真实模块，例如前端 app.js、三维场景 scene3d-webgl.mjs、后端会话 sessions.py 和仿真 core.py。",
    "这说明本毕设不是只完成了某个孤立算法，而是完成了较完整的平台功能。"
  ]));
}

// 7 Architecture
{
  const s = pptx.addSlide();
  header(s, 7, "系统架构：前端展示、业务会话和仿真计算分层组织", "前端负责交互展示，后端负责会话管理和仿真计算，模块边界清晰。");
  imagePanel(s, DOCIMG("image8.png"), 0.75, 1.35, 7.0, 4.8, "论文中提取的平台总体架构图");
  panel(s, 8.15, 1.48, 3.95, 1.15, "表示层", ["参数配置、指标展示、三维沙盘、任务分析、导出"], { fontSize: 12, gap: 0.31 });
  panel(s, 8.15, 3.0, 3.95, 1.15, "业务控制层", ["Web 服务、接口分发、实验会话管理、数据组织"], { fontSize: 12, gap: 0.31, accent: C.navy });
  panel(s, 8.15, 4.52, 3.95, 1.15, "仿真计算层", ["复杂环境建模、路径规划、策略调度、感知融合、指标统计"], { fontSize: 12, gap: 0.31 });
  s.addNotes(note("系统架构", [
    "平台采用前后端分离的三层结构。表示层面向用户，负责参数配置、三维沙盘和结果展示。",
    "业务控制层负责接口请求、实验会话和数据组织；仿真计算层负责核心模型、路径规划、策略调度和感知融合。",
    "这种结构让平台功能划分清晰，也便于后续扩展新的调度策略或实验指标。"
  ]));
}

// 8 Scenario
{
  const s = pptx.addSlide();
  header(s, 8, "场景建模：统一表达无人机、目标、障碍、天气和通信扰动", "平台中的调度决策不只看距离，而是同时考虑路径、视线、链路和节点状态。");
  imagePanel(s, DOCIMG("image11.png"), 0.78, 1.35, 5.9, 3.75, "论文中的场景建模与目标感知示意");
  table(s, 7.0, 1.38, [1.55, 2.0, 2.0], 0.5, [
    ["对象", "状态变量", "作用"],
    ["无人机", "位置、能量、故障、感知/通信偏置", "形成候选节点"],
    ["目标", "位置、速度、优先级、不确定性", "形成任务需求"],
    ["障碍", "栅格占用、建筑高度", "影响路径和视线"],
    ["天气", "感知半径、噪声、链路、延迟", "改变系统上限"],
    ["通信", "半径、丢包率、延迟", "影响融合质量"],
  ], { headerSize: 11, fontSize: 10.7, aligns: ["left", "left", "left"] });
  tag(s, 1.0, 5.62, 10.9, 0.52, "默认参数：地图1320，栅格33×33，无人机24架，目标6个，障碍34个，仿真40步", { fontSize: 14 });
  s.addNotes(note("复杂场景建模", [
    "平台把无人机、目标、障碍物、天气和通信链路统一放入同一个仿真场景。",
    "无人机是否适合执行某个目标任务，不只取决于直线距离，还取决于绕障路径、视线遮挡、链路质量和剩余能量。",
    "默认实验使用 24 架无人机、6 个动态目标和 34 个障碍物，属于中等规模复杂场景。"
  ]));
}

// 9 Constraints
{
  const s = pptx.addSlide();
  header(s, 9, "关键约束：路径、视线、天气和通信共同影响有效观测", "这些约束进入调度评分和严格成功判定，使实验更接近真实任务条件。");
  imagePanel(s, DOCIMG("image5.png"), 0.85, 1.32, 3.55, 2.25, "天气扰动参数影响");
  imagePanel(s, DOCIMG("image7.png"), 4.92, 1.32, 3.55, 2.25, "通信与融合流程");
  imagePanel(s, DOCIMG("image9.png"), 8.98, 1.32, 3.0, 2.25, "单步仿真流程");
  table(s, 0.9, 4.05, [1.75, 2.4, 3.45, 3.7], 0.52, [
    ["约束", "计算依据", "对系统的影响", "进入平台的位置"],
    ["路径代价", "障碍栅格距离图", "绕障距离变长会降低候选效用", "pathfinding.py"],
    ["视线遮挡", "无人机-目标连线是否穿越障碍", "遮挡时观测不可用", "line_of_sight_clear"],
    ["天气扰动", "半径、噪声、链路、故障附加量", "恶劣天气降低成功率上限", "weather_profile"],
    ["通信质量", "半径、丢包、延迟", "观测无法及时参与融合", "core.py 融合逻辑"],
  ], { headerSize: 11, fontSize: 10.6, aligns: ["left", "left", "left", "left"] });
  s.addNotes(note("关键约束", [
    "本页说明平台中的关键约束。路径代价来自障碍栅格距离图，视线遮挡用于判断目标是否可见。",
    "天气会影响感知半径、视场角、噪声、链路和故障概率；通信丢包和延迟会影响观测能否及时参与融合。",
    "这些约束都进入平台计算，而不是只用于页面展示。"
  ]));
}

// 10 RADS Overview
{
  const s = pptx.addSlide();
  header(s, 10, "RADS 方法：风险感知动态子群选择是本文算法核心", "每个仿真步重新计算目标需求、节点效用和派机预算，避免随机派遣与全量派遣的不足。");
  imagePanel(s, DOCIMG("image10.png"), 0.78, 1.34, 6.35, 4.68, "论文中提取的 RADS 调度流程图");
  panel(s, 7.55, 1.55, 4.45, 1.15, "目标需求", ["优先级越高、不确定性越大、运动越快，目标需求越高"], { fontSize: 12 });
  panel(s, 7.55, 3.05, 4.45, 1.15, "节点效用", ["覆盖能力、剩余能量、通信链路、路径代价、视线条件共同决定节点质量"], { fontSize: 12, accent: C.navy });
  panel(s, 7.55, 4.55, 4.45, 1.15, "动态子群", ["按照预算选择高效用无人机子群，而不是随机派遣或全部派出"], { fontSize: 12 });
  s.addNotes(note("RADS 方法总览", [
    "RADS 是 Risk-Aware Dynamic Subgroup Selection，即风险感知动态子群选择。",
    "算法每个仿真步都会重新计算目标需求、派机预算和无人机效用，然后通过贪心方式生成执行子群。",
    "它的核心思想是把有限资源投入到更需要、更适合的目标-无人机组合上。"
  ]));
}

// 11 Scoring
{
  const s = pptx.addSlide();
  header(s, 11, "评分设计：目标需求决定“要多少资源”，节点效用决定“派谁更合适”", "RADS 将任务紧迫度和节点适配度转化为可比较的分数。");
  tag(s, 0.9, 1.38, 5.5, 0.62, "目标需求：Rj = 0.45Pj + 0.40Qj + 0.15Mj + ξj", { fontSize: 14 });
  tag(s, 6.9, 1.38, 5.3, 0.62, "节点效用：Uij = f(覆盖、能量、链路、路径、视线、冗余)", { fontSize: 14 });
  table(s, 0.9, 2.38, [1.75, 2.9, 3.15, 3.8], 0.55, [
    ["评分部分", "主要因素", "含义", "调度效果"],
    ["目标需求", "优先级、不确定性、速度", "判断目标当前有多紧迫", "高需求目标优先获得资源"],
    ["节点效用", "覆盖、能量、链路、路径、视线", "判断无人机是否适合该目标", "高质量节点优先参与"],
    ["预算约束", "任务压力、系统状态、近期表现", "控制本步可派无人机规模", "避免全量冗余消耗"],
  ], { headerSize: 11.5, fontSize: 11.3, aligns: ["left", "left", "left", "left"] });
  panel(s, 0.9, 4.85, 3.55, 1.0, "比随机派遣强", ["不是抽签，而是依据目标和节点状态计算"], { fontSize: 12 });
  panel(s, 4.88, 4.85, 3.55, 1.0, "比全量派遣省", ["不是所有节点都上，而是控制派机预算"], { fontSize: 12, accent: C.navy });
  panel(s, 8.86, 4.85, 3.55, 1.0, "比固定派机活", ["每个仿真步都随目标与环境重新选择"], { fontSize: 12 });
  s.addNotes(note("评分设计", [
    "目标需求回答的是某个目标当前需要多少资源，主要考虑优先级、不确定性和运动强度。",
    "节点效用回答的是某架无人机是否适合某个目标，综合覆盖、能量、链路、路径和视线条件。",
    "动态预算则控制每一步投入多少无人机，从而避免全量派遣造成的高资源消耗。"
  ]));
}

// 12 Step Flow
{
  const s = pptx.addSlide();
  header(s, 12, "运行流程：后端每一步推进目标、调度、运动、观测、融合与记录", "平台不是一次性输出结果，而是逐步生成可回放的仿真序列。");
  imagePanel(s, FIG("ch7", "fig7-2_engine_step_flow.png"), 0.78, 1.34, 7.0, 4.75, "后端仿真引擎单步流程");
  panel(s, 8.15, 1.55, 3.95, 1.15, "状态更新", ["目标运动更新", "故障与能量状态更新"], { fontSize: 12, gap: 0.32 });
  panel(s, 8.15, 3.05, 3.95, 1.15, "策略调度", ["RADS、随机、全量三策略同步推进", "生成统一快照"], { fontSize: 12, gap: 0.32, accent: C.navy });
  panel(s, 8.15, 4.55, 3.95, 1.15, "结果记录", ["指标历史、回放帧、任务级结果", "支撑前端展示与导出"], { fontSize: 12, gap: 0.32 });
  s.addNotes(note("平台运行流程", [
    "平台后端不是一次性计算最终结果，而是按仿真步逐步推进。",
    "每一步包括目标状态更新、故障更新、路径图构建、任务分配、无人机运动、观测采集、指标记录和回放帧记录。",
    "这种机制让前端可以展示动态过程，也便于进行三策略同步对比。"
  ]));
}

// 13 Fusion
{
  const s = pptx.addSlide();
  header(s, 13, "感知融合：严格成功需要同时满足确认、误差和一致性", "平台不只判断“是否看见目标”，还判断观测是否可靠、及时、融合后是否达标。");
  flow(s, [
    ["感知条件", "距离、视场角、视线无遮挡"],
    ["概率探测", "根据噪声和天气生成观测"],
    ["链路传输", "丢包与延迟影响送达"],
    ["多源融合", "加权融合并抑制异常观测"],
    ["严格成功", "确认数、误差、一致性同时达标"],
  ], 0.85, 1.38, 11.45, 1.12, { titleSize: 12.5, fontSize: 9.6, highlight: 4 });
  tag(s, 1.0, 3.0, 3.5, 0.62, "融合位置 = Σ wi zi / Σ wi", { fontSize: 14 });
  tag(s, 4.95, 3.0, 3.5, 0.62, "误差 ej = ||估计位置 - 真实位置||", { fontSize: 14 });
  tag(s, 8.9, 3.0, 3.0, 0.62, "严格成功 = 确认 ∧ 达标 ∧ 一致", { fontSize: 14 });
  table(s, 0.9, 4.08, [2.0, 3.1, 3.1, 3.4], 0.52, [
    ["判定环节", "输入", "判定标准", "作用"],
    ["有效观测", "无人机、目标、障碍", "距离/视场/视线满足", "过滤不可用观测"],
    ["观测送达", "丢包率、延迟", "未丢包且时效可接受", "保证融合信息有效"],
    ["融合达标", "多源观测", "误差与一致性达标", "形成严格成功"],
  ], { headerSize: 11, fontSize: 10.8, aligns: ["left", "left", "left", "left"] });
  s.addNotes(note("感知融合与成功判定", [
    "平台中的感知成功不是简单的覆盖。首先要满足距离、视线和视场角条件。",
    "随后观测还要经过链路传输，丢包和延迟都会影响观测是否参与融合。",
    "最后严格成功需要确认数、定位误差和一致性同时满足，所以这个指标比普通覆盖率更严格。"
  ]));
}

// 14 Platform
{
  const s = pptx.addSlide();
  header(s, 14, "平台实现：支持参数配置、三维态势、三策略对比和任务级分析", "桌面毕业论文中的平台截图直接用于展示系统实现效果。");
  imagePanel(s, DOCIMG("image16.png"), 0.75, 1.3, 7.3, 4.8, "平台运行主界面与指标展示");
  panel(s, 8.42, 1.45, 3.65, 1.05, "参数配置", ["无人机、目标、障碍、感知、通信、天气等可调整"], { fontSize: 12 });
  panel(s, 8.42, 2.78, 3.65, 1.05, "三维态势", ["展示无人机、目标、障碍、感知范围、轨迹和派机链路"], { fontSize: 12, accent: C.navy });
  panel(s, 8.42, 4.12, 3.65, 1.05, "对比分析", ["RADS、随机派遣、全量派遣共享同一场景进行比较"], { fontSize: 12 });
  panel(s, 8.42, 5.45, 3.65, 0.65, "结果导出", ["核心指标和任务级结果可导出 CSV"], { fontSize: 12, titleSize: 13, accent: C.navy });
  s.addNotes(note("平台实现", [
    "这一页展示平台主界面。左侧支持参数配置，中央是三维态势沙盘，右侧和下方展示指标、曲线和任务级分析。",
    "平台支持 RADS、随机派遣和全量派遣三种策略在同一场景下对比。",
    "实验结束后还可以导出 CSV，用于论文表格整理和结果分析。"
  ]));
}

// 15 Experiment setup
{
  const s = pptx.addSlide();
  header(s, 15, "实验设计：统一场景下比较 RADS、随机派遣和全量派遣", "实验从感知效果和资源消耗两个角度评价方法。");
  table(s, 0.9, 1.38, [1.8, 4.1, 3.0, 2.7], 0.58, [
    ["策略", "含义", "对照作用", "预期特点"],
    ["RADS", "按目标需求和节点效用动态选择感知子群", "本文方法", "效果较好、资源低"],
    ["随机派遣", "采用相近预算，但随机抽取候选无人机", "无智能调度基线", "资源可控、成功率低"],
    ["全量派遣", "尽量投入全部可用无人机参与任务", "高资源基线", "成功率高、消耗大"],
  ], { headerSize: 11.5, fontSize: 11.2, aligns: ["left", "left", "left", "left"] });
  panel(s, 0.9, 4.18, 3.55, 1.05, "效果指标", ["严格成功率", "定位达标率", "平均定位误差"], { fontSize: 12, gap: 0.28 });
  panel(s, 4.88, 4.18, 3.55, 1.05, "资源指标", ["累计能耗", "平均派机数量", "信息时效"], { fontSize: 12, gap: 0.28, accent: C.navy });
  panel(s, 8.86, 4.18, 3.55, 1.05, "实验变量", ["任务规模", "天气/障碍", "通信半径/丢包/延迟"], { fontSize: 12, gap: 0.28 });
  tag(s, 1.05, 5.65, 10.9, 0.52, "默认实验：地图1320，33×33栅格，24架无人机，6个目标，34个障碍，40步仿真", { fontSize: 14 });
  s.addNotes(note("实验设计", [
    "实验选取 RADS、随机派遣和全量派遣三种策略进行比较。",
    "评价指标包括严格成功率、定位达标率、平均误差、累计能耗、平均派机数量和信息时效。",
    "实验变量包括任务规模、天气、障碍复杂度和通信条件。"
  ]));
}

// 16 Default result
{
  const s = pptx.addSlide();
  header(s, 16, "默认场景结果：RADS 成功率接近全量派遣，资源消耗明显更低", "这是整篇答辩最核心的数据结论。");
  barChart(s, 0.82, 1.32, 5.05, 3.05, "严格成功率对比", ["RADS", "随机", "全量"], [70.8, 16.7, 72.9], [C.red, C.blue, C.navy], 100, "%");
  stat(s, 6.35, 1.45, 1.75, 1.05, "70.8%", "RADS成功率", "接近全量72.9%", { color: C.red });
  stat(s, 8.35, 1.45, 1.75, 1.05, "47.6%", "能耗降低", "相较全量派遣", { color: C.navy });
  stat(s, 10.35, 1.45, 1.75, 1.05, "54.1%", "派机减少", "9.4 vs 20.5", { color: C.navy });
  table(s, 6.35, 3.02, [1.6, 1.4, 1.4, 1.4], 0.45, [
    ["指标", "RADS", "随机", "全量"],
    ["成功率", "70.8%", "16.7%", "72.9%"],
    ["平均误差", "9.52m", "较高", "8.07m"],
    ["累计能耗", "1120.4", "相近", "2138.5"],
    ["平均派机", "9.4", "相近", "20.5"],
  ], { headerSize: 10.2, fontSize: 10.2, aligns: ["left", "center", "center", "center"] });
  panel(s, 0.9, 5.25, 11.25, 0.75, "结果解读", [
    "RADS 不是依靠派出更多无人机取胜，而是通过更有效的子群选择，在接近全量派遣效果的同时显著降低资源投入。"
  ], { fontSize: 12.2, titleSize: 14 });
  s.addNotes(note("默认场景实验结果", [
    "默认场景下，RADS 的严格成功率为 70.8%，全量派遣为 72.9%，两者差距只有 2.1 个百分点。",
    "但资源消耗上，RADS 的累计能耗比全量派遣降低约 47.6%，平均派机数量从 20.5 降到 9.4。",
    "这说明 RADS 可以用更少资源获得接近全量派遣的感知效果。"
  ]));
}

// 17 Task and obstacle
{
  const s = pptx.addSlide();
  header(s, 17, "任务规模与障碍实验：RADS 能随任务压力调整，并利用路径/视线约束减少无效派机", "目标数量和障碍复杂度变化时，RADS 的表现具有较好稳定性。");
  lineChart(s, 0.82, 1.32, 5.2, 2.6, "任务规模变化成功率", ["6目标", "10目标"], [
    { name: "RADS", values: [70.8, 68.0], color: C.red },
    { name: "随机", values: [16.7, 21.8], color: C.blue },
    { name: "全量", values: [72.9, 58.3], color: C.navy },
  ]);
  lineChart(s, 6.58, 1.32, 5.2, 2.6, "障碍数量变化成功率", ["34障碍", "50障碍"], [
    { name: "RADS", values: [70.8, 68.8], color: C.red },
    { name: "随机", values: [16.7, 19.6], color: C.blue },
    { name: "全量", values: [72.9, 74.6], color: C.navy },
  ]);
  panel(s, 0.9, 4.35, 3.55, 1.05, "任务规模", ["目标数从6增至10", "RADS成功率仅下降2.8个百分点", "平均派机数主动上升"], { fontSize: 11.5, gap: 0.29 });
  panel(s, 4.88, 4.35, 3.55, 1.05, "障碍复杂度", ["障碍从34增至50", "RADS成功率由70.8%变为68.8%", "路径/视线评分发挥作用"], { fontSize: 11.5, gap: 0.29, accent: C.navy });
  panel(s, 8.86, 4.35, 3.55, 1.05, "结论", ["RADS能够根据任务压力和可达性变化调整子群", "不是固定派机"], { fontSize: 11.5, gap: 0.29 });
  s.addNotes(note("任务规模与障碍实验", [
    "任务规模实验中，目标数从 6 增加到 10 后，RADS 成功率只下降 2.8 个百分点，同时派机数量主动上升。",
    "障碍实验中，障碍物数量从 34 增加到 50 后，RADS 成功率变化较小。",
    "这说明 RADS 能够结合任务压力、路径代价和视线条件调整派机结果。"
  ]));
}

// 18 Weather and communication
{
  const s = pptx.addSlide();
  header(s, 18, "天气与通信实验：极端环境会压低上限，链路质量决定融合信息是否有效", "天气、丢包和延迟会直接影响严格成功率。");
  lineChart(s, 0.75, 1.32, 5.55, 2.65, "天气扰动下成功率", ["晴空", "薄雾", "降雨", "雷暴"], [
    { name: "RADS", values: [70.8, 60.8, 48.3, 34.2], color: C.red },
    { name: "随机", values: [16.7, 9.2, 8.3, 6.7], color: C.blue },
    { name: "全量", values: [72.9, 74.6, 67.9, 50.0], color: C.navy },
  ]);
  lineChart(s, 6.75, 1.32, 5.55, 2.65, "通信半径下RADS成功率", ["300m", "400m", "500m"], [
    { name: "RADS", values: [70.8, 81.7, 78.3], color: C.red },
  ]);
  table(s, 0.9, 4.42, [2.05, 3.15, 3.2, 3.2], 0.48, [
    ["变量", "实验现象", "原因解释", "结论"],
    ["天气恶化", "RADS 70.8%→34.2%", "感知半径、噪声、链路和故障同时受影响", "极端环境压低系统上限"],
    ["通信半径", "300m→400m 提升到81.7%", "更多观测能及时汇入融合", "链路覆盖提升协同效率"],
    ["丢包/延迟", "丢包10%降至65.0%；延迟2步降至60.0%", "观测数量和时效下降", "通信质量是融合关键"],
  ], { headerSize: 10.6, fontSize: 10.4, aligns: ["left", "left", "left", "left"] });
  s.addNotes(note("天气与通信实验", [
    "天气实验中，随着天气从晴空变为雷暴，RADS 成功率从 70.8% 降到 34.2%，说明极端环境会明显降低系统上限。",
    "通信半径从 300 米增加到 400 米时，RADS 成功率提升到 81.7%，说明链路覆盖对协同感知有帮助。",
    "丢包率和延迟升高会降低观测数量和信息时效，从而影响融合结果。"
  ]));
}

// 19 Overall and innovation
{
  const s = pptx.addSlide();
  header(s, 19, "综合结果与创新点：RADS 的价值在于“接近全量效果、明显降低资源投入”", "多组实验平均结果支撑本文结论。");
  barChart(s, 0.82, 1.3, 4.2, 2.55, "平均严格成功率", ["RADS", "随机", "全量"], [64.9, 17.1, 70.3], [C.red, C.blue, C.navy], 80, "%");
  barChart(s, 5.35, 1.3, 4.2, 2.55, "平均累计能耗", ["RADS", "随机", "全量"], [1060.4, 1103.0, 2143.4], [C.red, C.blue, C.navy], 2400, "");
  stat(s, 10.0, 1.42, 1.9, 1.04, "64.9%", "平均成功率", "接近全量70.3%", { color: C.red });
  stat(s, 10.0, 2.75, 1.9, 1.04, "49.5%", "能耗占比", "约为全量一半", { color: C.navy });
  panel(s, 0.9, 4.4, 2.8, 1.0, "创新点一", ["复杂约束下无人机集群协同态势感知平台"], { fontSize: 11.5 });
  panel(s, 4.05, 4.4, 2.8, 1.0, "创新点二", ["RADS动态子群选择方法，兼顾目标需求和节点能力"], { fontSize: 11.5, accent: C.navy });
  panel(s, 7.2, 4.4, 2.8, 1.0, "创新点三", ["障碍、天气、丢包、延迟、故障纳入统一仿真"], { fontSize: 11.5 });
  panel(s, 10.35, 4.4, 2.05, 1.0, "创新点四", ["三策略对比和任务级可解释分析"], { fontSize: 11.5, accent: C.navy });
  s.addNotes(note("综合结果与创新点", [
    "综合多组实验结果，RADS 的平均严格成功率为 64.9%，明显高于随机派遣，接近全量派遣。",
    "在资源消耗方面，RADS 的平均能耗约为全量派遣的一半，平均派机数量也明显更低。",
    "本文创新点包括复杂约束平台、RADS 动态子群方法、统一仿真建模以及三策略对比和任务级分析机制。"
  ]));
}

// 20 Conclusion
{
  const s = pptx.addSlide();
  header(s, 20, "总结与展望：本文完成了从模型、算法、平台到实验的毕业设计闭环", "后续可继续向高保真仿真、参数优化和真实飞控接口扩展。");
  stat(s, 0.9, 1.45, 1.75, 1.06, "1套", "可运行平台", "Web仿真与三维展示", { color: C.navy });
  stat(s, 2.95, 1.45, 1.75, 1.06, "3类", "对比策略", "RADS/随机/全量", { color: C.red });
  stat(s, 5.0, 1.45, 1.75, 1.06, "多组", "实验验证", "任务/天气/障碍/通信", { color: C.navy });
  stat(s, 7.05, 1.45, 1.75, 1.06, "47.6%", "默认能耗降低", "相较全量派遣", { color: C.red });
  stat(s, 9.1, 1.45, 1.75, 1.06, "49.5%", "平均能耗占比", "约为全量一半", { color: C.navy });
  table(s, 0.9, 3.1, [1.7, 4.55, 5.35], 0.55, [
    ["总结项", "完成情况", "结论"],
    ["模型", "建立包含无人机、目标、障碍、天气、通信和故障的复杂场景", "支撑复杂环境下协同感知实验"],
    ["算法", "设计 RADS 目标需求、节点效用和动态预算机制", "以较少资源获得接近全量的感知效果"],
    ["平台", "实现参数配置、三维回放、三策略对比、任务分析和导出", "形成可运行、可展示、可分析的毕设成果"],
    ["展望", "增加批量实验、参数优化、高保真动力学和 ROS/PX4 对接", "进一步提升工程应用价值"],
  ], { headerSize: 11, fontSize: 10.8, aligns: ["left", "left", "left"] });
  addText(s, "谢谢各位老师，请批评指正！", { x: 3.7, y: 6.03, w: 5.7, h: 0.36, fontSize: 22, bold: true, color: C.navy, align: "center" });
  s.addNotes(note("总结与展望", [
    "最后总结本文工作：我完成了复杂场景建模、RADS 算法设计、Web 平台实现和多组实验验证。",
    "实验结果表明，RADS 相比随机派遣有明显优势，相比全量派遣能够用更低能耗和更少派机数量获得接近的感知效果。",
    "后续可以继续加入批量实验、参数优化、高保真飞行动力学和 ROS/PX4 对接。我的汇报到此结束，谢谢各位老师，请批评指正。"
  ]));
}

async function main() {
  await pptx.writeFile({ fileName: PPTX_PATH, compression: true });
  console.log(PPTX_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
