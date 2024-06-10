import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDj3_s_MO7vbm2LZPoWzEuTU3d5aTGOBAI",
  authDomain: "labelmate-36c1b.firebaseapp.com",
  projectId: "labelmate-36c1b",
  storageBucket: "labelmate-36c1b.appspot.com",
  messagingSenderId: "1039654710742",
  appId: "1:1039654710742:web:ce10481477a00fb7700877",
  measurementId: "G-7LS2HMPG4L"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export {storage};