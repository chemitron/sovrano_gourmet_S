import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { User } from '../../src/types';
import { db } from '../firestore/firebase';


export const updateUserRoleByUsername = async (username: string, role: string) => {
  const q = query(collection(db, 'users'), where('username', '==', username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error('User not found');
  const userDoc = snapshot.docs[0];
  const uid = userDoc.id;
  await setDoc(doc(db, 'users', uid), { role }, { merge: true });
  return uid;
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      email: data.email,
      username: data.username,
      role: data.role,
      lastLogin: data.lastLogin,
      id: data.id,
    };
  });
};

export const fetchUserProfile = async (uid: string) => {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};


