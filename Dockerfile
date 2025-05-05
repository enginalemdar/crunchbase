FROM node:18-slim
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install-deps && npx playwright install

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
