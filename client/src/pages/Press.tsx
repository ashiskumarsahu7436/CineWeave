import { Download, Mail, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const releases = [
  {
    date: "November 12, 2025",
    title: "CineWeave Surpasses 500 Million Monthly Active Users",
    category: "Milestone",
    summary: "CineWeave today announced it has reached 500 million monthly active users globally, cementing its position as one of the world's fastest-growing video platforms.",
  },
  {
    date: "September 4, 2025",
    title: "CineWeave Launches Spaces — A New Way to Organize Your Favorite Channels",
    category: "Product",
    summary: "Spaces allows viewers to create custom collections of channels, making it easier than ever to organize and access content from your favorite creators.",
  },
  {
    date: "July 22, 2025",
    title: "CineWeave Introduces Personal Mode for Distraction-Free Viewing",
    category: "Product",
    summary: "Personal Mode is a new subscription feature that filters your feed to show only content from channels you follow, eliminating algorithmic noise.",
  },
  {
    date: "May 5, 2025",
    title: "CineWeave Raises Series B to Expand Global Creator Programs",
    category: "Business",
    summary: "CineWeave has closed a $120M Series B funding round led by global media investors to accelerate its creator monetization programs across 50 new markets.",
  },
  {
    date: "January 18, 2025",
    title: "CineWeave Launches Shorts — Vertical Video for the Mobile Generation",
    category: "Product",
    summary: "CineWeave Shorts brings immersive, full-screen vertical video to the platform, with an intuitive swipe experience designed for mobile-first viewers.",
  },
];

const categoryColor: Record<string, string> = {
  Milestone: "bg-green-500/10 text-green-500",
  Product: "bg-primary/10 text-primary",
  Business: "bg-orange-500/10 text-orange-500",
};

export default function Press() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Press Room</h1>
        <p className="text-muted-foreground">
          News, press releases, and media resources from CineWeave.
        </p>
      </div>

      {/* Media Kit */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg mb-1">Media Kit</h2>
            <p className="text-sm text-muted-foreground">
              Download our official logos, brand guidelines, product screenshots, and executive headshots.
            </p>
          </div>
          <Button className="flex-shrink-0" data-testid="button-download-media-kit">
            <Download className="h-4 w-4 mr-2" />
            Download Media Kit
          </Button>
        </CardContent>
      </Card>

      {/* Press Contact */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Press Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">CineWeave Communications Team</p>
            <p>press@cineweave.com</p>
            <p>+91 80 4567 8900</p>
            <p className="text-xs pt-1">For media inquiries only. Response within 24 hours.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Brand Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Use our brand assets according to our brand guidelines. Unauthorized modifications are not permitted.</p>
            <Button variant="outline" size="sm" data-testid="button-brand-guidelines">
              View Brand Guidelines
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Press Releases */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Press Releases</h2>
        {releases.map((r) => (
          <Card key={r.title} className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs font-medium ${categoryColor[r.category] || ''}`} variant="outline">
                    {r.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {r.date}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold mb-1">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.summary}</p>
              <Button variant="link" className="px-0 h-auto mt-2 text-primary text-sm" data-testid={`button-read-more-${r.date}`}>
                Read full release →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
