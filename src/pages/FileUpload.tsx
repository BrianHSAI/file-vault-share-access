
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import AccessCodeInput from "@/components/AccessCodeInput";
import { AccessCode, FileItem } from "@/context/FileContext";

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessCodes, setAccessCodes] = useState<string[]>(["", "", ""]);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { addFile, currentUser, files } = useFiles();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAccessCodesChange = (newCodes: string[]) => {
    setAccessCodes(newCodes);
  };

  const validateCodes = () => {
    // Check for empty codes
    const hasEmptyCode = accessCodes.some(code => !code.trim());
    if (hasEmptyCode) {
      toast.error("Alle adgangskoder skal være udfyldt");
      return false;
    }

    // Check for duplicate codes
    const uniqueCodes = new Set(accessCodes);
    if (uniqueCodes.size !== accessCodes.length) {
      toast.error("Adgangskoderne skal være unikke");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Vælg venligst en fil");
      return;
    }

    // Check if user has reached file limit
    const userFiles = files.filter(file => file.ownerId === currentUser?.id);
    if (userFiles.length >= 15) {
      toast.error("Du har nået din filgrænse. Køb flere filer for at fortsætte.");
      return;
    }

    if (!validateCodes()) {
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const formattedAccessCodes: AccessCode[] = accessCodes.map(code => ({
          code,
          used: false
        }));

        const newFile: FileItem = {
          id: `file-${Date.now()}`,
          name: selectedFile.name,
          uploadDate: new Date().toLocaleDateString(),
          size: formatFileSize(selectedFile.size),
          accessCodes: formattedAccessCodes,
          content: reader.result as string,
          type: selectedFile.type,
          ownerId: currentUser?.id || ""
        };

        addFile(newFile);
        toast.success("Fil uploadet med succes!");
        navigate("/dashboard");
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload mislykkedes. Prøv igen senere.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Upload Fil</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">Vælg fil</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {selectedFile ? (
                      <div>
                        <p className="font-medium text-blue-600">{selectedFile.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSelectedFile(null)}
                        >
                          Skift fil
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <upload className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-slate-700">
                          Klik for at vælge en fil eller træk den hertil
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Alle filtyper understøttes
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adgangskoder (3 unikke koder)</Label>
                <p className="text-sm text-slate-500 mb-2">
                  Hver kode kan kun bruges én gang til at få adgang til filen.
                </p>
                <AccessCodeInput codes={accessCodes} onChange={handleAccessCodesChange} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isUploading}
              >
                Annuller
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Uploader..." : "Upload Fil"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default FileUpload;
