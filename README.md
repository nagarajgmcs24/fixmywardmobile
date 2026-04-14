# Fix My Ward - Project Structure & Setup

## Root Directory
- `/backend`: Node.js Express Server
- `/frontend`: React Native Expo Mobile App

## 🚀 Getting Started

### 1. Backend Setup
1. Open a terminal in the `backend` folder.
2. Run `npm install`.
3. Create a MySQL database named `fixmyward`.
4. Run the schema: `mysql -u root -p fixmyward < database/schema.sql`.
5. (Optional) Run sample data: `mysql -u root -p fixmyward < database/populate_db.sql`.
6. Update `.env` with your DB credentials and `JWT_SECRET`.
7. Start server: `node index.js`.

### 2. Frontend Setup
1. Open a terminal in the `frontend` folder.
2. Run `npm install`.
3. Start Expo: `npx expo start`.
4. Use **Expo Go** on your physical device or an emulator to view the app.

## 📱 Features
- **Citizens**: Report issues with Photos + GPS, Track status, View ward maps.
- **Councillors**: Manage ward-specific issues, update status.
- **Admins**: Verify councillors and assign them to wards.
- **Auth**: Unified login via OTP, Google, and Apple.

## 🛠️ Tech Stack
- **Frontend**: React Native (Expo), React Navigation, Expo Location/Camera.
- **Backend**: Node.js, Express, MySQL.
- **Maps**: Google Maps API.
