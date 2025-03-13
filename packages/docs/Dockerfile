FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lock files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Docusaurus site
ENV NODE_ENV=production
RUN pnpm build

# Expose the port the app will run on
ENV PORT=8080
EXPOSE ${PORT}

# Command to run the application
CMD ["pnpm", "serve", "--port", "8080", "--no-open"]