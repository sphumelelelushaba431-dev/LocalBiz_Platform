# Local Biz Platform — Group 15 & 8
## PBDV301 | PBDE401 — Durban University of Technology

---

## Quick Start (VS Code only — no Android Studio needed)

### 1. Install tools
- Node.js v18+: https://nodejs.org
- VS Code: https://code.visualstudio.com
- Expo Go app on your Android phone (Google Play Store)

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Firebase
1. Go to https://console.firebase.google.com
2. Create a new project called "LocalBizPlatform"
3. Add a Web App (not Android)
4. Copy your config values into `src/config/firebase.js`
5. In Firebase Console, enable:
   - Authentication → Email/Password
   - Firestore Database (start in test mode)
   - Storage

### 4. Run the app
```bash
npx expo start
```
Scan the QR code with Expo Go on your phone.

---

## Project Structure
```
LocalBizPlatform/
  App.js                          ← Entry point
  src/
    config/
      firebase.js                 ← Firebase config (add your keys here)
    services/
      authService.js              ← Register, login, logout
      businessService.js          ← Business CRUD
      reviewService.js            ← Reviews
    navigation/
      AppNavigator.js             ← All navigation logic
    screens/
      LoginScreen.js
      RegisterScreen.js
      HomeScreen.js               ← Browse all businesses
      SearchScreen.js             ← Search by keyword
      BusinessProfileScreen.js    ← Business details + reviews
      OwnerDashboardScreen.js     ← Business owner listings
      CreateListingScreen.js      ← Add new business
      ProfileScreen.js            ← User profile + logout
```

## Firebase Collections
- `users` — user profiles (uid, name, email, role)
- `businesses` — business listings
- `reviews` — customer reviews

## Tech Stack
- React Native (Expo)
- Firebase Firestore (database)
- Firebase Auth (authentication)
- Firebase Storage (images)
- React Navigation (routing)
