const firebaseConfig = {
    apiKey: "AIzaSyBEE1kNykQlWS2U6T2VAFjWLIpoL5v6Hco",
    authDomain: "tfkk-5c22d.firebaseapp.com",
    databaseURL: "https://tfkk-5c22d-default-rtdb.firebaseio.com",
    projectId: "tfkk-5c22d",
    storageBucket: "tfkk-5c22d.firebasestorage.app",
    messagingSenderId: "680755606930",
    appId: "1:680755606930:web:6bc7d5af36e98e29593d4b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
