import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/legitmate/Hero";
import JobForm from "@/components/legitmate/JobForm";
import LinkForm from "@/components/legitmate/LinkForm";
import ResultCard from "@/components/legitmate/ResultCard";
import { PredictionResult } from "@/services/predictService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, User, LogIn } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { user } = useAuth();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  LegitMate
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Job Scam Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <Hero />
      
      <Tabs defaultValue="link" className="w-full">
        <div className="container mx-auto px-6 md:px-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="link">Paste Link</TabsTrigger>
            <TabsTrigger value="details">Paste Details</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="link">
          <LinkForm onResult={setResult} />
        </TabsContent>
        <TabsContent value="details">
          <JobForm onResult={setResult} />
        </TabsContent>
      </Tabs>
      
      <ResultCard result={result} />
    </main>
  );
};

export default Index;
