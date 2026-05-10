import { FileBlob, PresentationFile } from 'file:///C:/Users/%E8%B4%BA%E5%B0%8F%E5%8F%8C/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const desktop=path.join(os.homedir(),'Desktop'); const pptx=fs.readdirSync(desktop).filter(n=>n.endsWith('.pptx')).map(n=>({n,p:path.join(desktop,n),t:fs.statSync(path.join(desktop,n)).mtimeMs})).sort((a,b)=>b.t-a.t)[0].p;
const pres=await PresentationFile.importPptx(await FileBlob.load(pptx));
const blob=await pres.slides.items[0].export({format:'png'});
console.log('type', typeof blob, blob?.constructor?.name, Object.getOwnPropertyNames(blob||{}), Object.getOwnPropertyNames(Object.getPrototypeOf(blob||{})));
console.log(blob);
