import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

initializeApp({
  credential: cert(
    JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'))
  ),
});

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/make-admin.mjs <user-uid>');
  process.exit(1);
}

await getAuth().setCustomUserClaims(uid, { admin: true });
console.log('Granted admin claim to', uid);
process.exit(0);
