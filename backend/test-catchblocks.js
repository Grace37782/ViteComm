import { spawn } from 'child_process';
import http from 'http';

const PORT = 5097;

function fetch(path, method = 'GET', body = null, rawBody = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: rawBody
        ? { 'Content-Type': 'application/octet-stream' }
        : { 'Content-Type': 'application/json' },
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
    if (rawBody) req.write(rawBody);
    else if (body) req.write(JSON.stringify(body));
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
      if (!started && chunk.toString().includes('écoute')) { started = true; resolve(proc); }
    });
    proc.stderr.on('data', () => {});
    setTimeout(() => { if (!started) reject(new Error('timeout')); }, 8000);
  });
}

function killServer(proc) {
  return new Promise((r) => { proc.kill('SIGTERM'); setTimeout(r, 500); });
}

let passed = 0, failed = 0;
function assert(label, cond, actual, expected) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`); failed++; }
}

async function run() {
  // ── 1. Global error handler: malformed body → Express parse error → global middleware ──
  console.log('\n[TEST 1] Global error handler — malformed JSON');
  const s1 = await startServer('false');
  const r1 = await fetch('/api/auth/login', 'POST', null, '{not-json');
  assert('Status is 400 or 500', r1.status === 400 || r1.status === 500, r1.status, '400 or 500');
  assert('Error is generic (APP_DEBUG=false)', r1.body?.error !== undefined, r1.body?.error, 'has error field');
  await killServer(s1);

  // ── 2. Same thing with APP_DEBUG=true — should show raw Express error ──
  console.log('\n[TEST 2] Global error handler — malformed JSON (debug on)');
  const s2 = await startServer('true');
  const r2 = await fetch('/api/auth/login', 'POST', null, '{not-json');
  assert('Status is 400 or 500', r2.status === 400 || r2.status === 500, r2.status, '400 or 500');
  assert('Error has raw detail', typeof r2.body?.error === 'string', r2.body?.error, 'string');
  await killServer(s2);

  // ── 3. Controller catch block: register with data that triggers Prisma error ──
  //    Send a register with empty body → triggers the validation catch
  console.log('\n[TEST 3] Controller catch block — register with invalid data (debug off)');
  const s3 = await startServer('false');
  const r3 = await fetch('/api/auth/register', 'POST', {
    nom: 'Test',
    prenom: 'User',
    email: 'catchblocktest@test.com',
    mot_de_passe: 'short',
    role: 'invalid_role_value_that_breaks_prisma',
  });
  console.log(`  → Status: ${r3.status}, Error: ${r3.body?.error}`);
  assert('Has error field', typeof r3.body?.error === 'string', r3.body?.error, 'string');
  assert('Error is NOT a raw stack trace',
    !r3.body?.error?.includes('TypeError') && !r3.body?.error?.includes('at '),
    r3.body?.error, 'no stack trace');
  assert('Error is generic, friendly, or validation',
    r3.body?.error?.includes('erreur') || r3.body?.error?.includes('Erreur') ||
    r3.body?.error?.includes('requis') || r3.body?.error?.includes('invalide') ||
    r3.body?.error?.includes('interne') || r3.body?.error?.includes('rôle') ||
    r3.body?.error?.includes('doit être'),
    r3.body?.error, 'generic or friendly');
  await killServer(s3);

  // ── 4. Same with debug on — should show raw ──
  console.log('\n[TEST 4] Controller catch block — register with invalid data (debug on)');
  const s4 = await startServer('true');
  const r4 = await fetch('/api/auth/register', 'POST', {
    nom: 'Test',
    prenom: 'User',
    email: 'catchblocktest2@test.com',
    mot_de_passe: 'short',
    role: 'invalid_role_value_that_breaks_prisma',
  });
  console.log(`  → Status: ${r4.status}, Error: ${r4.body?.error}`);
  assert('Has error field', typeof r4.body?.error === 'string', r4.body?.error, 'string');
  await killServer(s4);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All tests passed!');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
