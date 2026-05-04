# FixMyWard Frontend 📱

This is the React Native mobile application for the FixMyWard platform, built using Expo.

## 🚀 Features
- **Citizen Dashboard**: View and track reported issues.
- **Report Issue**: Integrated camera and GPS for reporting civic problems.
- **Maps**: Visualize complaints on an interactive Google Map.
- **Multi-Role Support**: Different interfaces for Citizens, Councillors, and Admins.
- **Auth**: Support for Email/Password, OTP, and Social Login.

## 🛠️ Tech Stack
- **Framework**: React Native (Expo SDK)
- **Navigation**: React Navigation
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Map Provider**: Google Maps
- **State Management**: React Context API

## ⚙️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Backend URL**:
   Ensure the API base URL in `src/services/api.js` (or your configuration file) points to your backend server's IP address.

3. **Start Expo**:
   ```bash
   npx expo start
   ```

4. **Run on Device**:
   Download the **Expo Go** app on your phone and scan the QR code generated in the terminal.

## 📂 Folder Structure
- `src/components`: UI components like Buttons, Inputs, Cards.
- `src/screens`: Main application screens.
- `src/services`: API services for communicating with the backend.
- `src/context`: Authentication and global state management.
- `src/hooks`: Custom React hooks for location, etc.
