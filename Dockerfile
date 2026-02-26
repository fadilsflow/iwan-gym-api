FROM node:20-bookworm

# Install MariaDB server and client
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends mariadb-server mariadb-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Default runtime config, so docker run can stay minimal
ENV PORT=3000 \
  DB_NAME=membership_gym \
  DB_USER=root \
  DB_PASSWORD=root \
  DB_HOST=127.0.0.1 \
  DB_PORT=3306

# Install app dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Add entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000 3306

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
