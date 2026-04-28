import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { getAllBusinesses } from '../services/businessService';
import { getAllActivePromotions } from '../services/promotionService';
import { getAIRecommendations, saveUserActivity } from '../services/recommendationService';
import { auth } from '../config/firebase';

const CATEGORIES = ['All', 'Food', 'Beauty', 'Health', 'Retail', 'Services', 'Tech'];

export default function HomeScreen({ navigation }) {
  const [businesses, setBusinesses]         = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [recommended, setRecommended]       = useState([]);
  const [promotions, setPromotions]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [loadingAI, setLoadingAI]           = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      const [biz, promos] = await Promise.all([
        getAllBusinesses(),
        getAllActivePromotions()
      ]);
      const verified = biz.filter(b => b.verified !== false);
      setBusinesses(verified);
      setFiltered(verified);
      setPromotions(promos);

      if (auth.currentUser) {
        setLoadingAI(true);
        const recs = await getAIRecommendations(auth.currentUser.uid, verified);
        setRecommended(recs);
        setLoadingAI(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterByCategory = (cat) => {
    setActiveCategory(cat);
    if (cat !== 'All' && auth.currentUser) {
      saveUserActivity(auth.currentUser.uid, 'category_browse', { category: cat });
    }
    setFiltered(cat === 'All' ? businesses : businesses.filter(b => b.category === cat));
  };

  const handleOpenBusiness = (item) => {
    if (auth.currentUser) {
      saveUserActivity(auth.currentUser.uid, 'view', { businessId: item.id, category: item.category });
    }
    navigation.navigate('BusinessProfile', { businessId: item.id });
  };

  const renderStars = (r) => '★'.repeat(Math.round(r || 0)) + '☆'.repeat(5 - Math.round(r || 0));

  const BusinessCard = ({ item, horizontal }) => (
    <TouchableOpacity
      style={horizontal ? s.hCard : s.card}
      onPress={() => handleOpenBusiness(item)}
      activeOpacity={0.85}
    >
      <View style={horizontal ? s.hAvatar : s.cardAvatar}>
        <Text style={horizontal ? s.hAvatarText : s.cardAvatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={horizontal ? s.hBody : s.cardContent}>
        <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
        {!horizontal && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={s.catBadge}><Text style={s.catBadgeText}>{item.category}</Text></View>
          </View>
        )}
        {horizontal
          ? <Text style={s.hCat}>{item.category}</Text>
          : <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
        }
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={s.stars}>{renderStars(item.rating)}</Text>
          <Text style={s.rCount}> ({item.reviewCount || 0})</Text>
          {!horizontal && <Text style={s.loc} numberOfLines={1}> · {item.location}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello 👋</Text>
          <Text style={s.title}>Find Local Businesses</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.mapBtn} onPress={() => navigation.navigate('MapView')}>
            <Text style={s.mapBtnText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.searchBtn} onPress={() => navigation.navigate('Search')}>
            <Text style={s.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <BusinessCard item={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#5B4BC4']} />}
        ListHeaderComponent={
          <View>
            {/* Promotions Banner */}
            {promotions.length > 0 && (
              <View style={{ paddingTop: 16, paddingLeft: 16 }}>
                <Text style={s.secTitle}>Active Deals</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {promotions.slice(0, 5).map(p => (
                    <View key={p.id} style={s.promoBanner}>
                      {p.discountPercent ? (
                        <View style={s.discountBadge}><Text style={s.discountText}>{p.discountPercent}% OFF</Text></View>
                      ) : null}
                      <Text style={s.promoTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={s.promoDesc} numberOfLines={2}>{p.description}</Text>
                      <Text style={s.promoExpiry}>Expires: {p.expiryDate}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* AI Recommendations */}
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={s.secTitle}>Recommended for You</Text>
                <View style={s.aiBadge}><Text style={s.aiBadgeText}>AI</Text></View>
              </View>
              {loadingAI
                ? <ActivityIndicator color="#5B4BC4" style={{ marginVertical: 12 }} />
                : recommended.length > 0
                  ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
                      {recommended.map(item => <BusinessCard key={item.id} item={item} horizontal />)}
                    </ScrollView>
                  : <Text style={{ fontSize: 13, color: '#aaa', paddingBottom: 4 }}>Browse businesses to get personalised suggestions.</Text>
              }
            </View>

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#fff', maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={[s.catPill, activeCategory === cat && s.catPillActive]} onPress={() => filterByCategory(cat)}>
                  <Text style={[s.catPillText, activeCategory === cat && s.catPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1a1a2e', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>All Businesses</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 15, color: '#888', fontWeight: '600' }}>No businesses found.</Text>
            <Text style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>Pull down to refresh.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: '#fff' },
  greeting: { fontSize: 13, color: '#888' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  mapBtn: { backgroundColor: '#E1F5EE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#9FE1CB' },
  mapBtnText: { color: '#0F6E56', fontWeight: '600', fontSize: 13 },
  searchBtn: { backgroundColor: '#f0eeff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#d0c8ff' },
  searchBtnText: { color: '#5B4BC4', fontWeight: '600', fontSize: 13 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  promoBanner: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginRight: 10, width: 220, borderWidth: 1.5, borderColor: '#25D366' },
  discountBadge: { backgroundColor: '#25D366', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  discountText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  promoDesc: { fontSize: 12, color: '#666', lineHeight: 17, marginBottom: 6 },
  promoExpiry: { fontSize: 11, color: '#aaa' },
  aiBadge: { backgroundColor: '#FAEEDA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  aiBadgeText: { color: '#633806', fontSize: 11, fontWeight: '700' },
  hCard: { backgroundColor: '#fff', borderRadius: 14, width: 155, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e8e8e8' },
  hAvatar: { height: 80, backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center' },
  hAvatarText: { fontSize: 30, fontWeight: '700', color: '#5B4BC4' },
  hBody: { padding: 10 },
  hCat: { fontSize: 11, color: '#888', marginBottom: 4 },
  catPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  catPillActive: { backgroundColor: '#5B4BC4', borderColor: '#5B4BC4' },
  catPillText: { fontSize: 13, color: '#666', fontWeight: '500' },
  catPillTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', overflow: 'hidden', borderWidth: 0.5, borderColor: '#e8e8e8' },
  cardAvatar: { width: 90, backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 32, fontWeight: '700', color: '#5B4BC4' },
  cardContent: { flex: 1, padding: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  catBadge: { backgroundColor: '#f0eeff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  catBadgeText: { fontSize: 11, color: '#5B4BC4', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  stars: { fontSize: 13, color: '#f5a623' },
  rCount: { fontSize: 12, color: '#aaa' },
  loc: { fontSize: 12, color: '#aaa', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 40 }
});
