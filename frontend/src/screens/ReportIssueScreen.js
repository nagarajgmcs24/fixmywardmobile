import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, Image, ScrollView, Alert, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://localhost:5000';

const CATEGORIES = [
  { id: '1', name: 'Garbage', icon: '🗑️' },
  { id: '2', name: 'Roads/Potholes', icon: '🛣️' },
  { id: '3', name: 'Street Lights', icon: '💡' },
  { id: '4', name: 'Water Supply', icon: '🚰' },
  { id: '5', name: 'Sewage', icon: '🏗️' },
  { id: '6', name: 'Other', icon: '🛠️' },
];

const ReportIssueScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => setLocation({ latitude: 12.9716, longitude: 77.5946 })
        );
      }
    } else {
      (async () => {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      })();
    }
  }, []);

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setImage(ev.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !category || !description || !image) {
      Alert.alert('Error', 'Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        navigation.navigate('Login');
        return;
      }

      // In a real app, you would upload the image to S3/Cloudinary first
      // For this demo, we'll send the base64 or URI as image_url
      const response = await fetch(`${BACKEND_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ward_id: "8", // Default for demo, should come from user profile
          title,
          category: category.name,
          description,
          image_url: image, 
          location
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Your complaint has been submitted successfully!', [
          { text: 'OK', onPress: () => navigation.replace('CitizenDash') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to submit complaint');
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}

        alwaysBounceVertical={true}
      >
        <Text style={styles.sectionTitle}>What is the issue?</Text>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Summary Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Garbage piling up"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <Text style={styles.label}>Select Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryCard,
                category?.id === item.id && styles.categoryCardSelected
              ]}
              onPress={() => setCategory(item)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={[
                styles.categoryName,
                category?.id === item.id && styles.categoryNameSelected
              ]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Detailed Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us more about the problem..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Text style={styles.label}>Photo Proof</Text>
        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
          {image ? (
            <View>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <View style={styles.changeOverlay}>
                <Text style={styles.changeText}>Tap to Change</Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubText}>Take a Photo or Upload</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {location ? 'Location Captured Successfully' : 'Fetching Location...'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>
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
  content: { 
    padding: 24, 
    paddingBottom: 150, 
    ...Platform.select({
      web: { minHeight: '100%' },
      default: {}
    })
  },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 10 },
  inputWrapper: { marginBottom: 20 },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#e0e0e0', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: '#333' 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  categoryCard: { 
    width: '31%', 
    backgroundColor: '#f8f9fa', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  categoryCardSelected: { 
    backgroundColor: '#eef6ff', 
    borderColor: '#4A90E2' 
  },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryName: { fontSize: 10, color: '#666', textAlign: 'center', fontWeight: '500' },
  categoryNameSelected: { color: '#4A90E2', fontWeight: 'bold' },
  imagePlaceholder: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 16, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd'
  },
  placeholderBox: { alignItems: 'center' },
  placeholderSubText: { fontSize: 14, color: '#999' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 8, 
    alignItems: 'center' 
  },
  changeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  locationInfo: { 
    marginVertical: 20, 
    backgroundColor: '#f0f7ff', 
    padding: 12, 
    borderRadius: 10 
  },
  locationText: { fontSize: 13, color: '#4A90E2', fontWeight: '600' },
  submitBtn: { 
    backgroundColor: '#4A90E2', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  submitBtnDisabled: { backgroundColor: '#ccc' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ReportIssueScreen;
