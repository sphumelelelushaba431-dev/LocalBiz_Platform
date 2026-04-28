import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { createBusiness } from '../services/businessService';
import { auth } from '../config/firebase';

const CATEGORIES = ['Food', 'Beauty', 'Health', 'Retail', 'Services', 'Tech', 'Other'];

export default function CreateListingScreen({ navigation, route }) {
  const [name, setName]               = useState('');
  const [category, setCategory]       = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation]       = useState('');
  const [phone, setPhone]             = useState('');
  const [hours, setHours]             = useState('');
  const [regNumber, setRegNumber]     = useState('');
  const [docName, setDocName]         = useState('');
  const [docUri, setDocUri]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [coords, setCoords]           = useState(null);
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [gpsStatus, setGpsStatus]     = useState('');

  const handleUseMyLocation = async () => {
    setGpsLoading(true);
    setGpsStatus('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to pin your business on the map.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setGpsStatus(`Pinned: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Make sure GPS is enabled.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets?.length > 0) {
        setDocName(result.assets[0].name);
        setDocUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.length > 0) {
      setDocName('verification_photo.jpg');
      setDocUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name || !category || !description || !location) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (!regNumber && !docUri) {
      Alert.alert('Verification Required', 'Please provide a registration number or upload proof of registration.');
      return;
    }
    setLoading(true);
    try {
      await createBusiness(
        {
          name, category, description, location, phone, hours, regNumber,
          verificationDocName: docName,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null
        },
        auth.currentUser.uid,
        docUri
      );
      Alert.alert('Submitted!', 'Your listing has been submitted and is pending admin verification.');
      if (route.params?.onCreated) route.params.onCreated();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f7f6ff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>New Business Listing</Text>
        </View>

        {/* Business Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Business Details</Text>
          <Field label="Business Name *" value={name} onChange={setName} placeholder="e.g. Mama's Kitchen" />
          <Field label="Location / Address *" value={location} onChange={setLocation} placeholder="e.g. Umlazi, Durban" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="e.g. 071 234 5678" keyboardType="phone-pad" />
          <Field label="Operating Hours" value={hours} onChange={setHours} placeholder="e.g. Mon-Fri 8am-5pm" />
          <Field label="Description *" value={description} onChange={setDescription} placeholder="Tell customers about your business..." multiline />
          <Text style={s.label}>Category *</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[s.catBtn, category === cat && s.catBtnActive]} onPress={() => setCategory(cat)}>
                <Text style={[s.catBtnText, category === cat && s.catBtnTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* GPS Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Map Location (Optional)</Text>
          <Text style={s.sublabel}>Pin your business so customers can find you on the Map screen.</Text>
          <TouchableOpacity style={[s.gpsBtn, gpsLoading && { opacity: 0.6 }]} onPress={handleUseMyLocation} disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator color="#0F6E56" />
              : <Text style={s.gpsBtnText}>{coords ? '📍 Update My Location' : '📍 Use My Current Location'}</Text>
            }
          </TouchableOpacity>
          {gpsStatus ? <View style={s.gpsPill}><Text style={s.gpsPillText}>{gpsStatus}</Text></View> : null}
        </View>

        {/* Verification Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Business Verification</Text>
          <View style={s.verifyInfo}>
            <Text style={s.verifyInfoText}>Provide your registration number or upload proof of registration (certificate, tax certificate, or trading licence).</Text>
          </View>
          <Field label="Business Registration Number" value={regNumber} onChange={setRegNumber} placeholder="e.g. 2021/123456/07" autoCapitalize="characters" />
          <Text style={s.label}>Upload Proof of Registration</Text>
          <View style={s.uploadRow}>
            <TouchableOpacity style={s.uploadBtn} onPress={handlePickDocument}>
              <Text style={s.uploadBtnText}>Choose File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.uploadBtn, { backgroundColor: '#f0eeff', borderColor: '#d0c8ff' }]} onPress={handleTakePhoto}>
              <Text style={[s.uploadBtnText, { color: '#5B4BC4' }]}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          {docName ? (
            <View style={s.docPill}>
              <Text style={s.docPillText}>Attached: {docName}</Text>
              <TouchableOpacity onPress={() => { setDocName(''); setDocUri(''); }}>
                <Text style={s.docPillRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={s.pendingNote}>
            <Text style={s.pendingNoteText}>Your listing will be reviewed by the admin before going live.</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Submit for Verification</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType, autoCapitalize }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#aaa" multiline={multiline}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff' },
  back: { fontSize: 16, color: '#5B4BC4', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  section: { margin: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 5 },
  sublabel: { fontSize: 12, color: '#888', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  catBtnActive: { backgroundColor: '#5B4BC4', borderColor: '#5B4BC4' },
  catBtnText: { fontSize: 13, color: '#666', fontWeight: '500' },
  catBtnTextActive: { color: '#fff', fontWeight: '600' },
  gpsBtn: { backgroundColor: '#E1F5EE', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#5DCAA5', marginBottom: 10 },
  gpsBtnText: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  gpsPill: { backgroundColor: '#EAF3DE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  gpsPillText: { fontSize: 12, color: '#27500A', fontWeight: '500' },
  verifyInfo: { backgroundColor: '#FFF8E7', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFD97D' },
  verifyInfoText: { fontSize: 13, color: '#7A5C00', lineHeight: 18 },
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  uploadBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#fafafa' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#444' },
  docPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EAF3DE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  docPillText: { fontSize: 13, color: '#27500A', flex: 1 },
  docPillRemove: { color: '#E24B4A', fontSize: 16, marginLeft: 8 },
  pendingNote: { backgroundColor: '#f0eeff', borderRadius: 8, padding: 12 },
  pendingNoteText: { fontSize: 12, color: '#5B4BC4', lineHeight: 17 },
  btn: { backgroundColor: '#5B4BC4', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
