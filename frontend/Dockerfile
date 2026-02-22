# frontend/Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the rest
COPY . .

# Build the app
RUN npm run build

# Serve with a simple server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]