# Use Node.js official image
FROM node:20

# Set working directory in container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port your app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
