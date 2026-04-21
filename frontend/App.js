import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import CitizenDashboard from './src/screens/CitizenDashboard';
import CouncillorDashboard from './src/screens/CouncillorDashboard';
import ReportIssueScreen from './src/screens/ReportIssueScreen';
import MapScreen from './src/screens/MapScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import RegisterScreen from './src/screens/RegisterScreen';
import MyComplaintsScreen from './src/screens/MyComplaintsScreen';
import ComplaintDetailsScreen from './src/screens/ComplaintDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CitizenDash" component={CitizenDashboard} />
        <Stack.Screen name="CouncillorDash" component={CouncillorDashboard} />
        <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="AdminDash" component={AdminDashboard} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} />
        <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
