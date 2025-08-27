// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "storiesontips-80391.firebaseapp.com",
  projectId: "storiesontips-80391",
  storageBucket: "storiesontips-80391.firebasestorage.app",
  messagingSenderId: "745616456344",
  appId: "1:745616456344:web:1a53d6e019d8322efeaeed",
  measurementId: "G-33D2C2PZVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage=getStorage(app);