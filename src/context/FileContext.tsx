
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

// Firebase configuration with demo-mode configuration
// Using demo mode to allow the app to function without real Firebase credentials
const firebaseConfig = {
  apiKey: "demo-mode",
  authDomain: "demo-mode",
  projectId: "demo-mode",
  storageBucket: "demo-mode",
  messagingSenderId: "demo-mode",
  appId: "demo-mode"
};

// Initialize Firebase in demo mode
let auth;
let db;
let storage;
let app;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Continue with mock implementations
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};

// In-memory storage for demo mode
const inMemoryUsers: { id: string; email: string; password: string }[] = [];
const inMemoryFiles: FileItem[] = [];

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Monitor auth state - using demo mode if Firebase fails
  useEffect(() => {
    const demoAuthCheck = localStorage.getItem('demoCurrentUser');
    if (demoAuthCheck) {
      try {
        const parsedUser = JSON.parse(demoAuthCheck);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Error parsing demo user:", e);
      }
    }
    
    // Only use Firebase auth if not in demo mode
    if (auth) {
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
    }
    
    return () => {};
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
      // Demo mode for users count
      if (!db) {
        setUserCount(inMemoryUsers.length);
        
        if (currentUser) {
          // Get user files from in-memory storage
          const userFiles = inMemoryFiles.filter(file => file.ownerId === currentUser.id);
          setFiles(userFiles);
        }
        return;
      }
      
      // Get users count from Firebase
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUserCount(usersSnapshot.size);
      
      if (currentUser) {
        // Get user files from Firebase
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
      // Demo mode - store in memory
      if (!db || !storage) {
        inMemoryFiles.push(file);
        setFiles([...inMemoryFiles.filter(f => f.ownerId === currentUser?.id)]);
        return;
      }
      
      // Upload file content to Firebase Storage
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
      // Demo mode - delete from memory
      if (!db) {
        const fileIndex = inMemoryFiles.findIndex(file => file.id === id);
        if (fileIndex !== -1) {
          inMemoryFiles.splice(fileIndex, 1);
          setFiles([...inMemoryFiles.filter(f => f.ownerId === currentUser?.id)]);
        }
        return;
      }
      
      // Delete from Firebase
      await deleteDoc(doc(db, "files", id));
      
      // Update local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileById = useCallback(async (id: string) => {
    try {
      // Demo mode - get from memory
      if (!db) {
        return inMemoryFiles.find(file => file.id === id);
      }
      
      // Get from Firebase
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
      // Demo mode - get from memory
      if (!db) {
        return inMemoryFiles.find(file => 
          file.accessCodes.some(ac => ac.code === code && !ac.used)
        );
      }
      
      // Get from Firebase
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
      // Demo mode - mark in memory
      if (!db) {
        const fileIndex = inMemoryFiles.findIndex(file => file.id === fileId);
        if (fileIndex !== -1) {
          const updatedAccessCodes = inMemoryFiles[fileIndex].accessCodes.map(ac => 
            ac.code === code ? { ...ac, used: true } : ac
          );
          inMemoryFiles[fileIndex] = {
            ...inMemoryFiles[fileIndex],
            accessCodes: updatedAccessCodes
          };
          setFiles([...inMemoryFiles.filter(f => f.ownerId === currentUser?.id)]);
        }
        return;
      }
      
      // Mark in Firebase
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
      // Check if user already exists in demo mode
      const existingUser = inMemoryUsers.find(user => user.email === email);
      if (existingUser) {
        return false;
      }
      
      // Demo mode - create in memory
      if (!auth || !db) {
        const newUser = {
          id: `demo-${Date.now()}`,
          email,
          password
        };
        
        inMemoryUsers.push(newUser);
        setCurrentUser({
          id: newUser.id,
          email: newUser.email
        });
        
        localStorage.setItem('demoCurrentUser', JSON.stringify({
          id: newUser.id,
          email: newUser.email
        }));
        
        return true;
      }
      
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
      // Demo mode - log in from memory
      if (!auth) {
        const user = inMemoryUsers.find(u => u.email === email && u.password === password);
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email
          });
          
          localStorage.setItem('demoCurrentUser', JSON.stringify({
            id: user.id,
            email: user.email
          }));
          
          return true;
        }
        return false;
      }
      
      // Log in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Demo mode - log out from memory
      if (!auth) {
        setCurrentUser(null);
        localStorage.removeItem('demoCurrentUser');
        setFiles([]);
        return;
      }
      
      // Log out from Firebase
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
