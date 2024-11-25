import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD0JdCmIJPmXQJuyDFaVJYRSzPcAJfoe1g',
  authDomain: 'huntcofc-c37cd.firebaseapp.com',
  projectId: 'huntcofc-c37cd',
  storageBucket: 'huntcofc-c37cd.firebasestorage.app',
  messagingSenderId: '585813764383',
  appId: '1:585813764383:web:83a14a11571cabc014682a',
  measurementId: 'G-PDQWM09YWJ'
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app); 