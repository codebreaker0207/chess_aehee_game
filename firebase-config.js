import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfGn5OYurP78rYRQTBnS_9QOkMCMwQhok",
  authDomain: "aehee-c1b18.firebaseapp.com",
  projectId: "aehee-c1b18",
  storageBucket: "aehee-c1b18.firebasestorage.app",
  messagingSenderId: "843166194124",
  appId: "1:843166194124:web:87f1b8308ced5f060f2569",
  measurementId: "G-TL6NZ0S78F"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
