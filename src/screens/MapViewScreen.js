import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getAllBusinesses } from '../services/businessService';
import { saveUserActivity } from '../services/recommendationService';
import { auth } from '../config/firebase';

const CATEGORIES = ['All', 'Food', 'Beauty', 'Health', 'Retail', 'Services', 'Tech'];

const CATEGORY_COLORS = {
  Food: '#D85A30',
  Beauty: '#D4537E',
  Health: '#1D9E75',
  Retail: '#185FA5',
  Services: '#534AB7',
  Tech: '#854F0B',
  Other: '#888780'
};

export default function MapViewScreen({ navigation }) {
  const mapRef = useRef(null);
  const [businesses, setBusinesses]         = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [userLocation, setUserLocation]     = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedBiz, setSelectedBiz]       = useState(null);

  // Default map region — Durban, South Africa
  const [region, setRegion] = useState({
    latitude: -29.8587,
    longitude: 30.9764,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08
  });

  useEffect(() => {
    fetchData();
    requestLocation();
  }, []);

  const fetchData = async () => {
    try {
      const biz = await getAllBusinesses();
      const verified = biz.filter(b => b.verified !== false && b.latitude && b.longitude);
      setBusinesses(verified);
      setFiltered(verified);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
      }
    } catch (e) {
      // Location not available — stay on default Durban region
    }
  };

  const filterByCategory = (cat) => {
    setActiveCategory(cat);
    setFiltered(cat === 'All' ? businesses : businesses.filter(b => b.category === cat));
    setSelectedBiz(null);
  };

  const handleMarkerPress = (biz) => {
    setSelectedBiz(biz);
    // Track interest
    if (auth.currentUser) {
      saveUserActivity(auth.currentUser.uid, 'view', { businessId: biz.id, category: biz.category });
    }
  };

  const handleOpenProfile = (biz) => {
    navigation.navigate('BusinessProfile', { businessId: biz.id });
  };

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03
      }, 800);
    } else {
      Alert.alert('Location unavailable', 'Could not get your location. Please enable location services.');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Business Map</Text>
        <TouchableOpacity style={s.locBtn} onPress={centerOnUser}>
          <Text style={s.locBtnText}>My Location</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.catPill, activeCategory === cat && s.catPillActive]}
            onPress={() => filterByCategory(cat)}
          >
            <Text style={[s.catPillText, activeCategory === cat && s.catPillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={() => setSelectedBiz(null)}
      >
        {filtered.map(biz => (
          <Marker
            key={biz.id}
            coordinate={{
              latitude: biz.latitude || -29.8587,
              longitude: biz.longitude || 30.9764
            }}
            pinColor={CATEGORY_COLORS[biz.category] || '#5B4BC4'}
            onPress={() => handleMarkerPress(biz)}
          >
            <Callout tooltip onPress={() => handleOpenProfile(biz)}>
              <View style={s.callout}>
                <Text style={s.calloutName}>{biz.name}</Text>
                <Text style={s.calloutCat}>{biz.category}</Text>
                <Text style={s.calloutStars}>{'★'.repeat(Math.round(biz.rating || 0))}</Text>
                <Text style={s.calloutTap}>Tap to view profile</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Selected Business Card */}
      {selectedBiz && (
        <View style={s.bottomCard}>
          <View style={s.bottomCardInner}>
            <View style={s.bizAvatar}>
              <Text style={s.bizAvatarText}>{selectedBiz.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bizName}>{selectedBiz.name}</Text>
              <Text style={s.bizCat}>{selectedBiz.category} · {selectedBiz.location}</Text>
              <Text style={s.bizStars}>{'★'.repeat(Math.round(selectedBiz.rating || 0))} ({selectedBiz.reviewCount || 0})</Text>
            </View>
            <TouchableOpacity style={s.viewBtn} onPress={() => handleOpenProfile(selectedBiz)}>
              <Text style={s.viewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={s.legend}>
        <Text style={s.legendTitle}>Legend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <View key={cat} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  back: { fontSize: 15, color: '#5B4BC4', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  locBtn: { backgroundColor: '#E1F5EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  locBtnText: { color: '#0F6E56', fontSize: 12, fontWeight: '600' },
  catScroll: { backgroundColor: '#fff', maxHeight: 48 },
  catContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  catPillActive: { backgroundColor: '#5B4BC4', borderColor: '#5B4BC4' },
  catPillText: { fontSize: 12, color: '#666', fontWeight: '500' },
  catPillTextActive: { color: '#fff', fontWeight: '600' },
  map: { flex: 1 },
  callout: { backgroundColor: '#fff', borderRadius: 10, padding: 12, width: 160, borderWidth: 0.5, borderColor: '#e0e0e0' },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  calloutCat: { fontSize: 12, color: '#888', marginBottom: 2 },
  calloutStars: { fontSize: 14, color: '#f5a623', marginBottom: 4 },
  calloutTap: { fontSize: 11, color: '#5B4BC4', fontWeight: '600' },
  bottomCard: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#e0e0e0' },
  bottomCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bizAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center' },
  bizAvatarText: { fontSize: 20, fontWeight: '700', color: '#5B4BC4' },
  bizName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  bizCat: { fontSize: 12, color: '#888' },
  bizStars: { fontSize: 13, color: '#f5a623' },
  viewBtn: { backgroundColor: '#5B4BC4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  viewBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  legend: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  legendTitle: { fontSize: 11, fontWeight: '600', color: '#aaa', marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#555' }
});
