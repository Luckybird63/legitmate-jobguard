export type JobInput = {
  title: string;
  company: string;
  location?: string;
  department?: string;
  description: string;
};

export type PredictionResult = {
  result: "Legit" | "Fake";
  confidence: number; // 0..1
  keywords: string[];
  // Optional scraped or provided details
  title?: string;
  company?: string;
  location?: string;
  department?: string;
  description?: string;
  riskFactors?: string[];
  trustworthyIndicators?: string[];
  analysisComment?: string;
};

const STORAGE_KEY = "legitmate_api_base";

export const getApiBase = () => {
  try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
};

export const setApiBase = (val: string) => {
  try {
    if (val) localStorage.setItem(STORAGE_KEY, val);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

const suspiciousTerms = [
  "no experience", "immediate joining", "urgent", "quick money", "bitcoin",
  "wire transfer", "training fee", "crypto", "social security", "gift card",
  "work from home kit", "pay to apply", "bank details", "upfront fee",
  "limited seats", "act now", "easy income", "no interview", "telegram",
];

const computeRisk = (text: string) => {
  const t = text.toLowerCase();
  const hits = suspiciousTerms.filter(k => t.includes(k));
  let score = hits.length / Math.max(6, suspiciousTerms.length / 3);
  if (/\$\s?\d{3,}/.test(t)) score += 0.1; // money amounts
  if (/(immediately|today|now)/.test(t)) score += 0.05;
  score = Math.max(0, Math.min(1, score));
  const confidence = 0.5 + score * 0.49; // 0.5..0.99
  const result: PredictionResult["result"] = score > 0.35 ? "Fake" : "Legit";
  return { result, confidence, keywords: hits } as PredictionResult;
};

export const mockPredict = async (job: JobInput): Promise<PredictionResult> => {
  await new Promise(r => setTimeout(r, 650));
  return computeRisk(`${job.title} ${job.company} ${job.location} ${job.department} ${job.description}`);
};

export const predict = async (job: JobInput): Promise<PredictionResult> => {
  const base = getApiBase();
  
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Custom API failed:', e);
    }
  }
  
  // Use built-in Supabase edge function
  try {
    const res = await fetch(`https://cilgwgzengkdgerdztdx.supabase.co/functions/v1/predict`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbGd3Z3plbmdrZGdlcmR6dGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjI5NjgsImV4cCI6MjA3MDczODk2OH0.EA-ZvV2NLo3Whnge3dI1wDzmmB1qNVvEZOXldRChx1w`
      },
      body: JSON.stringify({ job }),
    });
    if (res.ok) {
      const result = await res.json();
      // Convert to match our interface
      return {
        result: result.result === 'legit' ? 'Legit' : 'Fake',
        confidence: result.confidence / 100, // Convert percentage to 0-1
        keywords: result.keywords || [],
        title: result.title,
        company: result.company,
        location: result.location,
        description: result.description,
        riskFactors: result.riskFactors,
        trustworthyIndicators: result.trustworthyIndicators,
        analysisComment: result.analysisComment
      };
    }
  } catch (e) {
    console.error('Built-in service failed:', e);
  }
  
  return mockPredict(job);
};

export const predictFromLink = async (url: string): Promise<PredictionResult> => {
  const base = getApiBase();
  
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/predict-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Custom API failed:', e);
    }
  }
  
  // Use built-in Supabase edge function
  try {
    const res = await fetch(`https://cilgwgzengkdgerdztdx.supabase.co/functions/v1/predict-link`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbGd3Z3plbmdrZGdlcmR6dGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjI5NjgsImV4cCI6MjA3MDczODk2OH0.EA-ZvV2NLo3Whnge3dI1wDzmmB1qNVvEZOXldRChx1w`
      },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const result = await res.json();
      // Convert to match our interface
      return {
        result: result.result === 'legit' ? 'Legit' : 'Fake',
        confidence: result.confidence / 100, // Convert percentage to 0-1
        keywords: result.keywords || [],
        title: result.title,
        company: result.company,
        location: result.location,
        description: result.description,
        riskFactors: result.riskFactors,
        trustworthyIndicators: result.trustworthyIndicators,
        analysisComment: result.analysisComment
      };
    }
  } catch (e) {
    console.error('Built-in service failed:', e);
  }
  
  // Fallback to mock
  await new Promise((r) => setTimeout(r, 500));
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  const mock = computeRisk(url);
  return { ...mock, title: `Job from ${host || "link"}`, description: url };
};

export const predictBulk = async (file: File): Promise<PredictionResult[]> => {
  const base = getApiBase();
  if (!base) throw new Error("Set API Base URL to use bulk predictions");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base.replace(/\/$/, "")}/predict-bulk`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};
