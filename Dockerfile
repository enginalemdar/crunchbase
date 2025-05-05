FROM node:18-slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Playwright’in gerekli kütüphaneleri
RUN npx playwright install-deps
RUN npx playwright install

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
