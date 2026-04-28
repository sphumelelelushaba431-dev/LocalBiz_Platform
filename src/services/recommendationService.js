import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Save a user's browsing/search activity for AI to learn from
export const saveUserActivity = async (userId, activityType, data) => {
  try {
    await addDoc(collection(db, 'user_activity'), {
      userId,
      activityType, // 'view', 'search', 'review', 'category_browse'
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    // Silently fail - activity tracking should never break the app
  }
};

// Fetch user's recent activity
export const getUserActivity = async (userId, limitCount = 20) => {
  const q = query(
    collection(db, 'user_activity'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

// Call OpenAI API to get personalised recommendations
export const getAIRecommendations = async (userId, allBusinesses) => {
  try {
    const activity = await getUserActivity(userId);

    // Build a summary of what the user has browsed
    const categories = activity
      .filter(a => a.category)
      .map(a => a.category);
    const searches = activity
      .filter(a => a.activityType === 'search')
      .map(a => a.keyword);
    const viewedIds = activity
      .filter(a => a.activityType === 'view')
      .map(a => a.businessId);

    // If no activity yet, return top-rated businesses
    if (categories.length === 0 && searches.length === 0) {
      return allBusinesses
        .filter(b => b.verified !== false)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);
    }

    // Build prompt for OpenAI
    const prompt = `
A mobile app user has the following browsing history:
- Categories browsed: ${[...new Set(categories)].join(', ') || 'none'}
- Recent searches: ${[...new Set(searches)].join(', ') || 'none'}

Available business categories on the platform: ${[...new Set(allBusinesses.map(b => b.category))].join(', ')}

Based on this user's interests, list the top 3 business category names they are most likely to be interested in next. 
Reply with ONLY a comma-separated list of category names. Nothing else.`;

    // 🔴 REPLACE 'YOUR_OPENAI_API_KEY' with your actual key
    // Store it in a .env file: EXPO_PUBLIC_OPENAI_KEY=sk-...
    const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY || 'YOUR_OPENAI_API_KEY';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const suggestedCategories = data.choices?.[0]?.message?.content
      ?.split(',')
      .map(c => c.trim())
      .filter(Boolean) || [];

    // Filter businesses by suggested categories, excluding already-viewed ones
    const recommended = allBusinesses
      .filter(b =>
        b.verified !== false &&
        !viewedIds.includes(b.id) &&
        suggestedCategories.some(cat =>
          b.category?.toLowerCase().includes(cat.toLowerCase())
        )
      )
      .slice(0, 6);

    // If AI returns nothing useful, fall back to top-rated
    if (recommended.length === 0) {
      return allBusinesses
        .filter(b => b.verified !== false && !viewedIds.includes(b.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);
    }

    return recommended;
  } catch (e) {
    // On any error, return top-rated businesses
    return allBusinesses
      .filter(b => b.verified !== false)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }
};
