import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CouncillorDashboard = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wardInfo, setWardInfo] = useState({ name: 'My Ward', id: '...' });

  useEffect(() => {
    fetchComplaints();
    loadWardInfo();
  }, []);

  const loadWardInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setWardInfo({ name: data.user.ward || 'My Ward', id: data.user.ward_id || '...' });
        }
      }
    } catch (error) {
      console.error('Error loading ward info:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      // For councillor, we fetch all complaints for their ward
      const response = await fetch('http://localhost:5000/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = (complaint) => {
    Alert.alert('Update Status', `Current: ${complaint.status}`, [
      { text: 'Resolved', onPress: () => updateStatus(complaint._id, 'resolved') },
      { text: 'In Progress', onPress: () => updateStatus(complaint._id, 'in_progress') },
      { text: 'Rejected', onPress: () => updateStatus(complaint._id, 'rejected') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchComplaints();
        Alert.alert('Success', 'Complaint status updated.');
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
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardInfo}>Category: {item.category || 'General'}</Text>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
          <TouchableOpacity 
            style={styles.mapBtn}
            onPress={() => navigation.navigate('Map', { complaints })}
          >
            <Text style={styles.mapIcon}>🗺️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
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

      <Text style={styles.sectionTitle}>Complaints to Resolve</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints()} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No complaints reported in your ward.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, backgroundColor: '#2C3E50', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subText: { fontSize: 16, color: '#bdc3c7', marginTop: 5 },
  mapBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  mapIcon: { fontSize: 24 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginTop: -30 },
  statBox: { backgroundColor: '#fff', width: '30%', padding: 15, borderRadius: 15, elevation: 5, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#999', marginTop: 5, textTransform: 'uppercase' },
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
  logoutBtn: { margin: 20, padding: 15, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center' },
  logoutBtnText: { color: '#333', fontWeight: 'bold' }
});

export default CouncillorDashboard;
