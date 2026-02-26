#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-membership_gym}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_PORT="${DB_PORT:-3306}"
DB_HOST="${DB_HOST:-127.0.0.1}"

# Ensure app can connect to local MySQL in this container
export DB_NAME DB_USER DB_PASSWORD DB_PORT DB_HOST

mkdir -p /run/mysqld
chown -R mysql:mysql /run/mysqld /var/lib/mysql

# Initialize MariaDB data dir only once
if [ ! -d /var/lib/mysql/mysql ]; then
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
fi

# Start MySQL daemon in background
mysqld_safe --datadir=/var/lib/mysql --bind-address=127.0.0.1 --port="${DB_PORT}" >/tmp/mysqld.log 2>&1 &

# Wait until MySQL is ready
for i in $(seq 1 60); do
  if mysqladmin ping --host=127.0.0.1 --port="${DB_PORT}" --silent; then
    break
  fi
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "MySQL did not become ready in time"
    exit 1
  fi
done

# Set root password (idempotent)
mysql -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
FLUSH PRIVILEGES;
SQL

# Create database if missing
mysql -uroot -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# Import schema only on first run
if [ ! -f /var/lib/mysql/.schema_loaded ]; then
  mysql -uroot -p"${DB_PASSWORD}" "${DB_NAME}" < /app/schema.sql
  touch /var/lib/mysql/.schema_loaded
fi

echo "MySQL ready on ${DB_HOST}:${DB_PORT}, starting API on port ${PORT:-3000}"

exec node server.js
