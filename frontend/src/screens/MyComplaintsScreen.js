import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Image, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://localhost:3000';

const MyComplaintsScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const fetchComplaints = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // In a real app, you'd decode the token to get the user_id
      // For now, let's fetch all complaints and filter on frontend or adjust backend
      const response = await fetch(`${BACKEND_URL}/api/complaints`, {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ComplaintDetails', { complaint: item })}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.category}>{item.category || 'General'}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.date}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList
          data={complaints}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Complaints Yet</Text>
              <Text style={styles.emptySubtitle}>Issues you report will appear here.</Text>
              <TouchableOpacity 
                style={styles.reportNowBtn}
                onPress={() => navigation.navigate('ReportIssue')}
              >
                <Text style={styles.reportNowText}>Report an Issue Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  list: { 
    padding: 20,
    paddingBottom: 150,
    ...Platform.select({
      web: { height: 'calc(100vh - 80px)', overflowY: 'auto' },
      default: {}
    })
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between' },
  textContainer: { flex: 1, paddingRight: 12 },
  category: { fontSize: 12, fontWeight: 'bold', color: '#4A90E2', marginBottom: 4, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  date: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  reportNowBtn: { backgroundColor: '#4A90E2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  reportNowText: { color: '#fff', fontWeight: 'bold' }
});

export default MyComplaintsScreen;
