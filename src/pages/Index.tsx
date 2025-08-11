import { useState } from "react";
import Hero from "@/components/legitmate/Hero";
import JobForm from "@/components/legitmate/JobForm";
import LinkForm from "@/components/legitmate/LinkForm";
import ResultCard from "@/components/legitmate/ResultCard";
import { PredictionResult } from "@/services/predictService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);

  return (
    <main>
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
