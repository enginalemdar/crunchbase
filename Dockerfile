--- a/Dockerfile
+++ b/Dockerfile
@@
 WORKDIR /app
 COPY package*.json ./
- RUN npm ci --production
+ # --omit=dev flag ile sadece production bağımlılıklarını yükle
+ RUN npm install --omit=dev

 COPY . .

 # Puppeteer için gerekli paketler
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
