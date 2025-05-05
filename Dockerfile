# Use an Alpine image that already bundles Chromium and Node.js
FROM zenika/alpine-chrome:with-node

# Set working directory
WORKDIR /app

# Copy only package manifests to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Expose the port your Express app listens on
EXPOSE 3000

# Tell Puppeteer where Chromium is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Launch the app
CMD ["npm", "start"]
