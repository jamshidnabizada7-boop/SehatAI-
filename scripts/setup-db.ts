import { spawnSync } from 'child_process';

// Credentials come from the environment only; never hardcode them in this file.
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set in the environment`);
  return v;
}

const dbPw = requireEnv('SEHATAI_DB_PASSWORD');

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sehatai') THEN
    CREATE USER sehatai WITH PASSWORD '${dbPw}';
  ELSE
    ALTER USER sehatai WITH PASSWORD '${dbPw}';
  END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE sehatai_staging TO sehatai;
ALTER DATABASE sehatai_staging OWNER TO sehatai;
`;

const adminPw = requireEnv('POSTGRES_ADMIN_PASSWORD');
const res = spawnSync('ssh', ['ariahub-oracle', `PGPASSWORD=${adminPw} psql -h 127.0.0.1 -p 5450 -U postgres -d postgres`], {
  input: sql,
  encoding: 'utf8',
});

console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);
console.log('status:', res.status);
