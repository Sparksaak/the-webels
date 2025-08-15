
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "the-webels",
  "appId": "1:486534621410:web:05d75472a8093ec28e16bb",
  "storageBucket": "the-webels.firebasestorage.app",
  "apiKey": "AIzaSyDBfI1ySJGdK2c-7LnLPCnlYVtjHN0vQiU",
  "authDomain": "the-webels.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "486534621410"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export { app, auth };
