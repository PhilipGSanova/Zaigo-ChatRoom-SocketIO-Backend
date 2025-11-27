# --- Base image ---
FROM node:18

# --- Set working directory ---
WORKDIR /app

# --- Copy package.json first for caching ---
COPY package*.json ./

# --- Install dependencies ---
RUN npm install --production

# --- Copy source files ---
COPY . .

# --- Expose the port used by Express ---
EXPOSE 5000

# --- Start the server ---
CMD [ "node", "server.js" ]
