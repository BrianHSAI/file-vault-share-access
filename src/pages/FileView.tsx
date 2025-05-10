
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccessCodeInput from "@/components/AccessCodeInput";
import { RefreshCw } from "lucide-react";

const FileView: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { getFileById, currentUser, syncData } = useFiles();
  const [file, setFile] = useState(fileId ? getFileById(fileId) : undefined);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Sync data when component mounts to ensure we have the latest
    syncData();

    if (fileId) {
      const foundFile = getFileById(fileId);
      if (!foundFile) {
        toast.error("Filen blev ikke fundet");
        navigate("/dashboard");
        return;
      }

      // Check if user owns this file
      if (foundFile.ownerId !== currentUser.id) {
        toast.error("Du har ikke adgang til denne fil");
        navigate("/dashboard");
        return;
      }

      setFile(foundFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, getFileById, navigate, currentUser]); // Remove syncData from dependency array

  const handleSync = () => {
    setIsSyncing(true);
    try {
      syncData();
      
      // Reload file data after sync
      if (fileId) {
        const foundFile = getFileById(fileId);
        if (foundFile) {
          setFile(foundFile);
        }
      }
      
      toast.success("Data synkroniseret!");
    } catch (error) {
      toast.error("Synkronisering mislykkedes");
    } finally {
      setIsSyncing(false);
    }
  };

  const renderFilePreview = () => {
    if (!file) return null;

    if (file.type.startsWith("image/")) {
      return (
        <div className="flex justify-center p-4 bg-white rounded-md">
          <img 
            src={file.content} 
            alt={file.name} 
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
      );
    } else if (file.type === "application/pdf") {
      return (
        <div className="h-[600px] w-full">
          <iframe 
            src={file.content}
            className="w-full h-full border-0 rounded-md"
            title={file.name}
          />
        </div>
      );
    } else {
      return (
        <div className="p-8 text-center bg-gray-50 rounded-md">
          <p className="text-lg font-medium">
            Forhåndsvisning er ikke tilgængelig for denne filtype
          </p>
          <p className="text-gray-500 mt-2">
            {file.name} ({file.type})
          </p>
        </div>
      );
    }
  };

  if (!currentUser || !file) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{file.name}</h1>
            <p className="text-slate-500">
              Uploadet {file.uploadDate} • {file.size}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Synkroniser
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
            >
              Tilbage til Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Forhåndsvisning</CardTitle>
              </CardHeader>
              <CardContent>{renderFilePreview()}</CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Adgangskoder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Del disse adgangskoder med personer, du vil give adgang til denne fil. 
                  Hver kode kan kun bruges én gang.
                </p>
                <AccessCodeInput 
                  codes={file.accessCodes.map(ac => ac.code)} 
                  onChange={() => {}}
                  readOnly={true}
                  maxCodes={file.accessCodes.length}
                />
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Anvendelsesstatus:</h4>
                  <ul className="space-y-1">
                    {file.accessCodes.map((code, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <span 
                          className={`w-2 h-2 rounded-full mr-2 ${code.used ? 'bg-red-500' : 'bg-green-500'}`}
                        ></span>
                        <span className="mr-2">{code.code}:</span>
                        <span className={code.used ? 'text-red-500' : 'text-green-500'}>
                          {code.used ? 'Brugt' : 'Ikke brugt endnu'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileView;
