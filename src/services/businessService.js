import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, deleteDoc, query,
  where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const COLLECTION = 'businesses';

export const createBusiness = async (data, ownerId, docUri = null) => {
  let verificationDocUrl = null;
  if (docUri) {
    try {
      const response = await fetch(docUri);
      const blob = await response.blob();
      const filename = `verifications/${ownerId}_${Date.now()}`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      verificationDocUrl = await getDownloadURL(storageRef);
    } catch (e) {
      console.warn('Document upload failed:', e);
    }
  }
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    ownerId,
    verificationDocUrl,
    verified: false,
    rating: 0,
    reviewCount: 0,
    totalViews: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getAllBusinesses = async () => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBusinessesByCategory = async (category) => {
  const q = query(collection(db, COLLECTION), where('category', '==', category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBusinessById = async (id) => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const getMyBusinesses = async (ownerId) => {
  const q = query(collection(db, COLLECTION), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateBusiness = async (id, data) => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteBusiness = async (id) => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const searchBusinesses = async (keyword) => {
  const all = await getAllBusinesses();
  const lower = keyword.toLowerCase();
  return all.filter(b =>
    b.verified !== false && (
      b.name?.toLowerCase().includes(lower) ||
      b.category?.toLowerCase().includes(lower) ||
      b.description?.toLowerCase().includes(lower) ||
      b.location?.toLowerCase().includes(lower)
    )
  );
};
