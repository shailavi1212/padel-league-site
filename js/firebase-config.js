// Firebase Configuration - Padel League Beer Sheva
const firebaseConfig = {
  apiKey: "AIzaSyDJc3kFg0QRyVHNrNKr02Va7HsSLWeR9d0",
  authDomain: "padel-live-d42c0.firebaseapp.com",
  databaseURL: "https://padel-live-d42c0-default-rtdb.firebaseio.com",
  projectId: "padel-live-d42c0",
  storageBucket: "padel-live-d42c0.firebasestorage.app",
  messagingSenderId: "448611105794",
  appId: "1:448611105794:web:ed316ea401ffc196c0fb1b",
  measurementId: "G-88GBRW9MSJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
