
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiles } from "@/context/FileContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithProvider, syncData } = useFiles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Venligst udfyld både email og adgangskode");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Log ind succesfuld!");
        navigate("/dashboard");
      } else {
        toast.error("Forkert email eller adgangskode");
      }
    } catch (error) {
      toast.error("Der opstod en fejl. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate Google login with mock data
      // In real app, this would use the Google OAuth API
      const mockGoogleUser = {
        id: `google-${Date.now()}`,
        email: `user-${Date.now()}@gmail.com`
      };
      
      const success = await loginWithProvider("google", mockGoogleUser);
      if (success) {
        toast.success("Log ind med Google succesfuld!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Der opstod en fejl ved login med Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate Microsoft login with mock data
      // In real app, this would use the Microsoft OAuth API
      const mockMicrosoftUser = {
        id: `microsoft-${Date.now()}`,
        email: `user-${Date.now()}@outlook.com`
      };
      
      const success = await loginWithProvider("microsoft", mockMicrosoftUser);
      if (success) {
        toast.success("Log ind med Microsoft succesfuld!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Der opstod en fejl ved login med Microsoft.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    try {
      syncData();
      toast.success("Data synkroniseret!");
    } catch (error) {
      toast.error("Synkronisering mislykkedes");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Log Ind</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full bg-white text-black border hover:bg-gray-100"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Log ind med Google
              </Button>
              <Button 
                onClick={handleMicrosoftLogin} 
                className="w-full bg-white text-black border hover:bg-gray-100"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#00a4ef" d="M1 13h10v10H1z" />
                  <path fill="#7fba00" d="M13 1h10v10H13z" />
                  <path fill="#ffb900" d="M13 13h10v10H13z" />
                </svg>
                Log ind med Microsoft
              </Button>
            </div>
            
            <div className="flex items-center">
              <Separator className="flex-grow" />
              <span className="px-3 text-sm text-gray-500">Eller</span>
              <Separator className="flex-grow" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="password">Adgangskode</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                disabled={isLoading}
              >
                {isLoading ? "Logger ind..." : "Log ind"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-center justify-center w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Synkroniser data
              </Button>
            </div>
            <p className="text-center text-sm">
              Har du ikke en konto?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Opret konto
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
