import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: 'https://img.icons8.com/clouds/200/000000/city-buildings.png' }} 
          style={styles.image} 
        />
        <Text style={styles.title}>Welcome to Fix My Ward</Text>
        <Text style={styles.subtitle}>
          Report civic issues, track complaints, and connect with your local authorities easily.
        </Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  image: { width: 250, height: 250, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 40 },
  button: { backgroundColor: '#4A90E2', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 30, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default OnboardingScreen;
