import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, RefreshControl, Platform, Modal, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CouncillorDashboard = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wardInfo, setWardInfo] = useState({ name: 'My Ward', id: '...' });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadWardInfo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [wardInfo, selectedStatus, selectedCategory])
  );

  useEffect(() => {
    if (wardInfo.id !== '...') {
      fetchComplaints();
      
      // Auto-refresh every 30 seconds for "immediate" visibility
      const interval = setInterval(() => {
        fetchComplaints();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [wardInfo, selectedStatus, selectedCategory]);

  const loadWardInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:3000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setWardInfo({ name: data.user.ward || 'My Ward', id: data.user.ward_id || '1' });
          return;
        }
      }
    } catch (error) {
      console.error('Error loading ward info:', error);
    }
    // fallback — still allow dashboard to load
    setWardInfo({ name: 'My Ward', id: '1' });
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      let url = `http://localhost:3000/api/complaints?ward_id=${wardInfo.id}`;
      if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        let filtered = data.complaints;
        if (selectedCategory !== 'all') {
          filtered = filtered.filter(c => c.category === selectedCategory);
        }
        setComplaints(filtered);
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const handleUpdateStatus = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusModalVisible(true);
  };

  const updateStatus = async (newStatus) => {
    if (!selectedComplaint) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/complaints/${selectedComplaint._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setStatusModalVisible(false);
        fetchComplaints();
        Alert.alert('Success', `Status updated to ${newStatus.replace('_', ' ')}.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ComplaintDetails', { id: item._id, complaint: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
            {(item.status || 'pending').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardInfo}>Category: {item.category || 'General'}</Text>
        <Text style={styles.cardDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
      </View>
      <TouchableOpacity 
        style={styles.actionBtn} 
        onPress={() => handleUpdateStatus(item)}
      >
        <Text style={styles.actionBtnText}>Update Status</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { backgroundColor: '#FFF3E0' };
      case 'in_progress': return { backgroundColor: '#E3F2FD' };
      case 'resolved': return { backgroundColor: '#E8F5E9' };
      case 'rejected': return { backgroundColor: '#FFEBEE' };
      default: return { backgroundColor: '#F5F5F5' };
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { color: '#FF9800' };
      case 'in_progress': return { color: '#2196F3' };
      case 'resolved': return { color: '#4CAF50' };
      case 'rejected': return { color: '#F44336' };
      default: return { color: '#9E9E9E' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Ward Management</Text>
            <Text style={styles.subText}>{wardInfo.name} - Ward {wardInfo.id}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.mapBtn}
              onPress={() => navigation.navigate('Map', { complaints })}
            >
              <Text style={styles.mapIcon}>🗺️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#333' }]}>
            {complaints.length}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {complaints.filter(c => c.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>
            {complaints.filter(c => c.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {complaints.filter(c => c.status === 'resolved').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <View style={styles.filterButtons}>
          {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterBtn, selectedStatus === status && styles.filterBtnActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.filterBtnText, selectedStatus === status && styles.filterBtnTextActive]}>
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <View style={styles.filterButtons}>
          {['all', 'Garbage', 'Roads/Potholes', 'Street Lights', 'Water Supply', 'Sewage', 'Other'].map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.filterBtn, selectedCategory === category && styles.filterBtnActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.filterBtnText, selectedCategory === category && styles.filterBtnTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Complaints to Resolve</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderItem}
          keyExtractor={item => String(item._id || item.id || Math.random())}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints()} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No complaints reported in your ward.</Text>
            </View>
          }
        />
      )}

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Select new status for: {selectedComplaint?.title}</Text>
            
            <View style={styles.statusOptions}>
              {['pending', 'in_progress', 'resolved', 'rejected'].map((status) => (
                <TouchableOpacity 
                  key={status}
                  style={[
                    styles.statusOption, 
                    selectedComplaint?.status === status && styles.statusOptionActive,
                    { borderLeftColor: getStatusTextStyle(status).color }
                  ]}
                  onPress={() => updateStatus(status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusTextStyle(status).color }]} />
                  <Text style={[
                    styles.statusOptionText,
                    selectedComplaint?.status === status && styles.statusOptionTextActive
                  ]}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      },
      default: { flex: 1 }
    })
  },
  header: { padding: 25, backgroundColor: '#2C3E50', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerButtons: { flexDirection: 'row', gap: 10 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subText: { fontSize: 16, color: '#bdc3c7', marginTop: 5 },
  mapBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  mapIcon: { fontSize: 24 },
  profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  profileIcon: { fontSize: 24 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginTop: -30, flexWrap: 'wrap' },
  statBox: { backgroundColor: '#fff', width: '22%', padding: 15, borderRadius: 15, elevation: 5, alignItems: 'center', marginBottom: 10 },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#999', marginTop: 5, textTransform: 'uppercase' },
  filtersContainer: { paddingHorizontal: 20, marginTop: 20 },
  filterLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  filterButtons: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 10, marginBottom: 5 },
  filterBtnActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  filterBtnText: { fontSize: 12, color: '#666' },
  filterBtnTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#333' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1, marginRight: 10 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cardInfo: { fontSize: 12, color: '#666' },
  cardDate: { fontSize: 12, color: '#999' },
  actionBtn: { marginTop: 15, backgroundColor: '#4A90E2', padding: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999' },
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

export default CouncillorDashboard;
