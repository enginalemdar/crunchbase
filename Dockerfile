FROM node:18-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npx playwright install-deps && npx playwright install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
