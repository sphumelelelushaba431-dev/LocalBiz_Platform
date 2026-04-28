import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { getMyBusinesses, deleteBusiness } from '../services/businessService';
import { auth } from '../config/firebase';

export default function OwnerDashboardScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBusinesses = async () => {
    try {
      const data = await getMyBusinesses(auth.currentUser.uid);
      setBusinesses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyBusinesses(); }, []);

  const handleDelete = (id, name) => {
    Alert.alert('Delete Listing', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteBusiness(id);
          fetchMyBusinesses();
        }
      }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateListing', { onCreated: fetchMyBusinesses })}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{item.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCat}>{item.category} · {item.location}</Text>
              <Text style={styles.cardReviews}>{item.reviewCount || 0} reviews</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No listings yet.</Text>
            <Text style={styles.emptySub}>Tap "+ New" to create your first listing.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff'
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#5B4BC4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', padding: 14, gap: 12,
    borderWidth: 0.5, borderColor: '#e8e8e8'
  },
  cardAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center'
  },
  cardAvatarText: { fontSize: 20, fontWeight: '700', color: '#5B4BC4' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardCat: { fontSize: 12, color: '#888' },
  cardReviews: { fontSize: 12, color: '#5B4BC4', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#E24B4A', fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  emptySub: { fontSize: 13, color: '#aaa', marginTop: 4 }
});
