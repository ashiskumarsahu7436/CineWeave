import { ShieldCheck, Flag, AlertTriangle, Users, Lock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const guidelines = [
  {
    icon: ShieldCheck,
    title: "Spam & Deceptive Practices",
    items: [
      "No spam, misleading metadata, or manipulated engagement",
      "No impersonation of people, brands, or organizations",
      "No coordinated inauthentic behavior or fake accounts",
      "No misleading thumbnails or titles that don't match content",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Harmful or Dangerous Content",
    items: [
      "No content that promotes self-harm or suicide",
      "No instructions for creating weapons capable of mass harm",
      "No dangerous challenges or pranks causing physical harm",
      "No content promoting drug use, trafficking, or illegal activities",
    ],
  },
  {
    icon: Users,
    title: "Hate Speech",
    items: [
      "No content promoting violence or hatred against individuals or groups",
      "No content denigrating people based on race, ethnicity, religion, gender, sexual orientation, or disability",
      "No use of slurs to dehumanize groups of people",
      "Educational, documentary, and counter-speech content is permitted",
    ],
  },
  {
    icon: Eye,
    title: "Violent & Graphic Content",
    items: [
      "No gratuitous or glorified violence for shock value",
      "No content that encourages others to commit violent acts",
      "Graphic news content is allowed with appropriate age restrictions",
      "Violent video game content is allowed within community standards",
    ],
  },
  {
    icon: Lock,
    title: "Privacy & Personal Information",
    items: [
      "No content exposing personal information without consent (doxxing)",
      "No non-consensual intimate imagery of any kind",
      "No content designed to harass specific individuals",
      "No content revealing private communications without consent",
    ],
  },
  {
    icon: Flag,
    title: "Misinformation",
    items: [
      "No medically harmful health misinformation",
      "No false claims about elections or voting processes",
      "Content denying well-documented historical events is not allowed",
      "Satire and parody are allowed when clearly labeled",
    ],
  },
];

export default function PolicySafety() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Policy & Safety</h1>
        <p className="text-muted-foreground">
          CineWeave is committed to being a platform where everyone feels safe to create and enjoy content. Our Community Guidelines define what is and isn't allowed.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button data-testid="button-report-content">
          <Flag className="h-4 w-4 mr-2" />
          Report Content
        </Button>
        <Button variant="outline" data-testid="button-safety-center">
          <ShieldCheck className="h-4 w-4 mr-2" />
          Safety Center
        </Button>
        <Button variant="outline" data-testid="button-crisis-resources">
          Crisis Resources
        </Button>
      </div>

      {/* Overview */}
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
        <p>
          Our Community Guidelines apply to all content on CineWeave — videos, thumbnails, titles, descriptions, comments, and profile information. Violations may result in content removal, strikes on your account, or permanent termination of your channel.
        </p>
        <p>
          We use a combination of human reviewers and automated systems to enforce these guidelines. If your content is removed, you'll receive a notification explaining why and how to appeal. Three strikes within 90 days result in account termination.
        </p>
      </div>

      {/* Guidelines */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Community Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((g) => {
            const Icon = g.icon;
            return (
              <Card key={g.title}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{g.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {g.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Appeals */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Appeals Process</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you believe your content was removed in error, you may appeal the decision within 30 days of the removal notice. Our policy team will review appeals and respond within 5–7 business days. You can submit an appeal from the notification in your Studio dashboard.
        </p>
        <Button variant="outline" data-testid="button-submit-appeal">Submit an Appeal</Button>
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>Policy questions: safety@cineweave.com</p>
        <p className="mt-1">Law enforcement requests: law-enforcement@cineweave.com</p>
      </div>
    </div>
  );
}
