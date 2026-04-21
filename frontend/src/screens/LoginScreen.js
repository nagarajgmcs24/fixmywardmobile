import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator,
  Modal, Pressable,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = 'http://localhost:5000';

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

// ⚠️ Replace with your Google Client ID from console.cloud.google.com
const GOOGLE_WEB_CLIENT_ID = '971430437174-kvj3d62nj5p0r43l1cvm60kk5kp3l3sm.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(null);
  const [wards, setWards] = useState([]);
  const [wardModalVisible, setWardModalVisible] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [pendingGoogle, setPendingGoogle] = useState(null);
  const [pendingManualLogin, setPendingManualLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({ useProxy: false }),
  });

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

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        (async () => {
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${authentication.accessToken}` },
            });
            const userInfo = await userInfoRes.json();
            setPendingGoogle({
              google_id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
            });
            setPhone('');
            setOtp('');
            setOtpSent(false);
            setMockOtp('');
          } catch (err) {
            Alert.alert('Error', 'Could not load Google profile: ' + err.message);
          }
        })();
      }
    }
  }, [response]);

  const navigateToDashboard = (role) => {
    if (role === 'ward_member' || role === 'admin') {
      navigation.replace('CouncillorDash');
    } else {
      navigation.replace('CitizenDash');
    }
  };

  const cancelGoogleFlow = () => {
    setPendingGoogle(null);
    setPendingManualLogin(false);
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setMockOtp('');
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (selectedWardId == null) {
      Alert.alert('Select ward', 'Please select your ward.');
      return;
    }
    setPendingManualLogin(true);
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setMockOtp('');
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.otp) setMockOtp(data.otp);
      setOtpSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return;
    setLoading(true);
    try {
      const body = { phone, otp };
      if (pendingGoogle) {
        body.google_id = pendingGoogle.google_id;
        body.email = pendingGoogle.email;
        body.name = pendingGoogle.name;
      } else if (pendingManualLogin) {
        body.email = email.trim();
        body.password = password;
      }
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.token) {
        navigateToDashboard(data.user.role);
      } else {
        Alert.alert('Error', data.message || 'Verification failed');
      }
    } catch {
      Alert.alert('Error', 'Verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = () => {
    Alert.alert('Apple Sign-In', 'Apple Sign-In requires an Apple Developer account. Contact the admin to enable it.');
  };

  const selectedWardLabel = selectedWardId != null
    ? (wards.find((w) => w.ward_id === selectedWardId)?.ward_name || 'Selected ward')
    : null;

  const isStepTwo = !!pendingGoogle || pendingManualLogin;
  const title = otpSent ? 'Enter OTP' : isStepTwo ? 'Verify your phone' : 'Sign In';
  const subtitle = otpSent
    ? `OTP sent to +91 ${phone}`
    : isStepTwo
      ? 'Enter your mobile number. We will send an OTP to finish signing in.'
      : 'Login to report and track local issues';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>📍 FixMyWard</Text>
            <Text style={styles.tagline}>Smart Civic Issue Reporting</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {!isStepTwo && !otpSent ? (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email ID</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="you@example.com"
                    placeholderTextColor="#aaa"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
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

                <TouchableOpacity style={styles.primaryBtn} onPress={handlePasswordLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In →</Text>}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.divLine} /><Text style={styles.divText}>OR</Text><View style={styles.divLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                >
                  <Text style={styles.googleBtnText}>🇬 Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.appleBtn} onPress={handleApple}>
                  <Text style={styles.appleBtnText}> Continue with Apple</Text>
                </TouchableOpacity>

                <View style={styles.registerRow}>
                  <Text style={styles.registerText}>New to FixMyWard? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {isStepTwo && !otpSent ? (
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

                <TouchableOpacity onPress={cancelGoogleFlow}>
                  <Text style={styles.changeLink}>← Back to sign in</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {otpSent ? (
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

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Login →</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setMockOtp('');
                    setOtp('');
                  }}
                >
                  <Text style={styles.changeLink}>{isStepTwo ? '← Change number' : '← Change Number'}</Text>
                </TouchableOpacity>

                {isStepTwo && !!pendingGoogle ? (
                  <TouchableOpacity onPress={cancelGoogleFlow}>
                    <Text style={[styles.changeLink, { marginTop: 8 }]}>Cancel Google sign-in</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  wardSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  wardSelectText: { fontSize: 16, color: '#333', flex: 1 },
  wardSelectPlaceholder: { fontSize: 16, color: '#aaa', flex: 1 },
  wardChevron: { fontSize: 12, color: '#888', marginLeft: 8 },
  phoneRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, overflow: 'hidden' },
  countryCode: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, justifyContent: 'center' },
  countryCodeText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
  phoneInput: { flex: 1, padding: 14, fontSize: 16, color: '#333' },
  otpInput: { borderWidth: 1.5, borderColor: '#4A90E2', borderRadius: 12, padding: 16, fontSize: 28, letterSpacing: 12, color: '#333', fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 16, minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  changeLink: { textAlign: 'center', color: '#4A90E2', fontSize: 14, marginTop: 4 },
  otpHint: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' },
  otpHintLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  otpHintValue: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32', letterSpacing: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  divText: { marginHorizontal: 12, color: '#aaa', fontSize: 13 },
  googleBtn: { borderWidth: 1.5, borderColor: '#ddd', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  googleBtnText: { fontSize: 15, color: '#444', fontWeight: '600' },
  appleBtn: { backgroundColor: '#000', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  appleBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerText: { color: '#888', fontSize: 14 },
  registerLink: { color: '#4A90E2', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '70%',
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', padding: 16, paddingBottom: 8 },
  modalList: { maxHeight: 320 },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalRowSelected: { backgroundColor: '#E3F2FD' },
  modalRowText: { fontSize: 16, color: '#333' },
  modalClose: { padding: 16, alignItems: 'center' },
  modalCloseText: { color: '#4A90E2', fontWeight: '600', fontSize: 16 },
});

export default LoginScreen;
