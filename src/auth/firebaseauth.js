import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";


const firebaseConfig = {
    apiKey: "AIzaSyA3LEMcoLF6z9Ouh54PkkrjsQVGNioRRDk",
    authDomain: "aieditor-383809.firebaseapp.com",
    projectId: "aieditor-383809",
    storageBucket: "aieditor-383809.appspot.com",
    messagingSenderId: "363692042724",
    appId: "1:363692042724:web:18dd8dbbe8a288133f7ff1"
};

const app = initializeApp(firebaseConfig);

export const firebaseauth = getAuth(app);