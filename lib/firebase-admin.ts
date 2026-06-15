import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

function loadCredentials() {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envJson) {
    return JSON.parse(envJson);
  }
  const localPath = join(process.cwd(), 'serviceAccountKey.json');
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, 'utf8'));
  }
  throw new Error(
    'Firebase Admin not configured. For local dev, place serviceAccountKey.json in the project root. For production, set FIREBASE_SERVICE_ACCOUNT_JSON env var to the JSON string.'
  );
}

function getApp(): App {
  if (_app) return _app;
  const existing = getApps()[0];
  if (existing) {
    _app = existing;
    return _app;
  }
  _app = initializeApp({ credential: cert(loadCredentials()) });
  return _app;
}

export function adminDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export function adminAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

// Returns the verified decoded token if the request bears a valid admin ID token, else null.
export async function verifyAdmin(req: Request): Promise<{ uid: string; email?: string } | null> {
  const header = req.headers.get('authorization') ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.admin !== true) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
