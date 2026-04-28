import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert, Linking
} from 'react-native';
import { getBusinessById } from '../services/businessService';
import { getReviews, addReview } from '../services/reviewService';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/authService';
import { trackProfileView, trackItemInterest } from '../services/analyticsService';

export default function BusinessProfileScreen({ route, navigation }) {
  const { businessId } = route.params;
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Track profile view when screen opens
  useEffect(() => {
    if (auth.currentUser) {
      trackProfileView(businessId, auth.currentUser.uid).catch(() => {});
    }
  }, [businessId]);

  const fetchData = async () => {
    try {
      const [biz, revs] = await Promise.all([
        getBusinessById(businessId),
        getReviews(businessId)
      ]);
      setBusiness(biz);
      setReviews(revs);
    } catch (e) {
      Alert.alert('Error', 'Could not load business details.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const number = business?.phone?.replace(/\D/g, '');
    if (number) {
      Linking.openURL(`https://wa.me/${number}`);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review comment.');
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const profile = await getUserProfile(user.uid);
      await addReview(businessId, user.uid, profile?.name || 'Anonymous', selectedRating, reviewText.trim());
      setReviewText('');
      setSelectedRating(5);
      Alert.alert('Thank you!', 'Your review has been submitted.');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, size = 16) => (
    <Text style={{ fontSize: size, color: '#f5a623' }}>
      {'★'.repeat(Math.round(rating || 0))}{'☆'.repeat(5 - Math.round(rating || 0))}
    </Text>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;
  }

  if (!business) {
    return <View style={styles.center}><Text>Business not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{business.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.heroName}>{business.name}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{business.category}</Text>
        </View>
        <View style={styles.ratingRow}>
          {renderStars(business.rating, 20)}
          <Text style={styles.ratingText}> {Number(business.rating || 0).toFixed(1)} ({business.reviewCount || 0} reviews)</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <InfoRow label="Location" value={business.location} />
        <InfoRow label="Hours" value={business.hours || 'Not specified'} />
        <InfoRow label="Phone" value={business.phone || 'Not specified'} />
        <InfoRow label="About" value={business.description} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {business.phone && (
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Write a Review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Write a Review</Text>
        <View style={styles.starSelector}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setSelectedRating(n)}>
              <Text style={{ fontSize: 28, color: n <= selectedRating ? '#f5a623' : '#ddd' }}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.reviewInput}
          placeholder="Share your experience..."
          placeholderTextColor="#aaa"
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {reviews.length === 0
          ? <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          : reviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{r.userName}</Text>
                {renderStars(r.rating, 14)}
              </View>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))
        }
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  backText: { fontSize: 16, color: '#5B4BC4', fontWeight: '600' },
  hero: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, paddingHorizontal: 20 },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  heroAvatarText: { fontSize: 36, fontWeight: '700', color: '#5B4BC4' },
  heroName: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', textAlign: 'center' },
  heroBadge: {
    marginTop: 6, backgroundColor: '#f0eeff',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20
  },
  heroBadgeText: { fontSize: 13, color: '#5B4BC4', fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 14, color: '#666', marginLeft: 4 },
  infoSection: { backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 14, padding: 16 },
  infoRow: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1a1a2e' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  whatsappBtn: {
    flex: 1, backgroundColor: '#25D366', paddingVertical: 12,
    borderRadius: 10, alignItems: 'center'
  },
  whatsappText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 4, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  starSelector: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  reviewInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1a1a2e', backgroundColor: '#fafafa',
    textAlignVertical: 'top', minHeight: 80, marginBottom: 12
  },
  submitBtn: { backgroundColor: '#5B4BC4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  noReviews: { color: '#aaa', textAlign: 'center', paddingVertical: 20 },
  reviewCard: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontWeight: '600', fontSize: 14, color: '#1a1a2e' },
  reviewComment: { fontSize: 14, color: '#555', lineHeight: 20 }
});
