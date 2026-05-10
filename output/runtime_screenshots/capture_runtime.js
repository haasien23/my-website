const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1600 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle', timeout: 30000 });
  const run = page.getByRole('button', { name: /运行仿真|开始|Run|运行/ }).first();
  try { await run.click({ timeout: 5000 }); await page.waitForTimeout(5000); } catch (e) { await page.waitForTimeout(1500); }
  await page.screenshot({ path: 'D:/biushe/output/runtime_screenshots/platform_runtime_full.png', fullPage: true });
  await page.screenshot({ path: 'D:/biushe/output/runtime_screenshots/platform_runtime_view.png', fullPage: false });
  await browser.close();
})();
