#!/bin/sh
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "127.0.0.1" ] || [ "$DB_HOST" = "localhost" ]; then
  export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=frameflow DB_PASSWORD=frameflow DB_NAME=frameflow
  mkdir -p /run/mysqld
  chown mysql:mysql /run/mysqld
  if [ ! -d /var/lib/mysql/mysql ]; then
    mariadb-install-db --user=mysql --datadir=/var/lib/mysql --auth-root-authentication-method=normal >/dev/null 2>&1
  fi
  mysqld_safe --user=mysql &
  i=0
  while [ $i -lt 30 ]; do mysqladmin ping >/dev/null 2>&1 && break; i=$((i+1)); sleep 1; done
  mysql -u root -e "CREATE DATABASE IF NOT EXISTS frameflow CHARACTER SET utf8mb4; CREATE USER IF NOT EXISTS 'frameflow'@'127.0.0.1' IDENTIFIED BY 'frameflow'; CREATE USER IF NOT EXISTS 'frameflow'@'localhost' IDENTIFIED BY 'frameflow'; GRANT ALL PRIVILEGES ON frameflow.* TO 'frameflow'@'127.0.0.1'; GRANT ALL PRIVILEGES ON frameflow.* TO 'frameflow'@'localhost'; FLUSH PRIVILEGES;"
  TABLES=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='frameflow';")
  if [ "$TABLES" = "0" ]; then
    mysql -u root frameflow < /app/schema.sql
    mysql -u root frameflow < /app/seed.demo.sql
  fi
fi
export JWT_SECRET=${JWT_SECRET:-frameflow-demo-secret-2026}
export NODE_ENV=production
exec node src/index.js
