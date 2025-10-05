import { HelpCircle, Search, MessageSquare, Book, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const helpTopics = [
  {
    icon: Video,
    title: "Getting Started",
    description: "Learn the basics of using CineWeave",
    topics: ["How to watch videos", "Creating an account", "Subscribing to channels"]
  },
  {
    icon: Book,
    title: "Account & Settings",
    description: "Manage your account preferences",
    topics: ["Change password", "Privacy settings", "Notification preferences"]
  },
  {
    icon: MessageSquare,
    title: "Troubleshooting",
    description: "Fix common issues",
    topics: ["Video playback issues", "Login problems", "App not loading"]
  }
];

export default function Help() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Help Center
        </h1>
        <p className="text-muted-foreground mt-1">Find answers and get support</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for help..."
          className="pl-10 h-12"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {helpTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card key={topic.title} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{topic.title}</CardTitle>
                <CardDescription>{topic.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {topic.topics.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Contact our support team</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Contact Support</Button>
          <Button variant="outline">Community Forum</Button>
        </CardContent>
      </Card>
    </div>
  );
}
