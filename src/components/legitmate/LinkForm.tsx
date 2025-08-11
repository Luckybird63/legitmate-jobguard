import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { predictFromLink, PredictionResult, setApiBase, getApiBase } from "@/services/predictService";

type LinkFormValues = {
  url: string;
  apiBase?: string;
};

const LinkForm = ({ onResult }: { onResult: (r: PredictionResult) => void }) => {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<LinkFormValues>({
    defaultValues: {
      url: "",
      apiBase: getApiBase() || "",
    },
  });

  const onSubmit = async (values: LinkFormValues) => {
    try {
      if (values.apiBase !== undefined) setApiBase(values.apiBase.trim());
      const res = await predictFromLink(values.url.trim());
      onResult(res);
      toast({ title: `Prediction: ${res.result}`, description: `Confidence: ${(res.confidence * 100).toFixed(1)}%` });
    } catch (e: any) {
      toast({ title: "Prediction failed", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <section id="job-link-checker" className="container mx-auto px-6 md:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Check via Link</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="url">Job/Internship URL</Label>
              <Input id="url" type="url" placeholder="https://www.linkedin.com/jobs/view/..." {...register("url", { required: true })} />
              <p className="text-sm text-muted-foreground">Paste a job posting link (LinkedIn, Internshala, Indeed, etc.)</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div className="grid gap-2">
                <Label htmlFor="apiBase">API Base URL (optional)</Label>
                <Input id="apiBase" placeholder="http://localhost:5000" {...register("apiBase")} />
                <p className="text-sm text-muted-foreground">Leave empty to use the built-in mock predictor.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Analyzing..." : "Analyze Link"}</Button>
              <Button type="button" variant="ghost" onClick={() => reset()}>Clear</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default LinkForm;
