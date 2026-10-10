// scripts/serve-https.ts
// Care Connect Secure HTTPS Proxy for Cross-Device Telemedicine Testing
// Generates SAN TLS certificates for LAN IP & localhost, proxies HTTPS (8443) -> HTTP (4000)
// and serves CA certificate on port 8080 for instant mobile installation.

import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';

const CERTS_DIR = path.resolve('certs');
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 8443);
const CA_HTTP_PORT = Number(process.env.CA_HTTP_PORT || 8080);
const TARGET_PORT = Number(process.env.TARGET_PORT || 4000);

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254') && !name.toLowerCase().includes('wsl') && !name.toLowerCase().includes('vEthernet')) {
        return net.address;
      }
    }
  }
  return '10.202.49.115';
}

function findOpenSsl(): string {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
  ];
  for (const c of candidates) {
    try {
      execSync(`"${c}" version`, { stdio: 'ignore' });
      return c;
    } catch {}
  }
  throw new Error('OpenSSL not found. Please ensure Git for Windows is installed.');
}

export function ensureCertificates(lanIp: string) {
  if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });

  const caKey = path.join(CERTS_DIR, 'sehatai-ca.key');
  const caCrt = path.join(CERTS_DIR, 'sehatai-ca.crt');
  const serverKey = path.join(CERTS_DIR, 'server.key');
  const serverCsr = path.join(CERTS_DIR, 'server.csr');
  const serverCrt = path.join(CERTS_DIR, 'server.crt');
  const sanCnf = path.join(CERTS_DIR, 'san.cnf');

  if (fs.existsSync(caCrt) && fs.existsSync(serverCrt) && fs.existsSync(serverKey)) {
    console.log('✓ Existing TLS certificates found in certs/');
    return { caCrt, serverCrt, serverKey };
  }

  const openssl = findOpenSsl();
  console.log(`==> Generating local TLS CA and SAN certificate using ${openssl}...`);

  // 1. Generate Root CA
  if (!fs.existsSync(caKey) || !fs.existsSync(caCrt)) {
    execSync(`"${openssl}" req -x509 -newkey rsa:2048 -nodes -keyout "${caKey}" -out "${caCrt}" -days 365 -subj "/CN=SehatAI Local Development CA/O=SehatAI Telemedicine"`, { stdio: 'inherit' });
  }

  // 2. Generate OpenSSL SAN configuration
  const cnfContent = `
[req]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[req_distinguished_name]
CN = ${lanIp}
O = SehatAI Telemedicine

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.local
DNS.3 = sehatai.local
IP.1 = 127.0.0.1
IP.2 = ${lanIp}
`;
  fs.writeFileSync(sanCnf, cnfContent.trim());

  // 3. Generate Server Key & CSR
  execSync(`"${openssl}" req -newkey rsa:2048 -nodes -keyout "${serverKey}" -out "${serverCsr}" -config "${sanCnf}"`, { stdio: 'inherit' });

  // 4. Sign Server Certificate with Root CA
  execSync(`"${openssl}" x509 -req -in "${serverCsr}" -CA "${caCrt}" -CAkey "${caKey}" -CAcreateserial -out "${serverCrt}" -days 180 -extfile "${sanCnf}" -extensions req_ext`, { stdio: 'inherit' });

  console.log('✓ Generated server certificate with SANs: localhost, 127.0.0.1, ' + lanIp);
  return { caCrt, serverCrt, serverKey };
}

export function startHttpsProxy() {
  const lanIp = getLocalIp();
  const { caCrt, serverCrt, serverKey } = ensureCertificates(lanIp);

  const sslOptions = {
    key: fs.readFileSync(serverKey),
    cert: fs.readFileSync(serverCrt),
  };

  // HTTPS Reverse Proxy: forwards requests to http://127.0.0.1:TARGET_PORT
  const httpsServer = https.createServer(sslOptions, (req, res) => {
    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${TARGET_PORT}`,
        'x-forwarded-proto': 'https',
        'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1',
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Bad Gateway (Is Next.js running on port ${TARGET_PORT}?): ${err.message}`);
    });

    req.pipe(proxyReq);
  });

  // Handle WebSocket upgrades for LiveKit signaling and Next.js HMR/SSE
  httpsServer.on('upgrade', (req, socket, head) => {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${TARGET_PORT}`,
        'x-forwarded-proto': 'https',
      },
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n` +
        Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n'
      );
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('error', () => {
      socket.destroy();
    });

    proxyReq.end();
  });

  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`\n======================================================================`);
    console.log(`==> SEHATAI SECURE HTTPS PROXY ACTIVE`);
    console.log(`======================================================================`);
    console.log(`✓ HTTPS URL (Mobile/PC):   https://${lanIp}:${HTTPS_PORT}`);
    console.log(`✓ Localhost URL:           https://127.0.0.1:${HTTPS_PORT}`);
    console.log(`✓ Forwarding to Next.js:   http://127.0.0.1:${TARGET_PORT}`);
  });

  // HTTP Helper server to download CA Certificate easily on mobile
  const caServer = http.createServer((req, res) => {
    if (req.url === '/ca.crt' || req.url === '/cert' || req.url === '/download') {
      res.writeHead(200, {
        'Content-Type': 'application/x-x509-ca-cert',
        'Content-Disposition': 'attachment; filename="sehatai-ca.crt"',
      });
      fs.createReadStream(caCrt).pipe(res);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SehatAI Local CA Setup</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; line-height: 1.5; }
    .card { background: #f4f4f5; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
    .btn { display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 1rem; }
    code { background: #e4e4e7; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    ol { padding-left: 1.2rem; }
  </style>
</head>
<body>
  <h2>SehatAI Mobile Camera & Mic HTTPS Setup</h2>
  <p>To access camera and microphone from mobile browsers, install the local development root certificate:</p>
  <a href="/ca.crt" class="btn">📥 1. Download CA Certificate</a>

  <div class="card">
    <h3>iOS (Safari) Instructions:</h3>
    <ol>
      <li>Tap Download above and select <strong>Allow</strong>.</li>
      <li>Open <strong>Settings > Profile Downloaded</strong> (or Settings > General > VPN & Device Management).</li>
      <li>Tap <strong>Install</strong> on "SehatAI Local Development CA".</li>
      <li>Open <strong>Settings > General > About > Certificate Trust Settings</strong>.</li>
      <li>Toggle ON <strong>Full Trust</strong> for "SehatAI Local Development CA".</li>
      <li>Open Safari and visit <a href="https://${lanIp}:${HTTPS_PORT}">https://${lanIp}:${HTTPS_PORT}</a>.</li>
    </ol>
  </div>

  <div class="card">
    <h3>Android (Chrome) Instructions:</h3>
    <ol>
      <li>Tap Download above.</li>
      <li>Open <strong>Settings > Security > More security settings > Encryption & credentials</strong>.</li>
      <li>Tap <strong>Install a certificate > CA certificate</strong>.</li>
      <li>Select the downloaded <code>sehatai-ca.crt</code> file.</li>
      <li>Open Chrome and visit <a href="https://${lanIp}:${HTTPS_PORT}">https://${lanIp}:${HTTPS_PORT}</a>.</li>
    </ol>
  </div>
</body>
</html>
    `);
  });

  caServer.listen(CA_HTTP_PORT, '0.0.0.0', () => {
    console.log(`✓ Mobile CA Install Portal: http://${lanIp}:${CA_HTTP_PORT}/`);
    console.log(`======================================================================\n`);
  });

  return { httpsServer, caServer };
}

if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  startHttpsProxy();
}
