import { doc, getFirestore, runTransaction } from "firebase/firestore";

const db = getFirestore();

export async function getNextSequence(name: string): Promise<number> {
  const counterRef = doc(db, "counters", name);

  const nextNumber = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);

    if (!snap.exists()) {
      transaction.set(counterRef, { current: 1 });
      return 1;
    }

    const current = snap.data().current || 0;
    const updated = current + 1;

    transaction.update(counterRef, { current: updated });
    return updated;
  });

  return nextNumber;
}
