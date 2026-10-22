"""Package the verified local build; deploy SehatAI production activation with rollback."""
from pathlib import Path
import shutil, tarfile, hashlib, subprocess, sys, posixpath

root = Path(__file__).resolve().parents[1]
bundle = root / '.next/standalone'
assert (bundle / 'server.js').is_file(), 'Build standalone output first'

print('==> Staging public and static assets...')
shutil.copytree(root / 'public', bundle / 'public', dirs_exist_ok=True)
shutil.copytree(root / '.next/static', bundle / '.next/static', dirs_exist_ok=True)

engine = root / 'node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node'
if not engine.is_file():
    alt_engine = root / 'node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node'
    if alt_engine.is_file():
        engine = alt_engine
assert engine.is_file(), f'Linux ARM64 engine missing: {engine}'

for target in [bundle / 'node_modules/.prisma/client', bundle / 'node_modules/@prisma/client']:
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(engine, target / engine.name)

archive = root / 'deploy/sehatai-production-activation-20261022.tar.gz'

def filter_member(m):
    parts = Path(m.name).parts
    if any(p.startswith('.env') for p in parts):
        return None
    # Dynamic storage trace filter: include only runtime allowlist
    if parts and parts[0] not in {'.next', 'server.js', 'package.json', 'public'}:
        return None
    if m.issym() and '/node_modules/' in m.linkname.replace(chr(92), '/'):
        target = 'node_modules/' + m.linkname.replace(chr(92), '/').split('/node_modules/', 1)[1]
        m.linkname = posixpath.relpath(target, posixpath.dirname(m.name))
    return m

if '--reuse-upload' not in sys.argv:
    print('==> Creating standalone archive...')
    with tarfile.open(archive, 'w:gz') as t:
        t.add(bundle, arcname='.', filter=filter_member)

with tarfile.open(archive) as t:
    assert all(not any(p.startswith('.env') for p in Path(m.name).parts) for m in t.getmembers())
    assert all(not any(p in {'temp', 'certs', 'backups', 'deploy'} for p in Path(m.name).parts) for m in t.getmembers())

digest = hashlib.sha256(archive.read_bytes()).hexdigest()
print('Archive prepared:', archive.stat().st_size, 'bytes; SHA256:', digest, flush=True)

if '--reuse-upload' not in sys.argv:
    print('==> Uploading archive to Oracle host (ariahub-oracle)...')
    subprocess.run(['scp', str(archive), 'ariahub-oracle:/tmp/sehatai-production-activation-20261022.tar.gz'], check=True, timeout=180)

remote = r'''
from pathlib import Path
import tarfile, hashlib, subprocess, os, posixpath, shutil, time

archive = Path('/tmp/sehatai-production-activation-20261022.tar.gz')
assert hashlib.sha256(archive.read_bytes()).hexdigest() == 'DIGEST', 'Checksum mismatch'
assert os.statvfs('/').f_bavail * os.statvfs('/').f_frsize > 500 * 1024**2, 'Insufficient disk space (require 500MB)'

current = Path('/opt/sehatai/current')
old = current.resolve()
print('Current active release:', old)

subprocess.run(['node', '-e', "if(require('/opt/sehatai/current/node_modules/next/package.json').version!=='16.1.3'||require('/opt/sehatai/current/node_modules/@prisma/client/package.json').version!=='6.19.2')process.exit(1)"], check=True)

release = Path(f'/opt/sehatai/releases/{time.strftime("%Y%m%d_%H%M%S")}_production_activation')
assert current.resolve() != release, 'Do not overwrite an active release'
if release.exists():
    shutil.rmtree(release)
release.mkdir(exist_ok=True)

print('Copying existing runtime baseline to new release...')
subprocess.run(['cp', '-a', str(old) + '/.', str(release)], check=True)

def portable_filter(member, destination):
    existing = Path(destination) / member.name
    if existing.is_symlink():
        assert existing.parent.resolve().is_relative_to(Path(destination).resolve())
        existing.unlink()
    if member.issym() and '/node_modules/' in member.linkname.replace(chr(92), '/'):
        target = 'node_modules/' + member.linkname.replace(chr(92), '/').split('/node_modules/', 1)[1]
        member.linkname = posixpath.relpath(target, posixpath.dirname(member.name))
    if member.issym():
        assert not posixpath.isabs(member.linkname)
        assert (existing.parent / member.linkname).resolve().is_relative_to(Path(destination).resolve())
        return tarfile.tar_filter(member, destination)
    return tarfile.data_filter(member, destination)

print('Extracting updated bundle into new release...')
with tarfile.open(archive) as t:
    t.extractall(release, filter=portable_filter)

assert not list(release.glob('.env*')), 'Do not deploy environment secrets in release'
subprocess.run(['chown', '-R', 'sehatai:sehatai', str(release)], check=True)

link = Path('/opt/sehatai/current-presentation')
link.symlink_to(release)
os.replace(link, current)
print('Switched current symlink to:', release)

try:
    print('Restarting sehatai-staging.service...')
    subprocess.run(['systemctl', 'restart', 'sehatai-staging.service'], check=True)
    import time, urllib.request
    healthy = False
    for attempt in range(25):
        time.sleep(1)
        try:
            req = urllib.request.urlopen('http://127.0.0.1:4000/api/care/health', timeout=3)
            if req.status == 200:
                print(f'Service healthy on attempt {attempt+1} (HTTP 200 OK)')
                healthy = True
                break
        except Exception as e:
            if attempt == 24:
                raise RuntimeError(f'Startup health failed after 25 attempts: {e}')
    assert healthy, 'Service did not become healthy'
    print('SUCCESS: Deployed', str(release), 'with rollback target', str(old))
except Exception as e:
    print('DEPLOYMENT FAILED. Rolling back to:', str(old), 'Error:', e)
    rollback = Path('/opt/sehatai/current-rollback')
    rollback.symlink_to(old)
    os.replace(rollback, current)
    subprocess.run(['systemctl', 'restart', 'sehatai-staging.service'], check=True)
    raise
'''.replace('DIGEST', digest)

print('==> Executing atomic deployment on Oracle host...')
r = subprocess.run(['ssh', 'ariahub-oracle', 'sudo python3 -'], input=remote, text=True, capture_output=True, timeout=180)
print(r.stdout)
if r.returncode:
    print(r.stderr)
    raise SystemExit(r.returncode)
