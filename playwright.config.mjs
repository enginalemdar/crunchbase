import { defineConfig } from 'playwright-extra';
import stealth from 'playwright-extra-plugin-stealth';

export default defineConfig({
  plugins: [stealth()]
});
