// ВАША КОНФИГУРАЦИЯ FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCIIc_fFx3_arvkAI-SMcFqiBzDAeDA798",
    authDomain: "database-65610.firebaseapp.com",
    databaseURL: "https://database-65610-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "database-65610",
    storageBucket: "database-65610.firebasestorage.app",
    messagingSenderId: "15140380143",
    appId: "1:15140380143:web:3edbe815e468e86e1aaa1a"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();