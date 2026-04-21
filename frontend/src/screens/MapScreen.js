import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, Platform, ScrollView } from 'react-native';

const MapScreen = ({ route, navigation }) => {
  const { complaints } = route.params || { complaints: [] };
  
  const getLat = (c) => c?.location?.latitude || c?.latitude || 12.9716;
  const getLng = (c) => c?.location?.longitude || c?.longitude || 77.5946;

  const [selectedLocation, setSelectedLocation] = useState(
    complaints.length > 0 
      ? { lat: getLat(complaints[0]), lng: getLng(complaints[0]) }
      : { lat: 12.9716, lng: 77.5946 } // Bangalore default
  );

  // Web fallback: show a real Google Map using iframe
  if (Platform.OS === 'web') {
    const mapUrl = `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.title}>🗺️ Complaint Map</Text>
          <TouchableOpacity style={styles.backButtonSmall} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonTextSmall}>← Go Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.webMain}>
          {/* Real Google Map Iframe for Web */}
          <View style={styles.mapContainer}>
            <iframe
              title="Google Map"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, borderRadius: 12 }}
              src={mapUrl}
              allowFullScreen
            />
          </View>

          {/* List of complaints to select from */}
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Recent Complaints ({complaints.length})</Text>
            <ScrollView style={styles.scrollList}>
              {complaints.length > 0 ? (
                complaints.map((c, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.card, 
                      selectedLocation.lat === getLat(c) && styles.activeCard
                    ]}
                    onPress={() => setSelectedLocation({ lat: getLat(c), lng: getLng(c) })}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{c.title || 'Untitled Issue'}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.status) }]}>
                        <Text style={styles.statusText}>{c.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardLocation}>📍 Ward {c.ward_id || 'Unknown'}</Text>
                    <Text style={styles.cardTime}>{new Date(c.created_at || Date.now()).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No complaints found on the map.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Native: use react-native-maps
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ 
          latitude: getLat(complaints[0]), 
          longitude: getLng(complaints[0]), 
          latitudeDelta: 0.0922, 
          longitudeDelta: 0.0421 
        }}
      >
        {complaints.map((c, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: getLat(c), longitude: getLng(c) }}
            title={c.title}
            description={c.status}
          />
        ))}
      </MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'resolved': return '#4CAF50';
    case 'in progress': return '#FF9800';
    case 'rejected': return '#F44336';
    default: return '#2196F3';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  map: { width: '100%', height: '100%' },
  
  // Web specific styles
  webHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  webMain: { 
    flex: 1, 
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    padding: 20,
    gap: 20
  },
  mapContainer: { 
    flex: 2, 
    height: '100%', 
    minHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  sidebar: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 15,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    height: '100%',
    maxHeight: 'calc(100vh - 120px)'
  },
  sidebarTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  scrollList: { flex: 1 },
  card: { 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#eee',
    backgroundColor: '#fff'
  },
  activeCard: { borderColor: '#4A90E2', backgroundColor: '#F0F7FF', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 8 },
  cardLocation: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardTime: { fontSize: 11, color: '#999' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  backButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#4A90E2', padding: 14, borderRadius: 8, alignItems: 'center' },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButtonSmall: { backgroundColor: '#4A90E2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  backButtonTextSmall: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

export default MapScreen;
