import { errorMessage, internalError } from './src/utils/errors.js';

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

// ── Test 1: errorMessage() with APP_DEBUG=true ──
process.env.APP_DEBUG = 'true';
console.log('\n[TEST] APP_DEBUG=true');

const err1 = new Error('Prisma: table users not found');
assert('errorMessage returns raw error.message', errorMessage(err1) === 'Prisma: table users not found');
assert('errorMessage with custom fallback returns raw error.message', errorMessage(err1, 'Données invalides.') === 'Prisma: table users not found');
assert('internalError returns raw error.message', internalError(err1) === 'Prisma: table users not found');

// ── Test 2: errorMessage() with APP_DEBUG=false ──
process.env.APP_DEBUG = 'false';
console.log('\n[TEST] APP_DEBUG=false');

const err2 = new Error('JWT malformed signature');
assert('errorMessage returns fallback', errorMessage(err2) === 'Une erreur est survenue.');
assert('errorMessage with custom fallback returns fallback', errorMessage(err2, 'Données invalides.') === 'Données invalides.');
assert('internalError returns generic message', internalError(err2) === 'Une erreur interne est survenue.');

// ── Test 3: APP_DEBUG=undefined (unset) should be treated as false ──
delete process.env.APP_DEBUG;
console.log('\n[TEST] APP_DEBUG=undefined (unset)');

const err3 = new Error('Some internal detail');
assert('errorMessage returns fallback when unset', errorMessage(err3) === 'Une erreur est survenue.');
assert('internalError returns generic when unset', internalError(err3) === 'Une erreur interne est survenue.');

// ── Test 4: APP_DEBUG=true with empty message ──
process.env.APP_DEBUG = 'true';
console.log('\n[TEST] APP_DEBUG=true with empty error message');

const err4 = new Error('');
assert('errorMessage with empty message returns empty string (debug)', errorMessage(err4) === '');
assert('internalError with empty message returns empty string (debug)', internalError(err4) === '');

// ── Test 5: APP_DEBUG=false preserves specific fallback ──
process.env.APP_DEBUG = 'false';
console.log('\n[TEST] APP_DEBUG=false with specific fallback messages');

const err5 = new Error('Some error');
assert('Google auth fallback', errorMessage(err5, "Échec de l'authentification Google.") === "Échec de l'authentification Google.");
assert('Network fallback', errorMessage(err5, 'Impossible de joindre le serveur.') === 'Impossible de joindre le serveur.');

// ── Summary ──
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All tests passed!');
