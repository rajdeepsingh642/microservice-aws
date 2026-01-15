FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create shared directory
RUN mkdir -p /app/shared

# Copy shared files to the shared mount point
RUN cp -r * /app/shared/ 2>/dev/null || true

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
