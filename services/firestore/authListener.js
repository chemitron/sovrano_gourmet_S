import { auth } from '..Services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user); // User is signed in or anonymous
    } else {
      callback(null); // User is signed out
    }
  });
};
