import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtCIVlpeHxk58T0jocsAbz4sdZTvPKzys",
    authDomain: "new-obs-data.firebaseapp.com",
    projectId: "new-obs-data",
    storageBucket: "new-obs-data.firebasestorage.app",
    messagingSenderId: "552069224960",
    appId: "1:552069224960:web:85dda7a0201682c96156e5",
    measurementId: "G-C2M3ZEYXRT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register function
export async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document with approved: false
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            approved: false,
            createdAt: new Date(),
            role: 'user' // default role
        });

        // Also save to artifacts > logins as requested
        // Using a subcollection structure or just a separate collection for logging
        try {
            await setDoc(doc(db, "artifacts", "logins", "users", user.uid), {
                email: email,
                uid: user.uid,
                createdAt: new Date()
            });
        } catch (e) {
            console.warn("Could not save to artifacts/logins:", e);
        }

        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Login function
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check approval status
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.approved === true) {
                return { success: true, user: user };
            } else {
                await signOut(auth);
                return { success: false, error: "Account noch nicht freigeschaltet. Bitte warte auf Bestätigung durch einen Administrator." };
            }
        } else {
            // Fallback for users created directly in console or old system
            // If no doc exists, maybe allow or deny? Let's deny to be safe and require doc creation.
            // Or create it now?
            // Let's create it as unapproved.
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                approved: false,
                createdAt: new Date(),
                role: 'user'
            });
            await signOut(auth);
            return { success: false, error: "Account-Daten wurden erstellt. Bitte warte auf Freischaltung." };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Check if user is approved (for route protection)
export async function checkApproval(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() && userDoc.data().approved === true;
}

// Get pending users (for admin)
export async function getPendingUsers() {
    const q = query(collection(db, "users"), where("approved", "==", false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Approve user
export async function approveUser(uid) {
    await updateDoc(doc(db, "users", uid), {
        approved: true
    });
}

// Logout
export function logout() {
    return signOut(auth);
}

export { auth, db };
