import { useState } from "react";
import Hero from "@/components/legitmate/Hero";
import JobForm from "@/components/legitmate/JobForm";
import ResultCard from "@/components/legitmate/ResultCard";
import { PredictionResult } from "@/services/predictService";

const Index = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);

  return (
    <main>
      <Hero />
      <JobForm onResult={setResult} />
      <ResultCard result={result} />
    </main>
  );
};

export default Index;
