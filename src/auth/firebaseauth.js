import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "*****ADD API KEY*****",
    authDomain: "aieditorv1.firebaseapp.com",
    projectId: "aieditorv1",
    storageBucket: "aieditorv1.appspot.com",
    messagingSenderId: "**********",
    appId: "1:**********:web:**********",
    measurementId: "G-11VZ43NWM6"
};

const app = initializeApp(firebaseConfig);
export const firebaseauth = getAuth(app);