// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAsenxDDXnqaTAI4vcxwuykzAMKruVb2E",
  authDomain: "byteme-316cd.firebaseapp.com",
  projectId: "byteme-316cd",
  storageBucket: "byteme-316cd.appspot.com",
  messagingSenderId: "1042739854326",
  appId: "1:1042739854326:web:48a22669cc0211d9a6e5d7",
  measurementId: "G-JL5F0PCCE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)