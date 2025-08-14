import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, Copy, Eye, AlertTriangle, CheckCircle, Clock, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import JobForm from '@/components/legitmate/JobForm';
import LinkForm from '@/components/legitmate/LinkForm';
import ResultCard from '@/components/legitmate/ResultCard';
import { PredictionResult } from '@/services/predictService';

interface JobPrediction {
  id: string;
  job_title: string;
  company?: string;
  prediction_result: string;
  confidence_score: number;
  analysis_comment?: string;
  created_at: string;
}

interface Profile {
  full_name?: string;
  email?: string;
  api_key?: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [predictions, setPredictions] = useState<JobPrediction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      setProfile(profileData);

      // Fetch user predictions
      const { data: predictionsData } = await supabase
        .from('job_predictions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setPredictions(predictionsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const copyApiKey = () => {
    if (profile?.api_key) {
      navigator.clipboard.writeText(profile.api_key);
      toast({
        title: "API Key Copied",
        description: "Your API key has been copied to clipboard.",
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const legitCount = predictions.filter(p => p.prediction_result === 'legit').length;
  const fakeCount = predictions.filter(p => p.prediction_result === 'fake').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.05),transparent)]" />
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    LegitMate Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {profile?.full_name || user?.email}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="mt-8">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Analysis</CardTitle>
                    <CardDescription>
                      Analyze job postings to detect potential scams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="link" className="w-full">
                      <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="link">Paste Link</TabsTrigger>
                        <TabsTrigger value="details">Paste Details</TabsTrigger>
                      </TabsList>
                      <TabsContent value="link">
                        <LinkForm onResult={setResult} />
                      </TabsContent>
                      <TabsContent value="details">
                        <JobForm onResult={setResult} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
                
                <ResultCard result={result} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>
                    Your recent job posting analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {predictions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No analyses yet. Start by analyzing your first job posting!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {predictions.map((prediction) => (
                        <div key={prediction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{prediction.job_title}</h3>
                            {prediction.company && (
                              <p className="text-sm text-muted-foreground">{prediction.company}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(prediction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">{prediction.confidence_score}% confidence</p>
                              {prediction.analysis_comment && (
                                <p className="text-xs text-muted-foreground max-w-xs truncate">
                                  {prediction.analysis_comment}
                                </p>
                              )}
                            </div>
                            <Badge variant={prediction.prediction_result === 'legit' ? 'default' : 'destructive'}>
                              {prediction.prediction_result === 'legit' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Legit</>
                              ) : (
                                <><AlertTriangle className="h-3 w-3 mr-1" /> Fake</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>API Integration</CardTitle>
                  <CardDescription>
                    Integrate LegitMate into your applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4" />
                      Your API Key
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        value={profile?.api_key || ''} 
                        readOnly 
                        className="font-mono"
                      />
                      <Button variant="outline" onClick={copyApiKey} className="gap-2">
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">API Endpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-muted/50 rounded border">
                        <code>POST /api/predict</code> - Analyze job details
                      </div>
                      <div className="p-3 bg-muted/50 rounded border">
                        <code>POST /api/predict-link</code> - Analyze job from URL
                      </div>
                      <div className="p-3 bg-muted/50 rounded border">
                        <code>POST /api/predict-bulk</code> - Batch analysis
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="mt-8">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{legitCount}</p>
                        <p className="text-sm text-muted-foreground">Legitimate Jobs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">{fakeCount}</p>
                        <p className="text-sm text-muted-foreground">Fake Jobs Detected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Eye className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{predictions.length}</p>
                        <p className="text-sm text-muted-foreground">Total Analyses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;