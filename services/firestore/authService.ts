import { signInAnonymously, signOut } from 'firebase/auth';
import { useResetContext } from "../../src/context/InvitadoContext";
import { logError } from "../../utils/logger";
import { auth } from '../firestore/firebase';

export const signInAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    logError('Anonymous sign-in error:', error);
    throw error;
  }
};
export const logout = async () => {
  const resetContext = useResetContext();
  try {
    await signOut(auth);
    resetContext();
  } catch (error) {
    logError('Logout error:', error);
  }
};
