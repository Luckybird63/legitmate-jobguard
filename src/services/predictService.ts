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
  if (!base) return mockPredict(job);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return mockPredict(job);
  }
};

export const predictFromLink = async (url: string): Promise<PredictionResult> => {
  const base = getApiBase();
  if (!base) {
    await new Promise((r) => setTimeout(r, 500));
    let host = "";
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    const mock = computeRisk(url);
    return { ...mock, title: `Job from ${host || "link"}`, description: url };
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/predict-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    let host = "";
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    const fallback = computeRisk(url);
    return { ...fallback, title: `Job from ${host || "link"}`, description: url };
  }
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
