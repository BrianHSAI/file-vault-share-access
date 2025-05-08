
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFiles } from "@/context/FileContext";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useFiles();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>Eksfiler</h1>
      </div>
      <div className="flex gap-4">
        {currentUser ? (
          <>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/upload")}>
              Upload Fil
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Log Out
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button variant="ghost" onClick={() => navigate("/access")}>
              Få Adgang til Filer
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
