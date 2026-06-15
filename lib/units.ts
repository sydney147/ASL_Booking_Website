import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, firebaseConfigured } from './firebase';
import { DEFAULT_UNITS, Unit } from './types';

export async function fetchUnits(): Promise<Unit[]> {
  if (!firebaseConfigured) return DEFAULT_UNITS;
  try {
    const snap = await getDocs(collection(db(), 'units'));
    if (snap.empty) return DEFAULT_UNITS;
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Unit, 'id'>) }));
  } catch (err) {
    console.error('fetchUnits failed, falling back to defaults:', err);
    return DEFAULT_UNITS;
  }
}

export async function fetchUnit(id: string): Promise<Unit | null> {
  const fallback = DEFAULT_UNITS.find((u) => u.id === id) ?? null;
  if (!firebaseConfigured) return fallback;
  try {
    const snap = await getDoc(doc(db(), 'units', id));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Unit, 'id'>) };
    }
    return fallback;
  } catch (err) {
    console.error('fetchUnit failed, falling back to defaults:', err);
    return fallback;
  }
}
