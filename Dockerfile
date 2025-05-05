# 1) Alpine+Chrome+Node içeren hazır imaj
FROM zenika/alpine-chrome:with-node

# 2) Çalışma dizini
WORKDIR /app

# 3) Sadece package.json'ı kopyala
COPY package.json ./

# 4) Prod bağımlılıkları yükle
RUN npm install --omit=dev

# 5) Kalan tüm kodu kopyala
COPY . .

# 6) Express port
EXPOSE 3000

# 7) Puppeteer için Chrome yolu
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 8) Başlat
CMD ["npm", "start"]
