#!/bin/sh
set -eu

# Ensure loopback ext4 volume is mounted
mkdir -p /var/lib/postgresql/data
if ! mountpoint -q /var/lib/postgresql/data; then
  mount -o loop /mnt/host/d/pgdata.img /var/lib/postgresql/data
fi

mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql
rm -f /var/lib/postgresql/data/db/postmaster.pid

# Run PostgreSQL daemon locked to localhost with scram-sha-256 authentication
su -s /bin/sh postgres -c "postgres -D /var/lib/postgresql/data/db"