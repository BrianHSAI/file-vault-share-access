
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { FileItem } from "@/context/FileContext";
import { Download } from "lucide-react";

const AccessFile: React.FC = () => {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessedFile, setAccessedFile] = useState<FileItem | null>(null);
  const navigate = useNavigate();
  const { getFileByAccessCode, markCodeAsUsed } = useFiles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !accessCode) {
      toast.error("Venligst udfyld både email og adgangskode");
      return;
    }

    setIsLoading(true);
    
    try {
      const file = getFileByAccessCode(accessCode, email);
      
      if (!file) {
        toast.error("Ugyldig adgangskode eller email");
        setIsLoading(false);
        return;
      }

      // Mark code as used
      markCodeAsUsed(file.id, accessCode);
      
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

  const handleDownload = () => {
    if (!accessedFile) return;

    try {
      // Create a link element
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
                <CardTitle className="text-center">Fil Tilgængelig</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-4">
                <div className="text-center mb-4">
                  <p className="text-lg mb-2">Din fil er klar til download</p>
                  <p className="text-sm text-gray-500">{accessedFile.name} ({accessedFile.type})</p>
                  <p className="text-sm text-gray-500 mt-1">{accessedFile.size}</p>
                </div>
                <Button 
                  onClick={handleDownload} 
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
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
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccessFile;
