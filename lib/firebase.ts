import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

export const firebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId
);

let app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

function getApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy .env.local.example to .env.local and fill in the values.'
    );
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config as Required<typeof config>);
  }
  return app;
}

export function db(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export function storage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
}

export function auth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}
