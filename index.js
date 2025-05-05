// index.js
require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const { CRUNCHBASE_EMAIL, CRUNCHBASE_PASSWORD, PORT = 3000 } = process.env;
if (!CRUNCHBASE_EMAIL || !CRUNCHBASE_PASSWORD) {
  console.error('⚠️ CRUNCHBASE_EMAIL veya CRUNCHBASE_PASSWORD eksik!');
  process.exit(1);
}

let browser;
(async () => {
  browser = await puppeteer.launch({ args: ['--no-sandbox'] });
})();

app.get('/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '`url` parametresi gerekli.' });

  const page = await browser.newPage();
  await page.goto('https://www.crunchbase.com/login', { waitUntil: 'networkidle2' });

  // — LOGIN —
  await page.type('input[name="email"]', CRUNCHBASE_EMAIL, { delay: 50 });
  await page.type('input[name="password"]', CRUNCHBASE_PASSWORD, { delay: 50 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  // — GİDİLECEK SAYFA —
  await page.goto(url, { waitUntil: 'networkidle2' });

  // — SCRAPE —
  const data = await page.evaluate(() => {
    // 1) Key People
    const peopleNodes = Array.from(document.querySelectorAll('mat-card#undefined.mat-mdc-card.reduced-padding .component--field-formatter.field-type-people'));
    const keyPeople = peopleNodes.map(card => {
      const nameEl  = card.querySelector('.link-accent');
      const titleEl = card.querySelector('.component--field-formatter.field-type-enum');
      return {
        name:  nameEl?.innerText.trim()  || null,
        title: titleEl?.innerText.trim() || null
      };
    });

    // 2) Details
    const detail = (label) => {
      const el = Array.from(document.querySelectorAll('.section--details .component--field-formatter'))
        .find(e => e.previousElementSibling?.innerText.trim() === label);
      return el?.innerText.trim() || null;
    };
    const details = {
      legalName:       detail('Legal Name'),
      operatingStatus: detail('Operating Status'),
      companyType:     detail('Company Type')
    };

    // 3) Overview (Round, Location, Headcount, Website, Tags)
    const overview = {
      lastRound: document.querySelector('a.component--field-formatter.field-type-enum')?.innerText.trim() || null,
      location:  document.querySelector('a.component--field-formatter.field-type-enum.accent')?.innerText.trim() || null,
      headcount: Array.from(document.querySelectorAll('span.component--field-formatter.field-type-enum'))
                   .find(el => /\d{1,3}-\d{1,3}/.test(el.innerText))
                   ?.innerText.trim() || null,
      website:   document.querySelector('a.component--field-formatter.field-type-link')?.href || null,
      tags:      Array.from(document.querySelectorAll('.tag-list .badge-pill'))
                   .map(t => t.innerText.trim())
    };

    // 4) Funding
    const fundingEl = document.querySelector('.section--funding');
    let funding = { lastRound: {}, totalFunding: null };
    if (fundingEl) {
      const roundType  = fundingEl.querySelector('a.component--field-formatter.field-type-enum')?.innerText.trim() || null;
      const amountEl   = fundingEl.querySelector('span.component--field-formatter.field-type-money.ng-star-inserted');
      const amount     = amountEl?.innerText.trim() || null;
      const dateMatch  = fundingEl.textContent.match(/in\s+([A-Za-z]{3}\s+\d{4})/);
      const date       = dateMatch?.[1] || null;
      const leadInvTxt = fundingEl.querySelector('div:has(strong:contains("Lead Investors"))')?.innerText
                         .replace(/Lead Investors:\s*/i,'').split(',')
                         .map(x=>x.trim()) || [];
      const totalEl    = Array.from(fundingEl.querySelectorAll('span.component--field-formatter.field-type-money'))
                         .pop()?.innerText.trim() || null;

      funding = {
        lastRound: {
          type:          roundType,
          amount,
          date,
          leadInvestors: leadInvTxt
        },
        totalFunding: totalEl
      };
    }

    return { keyPeople, details, overview, funding };
  });

  await page.close();
  res.json(data);
});

process.on('exit', () => browser && browser.close());
app.listen(PORT, () => {
  console.log(`🚀 Service listening on http://0.0.0.0:${PORT}`);
});
