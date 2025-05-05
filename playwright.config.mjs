import { defineConfig } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export default defineConfig({
  plugins: [
    StealthPlugin()
  ]
});
