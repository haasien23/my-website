const path = require("path");
const fs = require("fs");
const os = require("os");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const PREVIEW_DIR = path.join(ROOT, "output", "defense_ppt_reportstyle", "previews");
const OUT_DIR = path.join(ROOT, "output", "defense_ppt_image_pages");
const SOURCE_SCRIPT = path.join(ROOT, "scripts", "generate_defense_ppt_reportstyle.js");
const DESKTOP = path.join(os.homedir(), "Desktop");
const PPTX_PATH = path.join(DESKTOP, "基于集群的多任务协同态势感知平台_本科毕设答辩_图片整页版.pptx");

fs.mkdirSync(OUT_DIR, { recursive: true });

function extractNotes() {
  const src = fs.readFileSync(SOURCE_SCRIPT, "utf8");
  const regex = /\.addNotes\(note\("([^"]+)", \[(.*?)\]\)\);/gs;
  const result = [];
  let match;
  while ((match = regex.exec(src))) {
    const title = match[1];
    const body = match[2];
    const lines = [];
    const lineRegex = /"((?:\\"|[^"])*)"/g;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(body))) {
      lines.push(lineMatch[1].replace(/\\"/g, '"'));
    }
    result.push(`【${title}】\n${lines.join("\n")}`);
  }
  return result;
}

async function main() {
  const slideImages = Array.from({ length: 22 }, (_, i) =>
    path.join(PREVIEW_DIR, `slide_${String(i + 1).padStart(2, "0")}.png`)
  );
  const missing = slideImages.filter((file) => !fs.existsSync(file));
  if (missing.length) {
    throw new Error(`Missing rendered slide images:\n${missing.join("\n")}`);
  }

  const notes = extractNotes();
  if (notes.length !== slideImages.length) {
    throw new Error(`Expected ${slideImages.length} notes blocks, found ${notes.length}`);
  }

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

  slideImages.forEach((image, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({ path: image, x: 0, y: 0, w: 13.333, h: 7.5 });
    slide.addNotes(notes[index]);
  });

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
