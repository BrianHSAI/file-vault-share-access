
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import AccessCodeInput from "@/components/AccessCodeInput";
import { toast } from "sonner";
import { Link } from "lucide-react";

const LinkShare: React.FC = () => {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [accessCodes, setAccessCodes] = useState<string[]>(['', '', '']);
  const navigate = useNavigate();
  const { addFile, currentUser, files } = useFiles();

  const handleShare = async () => {
    if (!linkUrl) {
      toast.error("Indtast venligst et link");
      return;
    }

    if (!linkName) {
      toast.error("Indtast venligst et navn til linket");
      return;
    }

    // Validate link format
    try {
      new URL(linkUrl);
    } catch (e) {
      toast.error("Indtast venligst et gyldigt link");
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
      // Create file object for the shared link
      const fileObj = {
        id: `file-${Date.now()}`,
        name: linkName,
        uploadDate: new Date().toLocaleDateString('da-DK'),
        size: "Link",
        accessCodes: accessCodes
          .filter(code => code.trim() !== "")
          .map(code => ({ code, used: false })),
        content: linkUrl, // Store the URL in the content field
        type: "link", // Mark as link type
        ownerId: currentUser?.id || '',
      };
      
      addFile(fileObj);
      toast.success("Link delt med succes!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error sharing link:", error);
      toast.error("Der opstod en fejl ved deling af linket");
    } finally {
      setIsUploading(false);
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
            <CardTitle className="text-2xl">Del Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkName">Navn</Label>
                <Input
                  id="linkName"
                  placeholder="Navngiv dit link"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <Input
                    id="link"
                    placeholder="https://example.com/shared-file"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Indsæt link til en fil fra Google Drive, OneDrive eller lignende
                </p>
              </div>
            </div>

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
              onClick={handleShare}
              disabled={!linkUrl || !linkName || isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? "Gemmer..." : "Del Link"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LinkShare;
