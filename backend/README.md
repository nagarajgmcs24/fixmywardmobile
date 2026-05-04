# FixMyWard Backend ⚙️

The backend API for the FixMyWard platform, built with Node.js, Express, and MongoDB.

## 🚀 Features
- **User Authentication**: Secure JWT-based auth with support for OTP (Msg91) and Social Login.
- **Role-Based Access**: Specialized endpoints for Citizens, Councillors, and Admins.
- **Complaint Management**: CRUD operations for civic issues with image upload support.
- **Ward Management**: Logic for assigning councillors to specific geographic wards.
- **Notifications**: Backend support for triggering user notifications.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT, Bcrypt.js, Google Auth Library
- **Uploads**: Multer
- **API Client**: Axios

## ⚙️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/fixmyward
   JWT_SECRET=your_jwt_secret
   MSG91_AUTH_KEY=your_key
   MSG91_TEMPLATE_ID=your_id
   ```

3. **Start the Server**:
   ```bash
   node index.js
   ```

## 📡 API Reference

### Auth
- `POST /api/auth/send-otp`: Sends OTP to mobile.
- `POST /api/auth/verify-otp`: Verifies OTP and returns JWT.
- `POST /api/auth/register`: Traditional email registration.

### Complaints
- `GET /api/complaints`: List complaints (filtered by role/ward).
- `POST /api/complaints`: Submit new complaint (with image).
- `PUT /api/complaints/:id/status`: Update status (Councillor/Admin only).

## 📂 Folder Structure
- `controllers/`: Logic for handling requests.
- `models/`: Mongoose schemas.
- `routes/`: Express router definitions.
- `middleware/`: Authentication and authorization logic.
- `uploads/`: Local storage for complaint images.
