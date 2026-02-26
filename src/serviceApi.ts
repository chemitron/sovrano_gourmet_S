import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../services/firestore/firebase'; // adjust path if needed

export type Service = {
  id?: string;
  name: string;
  duration: string;
  description?: string;
  cost?: string;
};

// Fetch all services
export const fetchServices = async (): Promise<Service[]> => {
  const snapshot = await getDocs(collection(db, 'services'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Service[];
};

// Add a new service
export const addService = async (service: Service): Promise<void> => {
  await addDoc(collection(db, 'services'), service);
};

// Delete a service by ID
export const deleteService = async (serviceId: string): Promise<void> => {
  await deleteDoc(doc(db, 'services', serviceId));
};
