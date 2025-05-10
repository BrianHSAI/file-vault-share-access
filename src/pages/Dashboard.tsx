
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import FileCard from "@/components/FileCard";
import { Upload, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { files, currentUser, deleteFile, syncData, userCount } = useFiles();

  // Filter files by current user
  const userFiles = files.filter(file => file.ownerId === currentUser?.id);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    // We'll only sync data once when the component mounts, not on every render
    // or when syncData changes (which causes the infinite loop)
    syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]); // Remove syncData from the dependency array

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
  };

  const handleSync = () => {
    try {
      syncData();
      toast.success("Data synkroniseret!");
    } catch (error) {
      toast.error("Synkronisering mislykkedes");
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mine Filer</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Users className="h-4 w-4" />
              <span>{userCount} registrerede brugere</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleSync}
            >
              <RefreshCw className="h-4 w-4" />
              Synkroniser
            </Button>
            <Button 
              onClick={() => navigate("/upload")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Fil
            </Button>
          </div>
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
