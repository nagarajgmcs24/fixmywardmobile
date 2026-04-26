import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, Linking, Platform, Alert, StatusBar, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ComplaintDetailsScreen = ({ route, navigation }) => {
  const { complaint } = route.params;
  const [councillor, setCouncillor] = useState(null);
  const [userRole, setUserRole] = useState('citizen');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadUserRole();
    fetchCouncillor();
  }, []);

  const loadUserRole = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      console.log('DEBUG: Loaded user string from storage:', userStr);
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('DEBUG: User role is:', user.role);
        setUserRole(user.role || 'citizen');
        setCurrentUserId(user._id || user.user_id);
      } else {
        setUserRole('citizen');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('citizen'); // Default to citizen on error
    }
  };

  const fetchCouncillor = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Attempt to find councillor for this ward
      // Note: This is a placeholder fetch, assuming an endpoint exists or we find them in a list
      const response = await fetch(`http://localhost:3000/api/auth/profile?ward_id=${complaint.ward_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.user) {
         // Logic to filter if multiple users returned, but for now just a placeholder
      }
    } catch (error) {
      console.error('Error fetching councillor:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const openInMaps = () => {
    if (complaint.location) {
      const { latitude, longitude } = complaint.location;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`http://localhost:3000/api/complaints/${complaint._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                Alert.alert('Success', 'Complaint deleted.');
                navigation.goBack();
              } else {
                const data = await response.json();
                Alert.alert('Error', data.message || 'Failed to delete complaint.');
              }
            } catch (error) {
              Alert.alert('Error', 'Connection failed.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {/* Transparent Header Over Image */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
             <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {complaint.image_url ? (
            <Image source={{ uri: complaint.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.placeholderBox]}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>No Photo Provided</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
        </View>

        {/* Main Content Card (Floating) */}
        <View style={styles.mainCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{complaint.category || 'GENERAL'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(complaint.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(complaint.status) }]}>
                {complaint.status?.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{complaint.title}</Text>
          <Text style={styles.dateText}>{formatDate(complaint.created_at)}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{complaint.description || 'No description provided.'}</Text>

          <View style={styles.divider} />

          {/* Detailed Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>WARD</Text>
              <Text style={styles.infoValue}>Ward {complaint.ward_id || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>REPORTED BY</Text>
              <Text style={styles.infoValue}>You</Text>
            </View>
          </View>

          {/* Assigned Councillor Section */}
          <View style={styles.councillorCard}>
            <View style={styles.councillorAvatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.councillorInfo}>
              <Text style={styles.infoLabel}>ASSIGNED COUNCILLOR</Text>
              <Text style={styles.councillorName}>
                {complaint.councillor_name || `Councillor of Ward ${complaint.ward_id}`}
              </Text>
              <Text style={styles.councillorStatus}>Responsible for resolution</Text>
            </View>
          </View>

          {/* Location Section */}
          {complaint.location && (
            <TouchableOpacity style={styles.locationSection} onPress={openInMaps}>
              <View style={styles.locationIconBg}>
                <Text style={styles.locationIcon}>📍</Text>
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                <Text style={styles.locationTitle}>GPS Location Captured</Text>
                <Text style={styles.locationSubtitle}>Tap to view on Google Maps</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          )}

          {/* Timeline Section */}
          <View style={styles.timelineContainer}>
            <Text style={styles.sectionLabel}>Status Timeline</Text>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineTrack}>
                 <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                 <View style={[styles.timelineLine, { backgroundColor: '#4CAF50' }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Complaint Registered</Text>
                <Text style={styles.timelineDate}>{formatDate(complaint.created_at)}</Text>
                <Text style={styles.timelineDesc}>Successfully received by the ward office.</Text>
              </View>
            </View>

            {complaint.status !== 'pending' && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineTrack}>
                   <View style={[styles.timelineDot, { backgroundColor: getStatusColor(complaint.status) }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Status: {complaint.status?.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.timelineDate}>{formatDate(complaint.updated_at || complaint.created_at)}</Text>
                  <Text style={styles.timelineDesc}>The status has been updated by the councillor.</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            {(userRole === 'councillor' || userRole === 'admin' || currentUserId === complaint.user_id) && (
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
                <Text style={styles.actionBtnText}>Delete Report</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      },
      default: { flex: 1 }
    })
  },
  scroll: { 
    flex: 1,
    backgroundColor: '#F8F9FE',
    ...Platform.select({
      web: { overflowY: 'auto' },
      default: {}
    })
  },
  content: { 
    paddingBottom: 60,
    ...Platform.select({
      web: { minHeight: '100%' },
      default: {}
    })
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)', // For web support
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  heroSection: {
    height: 350,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  placeholderBox: {
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#EBF4FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  categoryText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  councillorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  councillorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  councillorInfo: {
    flex: 1,
  },
  councillorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  councillorStatus: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 30,
  },
  locationIconBg: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  timelineContainer: {
    marginBottom: 30,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineTrack: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748B',
    marginVertical: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: '#475569',
  },
  actionBtn: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonGroup: {
    marginTop: 10,
  },
  deleteBtn: {
    backgroundColor: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
  },
  statusOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  statusOptionTextActive: {
    color: '#1e293b',
  },
});

export default ComplaintDetailsScreen;

