import { PredictionResult } from "@/services/predictService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Shield, Eye, TrendingUp } from "lucide-react";

const ResultCard = ({ result }: { result: PredictionResult | null }) => {
  if (!result) return null;

  const isLegit = result.result === "Legit";
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="container mx-auto px-6 md:px-8 pb-12">
      <Card className="mx-auto max-w-4xl shadow-[var(--shadow-elevated)] border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isLegit ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                {isLegit ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">Analysis Complete</CardTitle>
                <CardDescription>AI-powered job posting verification</CardDescription>
              </div>
            </div>
            <Badge 
              variant={isLegit ? "default" : "destructive"} 
              className="text-sm px-3 py-1 font-medium"
            >
              {result.result}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Confidence Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Confidence Score</span>
              </div>
              <span className="text-lg font-bold text-primary">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {confidencePercent >= 80 ? "High confidence in this assessment" : 
               confidencePercent >= 60 ? "Moderate confidence in this assessment" : 
               "Low confidence - exercise caution"}
            </p>
          </div>

          {/* Analysis Comment */}
          {result.analysisComment && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">Analysis Summary</h3>
                  <p className="text-sm text-muted-foreground">{result.analysisComment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
          {(result.title || result.company || result.location) && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Job Details
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {result.title && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Title</h4>
                    <p className="text-sm mt-1">{result.title}</p>
                  </div>
                )}
                {result.company && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Company</h4>
                    <p className="text-sm mt-1">{result.company}</p>
                  </div>
                )}
                {result.location && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                    <p className="text-sm mt-1">{result.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords */}
          {result.keywords && result.keywords.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Detected Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultCard;