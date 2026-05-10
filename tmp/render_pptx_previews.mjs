import { FileBlob, PresentationFile } from 'file:///C:/Users/%E8%B4%BA%E5%B0%8F%E5%8F%8C/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const outDir = path.resolve('D:/biushe/output/defense_ppt/previews');
fs.mkdirSync(outDir, {recursive:true});
const desktop = path.join(os.homedir(), 'Desktop');
const pptx = fs.readdirSync(desktop)
  .filter(n => n.toLowerCase().endsWith('.pptx'))
  .map(n => ({n,p:path.join(desktop,n),t:fs.statSync(path.join(desktop,n)).mtimeMs}))
  .sort((a,b)=>b.t-a.t)[0].p;
const pres = await PresentationFile.importPptx(await FileBlob.load(pptx));
console.log('slides', pres.slides.count, pptx);
for (let i=0; i<pres.slides.items.length; i++) {
  const blob = await pres.slides.items[i].export({format:'png'});
  const out = path.join(outDir, `slide_${String(i+1).padStart(2,'0')}.png`);
  fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
  console.log(out);
}
