import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({ totalUsers: 0, totalComplaints: 0, resolvedComplaints: 0, pendingComplaints: 0 });
  const [pendingCouncillors, setPendingCouncillors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      // Fetch all users to find pending councillors (simplified for demo)
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setPendingCouncillors(usersData.users.filter(u => u.role === 'councillor' && !u.ward_id));
      }
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id, name) => {
    Alert.alert('Verify Councillor', `Approve ${name} as a ward member?`, [
      { text: 'Approve', onPress: () => verifyCouncillor(id) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const verifyCouncillor = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Assign to a default ward for demo
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: 'councillor', ward_id: '1' }) 
      });
      if (response.ok) {
        fetchData();
        Alert.alert('Success', 'Councillor verified and ward assigned.');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed.');
    }
  };

  const goToMap = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        navigation.navigate('Map', { complaints: data.complaints });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load map data.');
    }
  };

  const renderCouncillor = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardName}>{item.name || 'Unnamed'}</Text>
        <Text style={styles.cardPhone}>{item.phone}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify(item._id, item.name)}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Admin Panel</Text>
          <Text style={styles.subText}>System Overview & Verifications</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.totalComplaints}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.pendingComplaints}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.mapActionBtn} onPress={goToMap}>
            <Text style={styles.mapActionText}>🗺️ View Global Map</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pending Verifications</Text>
        <FlatList
          data={pendingCouncillors}
          renderItem={renderCouncillor}
          keyExtractor={item => item._id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending verifications.</Text>}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Login')}>
          <Text style={styles.backButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, backgroundColor: '#000', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subText: { fontSize: 16, color: '#999', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: -30 },
  statBox: { backgroundColor: '#fff', width: '31%', padding: 15, borderRadius: 15, elevation: 5, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  statLabel: { fontSize: 10, color: '#999', marginTop: 5, textTransform: 'uppercase' },
  actionRow: { padding: 20 },
  mapActionBtn: { backgroundColor: '#000', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  mapActionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#333' },
  list: { paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardPhone: { fontSize: 14, color: '#666', marginTop: 5 },
  cardEmail: { fontSize: 12, color: '#999' },
  verifyButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  verifyText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  backButton: { margin: 20, padding: 15, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center' },
  backButtonText: { color: '#333', fontWeight: 'bold' }
});

export default AdminDashboard;
