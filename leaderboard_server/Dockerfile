# Use Node.js LTS version as a base image
FROM node:16

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Rebuild native modules
RUN npm install sqlite3@latest

# Copy the rest of the application
COPY . .

# Expose port 5000 (or whatever port your Express app uses)
EXPOSE 6969

# Start the server
CMD ["node", "server.js"]
