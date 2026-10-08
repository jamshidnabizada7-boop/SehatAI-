mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql
su - postgres -c "pg_ctl -D /dev/shm/pgdata -l /dev/shm/pgdata/logfile start"
sleep 2
su - postgres -c "psql -c 'SELECT version();'"
su - postgres -c "psql -c 'CREATE DATABASE sehatai_test;'"