import {
  collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp, doc, deleteDoc, updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Create a new promotion
export const createPromotion = async (businessId, ownerId, data) => {
  const docRef = await addDoc(collection(db, 'promotions'), {
    businessId,
    ownerId,
    title: data.title,
    description: data.description,
    discountPercent: data.discountPercent || null,
    expiryDate: data.expiryDate,
    active: true,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Get all active promotions for a specific business
export const getPromotionsForBusiness = async (businessId) => {
  const q = query(
    collection(db, 'promotions'),
    where('businessId', '==', businessId),
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get all promotions created by a specific owner
export const getOwnerPromotions = async (ownerId) => {
  const q = query(
    collection(db, 'promotions'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get all active promotions (for home screen feed)
export const getAllActivePromotions = async () => {
  const q = query(
    collection(db, 'promotions'),
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Deactivate / end a promotion
export const deactivatePromotion = async (promotionId) => {
  await updateDoc(doc(db, 'promotions', promotionId), { active: false });
};

// Delete a promotion permanently
export const deletePromotion = async (promotionId) => {
  await deleteDoc(doc(db, 'promotions', promotionId));
};
