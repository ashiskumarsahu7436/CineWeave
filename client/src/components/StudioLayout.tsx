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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/store/useAppStore";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import studioLogoImage from "@/assets/cineweave-studio-logo.png";

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
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  const isActive = (path: string) => {
    if (path === "/studio") {
      return location === path;
    }
    return location.startsWith(path);
  };

  const StudioNavContent = () => (
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
            onClick={() => setMobileSidebarOpen(false)}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Button - Shows on < md */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent side="left" className="p-0 w-60">
              <VisuallyHidden>
                <SheetHeader>
                  <SheetTitle>Studio Navigation</SheetTitle>
                </SheetHeader>
              </VisuallyHidden>
              <StudioNavContent />
            </SheetContent>
          </Sheet>

          {/* Desktop Menu Button - Shows on >= md (non-functional, just for consistency) */}
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/">
            <div className="flex items-center gap-2">
              <img src={studioLogoImage} alt="CineWeave Studio Logo" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-base md:text-lg">CineWeave Studio</span>
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Back to CineWeave
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <span className="text-xs">Exit</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || user?.email || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || user?.username || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email || `@${user?.username || 'user'}`}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation - Hidden on mobile, visible on desktop */}
      <aside className="hidden md:fixed md:left-0 md:top-16 md:bottom-0 md:block md:w-60 bg-background border-r border-border overflow-y-auto">
        <StudioNavContent />
      </aside>

      {/* Main Content - Responsive margins and padding */}
      <main className="mt-16 p-4 md:p-6 md:ml-60">
        {children}
      </main>
    </div>
  );
}
