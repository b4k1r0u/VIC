import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR] ${err.toString()}`);
  });

  try {
    // Navigate and wait
    await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle2', timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    logs.push(`[PUPPETEER ERROR] ${e.toString()}`);
  } finally {
    console.log(logs.join('\n'));
    await browser.close();
  }
})();
