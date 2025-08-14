import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobInput {
  title: string;
  company?: string;
  location?: string;
  department?: string;
  description: string;
}

interface PredictionResult {
  result: 'legit' | 'fake';
  confidence: number;
  keywords: string[];
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  riskFactors: string[];
  trustworthyIndicators: string[];
  analysisComment: string;
}

const SUSPICIOUS_KEYWORDS = [
  'urgent', 'immediate start', 'no experience', 'work from home', 'easy money',
  'guaranteed income', 'act now', 'limited time', 'investment required',
  'pay upfront', 'training fee', 'processing fee', 'background check fee',
  'equipment fee', 'certification cost', 'click here', 'amazing opportunity',
  'financial freedom', 'make money fast', 'passive income', 'pyramid',
  'multi-level marketing', 'mlm', 'crypto', 'bitcoin', 'forex trading'
];

const TRUSTWORTHY_INDICATORS = [
  'company website', 'established company', 'benefits package', 'healthcare',
  'retirement plan', 'professional development', 'career growth', 'team environment',
  'equal opportunity', 'detailed job description', 'specific requirements',
  'industry experience', 'education required', 'certifications', 'skills needed'
];

function computeRisk(input: JobInput): PredictionResult {
  const text = `${input.title} ${input.company} ${input.description}`.toLowerCase();
  
  let suspiciousScore = 0;
  let trustworthyScore = 0;
  const foundSuspicious: string[] = [];
  const foundTrustworthy: string[] = [];
  
  // Check for suspicious keywords
  SUSPICIOUS_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      suspiciousScore += 1;
      foundSuspicious.push(keyword);
    }
  });
  
  // Check for trustworthy indicators
  TRUSTWORTHY_INDICATORS.forEach(indicator => {
    if (text.includes(indicator.toLowerCase())) {
      trustworthyScore += 0.5;
      foundTrustworthy.push(indicator);
    }
  });
  
  // Additional risk factors
  const riskFactors: string[] = [];
  const trustworthyIndicators: string[] = [];
  
  // Check for vague descriptions
  if (input.description.length < 100) {
    suspiciousScore += 2;
    riskFactors.push("Very short job description");
  }
  
  // Check for missing company info
  if (!input.company || input.company.trim().length === 0) {
    suspiciousScore += 1.5;
    riskFactors.push("No company name provided");
  }
  
  // Check for unrealistic promises
  if (text.includes('$') && (text.includes('week') || text.includes('day'))) {
    suspiciousScore += 1;
    riskFactors.push("Promises of high daily/weekly earnings");
  }
  
  // Positive indicators
  if (input.description.length > 300) {
    trustworthyScore += 1;
    trustworthyIndicators.push("Detailed job description");
  }
  
  if (input.company && input.company.length > 0) {
    trustworthyScore += 0.5;
    trustworthyIndicators.push("Company name provided");
  }
  
  // Calculate final score
  const totalScore = suspiciousScore - trustworthyScore;
  const confidence = Math.min(Math.max((Math.abs(totalScore) / 10) * 100, 45), 95);
  const isLegit = totalScore <= 1.5;
  
  // Generate analysis comment
  let analysisComment = "";
  if (isLegit) {
    analysisComment = foundTrustworthy.length > 0 
      ? `This appears to be a legitimate opportunity with ${foundTrustworthy.length} positive indicators.`
      : "This posting shows standard characteristics of legitimate job opportunities.";
  } else {
    analysisComment = foundSuspicious.length > 0
      ? `Warning: Contains ${foundSuspicious.length} suspicious elements commonly found in fake job postings.`
      : "This posting exhibits several red flags typical of fraudulent job opportunities.";
  }
  
  return {
    result: isLegit ? 'legit' : 'fake',
    confidence: Math.round(confidence),
    keywords: [...foundSuspicious, ...foundTrustworthy],
    title: input.title,
    company: input.company,
    location: input.location,
    description: input.description,
    riskFactors: riskFactors,
    trustworthyIndicators: trustworthyIndicators,
    analysisComment
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { job, apiKey } = await req.json();
    
    if (!job || !job.title || !job.description) {
      return new Response(
        JSON.stringify({ error: 'Missing required job fields: title and description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform prediction
    const prediction = computeRisk(job);
    
    // Get user ID if API key is provided
    let userId = null;
    if (apiKey) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('api_key', apiKey)
        .single();
      
      if (profile) {
        userId = profile.user_id;
      }
    }

    // Store prediction in database
    const { error: insertError } = await supabaseClient
      .from('job_predictions')
      .insert({
        user_id: userId,
        job_title: job.title,
        company: job.company,
        location: job.location,
        department: job.department,
        description: job.description,
        prediction_result: prediction.result,
        confidence_score: prediction.confidence,
        risk_factors: prediction.riskFactors,
        trustworthy_indicators: prediction.trustworthyIndicators,
        analysis_comment: prediction.analysisComment
      });

    if (insertError) {
      console.error('Error storing prediction:', insertError);
    }

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});