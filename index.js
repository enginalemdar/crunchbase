import express from 'express';
import { chromium } from 'playwright-extra';

const app = express();
const PORT = process.env.PORT || 3000;
const CB_USER = process.env.CRUNCHBASE_EMAIL;
const CB_PASS = process.env.CRUNCHBASE_PASSWORD;
const TARGET = 'https://www.crunchbase.com/organization/safebreach';

app.get('/scrape', async (req, res) => {
  if (!CB_USER || !CB_PASS) {
    return res.status(500).json({ error: 'CRUNCHBASE_EMAIL ve CRUNCHBASE_PASSWORD tanımlı değil.' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // 1) Giriş sayfasına git
    await page.goto('https://www.crunchbase.com/login', { waitUntil: 'networkidle' });

    // 2) Cloudflare kontrolü geçene kadar bekle (ör:  düğme, captcha vb.)
    //    – Eğer gerçekten captcha varsa, burada manuel müdahale gerekebilir.
    await page.waitForTimeout(5000);

    // 3) Email/Şifre gir ve submit
    await page.fill('input[name="email"]', CB_USER);
    await page.fill('input[name="password"]', CB_PASS);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 4) Hedef sayfaya yönlen
    await page.goto(TARGET, { waitUntil: 'networkidle' });
    // İçeriğin yüklenmesini bekle
    await page.waitForSelector('.component--field-formatter[field-type="money"]');

    // 5) Verileri çek
    const data = await page.evaluate(() => {
      const getText = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.innerText.trim() : null;
      };

      // Örnek alanlar
      const legalName = getText('span.component--field-formatter.field-type-legal_name');
      const operatingStatus = getText('span.component--field-formatter.field-type-enum');
      const companyType = getText('span.component--field-formatter.field-type-enum:nth-of-type(2)');
      const location    = getText('span.component--field-formatter.field-type-enum:nth-of-type(3)');
      const employeeCount = getText('span.component--field-formatter.field-type-enum:nth-of-type(4)');
      const website     = getText('a.component--field-formatter.field-type-link');
      const totalFunding= getText('a.component--field-formatter.field-type-money.accent.highlight-color-contrast-light--link');

      // Key People
      const people = Array.from(document.querySelectorAll('section:has(h2:contains("Key People")) li')).map(li => {
        const nameEl = li.querySelector('h3');
        const titleEl = li.querySelector('p');
        return {
          name: nameEl?.innerText.trim() || null,
          title: titleEl?.innerText.trim() || null
        };
      });

      // Funding Rounds
      const rounds = Array.from(document.querySelectorAll('section:has(h2:contains("Funding")) .cb-group-item')).map(item => ({
        round: item.querySelector('a.component--field-formatter.field-type-enum')?.innerText.trim() || null,
        amount: item.querySelector('span.component--field-formatter.field-type-money')?.innerText.trim() || null,
        date: item.querySelector('span.component--field-formatter.field-type-date')?.innerText.trim() || null,
        leadInvestors: Array.from(item.querySelectorAll('a.component--field-formatter.field-type-link')).map(a => a.innerText.trim())
      }));

      return { legalName, operatingStatus, companyType, location, employeeCount, website, totalFunding, people, rounds };
    });

    await browser.close();
    res.json(data);

  } catch (err) {
    await browser.close();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
