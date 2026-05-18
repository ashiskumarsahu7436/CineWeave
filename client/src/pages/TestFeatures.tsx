import { FlaskConical, Zap, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const experiments = [
  {
    id: "ambient-mode",
    name: "Ambient Mode",
    status: "Beta",
    description: "Extends the video's colors into the page background while watching, creating an immersive viewing experience similar to a bias light setup.",
    enrolled: false,
  },
  {
    id: "smart-chapters",
    name: "Smart Chapters",
    status: "Beta",
    description: "Automatically detects scene changes and topic shifts in videos to create chapters, even when creators haven't manually added them.",
    enrolled: false,
  },
  {
    id: "live-transcripts",
    name: "Live Transcripts",
    status: "Alpha",
    description: "Real-time AI-generated transcripts that appear alongside video playback. Searchable and downloadable after the stream ends.",
    enrolled: false,
  },
  {
    id: "ai-summaries",
    name: "AI Video Summaries",
    status: "Alpha",
    description: "Get a 3-sentence AI summary of any video before you watch, so you can decide if it's worth your time.",
    enrolled: false,
  },
  {
    id: "creator-insights",
    name: "Creator Insights Overlay",
    status: "Beta",
    description: "Shows lightweight stats (views, likes, upload date) as a subtle overlay on video thumbnails while browsing.",
    enrolled: false,
  },
  {
    id: "focus-mode",
    name: "Focus Mode",
    status: "Experimental",
    description: "Hides all UI elements except the video player and playback controls. No comments, no sidebar, no distractions.",
    enrolled: false,
  },
];

const statusColor: Record<string, string> = {
  Beta: "bg-primary/10 text-primary",
  Alpha: "bg-orange-500/10 text-orange-500",
  Experimental: "bg-purple-500/10 text-purple-500",
};

export default function TestFeatures() {
  const { toast } = useToast();
  const [states, setStates] = useState<Record<string, boolean>>({});

  const toggle = (id: string, name: string) => {
    const next = !states[id];
    setStates((prev) => ({ ...prev, [id]: next }));
    toast({ title: next ? `${name} enabled` : `${name} disabled`, description: next ? "Feature is now active. Refresh if needed." : "Feature turned off." });
  };

  const enrolledCount = Object.values(states).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Test New Features</h1>
          </div>
          <p className="text-muted-foreground">
            Try experimental features before they roll out to everyone. Your feedback helps us improve.
          </p>
        </div>
        {enrolledCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">{enrolledCount} active experiment{enrolledCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Beta program info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">CineWeave Beta Program</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Beta members get early access to all experiments and can submit direct feedback to our product team.
            </p>
          </div>
          <Button className="flex-shrink-0" data-testid="button-join-beta">
            Join Beta Program <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Experiments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Experiments</h2>
          <span className="text-sm text-muted-foreground">{experiments.length} experiments</span>
        </div>
        <div className="space-y-3">
          {experiments.map((exp) => (
            <Card key={exp.id} className={states[exp.id] ? "border-primary/40" : ""}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{exp.name}</h3>
                    <Badge className={`text-xs ${statusColor[exp.status]}`} variant="outline">
                      {exp.status}
                    </Badge>
                    {states[exp.id] && (
                      <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400" variant="outline">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                </div>
                <Switch
                  checked={!!states[exp.id]}
                  onCheckedChange={() => toggle(exp.id, exp.name)}
                  data-testid={`switch-experiment-${exp.id}`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t pt-6">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
          <p>
            Experimental features may be unstable, change without notice, or be discontinued at any time. Some experiments require a page refresh to take effect. Your feedback is invaluable — use the <a href="/feedback" className="text-primary hover:underline">feedback form</a> to share thoughts on any experiment.
          </p>
        </div>
      </div>
    </div>
  );
}
