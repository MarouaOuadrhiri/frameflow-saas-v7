FROM node:20-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends mariadb-server mariadb-client && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN chmod +x start.sh
EXPOSE 5000
CMD ["./start.sh"]
