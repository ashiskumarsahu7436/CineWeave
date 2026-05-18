import { Play, Search, Star, Users, Zap, Shield, Bell, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Discovery",
    description: "When you open CineWeave, our recommendation system analyzes your watch history, subscriptions, and engagement patterns to surface videos you're most likely to enjoy. The more you use the platform, the more accurate it becomes.",
  },
  {
    icon: Star,
    title: "Personal Mode",
    description: "Turn on Personal Mode to see only content from channels you subscribe to. No algorithmic surprises — just the creators you've chosen to follow. Perfect for when you want control over what appears in your feed.",
  },
  {
    icon: Users,
    title: "Spaces",
    description: "Spaces let you group channels into custom collections. Create a 'Tech' space, a 'Cooking' space, or any category you like. Switch between Spaces to see a curated feed from just those channels.",
  },
  {
    icon: Shield,
    title: "Channel Blocking",
    description: "Permanently block any channel from appearing in your feed. Blocked channels won't appear in recommendations, search results, or suggested videos — ever. You can manage your block list in Settings.",
  },
];

const howRecsWork = [
  { label: "Watch history", weight: "High" },
  { label: "Subscriptions", weight: "High" },
  { label: "Liked videos", weight: "Medium" },
  { label: "Search queries", weight: "Medium" },
  { label: "Trending in your region", weight: "Low" },
  { label: "Time of day", weight: "Low" },
];

const features = [
  { icon: Play, title: "Video Playback", description: "Adaptive bitrate streaming delivers the best quality your connection can handle, automatically adjusting from 144p to 4K." },
  { icon: Bell, title: "Notifications", description: "Subscribe to channels and get notified when they upload. Customize notification frequency per channel in your account settings." },
  { icon: BarChart2, title: "Creator Studio", description: "Creators get a full studio with upload tools, analytics, comment management, and channel customization." },
  { icon: Zap, title: "Shorts", description: "Vertical videos up to 3 minutes optimized for mobile. Swipe through an immersive, full-screen feed of short content." },
];

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-14 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">How CineWeave Works</h1>
        <p className="text-muted-foreground">
          A guide to understanding the platform — how content is surfaced, how personalization works, and what makes CineWeave different.
        </p>
      </div>

      {/* Core features */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Key Features Explained</h2>
        <div className="space-y-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommendation system */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How Recommendations Work</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          CineWeave's recommendation engine considers dozens of signals. Here are the main factors that influence what appears in your feed — and how much weight each carries:
        </p>
        <div className="space-y-2">
          {howRecsWork.map((r) => (
            <div key={r.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{r.label}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                r.weight === 'High' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                r.weight === 'Medium' ? 'bg-primary/10 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {r.weight}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          You can reduce algorithmic influence by enabling Personal Mode, which shows only subscribed content.
        </p>
      </div>

      {/* More features */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Platform Features</h2>
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
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>Have more questions? Visit our <a href="/help" className="text-primary hover:underline">Help Center</a> or contact support@cineweave.com.</p>
      </div>
    </div>
  );
}
