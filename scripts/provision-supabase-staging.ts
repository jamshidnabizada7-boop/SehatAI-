// scripts/provision-supabase-staging.ts
// Autonomous Supabase staging project detection and provisioning assistant.
import { CdpClient, getPageWsUrl, ensureChromeRunning } from './supabase-browser';

const CDP_PORT = 9444;

export async function checkSupabaseStatus() {
  await ensureChromeRunning();
  const wsUrl = await getPageWsUrl(CDP_PORT);
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();

  console.log('==> Inspecting Supabase Dashboard session...');
  await new Promise((r) => setTimeout(r, 3000));

  const url: string = await cdp.eval('window.location.href');
  console.log('Current URL:', url);

  const isSignIn = url.includes('sign-in') || url.includes('login');
  if (isSignIn) {
    console.log('⚠️ Status: Authentication required (User login/MFA pending at Supabase sign-in page).');
    cdp.close();
    return {
      authenticated: false,
      url,
      needsAuth: true,
      existingProject: null,
    };
  }

  // Check projects on page
  const projects: Array<{ name: string; ref: string }> = await cdp.eval(`
    Array.from(document.querySelectorAll('a[href*="/project/"]')).map(a => {
      const match = a.href.match(/\\/project\\/([a-z0-9]+)/);
      return {
        name: a.innerText.trim(),
        ref: match ? match[1] : ''
      };
    })
  `);

  console.log(`✓ Authenticated. Detected ${projects.length} accessible projects.`);
  const stagingProj = projects.find((p) => p.name.toLowerCase().includes('sehatai-staging') || p.name.toLowerCase().includes('staging'));

  if (stagingProj) {
    console.log(`✓ Found existing staging project: "${stagingProj.name}" (ref: ${stagingProj.ref})`);
  } else {
    console.log('ℹ️ No project named "sehatai-staging" found. Ready to create on Free plan.');
  }

  cdp.close();
  return {
    authenticated: true,
    url,
    needsAuth: false,
    existingProject: stagingProj ?? null,
    allProjects: projects,
  };
}

if (import.meta.main) {
  checkSupabaseStatus().catch((err) => {
    console.error('Error checking Supabase status:', err);
    process.exit(1);
  });
}
