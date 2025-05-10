
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { FileItem } from "@/context/FileContext";
import { Download, RefreshCw } from "lucide-react";

const AccessFile: React.FC = () => {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessedFile, setAccessedFile] = useState<FileItem | null>(null);
  const navigate = useNavigate();
  const { getFileByAccessCode, markCodeAsUsed, syncData } = useFiles();

  // Sync data when component mounts
  useEffect(() => {
    const initialSync = async () => {
      try {
        await syncData();
      } catch (error) {
        console.error("Error syncing data:", error);
      }
    };
    
    initialSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !accessCode) {
      toast.error("Venligst udfyld både email og adgangskode");
      return;
    }

    setIsLoading(true);
    
    try {
      // Sync data first to ensure we have the latest file info
      await syncData();
      
      const file = await getFileByAccessCode(accessCode, email);
      
      if (!file) {
        toast.error("Ugyldig adgangskode eller email");
        setIsLoading(false);
        return;
      }

      // Mark code as used
      await markCodeAsUsed(file.id, accessCode);
      
      // Show the file
      setAccessedFile(file);
      toast.success("Fil tilgået med succes!");
    } catch (error) {
      console.error("Error accessing file:", error);
      toast.error("Der opstod en fejl. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      toast.success("Data synkroniseret!");
    } catch (error) {
      toast.error("Synkronisering mislykkedes");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = () => {
    if (!accessedFile) return;

    try {
      // For regular files
      const link = document.createElement('a');
      link.href = accessedFile.content;
      link.download = accessedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download påbegyndt!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Der opstod en fejl ved download af filen");
    }
  };

  if (accessedFile) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{accessedFile.name}</h1>
              <p className="text-slate-500">
                Uploadet {accessedFile.uploadDate} • {accessedFile.size}
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
            >
              Tilbage til Forsiden
            </Button>
          </div>

          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  Fil Tilgængelig
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-4">
                <div className="text-center mb-4">
                  <p className="text-lg mb-2">Din fil er klar til download</p>
                  <p className="text-sm text-gray-500">{accessedFile.name} ({accessedFile.type})</p>
                  <p className="text-sm text-gray-500 mt-1">{accessedFile.size}</p>
                </div>
                <Button 
                  onClick={handleDownload} 
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download size={20} />
                  Download Fil
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center pt-4">
                <p className="text-sm text-gray-500 text-center">
                  Denne adgangskode er nu brugt og kan ikke bruges igen.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Få Adgang til Fil</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Din Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessCode">Adgangskode</Label>
                <Input
                  id="accessCode"
                  placeholder="Indtast den kode du har fået"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Henter fil..." : "Få adgang"}
              </Button>
              <div className="flex items-center justify-center w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Synkroniser data
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccessFile;
