import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp, writeBatch, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getMessaging, getToken as getFcmToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp, writeBatch, arrayUnion
};

/**
 * Liefert eine Firebase-Messaging-Instanz oder null, falls der Browser/das Gerät
 * das nicht unterstützt (z. B. Safari im normalen Tab statt als installierte PWA).
 * Wird bewusst erst bei Bedarf (Klick auf "Benachrichtigungen aktivieren") aufgerufen,
 * damit ein nicht unterstütztes Gerät nicht schon beim App-Start einen Fehler wirft.
 */
export function getMessagingSafe() {
  try {
    return getMessaging(app);
  } catch (err) {
    console.warn("Push-Benachrichtigungen auf diesem Gerät nicht verfügbar:", err);
    return null;
  }
}

export { getFcmToken };
