import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  ScrollView, Alert, ActivityIndicator, Platform, Modal, TextInput, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://localhost:3000';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals visibility
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isHelpVisible, setHelpVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);

  // Edit Profile fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWard, setEditWard] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setEditName(data.user.name || '');
        setEditEmail(data.user.email || '');
        setEditWard(data.user.ward_id || '');
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName || !editEmail) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, email: editEmail, ward_id: editWard })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Password updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'CITIZEN'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>+91 {user?.phone || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Ward</Text>
            <Text style={styles.infoValue}>Ward {user?.ward_id || 'Not Assigned'}</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingsItem} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.settingsText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setPasswordModalVisible(true)}>
            <Text style={styles.settingsText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setNotificationsVisible(true)}>
            <Text style={styles.settingsText}>Notification Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => setHelpVisible(true)}>
            <Text style={styles.settingsText}>Help & Support</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>FixMyWard v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Old Password</Text>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Current password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Min 6 characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Repeat new password"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={isNotificationsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Settings</Text>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Email Notifications</Text>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>SMS Notifications</Text>
              <Switch value={smsEnabled} onValueChange={setSmsEnabled} />
            </View>

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 20 }]} onPress={() => setNotificationsVisible(false)}>
              <Text style={styles.cancelBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={isHelpVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.helpHeading}>FAQs</Text>
              <Text style={styles.faqQ}>Q: How do I report an issue?</Text>
              <Text style={styles.faqA}>A: Use the dashboard's "Report Issue" button.</Text>
              
              <Text style={styles.faqQ}>Q: How long does it take to resolve?</Text>
              <Text style={styles.faqA}>A: Depends on the issue type, usually 3-5 days.</Text>

              <Text style={styles.helpHeading}>Contact Us</Text>
              <Text style={styles.helpText}>Email: support@fixmyward.com</Text>
              <Text style={styles.helpText}>Phone: 1800-WARD-HELP</Text>
            </ScrollView>

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 20 }]} onPress={() => setHelpVisible(false)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FE',
    ...Platform.select({
      web: { height: '100vh', overflow: 'hidden' },
      default: {}
    })
  },
  scroll: { 
    flex: 1,
    ...Platform.select({
      web: { overflow: 'auto' },
      default: {}
    })
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 24, paddingBottom: 100 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 20,
    letterSpacing: 1
  },
  infoRow: {
    marginBottom: 20
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b'
  },
  settingsSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  settingsText: {
    fontSize: 16,
    color: '#334155'
  },
  chevron: {
    fontSize: 24,
    color: '#94a3b8'
  },
  versionText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '600'
  },
  saveBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  toggleLabel: {
    fontSize: 16,
    color: '#334155'
  },
  helpHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 10
  },
  faqQ: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4
  },
  faqA: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16
  },
  helpText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8
  }
});

export default ProfileScreen;
