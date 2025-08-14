import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function mockPredictFromUrl(url: string): PredictionResult {
  // Extract domain and basic analysis
  const domain = new URL(url).hostname.toLowerCase();
  
  const legitimateDomains = [
    'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
    'ziprecruiter.com', 'careerbuilder.com', 'simplyhired.com'
  ];
  
  const suspiciousDomains = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co'
  ];
  
  let confidence = 75;
  let isLegit = true;
  const riskFactors: string[] = [];
  const trustworthyIndicators: string[] = [];
  let analysisComment = "";
  
  // Check domain reputation
  if (legitimateDomains.some(d => domain.includes(d))) {
    confidence = 90;
    trustworthyIndicators.push("Posted on reputable job board");
    analysisComment = "Job posted on a well-known, legitimate job platform.";
  } else if (suspiciousDomains.some(d => domain.includes(d))) {
    confidence = 85;
    isLegit = false;
    riskFactors.push("Shortened URL - potential redirect");
    analysisComment = "Warning: Shortened URL detected. This could redirect to a malicious site.";
  } else if (domain.includes('craigslist')) {
    confidence = 60;
    riskFactors.push("Posted on platform with mixed reputation");
    analysisComment = "Posted on Craigslist - exercise extra caution and verify independently.";
  } else {
    confidence = 70;
    analysisComment = "Unknown domain - please verify the legitimacy of this job posting independently.";
  }
  
  // Additional URL-based checks
  if (url.includes('?ref=') || url.includes('affiliate')) {
    riskFactors.push("Contains affiliate/referral parameters");
    confidence -= 10;
  }
  
  if (url.length > 200) {
    riskFactors.push("Unusually long URL");
    confidence -= 5;
  }
  
  return {
    result: isLegit ? 'legit' : 'fake',
    confidence: Math.max(45, Math.min(95, confidence)),
    keywords: [`Domain: ${domain}`],
    title: "Job posting from URL",
    company: domain,
    location: "Not specified",
    description: `Analysis based on URL: ${url}`,
    riskFactors,
    trustworthyIndicators,
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

    const { url, apiKey } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform prediction
    const prediction = mockPredictFromUrl(url);
    
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
        job_title: prediction.title || 'URL Analysis',
        company: prediction.company,
        location: prediction.location,
        description: prediction.description,
        job_url: url,
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
    console.error('Error in predict-link function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});