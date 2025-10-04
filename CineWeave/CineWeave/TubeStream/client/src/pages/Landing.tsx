import { Button } from "@/components/ui/button";
import { Play, Video, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">CineWeave</span>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Your Videos, Your Way
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience video streaming with powerful personalization. Block unwanted content, 
            organize your subscriptions, and enjoy a truly customized viewing experience.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </section>

        <section className="py-20 grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personal Mode</h3>
            <p className="text-muted-foreground">
              Toggle to see only videos from channels you subscribe to. No algorithms, no distractions.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Control</h3>
            <p className="text-muted-foreground">
              Permanently block channels and never see their content again. Full control over what you watch.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Spaces</h3>
            <p className="text-muted-foreground">
              Organize subscriptions into custom collections. Create spaces for gaming, tech, entertainment, and more.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
