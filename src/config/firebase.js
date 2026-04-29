import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// 🔴 REPLACE THESE with your actual Firebase project values
// Get them from: Firebase Console → Project Settings → Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyC3jWaq6s-DyDyvpcmDZ63TUQZTXjgG93o",
  authDomain: "localbizplatform-87954.firebaseapp.com",
  projectId: "localbizplatform-87954",
  storageBucket: "localbizplatform-87954.firebasestorage.app",
  messagingSenderId: "492599822648",
  appId: "1:492599822648:web:f6aefce4d633fa8d7019cd"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
