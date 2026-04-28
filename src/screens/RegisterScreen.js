import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { registerUser } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !address || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('Error', 'Please enter a valid cell phone number.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email.trim(), password, name, 'customer', phone.trim(), address.trim());
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email is already registered.');
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>LB</Text></View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Local Biz community</Text>
        </View>

        <View style={styles.form}>
          <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
          <Field label="Email Address" value={email} onChange={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Cell Phone Number" value={phone} onChange={setPhone} placeholder="e.g. 071 234 5678" keyboardType="phone-pad" />
          <Field label="Physical Address" value={address} onChange={setAddress} placeholder="e.g. 12 Main Street, Umlazi, Durban" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="Min. 6 characters" secure />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your personal information is stored securely and will not be shared with third parties. By registering you agree to our Privacy Policy (POPIA compliant).
            </Text>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ownerNote}>
          <Text style={styles.ownerNoteTitle}>Are you a business owner?</Text>
          <Text style={styles.ownerNoteText}>Contact the platform admin to register your business and get a business owner account.</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize, secure }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        secureTextEntry={secure || false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f6ff' },
  inner: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#5B4BC4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa' },
  infoBox: { backgroundColor: '#f0eeff', borderRadius: 8, padding: 12, marginBottom: 16 },
  infoText: { fontSize: 12, color: '#5B4BC4', lineHeight: 17 },
  btn: { backgroundColor: '#5B4BC4', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: '#888' },
  linkBold: { color: '#5B4BC4', fontWeight: '600' },
  ownerNote: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  ownerNoteTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4, textAlign: 'center' },
  ownerNoteText: { fontSize: 13, color: '#666', lineHeight: 18, textAlign: 'center' }
});
