
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFiles } from "@/context/FileContext";
import FileCard from "@/components/FileCard";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { upload } from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { files, deleteFile, currentUser } = useFiles();

  // Get user's files
  const userFiles = files.filter(file => file.ownerId === currentUser?.id);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleDelete = (id: string) => {
    deleteFile(id);
    toast.success("Filen er slettet");
  };

  const handleViewFile = (id: string) => {
    navigate(`/file/${id}`);
  };

  const handleUpload = () => {
    // Check if user has reached the file limit (15)
    if (userFiles.length >= 15) {
      toast.error("Du har nået din filgrænse. Køb flere filer for at fortsætte.");
      return;
    }
    navigate("/upload");
  };

  const handleBuyMoreFiles = () => {
    toast.info("Køb flere filer funktionalitet er ikke implementeret endnu.");
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mine Filer</h1>
            <p className="text-slate-500 mt-1">
              {userFiles.length} / 15 filer brugt
            </p>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Button 
              onClick={handleUpload}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <upload size={16} />
              Upload Fil
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBuyMoreFiles}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Køb Flere Filer
            </Button>
          </div>
        </div>

        {userFiles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-slate-700">Ingen filer endnu</h2>
            <p className="text-slate-500 mt-2">Upload din første fil for at komme i gang</p>
            <Button 
              onClick={handleUpload} 
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Upload nu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleDelete}
                onView={handleViewFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
