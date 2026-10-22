import { spawnSync } from 'child_process';

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sehatai') THEN
    CREATE USER sehatai WITH PASSWORD 'SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026';
  ELSE
    ALTER USER sehatai WITH PASSWORD 'SehatAI_Staging_9b8a7c6d5e4f3210_Sec2026';
  END IF;
END
$$;
GRANT ALL PRIVILEGES ON DATABASE sehatai_staging TO sehatai;
ALTER DATABASE sehatai_staging OWNER TO sehatai;
`;

const adminPw = process.env.POSTGRES_ADMIN_PASSWORD || '6bee8b0a4f143de72ea787b1d90b8b1f7f1d7376c2bf7e775b072194d6a39344';
const res = spawnSync('ssh', ['ariahub-oracle', `PGPASSWORD=${adminPw} psql -h 127.0.0.1 -p 5450 -U postgres -d postgres`], {
  input: sql,
  encoding: 'utf8',
});

console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);
console.log('status:', res.status);
