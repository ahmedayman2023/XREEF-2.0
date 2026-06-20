import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, updateDoc, arrayUnion, doc, increment, getDoc, setDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services for Xreef App
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const storage = getStorage(app);

// Auth Methods
const googleProvider = new GoogleAuthProvider();

let currentAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential && credential.accessToken) {
    currentAccessToken = credential.accessToken;
  }
  return result;
};

export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);

// Firestore helpers
export enum OperationType {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export function handleFirestoreError(error: any, operation: OperationType, path: string) {
  console.error(`Firestore error during ${operation} at ${path}:`, error);
}

/**
 * Uploads an image file to Firebase Storage for the XReef project.
 * 
 * @param file - The image file to upload (File or Blob)
 * @param folderPath - The destination path in the storage bucket (e.g., 'images/projects')
 * @returns A promise that resolves to the download URL of the uploaded image
 */
export const uploadProjectImage = async (file: File | Blob, folderPath: string): Promise<string> => {
  try {
    // Determine a filename
    const filename = file instanceof File ? file.name : `image_${Date.now()}.png`;
    
    // Create a reference to the specific path within the bucket
    const imageRef = ref(storage, `${folderPath}/${filename}`);
    
    // Upload the file
    await uploadBytes(imageRef, file);
    
    // Get and return the download URL
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
};

/**
 * Uploads an image and saves its URL to the given project's document in Firestore.
 * 
 * @param file - The image file to upload (File or Blob)
 * @param folderPath - The destination path in the storage bucket
 * @param projectId - The ID of the project to update
 * @returns A promise that resolves to the download URL
 */
export const uploadAndSaveImage = async (file: File | Blob, folderPath: string, projectId: string): Promise<string> => {
  try {
    const downloadURL = await uploadProjectImage(file, folderPath);
    
    // Get the current user to find the correct project document path
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to save an image to a project.");
    }
    
    // Reference to the project document
    const projectRef = doc(db, `users/${currentUser.uid}/projects`, projectId);
    
    // Update the document to include the new image URL in the 'images' array field
    await updateDoc(projectRef, {
      images: arrayUnion(downloadURL)
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading and saving image:", error);
    throw error;
  }
};

/**
 * Uploads an image to Firebase Storage and saves its URL to a folder document in Firestore.
 * Also increments the folder's imageCount.
 * 
 * @param file - The image file to upload (File or Blob)
 * @param folderId - The ID of the folder to update
 * @param folderPath - The destination path in the storage bucket
 * @returns A promise that resolves to an object containing the download URL and the new image count
 */
export const uploadToFolder = async (file: File | Blob, folderId: string, folderPath: string): Promise<{ downloadURL: string, imageCount: number }> => {
  try {
    const downloadURL = await uploadProjectImage(file, folderPath);
    
    // Get the current user to find the correct folder document path
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to save an image to a folder.");
    }
    
    // Reference to the folder document
    const folderRef = doc(db, `users/${currentUser.uid}/folders`, folderId);
    
    // Update the document to include the new image URL and increment the image count
    await updateDoc(folderRef, {
      images: arrayUnion(downloadURL),
      imageCount: increment(1)
    });
    
    // Fetch the updated document to get the new image count
    const folderSnap = await getDoc(folderRef);
    const newImageCount = folderSnap.data()?.imageCount || 1;
    
    return { downloadURL, imageCount: newImageCount };
  } catch (error) {
    console.error("Error uploading and saving image to folder:", error);
    throw error;
  }
};

/**
 * Creates a new project folder in Firestore.
 * 
 * @param folderName - The name of the new folder
 * @returns A promise that resolves to the new folder ID
 */
export const createProjectFolder = async (folderName: string): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be logged in to create a folder.");
    }
    
    const folderId = Date.now().toString();
    const folderRef = doc(db, `users/${currentUser.uid}/folders`, folderId);
    
    await setDoc(folderRef, {
      id: folderId,
      folderName,
      createdAt: Date.now(),
      images: [],
      imageCount: 0
    });
    
    return folderId;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
};

/**
 * Fetches folders for the current user and listens for real-time updates.
 * 
 * @param callback - Function to call with the updated list of folders
 * @returns An unsubscribe function to detach the listener
 */
export const fetchFolders = (callback: (folders: any[]) => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to fetch folders.");
    return () => {}; // return empty unsubscribe
  }
  
  const foldersRef = collection(db, `users/${currentUser.uid}/folders`);
  const qFolders = query(foldersRef, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(qFolders, (snapshot) => {
    const foldersData: any[] = [];
    snapshot.forEach((doc) => {
      // Use cast to any to be flexible or define interface
      foldersData.push({ id: doc.id, ...doc.data() });
    });
    callback(foldersData);
  }, (error) => {
    console.error("Error fetching folders in real-time:", error);
  });
  
  return unsubscribe;
};

export default app;