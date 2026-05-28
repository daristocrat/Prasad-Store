import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseEnabled, storage } from './firebase';
import { defaultCategories, normalizeProduct } from './productStore';

const productsRef = () => collection(db, 'products');
const categoriesRef = () => collection(db, 'categories');

export async function fetchRemoteProducts() {
  if (!firebaseEnabled) return null;
  const snapshot = await getDocs(query(productsRef(), orderBy('name')));
  return snapshot.docs.map((item) => normalizeProduct({ id: item.id, ...item.data() }));
}

export async function saveRemoteProduct(product) {
  if (!firebaseEnabled) return null;
  const normalized = normalizeProduct({ ...product, lastUpdated: new Date().toISOString() });
  const payload = {
    ...normalized,
    lastUpdated: normalized.lastUpdated,
    updatedAt: serverTimestamp()
  };

  if (String(normalized.id).startsWith('local-') || String(normalized.id).length < 8) {
    const created = await addDoc(productsRef(), payload);
    return { ...normalized, id: created.id };
  }

  await setDoc(doc(db, 'products', String(normalized.id)), payload, { merge: true });
  return normalized;
}

export async function deleteRemoteProduct(id) {
  if (!firebaseEnabled) return;
  await deleteDoc(doc(db, 'products', String(id)));
}

export async function fetchRemoteCategories() {
  if (!firebaseEnabled) return null;
  const snapshot = await getDocs(categoriesRef());
  const remote = snapshot.docs.map((item) => item.data().name).filter(Boolean);
  return remote.length ? remote : defaultCategories;
}

export async function saveRemoteCategory(name) {
  if (!firebaseEnabled) return;
  await setDoc(doc(db, 'categories', name), { name }, { merge: true });
}

export async function uploadProductImage(file) {
  if (!firebaseEnabled || !storage) return null;
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const imageRef = ref(storage, `products/${Date.now()}-${safeName}`);
  await uploadBytes(imageRef, file, { contentType: file.type });
  return getDownloadURL(imageRef);
}
