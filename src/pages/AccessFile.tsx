
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
      toast.error("Der opstod en fejl. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFilePreview = () => {
    if (!accessedFile) return null;

    if (accessedFile.type.startsWith("image/")) {
      return (
        <div className="flex justify-center p-4 bg-white rounded-md">
          <img 
            src={accessedFile.content} 
            alt={accessedFile.name} 
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
      );
    } else if (accessedFile.type === "application/pdf") {
      return (
        <div className="h-[600px] w-full">
          <iframe 
            src={accessedFile.content}
            className="w-full h-full border-0 rounded-md"
            title={accessedFile.name}
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
            {accessedFile.name} ({accessedFile.type})
          </p>
        </div>
      );
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

          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Forhåndsvisning</CardTitle>
              </CardHeader>
              <CardContent>
                {renderFilePreview()}
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  Denne fil kan kun ses i browseren og kan ikke downloades.
                  Adgangskoden er nu brugt og kan ikke bruges igen.
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
                {isLoading ? "Henter fil..." : "Vis Fil"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AccessFile;
