import {
  collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Track when a customer views a business profile
export const trackProfileView = async (businessId, userId) => {
  await addDoc(collection(db, 'analytics_views'), {
    businessId,
    userId,
    viewedAt: serverTimestamp()
  });
  // Increment the view counter on the business document
  await updateDoc(doc(db, 'businesses', businessId), {
    totalViews: increment(1)
  });
};

// Track when a customer shows interest in a product/item
export const trackItemInterest = async (businessId, itemName, userId) => {
  await addDoc(collection(db, 'analytics_interests'), {
    businessId,
    itemName,
    userId,
    trackedAt: serverTimestamp()
  });
};

// ── Admin Analytics Queries ──────────────────────────────────────────────────

// Get total profile views per business
export const getViewsPerBusiness = async () => {
  const snapshot = await getDocs(collection(db, 'analytics_views'));
  const counts = {};
  snapshot.docs.forEach(d => {
    const { businessId } = d.data();
    counts[businessId] = (counts[businessId] || 0) + 1;
  });
  return counts; // { businessId: viewCount }
};

// Get most-viewed businesses with names
export const getTopBusinessesByViews = async (limit = 10) => {
  const [viewsSnap, bizSnap] = await Promise.all([
    getDocs(collection(db, 'analytics_views')),
    getDocs(collection(db, 'businesses'))
  ]);

  const counts = {};
  viewsSnap.docs.forEach(d => {
    const { businessId } = d.data();
    counts[businessId] = (counts[businessId] || 0) + 1;
  });

  const businesses = {};
  bizSnap.docs.forEach(d => { businesses[d.id] = d.data().name; });

  return Object.entries(counts)
    .map(([id, views]) => ({ id, name: businesses[id] || 'Unknown', views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

// Get most popular items/products across all businesses
export const getTopItems = async (limit = 10) => {
  const snapshot = await getDocs(collection(db, 'analytics_interests'));
  const counts = {};
  snapshot.docs.forEach(d => {
    const { itemName, businessId } = d.data();
    const key = `${itemName}||${businessId}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([key, interests]) => {
      const [itemName, businessId] = key.split('||');
      return { itemName, businessId, interests };
    })
    .sort((a, b) => b.interests - a.interests)
    .slice(0, limit);
};

// Get overall platform stats
export const getPlatformStats = async () => {
  const [usersSnap, bizSnap, reviewsSnap, viewsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'businesses')),
    getDocs(collection(db, 'reviews')),
    getDocs(collection(db, 'analytics_views'))
  ]);

  const customers = usersSnap.docs.filter(d => d.data().role === 'customer').length;
  const owners    = usersSnap.docs.filter(d => d.data().role === 'business_owner').length;

  return {
    totalCustomers: customers,
    totalOwners: owners,
    totalBusinesses: bizSnap.size,
    totalReviews: reviewsSnap.size,
    totalViews: viewsSnap.size
  };
};

// Get all reviews with business names for admin
export const getAllReviewsForAdmin = async () => {
  const [reviewsSnap, bizSnap] = await Promise.all([
    getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))),
    getDocs(collection(db, 'businesses'))
  ]);

  const businesses = {};
  bizSnap.docs.forEach(d => { businesses[d.id] = d.data().name; });

  return reviewsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    businessName: businesses[d.data().businessId] || 'Unknown Business'
  }));
};

// Get pending (unverified) business listings
export const getPendingBusinesses = async () => {
  const q = query(collection(db, 'businesses'), where('verified', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Approve a business listing
export const approveBusiness = async (businessId) => {
  await updateDoc(doc(db, 'businesses', businessId), { verified: true, verifiedAt: serverTimestamp() });
};

// Reject/remove a business listing
export const rejectBusiness = async (businessId) => {
  await updateDoc(doc(db, 'businesses', businessId), { verified: false, rejected: true });
};

// Delete a review
export const deleteReview = async (reviewId) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'reviews', reviewId));
};
