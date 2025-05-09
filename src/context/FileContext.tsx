
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  content: string; // Base64 encoded file content or URL for links
  type: string;
  ownerId: string;
}

interface User {
  id: string;
  email: string;
  password: string;
  provider?: string; // 'google', 'microsoft', or undefined for regular login
  providerUserId?: string;
}

interface FileContextType {
  files: FileItem[];
  addFile: (file: FileItem) => void;
  deleteFile: (id: string) => void;
  getFileById: (id: string) => FileItem | undefined;
  getFileByAccessCode: (code: string, email: string) => FileItem | undefined;
  markCodeAsUsed: (fileId: string, code: string) => void;
  currentUser: { id: string; email: string; provider?: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithProvider: (provider: string, userData: { id: string, email: string }) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<boolean>;
  userCount: number;
  syncData: () => void;
}

// Mock server API
const API = {
  getUsers: (): User[] => {
    try {
      const usersString = localStorage.getItem("global_users");
      return usersString ? JSON.parse(usersString) : [];
    } catch (error) {
      console.error("Error retrieving users:", error);
      return [];
    }
  },
  
  saveUsers: (users: User[]): void => {
    try {
      localStorage.setItem("global_users", JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  },
  
  getFiles: (): FileItem[] => {
    try {
      const filesString = localStorage.getItem("global_files");
      return filesString ? JSON.parse(filesString) : [];
    } catch (error) {
      console.error("Error retrieving files:", error);
      return [];
    }
  },
  
  saveFiles: (files: FileItem[]): void => {
    try {
      localStorage.setItem("global_files", JSON.stringify(files));
    } catch (error) {
      console.error("Error saving files:", error);
    }
  },

  getUserFiles: (userId: string): FileItem[] => {
    try {
      const allFiles = API.getFiles();
      return allFiles.filter(file => file.ownerId === userId);
    } catch (error) {
      console.error("Error retrieving user files:", error);
      return [];
    }
  }
};

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
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; provider?: string } | null>(null);

  // Initial data load
  useEffect(() => {
    syncData();
    
    // Try to restore user session
    const savedUserString = localStorage.getItem("current_session");
    if (savedUserString) {
      try {
        const savedUser = JSON.parse(savedUserString);
        setCurrentUser(savedUser);
        
        // Load user files
        if (savedUser && savedUser.id) {
          const userFiles = API.getUserFiles(savedUser.id);
          setFiles(userFiles);
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      }
    }
  }, []);

  // Sync data between devices and update UI when current user changes
  useEffect(() => {
    if (currentUser) {
      const userFiles = API.getUserFiles(currentUser.id);
      setFiles(userFiles);
    } else {
      setFiles([]);
    }
  }, [currentUser]);

  const syncData = () => {
    const fetchedUsers = API.getUsers();
    setUsers(fetchedUsers);
    
    if (currentUser) {
      const userFiles = API.getUserFiles(currentUser.id);
      setFiles(userFiles);
    }
  };

  const addFile = (file: FileItem) => {
    try {
      const allFiles = API.getFiles();
      const newFiles = [...allFiles, file];
      API.saveFiles(newFiles);
      
      // Update local state with only user's files
      if (currentUser) {
        const updatedUserFiles = API.getUserFiles(currentUser.id);
        setFiles(updatedUserFiles);
      }
    } catch (error) {
      console.error("Error storing files:", error);
      throw error;
    }
  };

  const deleteFile = (id: string) => {
    try {
      const allFiles = API.getFiles();
      const newFiles = allFiles.filter((file) => file.id !== id);
      API.saveFiles(newFiles);
      
      // Update local state
      if (currentUser) {
        const updatedUserFiles = API.getUserFiles(currentUser.id);
        setFiles(updatedUserFiles);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileById = (id: string) => {
    const allFiles = API.getFiles();
    return allFiles.find((file) => file.id === id);
  };

  const getFileByAccessCode = (code: string, email: string) => {
    const allFiles = API.getFiles();
    return allFiles.find((file) => 
      file.accessCodes.some(accessCode => 
        accessCode.code === code && !accessCode.used
      )
    );
  };

  const markCodeAsUsed = (fileId: string, code: string) => {
    try {
      const allFiles = API.getFiles();
      const newFiles = allFiles.map((file) => {
        if (file.id === fileId) {
          const newAccessCodes = file.accessCodes.map((accessCode) => {
            if (accessCode.code === code) {
              return { ...accessCode, used: true };
            }
            return accessCode;
          });
          return { ...file, accessCodes: newAccessCodes };
        }
        return file;
      });
      
      API.saveFiles(newFiles);
      
      // Update local state if necessary
      if (currentUser) {
        const updatedUserFiles = API.getUserFiles(currentUser.id);
        setFiles(updatedUserFiles);
      }
    } catch (error) {
      console.error("Error updating code status:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const allUsers = API.getUsers();
    const user = allUsers.find((u) => u.email === email && u.password === password);
    
    if (user) {
      const userSession = { 
        id: user.id, 
        email: user.email,
        provider: user.provider
      };
      
      setCurrentUser(userSession);
      localStorage.setItem("current_session", JSON.stringify(userSession));
      
      // Load user files
      const userFiles = API.getUserFiles(user.id);
      setFiles(userFiles);
      
      return true;
    }
    return false;
  };

  const loginWithProvider = async (provider: string, userData: { id: string, email: string }): Promise<boolean> => {
    const allUsers = API.getUsers();
    let user = allUsers.find((u) => 
      u.provider === provider && u.providerUserId === userData.id
    );
    
    // If user doesn't exist with this provider, create a new one
    if (!user) {
      user = { 
        id: `user-${Date.now()}`, 
        email: userData.email,
        password: "", // No password for social login
        provider,
        providerUserId: userData.id
      };
      
      const updatedUsers = [...allUsers, user];
      API.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
    
    // Set user session
    const userSession = { 
      id: user.id, 
      email: user.email,
      provider: user.provider
    };
    
    setCurrentUser(userSession);
    localStorage.setItem("current_session", JSON.stringify(userSession));
    
    // Load user files
    const userFiles = API.getUserFiles(user.id);
    setFiles(userFiles);
    
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setFiles([]);
    localStorage.removeItem("current_session");
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    const allUsers = API.getUsers();
    const userExists = allUsers.some((u) => u.email === email);
    
    if (userExists) {
      return false;
    }
    
    const newUser = { id: `user-${Date.now()}`, email, password };
    const updatedUsers = [...allUsers, newUser];
    
    // Save to "server"
    API.saveUsers(updatedUsers);
    
    // Update local state
    setUsers(updatedUsers);
    
    // Auto login
    const userSession = { id: newUser.id, email: newUser.email };
    setCurrentUser(userSession);
    localStorage.setItem("current_session", JSON.stringify(userSession));
    
    return true;
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
    loginWithProvider,
    logout,
    signup,
    userCount: users.length,
    syncData
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
