import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import {
  getPlatformStats,
  getTopBusinessesByViews,
  getTopItems,
  getAllReviewsForAdmin,
  getPendingBusinesses,
  approveBusiness,
  rejectBusiness,
  deleteReview
} from '../services/analyticsService';

const TABS = ['Overview', 'Verifications', 'Analytics', 'Reviews'];

export default function AdminPanelScreen() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats]           = useState(null);
  const [topBiz, setTopBiz]         = useState([]);
  const [topItems, setTopItems]     = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [pending, setPending]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, b, i, r, p] = await Promise.all([
        getPlatformStats(),
        getTopBusinessesByViews(),
        getTopItems(),
        getAllReviewsForAdmin(),
        getPendingBusinesses()
      ]);
      setStats(s);
      setTopBiz(b);
      setTopItems(i);
      setReviews(r);
      setPending(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (id, name) => {
    Alert.alert('Approve', `Approve "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => { await approveBusiness(id); fetchAll(); } }
    ]);
  };

  const handleReject = async (id, name) => {
    Alert.alert('Reject', `Reject and hide "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => { await rejectBusiness(id); fetchAll(); } }
    ]);
  };

  const handleDeleteReview = async (id) => {
    Alert.alert('Delete Review', 'Remove this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReview(id); fetchAll(); } }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#5B4BC4" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {tab === 'Verifications' && pending.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pending.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={['#5B4BC4']} />}
      >

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'Overview' && (
          <View>
            <Text style={styles.sectionTitle}>Platform Summary</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Customers" value={stats?.totalCustomers ?? 0} color="#5B4BC4" />
              <StatCard label="Business Owners" value={stats?.totalOwners ?? 0} color="#0F6E56" />
              <StatCard label="Listings" value={stats?.totalBusinesses ?? 0} color="#185FA5" />
              <StatCard label="Reviews" value={stats?.totalReviews ?? 0} color="#854F0B" />
              <StatCard label="Profile Views" value={stats?.totalViews ?? 0} color="#993C1D" />
              <StatCard label="Pending Approval" value={pending.length} color="#E24B4A" />
            </View>
          </View>
        )}

        {/* ── VERIFICATIONS TAB ── */}
        {activeTab === 'Verifications' && (
          <View>
            <Text style={styles.sectionTitle}>Pending Business Approvals</Text>
            {pending.length === 0 ? (
              <EmptyState message="No pending verifications. All businesses are reviewed." />
            ) : pending.map(biz => (
              <View key={biz.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.bizAvatar}><Text style={styles.bizAvatarText}>{biz.name?.charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{biz.name}</Text>
                    <Text style={styles.cardSub}>{biz.category} · {biz.location}</Text>
                  </View>
                  <View style={styles.pendingPill}><Text style={styles.pendingPillText}>Pending</Text></View>
                </View>

                {biz.regNumber ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Reg Number</Text>
                    <Text style={styles.infoValue}>{biz.regNumber}</Text>
                  </View>
                ) : null}

                {biz.verificationDocName ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Document</Text>
                    <Text style={styles.infoValue}>{biz.verificationDocName}</Text>
                  </View>
                ) : null}

                <Text style={styles.cardDesc} numberOfLines={2}>{biz.description}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(biz.id, biz.name)}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(biz.id, biz.name)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'Analytics' && (
          <View>
            <Text style={styles.sectionTitle}>Most Viewed Businesses</Text>
            {topBiz.length === 0 ? (
              <EmptyState message="No view data yet. Views are tracked as customers browse." />
            ) : topBiz.map((biz, i) => (
              <View key={biz.id} style={styles.rankRow}>
                <Text style={styles.rankNum}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>{biz.name}</Text>
                </View>
                <View style={styles.viewPill}>
                  <Text style={styles.viewPillText}>{biz.views} views</Text>
                </View>
                <View style={styles.barWrap}>
                  <View style={[styles.bar, { width: `${Math.min(100, (biz.views / (topBiz[0]?.views || 1)) * 100)}%` }]} />
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Most Interested Items / Products</Text>
            {topItems.length === 0 ? (
              <EmptyState message="No item interest data yet. Tracked as customers tap on products." />
            ) : topItems.map((item, i) => (
              <View key={i} style={styles.rankRow}>
                <Text style={styles.rankNum}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>{item.itemName}</Text>
                  <Text style={styles.rankSub}>Business ID: {item.businessId.slice(0, 8)}...</Text>
                </View>
                <View style={[styles.viewPill, { backgroundColor: '#f0eeff' }]}>
                  <Text style={[styles.viewPillText, { color: '#5B4BC4' }]}>{item.interests} taps</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'Reviews' && (
          <View>
            <Text style={styles.sectionTitle}>All Customer Reviews ({reviews.length})</Text>
            {reviews.length === 0 ? (
              <EmptyState message="No reviews have been submitted yet." />
            ) : reviews.map(r => (
              <View key={r.id} style={styles.card}>
                <View style={styles.reviewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.userName}</Text>
                    <Text style={styles.cardSub}>on {r.businessName}</Text>
                  </View>
                  <Text style={styles.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteReview(r.id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  adminBadge: { backgroundColor: '#5B4BC4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tabScroll: { backgroundColor: '#fff', maxHeight: 50 },
  tabContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive: { backgroundColor: '#5B4BC4', borderColor: '#5B4BC4' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  tabBadge: { backgroundColor: '#E24B4A', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, width: '47%', borderWidth: 0.5, borderColor: '#e8e8e8' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: '#e8e8e8' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bizAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8e4ff', alignItems: 'center', justifyContent: 'center' },
  bizAvatarText: { fontSize: 18, fontWeight: '700', color: '#5B4BC4' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 1 },
  cardDesc: { fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 18 },
  pendingPill: { backgroundColor: '#FAEEDA', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pendingPillText: { color: '#633806', fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  infoLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#333' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: { flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveBtnText: { color: '#27500A', fontWeight: '700', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#FCEBEB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectBtnText: { color: '#791F1F', fontWeight: '700', fontSize: 14 },
  rankRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: '#e8e8e8' },
  rankNum: { fontSize: 18, fontWeight: '700', color: '#5B4BC4', width: 24 },
  rankName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  rankSub: { fontSize: 11, color: '#aaa', marginTop: 1 },
  viewPill: { backgroundColor: '#E1F5EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  viewPillText: { color: '#085041', fontSize: 12, fontWeight: '600' },
  barWrap: { position: 'absolute', bottom: 0, left: 56, right: 0, height: 3, backgroundColor: '#f0f0f0', borderRadius: 2 },
  bar: { height: 3, backgroundColor: '#5B4BC4', borderRadius: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  stars: { fontSize: 14, color: '#f5a623' },
  reviewComment: { fontSize: 13, color: '#555', lineHeight: 19 },
  deleteBtn: { backgroundColor: '#FCEBEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  deleteBtnText: { color: '#791F1F', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 }
});
