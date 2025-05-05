import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin
chromium.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const target = req.query.path;
  if (!target) {
    return res.status(400).json({ error: 'Missing required query parameter: path' });
  }

  const CB_USER = process.env.CRUNCHBASE_EMAIL;
  const CB_PASS = process.env.CRUNCHBASE_PASSWORD;
  if (!CB_USER || !CB_PASS) {
    return res.status(500).json({ error: 'CRUNCHBASE_EMAIL or CRUNCHBASE_PASSWORD is not set' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto('https://www.crunchbase.com/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Cloudflare check
    await page.fill('input[name="email"]', CB_USER);
    await page.fill('input[name="password"]', CB_PASS);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 2. Scrape target organization
    const url = `https://www.crunchbase.com/organization/${encodeURIComponent(target)}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('body');

    // 3. Extract data
    const result = await page.evaluate(() => {
      const text = sel => {
        const e = document.querySelector(sel);
        return e ? e.innerText.trim() : null;
      };

      const legalName    = text('span.component--field-formatter.field-type-legal_name');
      const status       = text('span.component--field-formatter.field-type-enum');
      const website      = text('a.component--field-formatter.field-type-link');
      const totalFunding = text('a.component--field-formatter.field-type-money');

      const people = Array.from(
        document.querySelectorAll('section:has(h2:contains("Key People")) li')
      ).map(li => ({
        name: li.querySelector('h3')?.innerText.trim() || null,
        title: li.querySelector('p')?.innerText.trim() || null
      }));

      const rounds = Array.from(
        document.querySelectorAll('section:has(h2:contains("Funding")) .cb-group-item')
      ).map(item => ({
        round: item.querySelector('a.component--field-formatter.field-type-enum')?.innerText.trim() || null,
        amount: item.querySelector('span.component--field-formatter.field-type-money')?.innerText.trim() || null,
        date: item.querySelector('span.component--field-formatter.field-type-date')?.innerText.trim() || null,
        investors: Array.from(item.querySelectorAll('a.component--field-formatter.field-type-link')).map(a => a.innerText.trim())
      }));

      return { legalName, status, website, totalFunding, people, rounds };
    });

    await browser.close();
    res.json(result);
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
