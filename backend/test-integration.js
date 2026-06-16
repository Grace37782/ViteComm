import { spawn } from 'child_process';
import http from 'http';

const PORT = 5099;

function fetch(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function startServer(appDebug) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['src/index.js'], {
      cwd: '/home/lionel/Documents/1_Software_Dev/ViteComm/backend',
      env: { ...process.env, PORT: String(PORT), APP_DEBUG: appDebug },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let started = false;
    proc.stdout.on('data', (chunk) => {
      if (!started && chunk.toString().includes('écoute')) {
        started = true;
        resolve(proc);
      }
    });
    proc.stderr.on('data', () => {
      // suppress
    });
    setTimeout(() => { if (!started) reject(new Error('Server start timeout')); }, 8000);
  });
}

function killServer(proc) {
  return new Promise((resolve) => {
    proc.kill('SIGTERM');
    setTimeout(resolve, 500);
  });
}

let passed = 0;
let failed = 0;

function assert(label, condition, actual, expected) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    console.log(`    expected: ${JSON.stringify(expected)}`);
    console.log(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

async function run() {
  // ── TEST 1: APP_DEBUG=true ──
  console.log('\n[INTEGRATION] Starting server with APP_DEBUG=true ...');
  const serverTrue = await startServer('true');
  console.log('  Server started.\n');

  // Test: POST /api/auth/login with bad credentials triggers a 400 with error message
  const resTrue = await fetch('/api/auth/login', 'POST', {
    email: 'nonexistent@test.com',
    mot_de_passe: 'wrongpassword',
  });
  console.log('[APP_DEBUG=true] POST /api/auth/login (bad credentials)');
  assert('Status is 401', resTrue.status === 401, resTrue.status, 401);
  assert('Has error field', typeof resTrue.body?.error === 'string', resTrue.body?.error, 'string');
  assert('Error message is NOT generic (raw message shown)',
    resTrue.body?.error !== 'Une erreur est survenue.',
    resTrue.body?.error, 'NOT generic');

  // Test: GET /api/admin/users without token triggers auth middleware error
  const resAdmin = await fetch('/api/admin/users');
  console.log('\n[APP_DEBUG=true] GET /api/admin/users (no token)');
  assert('Status is 401 or 403', resAdmin.status === 401 || resAdmin.status === 403,
    resAdmin.status, '401 or 403');
  assert('Has error field', typeof resAdmin.body?.error === 'string', resAdmin.body?.error, 'string');

  await killServer(serverTrue);

  // ── TEST 2: APP_DEBUG=false ──
  console.log('\n\n[INTEGRATION] Starting server with APP_DEBUG=false ...');
  const serverFalse = await startServer('false');
  console.log('  Server started.\n');

  const resFalse = await fetch('/api/auth/login', 'POST', {
    email: 'nonexistent@test.com',
    mot_de_passe: 'wrongpassword',
  });
  console.log('[APP_DEBUG=false] POST /api/auth/login (bad credentials)');
  assert('Status is 401', resFalse.status === 401, resFalse.status, 401);
  assert('Has error field', typeof resFalse.body?.error === 'string', resFalse.body?.error, 'string');
  assert('Error message IS generic (raw message hidden)',
    resFalse.body?.error === 'Identifiants invalides.',
    resFalse.body?.error, 'Identifiants invalides.');

  const resAdminF = await fetch('/api/admin/users');
  console.log('\n[APP_DEBUG=false] GET /api/admin/users (no token)');
  assert('Status is 401 or 403', resAdminF.status === 401 || resAdminF.status === 403,
    resAdminF.status, '401 or 403');
  assert('Has error field', typeof resAdminF.body?.error === 'string', resAdminF.body?.error, 'string');

  await killServer(serverFalse);

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Integration Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All integration tests passed!');
}

run().catch(e => { console.error('Test failed:', e); process.exit(1); });
