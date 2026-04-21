import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, FlatList, ActivityIndicator, RefreshControl, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CitizenDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Citizen');
  const [complaints, setComplaints] = useState([
    { id: '1', title: 'Street Light Not Working', status: 'Pending', date: '28 Mar 2026', category: 'Electricity' },
    { id: '2', title: 'Pothole on Main Road', status: 'In Progress', date: '27 Mar 2026', category: 'Roads' },
  ]);

  useEffect(() => {
    loadUserData();
    fetchComplaints();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUserName(data.user.name || 'Citizen');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ComplaintDetails', { id: item._id, complaint: item })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardCategory}>{item.category || 'General'}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.viewLink}>Details →</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { backgroundColor: '#FFF3E0' };
      case 'in progress': 
      case 'in_progress': return { backgroundColor: '#E3F2FD' };
      case 'resolved': return { backgroundColor: '#E8F5E9' };
      default: return { backgroundColor: '#F5F5F5' };
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { color: '#FF9800' };
      case 'in progress':
      case 'in_progress': return { color: '#2196F3' };
      case 'resolved': return { color: '#4CAF50' };
      default: return { color: '#9E9E9E' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.headerIcon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.headerIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#4A90E2' }]}>
            <Text style={styles.statNum}>{complaints.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statNum}>
              {complaints.filter(c => c.status.toLowerCase() === 'resolved').length}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.statNum}>
              {complaints.filter(c => c.status.toLowerCase() === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.reportBtn}
            onPress={() => navigation.navigate('ReportIssue')}
          >
            <Text style={styles.reportBtnText}>📢 Report a New Issue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Recent Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyComplaints')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={complaints.slice(0, 3)}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No reports yet. Help us fix your ward!</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Map', { complaints })}
      >
        <Text style={styles.fabIcon}>📍</Text>
      </TouchableOpacity>
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
  content: {
    paddingBottom: 100,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#FFF' 
  },
  welcomeText: { fontSize: 16, color: '#64748B' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  headerRight: { flexDirection: 'row' },
  headerBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 25, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 12
  },
  headerIcon: { fontSize: 20 },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginTop: -20 
  },
  statCard: { 
    width: '31%', 
    padding: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  actionSection: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
  reportBtn: { 
    backgroundColor: '#4A90E2', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  reportBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listSection: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { color: '#4A90E2', fontWeight: '600' },
  card: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardCategory: { fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' },
  cardDate: { fontSize: 12, color: '#94A3B8' },
  viewLink: { fontSize: 12, color: '#4A90E2', fontWeight: '600' },
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 24, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  fabIcon: { fontSize: 24 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94A3B8', textAlign: 'center' }
});

export default CitizenDashboard;
