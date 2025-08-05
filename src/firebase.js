// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwiG9YqToIFGmVA0LaP2Tq7jseziCNOco",
  authDomain: "verbosapp.firebaseapp.com",
  projectId: "verbosapp",
  storageBucket: "verbosapp.firebasestorage.app",
  messagingSenderId: "82425804309",
  appId: "1:82425804309:web:3ef92fcdd82d2f4128001c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
