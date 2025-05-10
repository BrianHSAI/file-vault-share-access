
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

export interface AccessCode {
  code: string;
  used: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  accessCodes: AccessCode[];
  content: string; // Base64 encoded file content or URL to cloud storage
  type: string;
  ownerId: string;
}

interface User {
  id: string;
  email: string;
}

interface FileContextType {
  files: FileItem[];
  addFile: (file: FileItem) => void;
  deleteFile: (id: string) => void;
  getFileById: (id: string) => Promise<FileItem | undefined>;
  getFileByAccessCode: (code: string, email: string) => Promise<FileItem | undefined>;
  markCodeAsUsed: (fileId: string, code: string) => void;
  currentUser: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<boolean>;
  userCount: number;
  syncData: () => Promise<void>;
}

// Firebase configuration (this would need real values)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          email: user.email || ""
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync data when current user changes
  useEffect(() => {
    if (currentUser) {
      syncData();
    } else {
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Create a memoized version of syncData to prevent infinite loops
  const syncData = useCallback(async () => {
    try {
      // Get users count
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUserCount(usersSnapshot.size);
      
      if (currentUser) {
        // Get user files
        const filesQuery = query(
          collection(db, "files"),
          where("ownerId", "==", currentUser.id)
        );
        
        const filesSnapshot = await getDocs(filesQuery);
        const fetchedFiles: FileItem[] = [];
        
        filesSnapshot.forEach((doc) => {
          fetchedFiles.push({ id: doc.id, ...doc.data() } as FileItem);
        });
        
        setFiles(fetchedFiles);
      }
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  }, [currentUser]);

  const addFile = async (file: FileItem) => {
    try {
      // Upload file content to Storage
      const storageRef = ref(storage, `files/${file.id}`);
      await uploadString(storageRef, file.content, 'data_url');
      
      // Get URL for the uploaded file
      const fileUrl = await getDownloadURL(storageRef);
      
      // Save file metadata to Firestore
      const fileData = {
        ...file,
        content: fileUrl, // Store URL instead of base64
      };
      
      await addDoc(collection(db, "files"), fileData);
      
      // Update local state
      await syncData();
    } catch (error) {
      console.error("Error storing file:", error);
      throw error;
    }
  };

  const deleteFile = async (id: string) => {
    try {
      await deleteDoc(doc(db, "files", id));
      
      // Update local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileById = useCallback(async (id: string) => {
    try {
      const docRef = doc(db, "files", id);
      const docSnap = await getDocs(collection(db, "files"));
      
      let foundFile: FileItem | undefined;
      
      docSnap.forEach((doc) => {
        if (doc.id === id) {
          foundFile = { id: doc.id, ...doc.data() } as FileItem;
        }
      });
      
      return foundFile;
    } catch (error) {
      console.error("Error getting file by ID:", error);
      return undefined;
    }
  }, []);

  const getFileByAccessCode = useCallback(async (code: string, email: string) => {
    try {
      // Query files to find one with matching access code
      const filesSnapshot = await getDocs(collection(db, "files"));
      let foundFile: FileItem | undefined;
      
      filesSnapshot.forEach((doc) => {
        const fileData = doc.data() as Omit<FileItem, "id">;
        const accessCodes = fileData.accessCodes || [];
        
        if (accessCodes.some(ac => ac.code === code && !ac.used)) {
          foundFile = { id: doc.id, ...fileData } as FileItem;
        }
      });
      
      return foundFile;
    } catch (error) {
      console.error("Error getting file by access code:", error);
      return undefined;
    }
  }, []);

  const markCodeAsUsed = async (fileId: string, code: string) => {
    try {
      // Get the file document
      const docRef = doc(db, "files", fileId);
      const docSnap = await getDocs(collection(db, "files"));
      
      let foundFile: FileItem | undefined;
      
      docSnap.forEach((doc) => {
        if (doc.id === fileId) {
          foundFile = { id: doc.id, ...doc.data() } as FileItem;
        }
      });
      
      if (foundFile) {
        // Update the access code to mark as used
        const updatedAccessCodes = foundFile.accessCodes.map(ac => 
          ac.code === code ? { ...ac, used: true } : ac
        );
        
        // Update the document
        await updateDoc(docRef, {
          accessCodes: updatedAccessCodes
        });
        
        // Update local state
        await syncData();
      }
    } catch (error) {
      console.error("Error marking code as used:", error);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Add user to Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email
      });
      
      return true;
    } catch (error) {
      console.error("Error signing up:", error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFiles([]);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value = {
    files,
    addFile,
    deleteFile,
    getFileById,
    getFileByAccessCode,
    markCodeAsUsed,
    currentUser,
    login,
    logout,
    signup,
    userCount,
    syncData
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
