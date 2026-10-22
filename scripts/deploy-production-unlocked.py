"""Package the verified unlocked production build and deploy to Oracle with atomic rollback."""
from pathlib import Path
import shutil, tarfile, hashlib, subprocess, sys, posixpath

root = Path(__file__).resolve().parents[1]
bundle = root / '.next/standalone'
assert (bundle / 'server.js').is_file(), 'Build standalone output first'

print('Copying public assets and static assets to standalone bundle...')
shutil.copytree(root / 'public', bundle / 'public', dirs_exist_ok=True)
shutil.copytree(root / '.next/static', bundle / '.next/static', dirs_exist_ok=True)

engine = root / 'node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node'
assert engine.is_file(), f'ARM64 engine not found at {engine}'

for target in [bundle / 'node_modules/.prisma/client', bundle / 'node_modules/@prisma/client']:
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(engine, target / engine.name)

archive = root / 'deploy/sehatai-production-unlocked.tar.gz'
archive.parent.mkdir(parents=True, exist_ok=True)

def filter_member(m):
    parts = Path(m.name).parts
    if any(p.startswith('.env') for p in parts):
        return None
    if parts and parts[0] not in {'.next', 'server.js', 'package.json', 'public'}:
        return None
    if m.issym() and '/node_modules/' in m.linkname.replace(chr(92), '/'):
        target = 'node_modules/' + m.linkname.replace(chr(92), '/').split('/node_modules/', 1)[1]
        m.linkname = posixpath.relpath(target, posixpath.dirname(m.name))
    return m

print('Creating tarball...')
with tarfile.open(archive, 'w:gz') as t:
    t.add(bundle, arcname='.', filter=filter_member)

with tarfile.open(archive) as t:
    members = t.getmembers()
    assert all(not any(p.startswith('.env') for p in Path(m.name).parts) for m in members), 'No .env files allowed'
    assert all(not any(p in {'temp', 'certs', 'backups', 'deploy'} for p in Path(m.name).parts) for m in members), 'No sensitive directories allowed'

digest = hashlib.sha256(archive.read_bytes()).hexdigest()
size_mb = archive.stat().st_size / (1024 * 1024)
print(f'Archive ready: {size_mb:.2f} MB; SHA256: {digest}', flush=True)

print('Uploading archive to Oracle...')
subprocess.run(['scp', str(archive), 'ariahub-oracle:/tmp/sehatai-production-unlocked.tar.gz'], check=True, timeout=180)
print('Upload complete.')

remote_script = r'''
from pathlib import Path
import tarfile, hashlib, subprocess, os, posixpath, time, urllib.request

archive = Path('/tmp/sehatai-production-unlocked.tar.gz')
assert archive.is_file(), 'Uploaded archive not found'
actual_digest = hashlib.sha256(archive.read_bytes()).hexdigest()
assert actual_digest == 'DIGEST', f'Digest mismatch: {actual_digest}'

free_space = os.statvfs('/').f_bavail * os.statvfs('/').f_frsize
assert free_space > 1.5 * 1024**3, f'Insufficient free space: {free_space / 1024**3:.2f} GB'

current = Path('/opt/sehatai/current')
old = current.resolve()
print(f'Current release: {old}')

release = Path('/opt/sehatai/releases/20261022_production_unlocked')
if release.exists():
    import shutil
    shutil.rmtree(release)

release.mkdir(parents=True, exist_ok=True)
print(f'Copying base runtime dependencies from {old} to {release}...')
subprocess.run(['cp', '-a', str(old) + '/.', str(release)], check=True)

def portable_filter(member, destination):
    from pathlib import Path
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

print(f'Extracting {archive} into {release}...')
with tarfile.open(archive) as t:
    t.extractall(release, filter=portable_filter)

assert not list(release.glob('.env*')), 'Do not deploy environment secrets in release'
subprocess.run(['chown', '-R', 'sehatai:sehatai', str(release)], check=True)

print('Switching symlink atomically...')
temp_link = Path('/opt/sehatai/current-unlocked')
if temp_link.exists() or temp_link.is_symlink():
    temp_link.unlink()
temp_link.symlink_to(release)
os.replace(temp_link, current)

print('Restarting sehatai-staging.service...')
try:
    subprocess.run(['systemctl', 'restart', 'sehatai-staging.service'], check=True)
    for attempt in range(25):
        time.sleep(1)
        try:
            req = urllib.request.Request('http://127.0.0.1:4000/api/eval/results', headers={'User-Agent': 'DeployHealthCheck'})
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    print(f'Service ready on attempt {attempt + 1}: HTTP {resp.status} from /api/eval/results')
                    break
        except Exception as e:
            if attempt == 24:
                raise RuntimeError(f'Startup health check failed after 25s: {e}')

    print(f'Successfully deployed {release}. Rollback target is {old}.')
    archive.unlink(missing_ok=True)
except Exception as e:
    print(f'Deployment failed, rolling back to {old}: {e}')
    rollback = Path('/opt/sehatai/current-rollback')
    if rollback.exists() or rollback.is_symlink():
        rollback.unlink()
    rollback.symlink_to(old)
    os.replace(rollback, current)
    subprocess.run(['systemctl', 'restart', 'sehatai-staging.service'], check=True)
    raise
'''.replace('DIGEST', digest)

print('Executing remote deployment script on Oracle...')
r = subprocess.run(['ssh', 'ariahub-oracle', 'sudo python3 -'], input=remote_script, text=True, capture_output=True, timeout=180)
print(r.stdout)
if r.returncode:
    print(r.stderr, file=sys.stderr)
    sys.exit(r.returncode)

print('Deployment SUCCESS!')
