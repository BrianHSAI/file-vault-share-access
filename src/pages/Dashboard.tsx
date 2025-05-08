
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import FileCard from "@/components/FileCard";
import { Upload } from "lucide-react"; // Fixed import, capitalized Upload

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { files, currentUser, deleteFile } = useFiles();

  // Filter files by current user
  const userFiles = files.filter(file => file.ownerId === currentUser?.id);

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Mine Filer</h1>
          <Button 
            onClick={() => navigate("/upload")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Fil
          </Button>
        </div>

        {userFiles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-slate-500 mb-4">Du har ikke uploadet nogen filer endnu.</p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button 
                onClick={() => navigate("/upload")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Din Første Fil
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={() => handleDelete(file.id)}
                onClick={() => navigate(`/file/${file.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
