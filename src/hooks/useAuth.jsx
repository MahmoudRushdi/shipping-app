// src/hooks/useAuth.js

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("useAuth Hook: Setting up authentication listener...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("useAuth Hook: Auth state changed.");

      if (firebaseUser) {
        console.log("useAuth Hook: User is logged in. UID:", firebaseUser.uid);
        setUser(firebaseUser); // Set user immediately

        const userDocRef = doc(db, 'users', firebaseUser.uid);

        try {
          console.log("useAuth Hook: Checking for user document in Firestore...");
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            console.log("useAuth Hook: User document found. Role:", userDoc.data().role);
            setRole(userDoc.data().role);
          } else {
            // This is the part that should run for new users
            console.log("useAuth Hook: User document NOT found. Attempting to create it now...");
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              role: 'customer'
            });
            console.log("useAuth Hook: SUCCESSFULLY created user document with 'customer' role.");
            setRole('customer');
          }
        } catch (error) {
            // This will catch any errors with Firestore rules or other issues
            console.error("useAuth Hook: ERROR checking or creating user document:", error);
        }

      } else {
        console.log("useAuth Hook: User is logged out.");
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
        console.log("useAuth Hook: Cleaning up listener.");
        unsubscribe();
    };
  }, []);

  return { user, role, isLoading };
}