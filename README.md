# FixMyWard Mobile 📱

FixMyWard is a comprehensive civic engagement platform designed to bridge the gap between citizens, local councillors, and administrators. It allows citizens to report local ward issues with real-time GPS data and photos, enabling councillors to track and resolve them efficiently.

## 🚀 Key Features

### 👥 For Citizens
- **Report Issues**: Submit complaints with photos (camera integration) and precise GPS location.
- **Track Progress**: Real-time status updates on submitted complaints (Pending, In Progress, Resolved).
- **Interactive Maps**: View all reported issues in your ward on an integrated Google Map.
- **Unified Auth**: Flexible login options including OTP (Msg91), Google, and Apple Sign-In.
- **Notifications**: Stay updated with push notifications regarding your complaint status.
- **Profile Management**: Manage personal details and view history of reported issues.

### 🏛️ For Councillors
- **Ward Management**: Access a specialized dashboard to view all issues within their assigned ward.
- **Status Updates**: Update the progress of complaints to keep citizens informed.
- **Complaint Details**: View detailed information, including photos and precise locations on the map.

### 🛡️ For Administrators
- **User Verification**: Verify and manage councillor registrations.
- **Ward Assignment**: Assign councillors to specific wards.
- **System Overview**: Monitor the overall health and activity of the platform.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Stack & Tab)
- **Maps**: React Native Maps (Google Maps SDK)
- **Location**: Expo Location
- **Media**: Expo Camera & Image Picker
- **Styling**: NativeWind / CSS

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt.js
- **File Storage**: Multer (Local storage for uploads)
- **Services**: Msg91 (OTP), Google OAuth, Apple Auth

---

## 📂 Project Structure

```text
fixmywardmobile/
├── backend/            # Express Server
│   ├── controllers/    # Business logic for Auth, Complaints, Users, etc.
│   ├── models/         # Mongoose Schemas (User, Complaint, Ward, etc.)
│   ├── routes/         # API Route definitions
│   ├── middleware/     # Auth and Role-based access control
│   └── database/       # DB connection logic
└── frontend/           # React Native App (Expo)
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── screens/    # Full-page screens (Dashboard, Login, Report, etc.)
    │   ├── services/   # API call logic (Axios instances)
    │   └── context/    # State management (AuthContext)
```

---

## ⚙️ Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure the following:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   MSG91_AUTH_KEY=your_msg91_key
   MSG91_TEMPLATE_ID=your_template_id
   ```
4. Start the server:
   ```bash
   node index.js
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the API base URL in `src/services/api.js` (or similar) to point to your backend IP address.
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
5. Use **Expo Go** on your physical device or an Android/iOS emulator.

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user (Email/Pass)
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Trigger OTP via Msg91
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/social-login` - Google/Apple authentication

### Complaints
- `POST /api/complaints` - Create a new complaint (Citizen)
- `GET /api/complaints` - Fetch complaints based on role/ward
- `PUT /api/complaints/:id/status` - Update complaint status (Councillor/Admin)
- `DELETE /api/complaints/:id` - Remove a complaint

### Admin/Wards
- `GET /api/wards` - List all wards
- `POST /api/admin/verify-councillor` - Approve councillor accounts

---

## 📱 Screenshots & UI

| Citizen Dashboard | Report Issue | Map View |
| :---: | :---: | :---: |
| Overview of reports | Camera & GPS integration | Spatial distribution of issues |

---

## 📄 License
This project is licensed under the ISC License.
