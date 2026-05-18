import { Code, Zap, Key, BookOpen, GitBranch, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const endpoints = [
  { method: "GET", path: "/v1/videos", description: "Retrieve a paginated list of public videos with filters for category, sort, and duration." },
  { method: "GET", path: "/v1/videos/:id", description: "Fetch metadata for a single video including title, description, views, and channel info." },
  { method: "GET", path: "/v1/channels/:id", description: "Get channel details including subscriber count, bio, and verification status." },
  { method: "GET", path: "/v1/search", description: "Search videos and channels by keyword with optional filters." },
  { method: "POST", path: "/v1/videos", description: "Upload a new video. Requires OAuth with upload scope. Supports chunked upload for large files." },
  { method: "GET", path: "/v1/users/me", description: "Retrieve the authenticated user's profile, preferences, and subscription list." },
];

const methodColor: Record<string, string> = {
  GET: "bg-green-500/10 text-green-600 dark:text-green-400",
  POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PATCH: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const features = [
  { icon: Zap, title: "Fast & Reliable", description: "Our API is served from globally distributed edge nodes with 99.9% uptime SLA." },
  { icon: Key, title: "Secure Auth", description: "OAuth 2.0 with scoped tokens. API keys for read-only access without user context." },
  { icon: GitBranch, title: "Versioned API", description: "Stable versioned endpoints — we never break existing integrations without notice." },
  { icon: Globe, title: "Global CDN", description: "Video delivery through our CDN with low-latency playback in 190+ countries." },
];

export default function Developers() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Developer Platform</h1>
        <p className="text-muted-foreground">
          Build apps, tools, and integrations on top of CineWeave using our REST API and SDKs.
        </p>
        <div className="flex gap-3 mt-4">
          <Button data-testid="button-get-api-key">Get API Key</Button>
          <Button variant="outline" data-testid="button-api-docs">
            <BookOpen className="h-4 w-4 mr-2" />
            Full Documentation
          </Button>
        </div>
      </div>

      {/* Platform features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Getting started */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Start</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">Make your first API call — no auth required for public data:</p>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto">
{`curl https://api.cineweave.com/v1/videos \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -G -d "category=gaming&limit=10"`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Rate limits */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Rate Limits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary mb-1">10,000</div>
              <div className="text-sm font-medium">Free tier</div>
              <div className="text-xs text-muted-foreground">requests / day</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary mb-1">100,000</div>
              <div className="text-sm font-medium">Pro tier</div>
              <div className="text-xs text-muted-foreground">requests / day</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary mb-1">Unlimited</div>
              <div className="text-sm font-medium">Enterprise</div>
              <div className="text-xs text-muted-foreground">custom SLA</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Reference */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Code className="h-5 w-5" /> API Reference
        </h2>
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <Card key={ep.path} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <Badge className={`font-mono text-xs mt-0.5 flex-shrink-0 ${methodColor[ep.method]}`} variant="outline">
                  {ep.method}
                </Badge>
                <div>
                  <code className="text-sm font-mono text-foreground">{ep.path}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>Developer support: <strong className="text-foreground">developers@cineweave.com</strong></p>
        <p className="mt-1">Status page · Changelog · API Changelog · SDKs (Python, JS, Go)</p>
      </div>
    </div>
  );
}
