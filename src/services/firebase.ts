import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        isAdmin: user.email?.toLowerCase() === 'walidxdxdxd@gmail.com'
      });
    } else if (user.email?.toLowerCase() === 'walidxdxdxd@gmail.com' && !userDoc.data()?.isAdmin) {
      try {
        await updateDoc(userDocRef, { isAdmin: true });
      } catch (e) {
        console.warn("Could not self-repair admin status via client update.");
      }
    }
    return user;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

const sanitizeForFirestore = (data: any): any => {
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeForFirestore);
  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === undefined) return;
    if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeForFirestore(value);
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

export const getCollection = async (collectionName: string) => {
  try {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    
    return docs.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
};

export const addDocument = async (collectionName: string, data: any) => {
  try {
    const sanitizedData = sanitizeForFirestore(data);
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, { ...sanitizedData, createdAt: serverTimestamp() });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const trimmedId = String(id || '').trim();
    if (!trimmedId) {
      throw new Error(`Invalid or empty document ID for update operation.`);
    }
    const sanitizedData = sanitizeForFirestore(data);
    const docRef = doc(db, collectionName, trimmedId);
    await setDoc(docRef, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id || 'NULL'}`);
  }
};

export const removeDocument = async (collectionName: string, id: string) => {
  try {
    const trimmedId = String(id || '').trim();
    if (!trimmedId) {
      throw new Error(`Invalid or empty document ID for delete operation.`);
    }
    await deleteDoc(doc(db, collectionName, trimmedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id || 'NULL'}`);
  }
};
