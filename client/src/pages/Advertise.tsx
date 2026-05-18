import { Target, BarChart2, Globe, Users, TrendingUp, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formats = [
  { icon: Layers, title: "Skippable In-Stream Ads", description: "Run before, during, or after videos. Viewers can skip after 5 seconds. You pay only when they watch 30+ seconds or engage." },
  { icon: TrendingUp, title: "Non-Skippable In-Stream", description: "15-second ads that play before a video. Guaranteed full viewership. Ideal for brand awareness campaigns." },
  { icon: Target, title: "Bumper Ads", description: "6-second non-skippable ads optimized for mobile. Perfect for reinforcing a brand message at scale." },
  { icon: Globe, title: "Discovery Ads", description: "Appear in search results and on channel pages. Reach viewers who are actively looking for content like yours." },
  { icon: BarChart2, title: "Masthead Ads", description: "Premium placement at the top of the CineWeave homepage. Maximum reach for product launches and major campaigns." },
  { icon: Users, title: "Branded Content", description: "Partner with CineWeave creators for authentic sponsored content that resonates with their established audiences." },
];

const stats = [
  { value: "500M+", label: "Monthly active users" },
  { value: "1B+", label: "Daily watch hours" },
  { value: "190+", label: "Countries reached" },
  { value: "18–34", label: "Core audience age range" },
];

export default function Advertise() {
  const { toast } = useToast();
  const [company, setCompany] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setCompany(""); setContactEmail(""); setBudget(""); setGoal("");
      toast({ title: "Request received!", description: "Our advertising team will contact you within 2 business days." });
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-14 py-8">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Advertise on CineWeave</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Reach a massive, engaged audience of 500 million viewers. Our ad platform gives you the targeting precision to connect with the right people at the right moment.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ad Formats */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Ad Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title}>
                <CardContent className="p-5">
                  <Icon className="h-7 w-7 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Form */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Get in Touch</h2>
        <p className="text-muted-foreground">Tell us about your campaign and our team will reach out with a tailored proposal.</p>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company name</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" required data-testid="input-company" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Business email</label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" required data-testid="input-advertise-email" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Monthly budget range</label>
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. $5,000 – $20,000" data-testid="input-budget" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Campaign goal</label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Describe your campaign objective..." rows={3} data-testid="input-goal" />
          </div>
          <Button type="submit" disabled={sending} data-testid="button-advertise-contact">
            {sending ? "Sending…" : "Request a Proposal"}
          </Button>
        </form>
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>For direct advertising inquiries: <strong className="text-foreground">ads@cineweave.com</strong></p>
        <p className="mt-1">Minimum campaign spend: $1,000/month</p>
      </div>
    </div>
  );
}
