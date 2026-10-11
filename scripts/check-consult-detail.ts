import { encode } from 'next-auth/jwt';
import { execSync } from 'child_process';

async function main() {
  const remoteNextAuthRaw = execSync('ssh -n ariahub-oracle "sudo grep ^NEXTAUTH_SECRET= /etc/sehatai/staging.env"', { encoding: 'utf8' }).trim().split('=')[1].replace(/["']/g, '');
  const remoteStagingKeyRaw = execSync('ssh -n ariahub-oracle "sudo grep ^STAGING_ACCESS_SECRET= /etc/sehatai/staging.env"', { encoding: 'utf8' }).trim().split('=')[1].replace(/["']/g, '');

  const patientToken = await encode({
    token: { id: 'cmv2h47xp000vubsolg1cpimr', email: 'test.patient1@sehatai.local', name: 'Zahid Mock', role: 'user', accountStatus: 'active' },
    secret: remoteNextAuthRaw,
  });

  const res = await fetch('http://127.0.0.1:4400/api/care/consultations/cmv2h48hl0012ubso1mxyydlu', {
    headers: {
      'x-staging-access-key': remoteStagingKeyRaw,
      cookie: `sehatai_staging_key=${remoteStagingKeyRaw}; next-auth.session-token=${patientToken}`,
    }
  });

  console.log('HTTP status:', res.status);
  const json = await res.json();
  console.log('Consultation status:', json.consultation?.status);
  console.log('Prescriptions array:', json.consultation?.prescriptions);
}

main().catch(console.error);
