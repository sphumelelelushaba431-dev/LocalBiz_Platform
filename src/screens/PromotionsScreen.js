import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { createPromotion, getOwnerPromotions, deactivatePromotion, deletePromotion } from '../services/promotionService';
import { getMyBusinesses } from '../services/businessService';
import { auth } from '../config/firebase';

export default function PromotionsScreen({ navigation }) {
  const [promotions, setPromotions]   = useState([]);
  const [businesses, setBusinesses]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Form state
  const [selectedBizId, setSelectedBizId] = useState('');
  const [title, setTitle]                 = useState('');
  const [description, setDescription]     = useState('');
  const [discount, setDiscount]           = useState('');
  const [expiryDate, setExpiryDate]       = useState('');

  const fetchData = async () => {
    try {
      const [promos, biz] = await Promise.all([
        getOwnerPromotions(auth.currentUser.uid),
        getMyBusinesses(auth.currentUser.uid)
      ]);
      setPromotions(promos);
      setBusinesses(biz);
      if (biz.length > 0 && !selectedBizId) setSelectedBizId(biz[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!title || !description || !expiryDate) {
      Alert.alert('Error', 'Please fill in title, description, and expiry date.');
      return;
    }
    if (!selectedBizId) {
      Alert.alert('Error', 'You must have at least one verified business listing to post a promotion.');
      return;
    }
    setSubmitting(true);
    try {
      await createPromotion(selectedBizId, auth.currentUser.uid, {
        title, description,
        discountPercent: discount ? parseInt(discount) : null,
        expiryDate
      });
      Alert.alert('Success!', 'Your promotion is now live.');
      setTitle(''); setDescription(''); setDiscount(''); setExpiryDate('');
      setShowForm(false);
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Could not create promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = (id) => {
    Alert.alert('End Promotion', 'Stop this promotion?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End It', style: 'destructive', onPress: async () => { await deactivatePromotion(id); fetchData(); } }
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this promotion permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePromotion(id); fetchData(); } }
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f7f6ff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Promotions & Deals</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={s.addBtnText}>{showForm ? '✕ Cancel' : '+ New Deal'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Create Form */}
        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>New Promotion</Text>

            {/* Business selector */}
            {businesses.length > 1 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={s.label}>Select Business</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {businesses.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      style={[s.bizPill, selectedBizId === b.id && s.bizPillActive]}
                      onPress={() => setSelectedBizId(b.id)}
                    >
                      <Text style={[s.bizPillText, selectedBizId === b.id && s.bizPillTextActive]}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <FormField label="Deal Title *" value={title} onChange={setTitle} placeholder="e.g. Weekend Special — 20% off all meals" />
            <FormField label="Description *" value={description} onChange={setDescription} placeholder="Describe the deal..." multiline />
            <FormField label="Discount % (optional)" value={discount} onChange={setDiscount} placeholder="e.g. 20" keyboardType="numeric" />
            <FormField label="Expiry Date *" value={expiryDate} onChange={setExpiryDate} placeholder="e.g. 30 April 2026" />

            <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Post Promotion</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Promotions List */}
        <View style={{ padding: 16 }}>
          <Text style={s.listTitle}>Your Promotions ({promotions.length})</Text>
          {promotions.length === 0
            ? <View style={s.empty}>
                <Text style={s.emptyText}>No promotions yet.</Text>
                <Text style={s.emptySub}>Tap "+ New Deal" to attract more customers.</Text>
              </View>
            : promotions.map(p => (
              <View key={p.id} style={s.promoCard}>
                <View style={s.promoTop}>
                  <View style={{ flex: 1 }}>
                    {p.discountPercent ? (
                      <View style={s.discountBadge}><Text style={s.discountText}>{p.discountPercent}% OFF</Text></View>
                    ) : null}
                    <Text style={s.promoTitle}>{p.title}</Text>
                    <Text style={s.promoDesc}>{p.description}</Text>
                    <Text style={s.promoExpiry}>Expires: {p.expiryDate}</Text>
                  </View>
                  <View style={[s.statusDot, { backgroundColor: p.active ? '#25D366' : '#aaa' }]} />
                </View>
                <View style={s.promoActions}>
                  {p.active && (
                    <TouchableOpacity style={s.endBtn} onPress={() => handleDeactivate(p.id)}>
                      <Text style={s.endBtnText}>End Promotion</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(p.id)}>
                    <Text style={s.delBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          }
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({ label, value, onChange, placeholder, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#aaa" multiline={multiline}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#5B4BC4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  formCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa' },
  bizPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  bizPillActive: { backgroundColor: '#5B4BC4', borderColor: '#5B4BC4' },
  bizPillText: { fontSize: 13, color: '#666' },
  bizPillTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#5B4BC4', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#888', fontWeight: '600' },
  emptySub: { fontSize: 13, color: '#aaa', marginTop: 4 },
  promoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0' },
  promoTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  discountBadge: { backgroundColor: '#25D366', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  discountText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  promoTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  promoDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 6 },
  promoExpiry: { fontSize: 12, color: '#aaa' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10, marginTop: 4 },
  promoActions: { flexDirection: 'row', gap: 10 },
  endBtn: { flex: 1, backgroundColor: '#FAEEDA', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  endBtnText: { color: '#633806', fontWeight: '600', fontSize: 13 },
  delBtn: { flex: 1, backgroundColor: '#FCEBEB', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  delBtnText: { color: '#791F1F', fontWeight: '600', fontSize: 13 }
});
