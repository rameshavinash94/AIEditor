import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyD_Mv44cgEy4SGPvPa17589AfzJ2foVg7E",
    authDomain: "aieditorv1.firebaseapp.com",
    projectId: "aieditorv1",
    storageBucket: "aieditorv1.appspot.com",
    messagingSenderId: "189760368819",
    appId: "1:189760368819:web:27503b11f65d85562b00c6",
    measurementId: "G-11VZ43NWM6"
};

const app = initializeApp(firebaseConfig);
export const firebaseauth = getAuth(app);