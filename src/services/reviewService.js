import {
  collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const addReview = async (businessId, userId, userName, rating, comment) => {
  await addDoc(collection(db, 'reviews'), {
    businessId, userId, userName, rating, comment,
    createdAt: serverTimestamp()
  });
  // Recalculate true average rating
  const allReviews = await getReviews(businessId);
  const total = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const count = allReviews.length;
  await updateDoc(doc(db, 'businesses', businessId), {
    reviewCount: count,
    rating: count > 0 ? parseFloat((total / count).toFixed(1)) : 0
  });
};

export const getReviews = async (businessId) => {
  const q = query(
    collection(db, 'reviews'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
