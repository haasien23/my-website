const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1600 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: /运行仿真|Run|运行/ }).first().click({ timeout: 8000 });
  await page.waitForFunction(() => document.body.innerText.includes('仿真完成') || document.body.innerText.includes('第 40 帧') || document.body.innerText.includes('第 40 步'), null, { timeout: 65000 }).catch(async () => { await page.waitForTimeout(15000); });
  await page.screenshot({ path: 'D:/biushe/output/runtime_screenshots/platform_runtime_complete_full.png', fullPage: true });
  await page.screenshot({ path: 'D:/biushe/output/runtime_screenshots/platform_runtime_complete_view.png', fullPage: false });
  await browser.close();
})();
