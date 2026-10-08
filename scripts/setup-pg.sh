mkdir -p /var/lib/postgresql/data/db
chown -R postgres:postgres /var/lib/postgresql/data
mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql
su - postgres -c "initdb -D /var/lib/postgresql/data/db -U postgres --auth-local=trust --auth-host=trust"
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/db/postgresql.conf
echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/db/pg_hba.conf
echo "host all all ::0/0 trust" >> /var/lib/postgresql/data/db/pg_hba.conf
su - postgres -c "pg_ctl -D /var/lib/postgresql/data/db -l /var/lib/postgresql/data/db/logfile start"
sleep 2
su - postgres -c "psql -c 'CREATE DATABASE sehatai_test;'"