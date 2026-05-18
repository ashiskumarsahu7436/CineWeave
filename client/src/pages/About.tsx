import { Play, Users, Globe, Zap, Shield, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Monthly Viewers", value: "500M+" },
  { label: "Content Creators", value: "10M+" },
  { label: "Countries", value: "190+" },
  { label: "Hours Watched Daily", value: "1B+" },
];

const values = [
  { icon: Users, title: "Creator First", description: "We build every feature with creators in mind. Your growth is our mission." },
  { icon: Globe, title: "Global Reach", description: "Connecting creators and viewers across every corner of the world." },
  { icon: Zap, title: "Innovation", description: "Constantly pushing the boundaries of what a video platform can be." },
  { icon: Shield, title: "Trust & Safety", description: "A platform where everyone feels safe to express themselves." },
  { icon: Heart, title: "Community", description: "We believe in the power of shared interests to bring people together." },
  { icon: Play, title: "Entertainment", description: "Making world-class entertainment accessible to everyone, everywhere." },
];

const team = [
  { name: "Arjun Mehta", role: "CEO & Co-Founder", bio: "Former product lead at a major streaming company with 15 years in media tech." },
  { name: "Priya Sharma", role: "CTO & Co-Founder", bio: "Built large-scale video infrastructure serving billions of requests daily." },
  { name: "Ravi Nair", role: "Chief Product Officer", bio: "Passionate about user experience and creating products people love." },
  { name: "Ananya Iyer", role: "Chief Content Officer", bio: "15 years in media and entertainment, championing diverse creator voices." },
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold">CineWeave</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We're building the world's most personalized video platform — a place where creators thrive and viewers discover content they truly love.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Our Story */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Our Story</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-4">
          <p>
            CineWeave was founded in 2023 with a simple but powerful idea: video platforms should work for creators and viewers equally. Too often, algorithms prioritize engagement over quality, and creators struggle to reach the audiences who would genuinely love their work.
          </p>
          <p>
            We started by asking: what if a platform truly understood what you wanted to watch — and helped creators build sustainable audiences around genuine interest? That question became CineWeave.
          </p>
          <p>
            Today, CineWeave serves hundreds of millions of viewers across 190 countries, with features like Personal Mode, Spaces, and intelligent channel curation that make the discovery experience genuinely personal. Our tools empower creators to build lasting communities, not just chase viral moments.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title}>
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leadership */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Leadership Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member) => (
            <Card key={member.name}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-primary">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* HQ */}
      <div className="border-t pt-8 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Headquarters:</strong> CineWeave Pvt. Ltd., Bengaluru, Karnataka, India — 560001</p>
        <p className="mt-1"><strong className="text-foreground">Founded:</strong> 2023 &nbsp;·&nbsp; <strong className="text-foreground">Employees:</strong> 1,200+</p>
      </div>
    </div>
  );
}
