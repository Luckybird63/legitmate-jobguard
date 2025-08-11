import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PredictionResult } from "@/services/predictService";

const ResultCard = ({ result }: { result: PredictionResult | null }) => {
  if (!result) return null;

  const legit = result.result.toLowerCase() === "legit";

  return (
    <section className="container mx-auto px-6 md:px-8 py-8">
      <Card className="transition-transform will-change-transform hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Result</CardTitle>
          <Badge variant={legit ? "secondary" : "destructive"}>
            {legit ? "Legit" : "Fake"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <Progress value={Math.round(result.confidence * 100)} />
            <div className="text-sm">{(result.confidence * 100).toFixed(1)}%</div>
          </div>

          {result.keywords?.length ? (
            <div className="grid gap-2">
              <span className="text-sm text-muted-foreground">Risk indicators</span>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((k) => (
                  <Badge key={k} variant="outline">{k}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};

export default ResultCard;
