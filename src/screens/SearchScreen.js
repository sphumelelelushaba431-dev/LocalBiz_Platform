// ─── SearchScreen.js ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { searchBusinesses } from '../services/businessService';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchBusinesses(query.trim());
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) =>
    '★'.repeat(Math.round(rating || 0)) + '☆'.repeat(5 - Math.round(rating || 0));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Business name, category..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color="#5B4BC4" style={{ marginTop: 40 }} />}

      {!loading && searched && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BusinessProfile', { businessId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCat}>{item.category} · {item.location}</Text>
              <Text style={{ fontSize: 13, color: '#f5a623' }}>{renderStars(item.rating)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
    color: '#1a1a2e', backgroundColor: '#fafafa'
  },
  searchBtn: {
    backgroundColor: '#5B4BC4', borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center'
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', padding: 12, gap: 12,
    borderWidth: 0.5, borderColor: '#e8e8e8'
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#5B4BC4' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardCat: { fontSize: 12, color: '#888', marginBottom: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa' }
});
