# Imagine Read Frontend (Web Mode - Docker)
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies for Vite)
RUN npm ci

# Copy application code
COPY . .

# Create a web-only Vite config that skips Electron plugins
RUN echo 'import { defineConfig } from "vite"; \
    import react from "@vitejs/plugin-react"; \
    export default defineConfig({ \
    plugins: [react()], \
    server: { host: "0.0.0.0", port: 5173 }, \
    optimizeDeps: { include: ["react-virtualized-auto-sizer", "react-window"] } \
    });' > vite.config.web.ts

EXPOSE 5173

# Run Vite dev server with web-only config
CMD ["npx", "vite", "--config", "vite.config.web.ts"]
