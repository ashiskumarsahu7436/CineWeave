import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Video,
  BarChart3,
  Users,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

const studioNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/studio" },
  { icon: Video, label: "Content", path: "/studio/content" },
  { icon: BarChart3, label: "Analytics", path: "/studio/analytics" },
  { icon: Users, label: "Community", path: "/studio/community" },
  { icon: Settings, label: "Settings", path: "/studio/settings" },
];

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: channel } = useQuery<any>({
    queryKey: ['/api/users', user?.id, 'channel'],
    enabled: !!user?.id,
  });

  const isActive = (path: string) => {
    if (path === "/studio") {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CW</span>
              </div>
              <span className="font-semibold text-lg">CineWeave Studio</span>
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost">Back to CineWeave</Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={channel?.avatar} alt={channel?.name} />
              <AvatarFallback>{channel?.name?.[0] || user?.firstName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{channel?.name || 'Your channel'}</p>
              <p className="text-xs text-muted-foreground">{channel?.username || ''}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <aside className="fixed left-0 top-16 bottom-0 w-60 bg-background border-r border-border overflow-y-auto">
        <div className="py-2">
          {studioNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 mt-16 p-6">
        {children}
      </main>
    </div>
  );
}
