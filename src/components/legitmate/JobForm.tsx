import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { predict, PredictionResult, setApiBase, getApiBase, predictBulk } from "@/services/predictService";
import { useState } from "react";

export type JobFormValues = {
  title: string;
  company: string;
  location?: string;
  department?: string;
  description: string;
  apiBase?: string;
  file?: FileList;
};

const JobForm = ({ onResult }: { onResult: (r: PredictionResult) => void }) => {
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch } = useForm<JobFormValues>({
    defaultValues: {
      title: "",
      company: "",
      location: "",
      department: "",
      description: "",
      apiBase: getApiBase() || "",
    }
  });

  const [bulkLoading, setBulkLoading] = useState(false);

  const onSubmit = async (values: JobFormValues) => {
    try {
      if (values.apiBase !== undefined) setApiBase(values.apiBase.trim());

      const result = await predict({
        title: values.title,
        company: values.company,
        location: values.location,
        department: values.department,
        description: values.description,
      });
      onResult(result);
      toast({ title: `Prediction: ${result.result}`, description: `Confidence: ${(result.confidence * 100).toFixed(1)}%` });
    } catch (e: any) {
      toast({ title: "Prediction failed", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  const fileList = watch("file");

  const handleBulk = async () => {
    if (!fileList || fileList.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await predictBulk(fileList[0]);
      toast({ title: `Bulk predictions: ${res.length}`, description: "First result shown below." });
      onResult(res[0]);
    } catch (e: any) {
      toast({ title: "Bulk prediction failed", description: e?.message || "Ensure API base is set and supports /predict-bulk", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <section id="job-checker" className="container mx-auto px-6 md:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Check a Job Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" placeholder="Software Engineer" {...register("title", { required: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Acme Corp" {...register("company", { required: true })} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Remote" {...register("location")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Engineering" {...register("department")} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Paste full job details here..." className="min-h-36" {...register("description", { required: true })} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div className="grid gap-2">
                <Label htmlFor="apiBase">API Base URL (optional)</Label>
                <Input id="apiBase" placeholder="http://localhost:5000" {...register("apiBase")} />
                <p className="text-sm text-muted-foreground">Leave empty to use the built-in mock predictor.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">Bulk upload (CSV/JSON)</Label>
                <Input id="file" type="file" accept=".csv,.json" {...register("file")} />
                <Button type="button" variant="secondary" onClick={handleBulk} disabled={bulkLoading || !fileList?.length}>
                  {bulkLoading ? "Analyzing..." : "Predict Bulk"}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Analyzing..." : "Analyze"}</Button>
              <Button type="button" variant="ghost" onClick={() => reset()}>Clear</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default JobForm;
