import { Upload, DollarSign, BarChart2, Users, Star, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const benefits = [
  { icon: Upload, title: "Powerful Upload Tools", description: "Upload videos in any format up to 12GB, with automatic transcoding to HD and 4K. Schedule posts, set visibility, and manage thumbnails with ease." },
  { icon: DollarSign, title: "Monetization Programs", description: "Earn from ads, channel memberships, Super Thanks, and merchandise integration. Creators can start monetizing from day one with our Partner Program." },
  { icon: BarChart2, title: "Deep Analytics", description: "Understand your audience with detailed analytics: watch time, retention curves, traffic sources, demographics, and revenue breakdowns." },
  { icon: Users, title: "Community Building", description: "Engage your subscribers with posts, polls, and live streams. Spaces lets your fans organize around your content on their own." },
];

const steps = [
  { number: "01", title: "Create your account", description: "Sign up for free and set up your channel in minutes." },
  { number: "02", title: "Upload your first video", description: "Use our simple uploader with support for all major formats." },
  { number: "03", title: "Grow your audience", description: "Publish consistently and use our SEO tools to get discovered." },
  { number: "04", title: "Start earning", description: "Apply for monetization once you reach eligibility thresholds." },
];

const eligibility = [
  "At least 1,000 subscribers on your channel",
  "Minimum 4,000 watch hours in the past 12 months",
  "No active Community Guideline strikes",
  "Linked AdSense account in good standing",
  "Located in an eligible country or territory",
];

export default function Creators() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Create on CineWeave</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Share your passion with the world. Build a community. Earn doing what you love.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/studio">
            <Button size="lg" data-testid="button-open-studio">Open Studio</Button>
          </Link>
          <Button size="lg" variant="outline" data-testid="button-creator-guide">Creator Guide</Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Everything you need to succeed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.title}>
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How to start */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">How to get started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.number} className="space-y-2">
              <div className="text-4xl font-bold text-primary/30">{s.number}</div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization eligibility */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Monetization Eligibility</h2>
        <p className="text-muted-foreground">To join the CineWeave Partner Program and start earning, you need to meet the following criteria:</p>
        <div className="space-y-2">
          {eligibility.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
        <Button className="mt-2" data-testid="button-apply-partner">Apply for Partner Program</Button>
      </div>

      {/* Creator Resources */}
      <div className="border-t pt-8 space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Creator Resources</p>
        <p>Creator Academy · Help Center · Creator Forum · Creator Insider Newsletter</p>
        <p>Contact for Creator Support: creators@cineweave.com</p>
      </div>
    </div>
  );
}
