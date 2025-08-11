import heroImage from "@/assets/hero-legitmate.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const scrollToForm = () => {
    const el = document.getElementById("job-checker");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Abstract AI data waves for LegitMate job fraud detection"
          className="w-full h-[48vh] md:h-[64vh] object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background)/0.2)] via-[hsl(var(--background)/0.6)] to-[hsl(var(--background))]" />
      </div>

      <div className="relative container mx-auto px-6 md:px-8 py-20 md:py-28 flex flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground bg-[hsl(var(--card))]/70 backdrop-blur">
          AI-powered safety for job seekers
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
          LegitMate: Fake Job Posting Detector
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground">
          Paste a job description or upload data. We’ll analyze risks and flag suspicious patterns with an AI model.
        </p>
        <div className="mt-8">
          <Button variant="default" size="lg" onClick={scrollToForm} className="animate-[float_6s_ease-in-out_infinite]">
            Check a Job Post
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
