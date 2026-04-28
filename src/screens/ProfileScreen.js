import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { logoutUser, getUserProfile, updateUserProfile } from '../services/authService';
import { auth } from '../config/firebase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [address, setAddress] = useState('');

  const fetchProfile = async () => {
    if (auth.currentUser) {
      const data = await getUserProfile(auth.currentUser.uid);
      setProfile(data);
      setName(data?.name || '');
      setPhone(data?.phone || '');
      setAddress(data?.address || '');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logoutUser() }
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateUserProfile(auth.currentUser.uid, {
        name: name.trim(), phone: phone.trim(), address: address.trim()
      });
      Alert.alert('Saved!', 'Your profile has been updated.');
      setEditing(false);
      fetchProfile();
    } catch (e) {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f7f6ff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Loading...'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile?.role === 'business_owner' ? 'Business Owner'
               : profile?.role === 'admin' ? 'Admin'
               : 'Customer'}
            </Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Edit your details</Text>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#aaa" autoCapitalize="words" />
            <Text style={styles.fieldLabel}>Cell Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. 071 234 5678" placeholderTextColor="#aaa" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Physical Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="e.g. 12 Main Street, Durban" placeholderTextColor="#aaa" />
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(profile?.name || ''); setPhone(profile?.phone || ''); setAddress(profile?.address || ''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Details</Text>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{profile?.phone || 'Not set'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Address</Text><Text style={styles.detailValue}>{profile?.address || 'Not set'}</Text></View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Member since</Text>
              <Text style={styles.detailValue}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' }) : '—'}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditing(true)}>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Privacy Policy', 'This app collects your name, email, phone number, and location to provide business discovery services. Data is stored securely on Firebase and is not shared with third parties. POPIA compliant.', [{ text: 'OK' }])}>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('About Local Biz', 'Local Biz Platform v2.0\nGroup 15 & 8 — Tech Titans\nPBDV301 | PBDE401\nDurban University of Technology', [{ text: 'OK' }])}>
            <Text style={styles.menuText}>About Local Biz</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#5B4BC4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  email: { fontSize: 14, color: '#888', marginTop: 2 },
  roleBadge: { marginTop: 10, backgroundColor: '#f0eeff', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleText: { color: '#5B4BC4', fontWeight: '600', fontSize: 13 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  detailRow: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#1a1a2e' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 5, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa', marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  saveBtn: { flex: 1, backgroundColor: '#5B4BC4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontWeight: '600', fontSize: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 15, color: '#1a1a2e' },
  menuArrow: { fontSize: 20, color: '#aaa' },
  logoutBtn: { margin: 16, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E24B4A' },
  logoutText: { color: '#E24B4A', fontSize: 16, fontWeight: '600' }
});
