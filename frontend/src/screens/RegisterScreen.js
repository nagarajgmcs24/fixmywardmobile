import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://localhost:3000';

const FALLBACK_WARDS = [
  { ward_id: 1, ward_name: 'Ward 1 - Indiranagar' },
  { ward_id: 2, ward_name: 'Ward 2 - Koramangala' },
  { ward_id: 3, ward_name: 'Ward 3 - HSR Layout' },
  { ward_id: 4, ward_name: 'Ward 4 - Whitefield' },
  { ward_id: 5, ward_name: 'Ward 5 - Marathahalli' },
  { ward_id: 6, ward_name: 'Ward 6 - Jayanagar' },
  { ward_id: 7, ward_name: 'Ward 7 - JP Nagar' },
  { ward_id: 8, ward_name: 'Ward 8 - Electronic City' },
];

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [wards, setWards] = useState([]);
  const [wardModalVisible, setWardModalVisible] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/wards`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) setWards(data);
        else setWards(FALLBACK_WARDS);
      } catch {
        setWards(FALLBACK_WARDS);
      }
    })();
  }, []);

  const selectedWardLabel = selectedWardId != null
    ? (wards.find((w) => w.ward_id === selectedWardId)?.ward_name || 'Selected ward')
    : null;

  const goStep1 = () => {
    setStep(1);
    setPhone('');
    setOtp('');
    setMockOtp('');
  };

  const goStep2 = async () => {
    const em = email.trim();
    if (!em) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com).');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Full Name Required', 'Please enter your full name.');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('Name Too Short', 'Please enter a valid full name (at least 2 characters).');
      return;
    }
    if (!password || !password.trim()) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }
    if (selectedWardId == null) {
      Alert.alert('Ward Required', 'Please select your ward from the dropdown.');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Checking email availability:', em);
      const res = await fetch(`${BACKEND_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      });
      const data = await res.json();
      console.log('📥 Email check response:', { status: res.status, data });
      
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Email check failed');
        return;
      }
      console.log('✅ Email is available. Moving to step 2');
      setStep(2);
      setPhone('');
      setOtp('');
      setMockOtp('');
    } catch (error) {
      console.error('❌ Email check error:', error.message);
      Alert.alert('Error', 'Could not reach server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Mobile Number Required', 'Please enter your mobile number.');
      return;
    }
    if (phone.length !== 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      console.log('📤 Sending OTP for phone:', phone);
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      console.log('📥 Send OTP response:', { status: res.status, data });
      
      if (data.otp) {
        console.log('✅ OTP Received:', data.otp);
        setMockOtp(data.otp);
        setStep(3);
        setOtp('');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error.message);
      Alert.alert('Error', 'Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    if (!otp || otp.trim() === '') {
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP sent to your phone.');
      return;
    }
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'OTP must be exactly 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const body = {
        phone,
        otp,
        email: email.trim(),
        name: name.trim(),
        password,
        ward_id: selectedWardId,
      };
      
      console.log('📤 Sending registration request:', body);
      
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      console.log('📥 Registration response status:', res.status);
      console.log('📥 Registration response data:', data);
      
      if (res.ok && data.token) {
        console.log('✅ Registration successful! Token received');
        await AsyncStorage.setItem('token', data.token);
        if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        const role = data.user?.role || 'citizen';
        console.log('🎯 Navigating to dashboard with role:', role);
        
        if (role === 'councillor' || role === 'ward_member' || role === 'admin') {
          navigation.replace('CouncillorDash');
        } else {
          navigation.replace('CitizenDash');
        }
      } else {
        console.error('❌ Registration failed:', data.message);
        Alert.alert('Error', data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('❌ Registration exception:', error.message);
      Alert.alert('Error', 'Could not reach server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const title =
    step === 1 ? 'Citizen Registration' : step === 2 ? 'Mobile number' : 'Verify OTP';
  const subtitle =
    step === 1
      ? 'Fill in your details to get started'
      : step === 2
        ? 'We will send a one-time password to verify your number.'
        : `OTP sent to +91 ${phone}`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.logo}>📍 FixMyWard</Text>
            <Text style={styles.tagline}>Create Your Account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* ── Step 1: Details ── */}
            {step === 1 ? (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Amit Kumar"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Ward</Text>
                  <TouchableOpacity
                    style={styles.wardSelect}
                    onPress={() => setWardModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={selectedWardLabel ? styles.wardSelectText : styles.wardSelectPlaceholder}>
                      {selectedWardLabel || 'Select your ward'}
                    </Text>
                    <Text style={styles.wardChevron}>▼</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>ℹ️ This registration is only for Citizens. Councillors should use their predefined credentials on the Login page.</Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={goStep2} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Continue →</Text>}
                </TouchableOpacity>

                <View style={styles.loginRow}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {/* ── Step 2: Phone ── */}
            {step === 2 ? (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.phoneRow}>
                    <View style={styles.countryCode}><Text style={styles.countryCodeText}>+91</Text></View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="9876543210"
                      placeholderTextColor="#aaa"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={10}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP →</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.changeLink}>← Back to details</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {/* ── Step 3: OTP ── */}
            {step === 3 ? (
              <>
                {mockOtp ? (
                  <View style={styles.otpHint}>
                    <Text style={styles.otpHintLabel}>🔐 Your OTP (Dev Mode)</Text>
                    <Text style={styles.otpHintValue}>{mockOtp}</Text>
                  </View>
                ) : null}

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
                    placeholderTextColor="#aaa"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    textAlign="center"
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyAndCreate} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Create Account →</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setStep(2); setOtp(''); setMockOtp(''); }}>
                  <Text style={styles.changeLink}>← Change number</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={goStep1}>
                  <Text style={[styles.changeLink, { marginTop: 8 }]}>← Start over</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ward Modal */}
      <Modal visible={wardModalVisible} transparent animationType="fade" onRequestClose={() => setWardModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setWardModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select ward</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {wards.map((w) => (
                <TouchableOpacity
                  key={w.ward_id}
                  style={[styles.modalRow, selectedWardId === w.ward_id && styles.modalRowSelected]}
                  onPress={() => {
                    setSelectedWardId(w.ward_id);
                    setWardModalVisible(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{w.ward_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setWardModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#8888cc', letterSpacing: 1 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, fontSize: 16, color: '#333' },
  wardSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  wardSelectText: { fontSize: 16, color: '#333', flex: 1 },
  wardSelectPlaceholder: { fontSize: 16, color: '#aaa', flex: 1 },
  wardChevron: { fontSize: 12, color: '#888', marginLeft: 8 },
  phoneRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, overflow: 'hidden' },
  countryCode: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, justifyContent: 'center' },
  countryCodeText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
  phoneInput: { flex: 1, padding: 14, fontSize: 16, color: '#333' },
  infoBox: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: '#795548', lineHeight: 18 },
  primaryBtn: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16, minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: '#888', fontSize: 14 },
  loginLink: { color: '#4A90E2', fontSize: 14, fontWeight: 'bold' },
  otpHint: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  otpHintLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  otpHintValue: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32', letterSpacing: 8 },
  otpInput: { borderWidth: 1.5, borderColor: '#4A90E2', borderRadius: 12, padding: 16, fontSize: 28, letterSpacing: 12, color: '#333', fontWeight: 'bold' },
  changeLink: { textAlign: 'center', color: '#4A90E2', fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, maxHeight: '70%', paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', padding: 16, paddingBottom: 8 },
  modalList: { maxHeight: 320 },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalRowSelected: { backgroundColor: '#E3F2FD' },
  modalRowText: { fontSize: 16, color: '#333' },
  modalClose: { padding: 16, alignItems: 'center' },
  modalCloseText: { color: '#4A90E2', fontWeight: '600', fontSize: 16 },
});

export default RegisterScreen;
