import type { ContinueWatchingEntry } from '../store/useStore';

const FIREBASE_SDK_VERSION = '10.14.1';
const SDK_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const SCRIPTS = [`${SDK_BASE}/firebase-app-compat.js`, `${SDK_BASE}/firebase-auth-compat.js`, `${SDK_BASE}/firebase-firestore-compat.js`];

declare global {
  interface Window {
    firebase?: any;
  }
}

type FirebaseAuthUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

type FirebaseUserProfilePayload = {
  name: string;
  email: string;
  picture?: string;
};

type ReportPayload = {
  title: string;
  description: string;
  platform: string;
  page?: string;
};

let initialized = false;
let initPromise: Promise<boolean> | null = null;

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-firebase-sdk=\"${src}\"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.firebaseSdk = src;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });

const getFirebaseConfig = () => {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
  const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim();
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim();
  const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim();
  const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim();
  const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(messagingSenderId ? { messagingSenderId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
};

export const initializeFirebase = async () => {
  if (initialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const config = getFirebaseConfig();
    if (!config || typeof window === 'undefined') return false;

    try {
      await Promise.all(SCRIPTS.map(loadScript));
      if (!window.firebase) return false;

      if (!window.firebase.apps?.length) {
        window.firebase.initializeApp(config);
      }

      initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase', error);
      return false;
    }
  })();

  return initPromise;
};

const getAuth = () => window.firebase?.auth?.();
const getDb = () => window.firebase?.firestore?.();
const docIdForEntry = (entry: ContinueWatchingEntry) => `${entry.platform}__${entry.dramaId}`;

export const signInWithFirebaseGoogle = async (): Promise<FirebaseAuthUser | null> => {
  const ok = await initializeFirebase();
  if (!ok) return null;

  const auth = getAuth();
  if (!auth || !window.firebase?.auth?.GoogleAuthProvider) return null;

  const provider = new window.firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);
  const user = result?.user;
  if (!user) return null;

  return {
    uid: String(user.uid),
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
};

export const signOutFirebase = async () => {
  const ok = await initializeFirebase();
  if (!ok) return;
  const auth = getAuth();
  await auth?.signOut?.();
};

export const saveUserProfileToCloud = async (uid: string, profile: FirebaseUserProfilePayload) => {
  if (!uid) return;
  if (!profile?.name || !profile?.email) return;

  const ok = await initializeFirebase();
  if (!ok) return;

  const db = getDb();
  if (!db) return;

  const payload: Record<string, any> = {
    name: String(profile.name).trim(),
    email: String(profile.email).trim().toLowerCase(),
    updatedAt: Date.now(),
  };

  if (profile.picture) {
    payload.picture = String(profile.picture).trim();
  }

  await db.collection('users').doc(uid).set(payload, { merge: true });
};

export const onFirebaseAuthState = async (cb: (user: FirebaseAuthUser | null) => void) => {
  const ok = await initializeFirebase();
  if (!ok) {
    cb(null);
    return () => {};
  }

  const auth = getAuth();
  if (!auth?.onAuthStateChanged) {
    cb(null);
    return () => {};
  }

  return auth.onAuthStateChanged((user: any) => {
    if (!user) {
      cb(null);
      return;
    }

    cb({
      uid: String(user.uid),
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });
  });
};

export const saveContinueWatchingToCloud = async (uid: string, entry: ContinueWatchingEntry) => {
  if (!uid) return;
  const ok = await initializeFirebase();
  if (!ok) return;

  const db = getDb();
  if (!db) return;

  const id = docIdForEntry(entry);
  await db.collection('users').doc(uid).collection('continueWatching').doc(id).set(entry, { merge: true });
};

export const loadContinueWatchingFromCloud = async (uid: string): Promise<ContinueWatchingEntry[]> => {
  if (!uid) return [];
  const ok = await initializeFirebase();
  if (!ok) return [];

  const db = getDb();
  if (!db) return [];

  const snap = await db.collection('users').doc(uid).collection('continueWatching').get();
  return snap.docs
    .map((doc: any) => doc.data())
    .filter(Boolean)
    .map((item: any) => ({
      platform: item.platform || 'dramabox',
      dramaId: String(item.dramaId || ''),
      dramaTitle: String(item.dramaTitle || 'Tanpa Judul'),
      dramaPoster: String(item.dramaPoster || '/images/placeholder-poster.svg'),
      episodeId: String(item.episodeId || '1'),
      episodeNo:
        typeof item.episodeNo === 'number' && Number.isFinite(item.episodeNo) && item.episodeNo > 0
          ? Math.floor(item.episodeNo)
          : undefined,
      progress: Number(item.progress || 0),
      timestamp: Number(item.timestamp || Date.now()),
    }))
    .filter((entry: ContinueWatchingEntry) => Boolean(entry.dramaId));
};

export const saveIssueReportToCloud = async (uid: string, report: ReportPayload) => {
  if (!uid) return;
  const title = String(report?.title || '').trim();
  const description = String(report?.description || '').trim();
  const platform = String(report?.platform || '').trim();
  if (!title || !description || !platform) return;

  const ok = await initializeFirebase();
  if (!ok) return;

  const db = getDb();
  if (!db) return;

  const payload: Record<string, any> = {
    title,
    description,
    platform,
    page: String(report?.page || '').trim() || 'unknown',
    status: 'open',
    createdAt: Date.now(),
  };

  await db.collection('users').doc(uid).collection('reports').add(payload);
};

export const clearContinueWatchingInCloud = async (uid: string) => {
  if (!uid) return;
  const ok = await initializeFirebase();
  if (!ok) return;

  const db = getDb();
  if (!db) return;

  const snap = await db.collection('users').doc(uid).collection('continueWatching').get();
  if (!snap.docs?.length) return;

  const batch = db.batch();
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  await batch.commit();
};
