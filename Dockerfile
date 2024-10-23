# Use the official Node.js 18 image as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy ESLint configuration and ignore file
COPY .eslintrc.json .eslintignore ./

# Install dependencies
RUN npm ci

# Copy the rest of your app's source code
COPY . .

# Build your Next.js app
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
