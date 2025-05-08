
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useFiles();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-12">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Sikker Fildeling med Adgangskoder
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload dine filer og del dem sikkert med unikke adgangskoder. 
            Modtagere kan få adgang til filerne uden at downloade dem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {currentUser ? (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                onClick={() => navigate("/dashboard")}
              >
                Gå til Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                  onClick={() => navigate("/login")}
                >
                  Log Ind
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
                  onClick={() => navigate("/access")}
                >
                  Få Adgang til Filer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-slate-800 text-slate-300 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 Eksfiler. Alle rettigheder forbeholdes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
