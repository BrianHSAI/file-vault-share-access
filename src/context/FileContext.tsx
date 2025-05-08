
import React, { createContext, useContext, useState, ReactNode } from "react";

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
  content: string; // Base64 encoded file content
  type: string;
  ownerId: string;
}

interface FileContextType {
  files: FileItem[];
  addFile: (file: FileItem) => void;
  deleteFile: (id: string) => void;
  getFileById: (id: string) => FileItem | undefined;
  getFileByAccessCode: (code: string, email: string) => FileItem | undefined;
  markCodeAsUsed: (fileId: string, code: string) => void;
  currentUser: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<boolean>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>(() => {
    const savedFiles = localStorage.getItem("files");
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const addFile = (file: FileItem) => {
    const newFiles = [...files, file];
    setFiles(newFiles);
    localStorage.setItem("files", JSON.stringify(newFiles));
  };

  const deleteFile = (id: string) => {
    const newFiles = files.filter((file) => file.id !== id);
    setFiles(newFiles);
    localStorage.setItem("files", JSON.stringify(newFiles));
  };

  const getFileById = (id: string) => {
    return files.find((file) => file.id === id);
  };

  const getFileByAccessCode = (code: string, email: string) => {
    return files.find((file) => 
      file.accessCodes.some(accessCode => 
        accessCode.code === code && !accessCode.used
      )
    );
  };

  const markCodeAsUsed = (fileId: string, code: string) => {
    const newFiles = files.map((file) => {
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
    setFiles(newFiles);
    localStorage.setItem("files", JSON.stringify(newFiles));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      setCurrentUser({ id: user.id, email: user.email });
      localStorage.setItem("currentUser", JSON.stringify({ id: user.id, email: user.email }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userExists = users.some((u: any) => u.email === email);
    
    if (userExists) {
      return false;
    }
    
    const newUser = { id: `user-${Date.now()}`, email, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    
    setCurrentUser({ id: newUser.id, email: newUser.email });
    localStorage.setItem("currentUser", JSON.stringify({ id: newUser.id, email: newUser.email }));
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
    logout,
    signup
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
