import React, { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import AccessCodeInput from "@/components/AccessCodeInput";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [accessCodes, setAccessCodes] = useState<string[]>(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addFile, currentUser, files } = useFiles();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check file size - limit to 50MB to avoid localStorage issues
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("Filen er for stor. Maksimum filstørrelse er 50MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vælg venligst en fil først");
      return;
    }

    // Check if max files limit reached
    if (currentUser && files.filter(f => f.ownerId === currentUser.id).length >= 15) {
      toast.error("Du har nået grænsen på 15 filer. Opgrader for at uploade flere.");
      return;
    }

    // Validate access codes
    const validCodes = accessCodes.filter(code => code.trim() !== "");
    if (validCodes.length === 0) {
      toast.error("Indtast mindst én adgangskode");
      return;
    }

    setIsUploading(true);

    try {
      // Read file as data URL
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Create file object
        const fileObj = {
          id: `file-${Date.now()}`,
          name: file.name,
          uploadDate: new Date().toLocaleDateString('da-DK'),
          size: formatFileSize(file.size),
          accessCodes: accessCodes
            .filter(code => code.trim() !== "")
            .map(code => ({ code, used: false })),
          content: result,
          type: file.type,
          ownerId: currentUser?.id || '',
        };
        
        try {
          addFile(fileObj);
          toast.success("Fil uploadet med succes!");
          navigate("/dashboard");
        } catch (error) {
          console.error("Error saving file:", error);
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            toast.error("Filen er for stor til at blive gemt. Prøv med en mindre fil.");
          } else {
            toast.error("Der opstod en fejl ved gemning af filen");
          }
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Der opstod en fejl ved læsning af filen");
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Der opstod en fejl ved upload af filen");
      setIsUploading(false);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Fil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Vælg fil</Label>
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Klik for at vælge en fil</p>
                  <p className="text-xs text-gray-400">PDF, billeder, dokumenter, videoer</p>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Vælg Fil
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFileInput}
                    >
                      Skift fil
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="space-y-4">
                <Label>Adgangskoder</Label>
                <AccessCodeInput
                  codes={accessCodes}
                  onChange={setAccessCodes}
                  maxCodes={3}
                />
                <p className="text-xs text-gray-500">
                  Tilføj op til 3 adgangskoder. Hver adgangskode kan kun bruges én gang.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={isUploading}
            >
              Annuller
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? "Uploader..." : "Upload Fil"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FileUpload;
