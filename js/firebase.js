import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAp6-T8C6URg9HiU3Qf82hUgNd4UMxnq0",
    authDomain: "bathroom-signout-f88a9.firebaseapp.com",
    projectId: "bathroom-signout-f88a9",
    storageBucket: "bathroom-signout-f88a9.firebasestorage.app",
    messagingSenderId: "629365316433",
    appId: "1:629365316433:web:b1c0fbe2dcf5795aa99170",
    measurementId: "G-RN379H370W"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
