# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Sadece package.json kopyalayıp production bağımlılıklarını yükle
COPY package.json ./
RUN npm install --omit=dev

# Ardından kodunuzu kopyalayın
COPY . .

# Puppeteer için gereken paketler
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
  && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

CMD ["npm", "start"]
