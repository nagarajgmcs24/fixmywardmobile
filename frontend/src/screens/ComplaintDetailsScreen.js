import React from 'react';
import {
  StyleSheet, Text, View, Image, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, Linking, Platform
} from 'react-native';

const { width } = Dimensions.get('window');

const ComplaintDetailsScreen = ({ route, navigation }) => {
  const { complaint } = route.params;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {complaint.image_url ? (
          <Image source={{ uri: complaint.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderBox]}>
            <Text style={styles.placeholderText}>📷 No Photo Provided</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.category}>{complaint.category || 'General'}</Text>
              <Text style={styles.title}>{complaint.title}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(complaint.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(complaint.status) }]}>
                {complaint.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{complaint.description || 'No description provided.'}</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date Reported</Text>
              <Text style={styles.metaValue}>{new Date(complaint.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ward</Text>
              <Text style={styles.metaValue}>Ward {complaint.ward_id}</Text>
            </View>
          </View>

          {complaint.location && (
            <>
              <View style={styles.divider} />
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity style={styles.locationCard} onPress={openInMaps}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationStatus}>GPS Location Captured</Text>
                  <Text style={styles.locationLink}>Open in Google Maps →</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.timelineSection}>
            <Text style={styles.label}>Activity Timeline</Text>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Complaint Submitted</Text>
                <Text style={styles.timelineDate}>{new Date(complaint.created_at).toLocaleString()}</Text>
              </View>
            </View>
            {complaint.status !== 'pending' && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(complaint.status) }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Status Updated: {complaint.status.replace('_', ' ')}</Text>
                  <Text style={styles.timelineDate}>{new Date(complaint.updated_at || complaint.created_at).toLocaleString()}</Text>
                </View>
              </View>
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
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { 
    paddingBottom: 100,
    ...Platform.select({
      web: { minHeight: '100%' },
      default: {}
    })
  },
  image: { width: width, height: 300, resizeMode: 'cover', backgroundColor: '#f1f5f9' },
  placeholderBox: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94A3B8', fontSize: 16, fontWeight: 'bold' },
  infoSection: { padding: 24, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleContainer: { flex: 1, paddingRight: 10 },
  category: { fontSize: 12, fontWeight: 'bold', color: '#4A90E2', marginBottom: 4, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20 
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 10, textTransform: 'uppercase' },
  description: { fontSize: 16, color: '#334155', lineHeight: 24 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  metaValue: { fontSize: 14, color: '#1e293b', fontWeight: 'bold' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ff', padding: 16, borderRadius: 16 },
  locationIcon: { fontSize: 24, marginRight: 16 },
  locationTextContainer: { flex: 1 },
  locationStatus: { fontSize: 14, color: '#1e293b', fontWeight: 'bold', marginBottom: 4 },
  locationLink: { fontSize: 12, color: '#4A90E2', fontWeight: 'bold' },
  timelineSection: { marginTop: 30 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, marginRight: 16, zIndex: 1 },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  timelineDate: { fontSize: 12, color: '#94a3b8' }
});

export default ComplaintDetailsScreen;