import { Link, useLocation } from "wouter";
import { 
  Home, 
  Play, 
  TrendingUp, 
  FolderOpen, 
  Layers, 
  BookOpen, 
  History, 
  Clock,
  ShoppingBag,
  Music,
  Film,
  Radio,
  Gamepad2,
  Newspaper,
  Volleyball,
  GraduationCap,
  Shirt,
  Mic,
  Settings,
  Flag,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Play, label: "Shorts", path: "/shorts" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: FolderOpen, label: "Subscriptions", path: "/subscriptions" },
  { icon: Layers, label: "Spaces", path: "/spaces" },
];

const libraryItems = [
  { icon: BookOpen, label: "Library", path: "/library" },
  { icon: History, label: "History", path: "/history" },
  { icon: Clock, label: "Watch Later", path: "/watch-later" },
];

const exploreItems = [
  { icon: ShoppingBag, label: "Shopping", path: "/explore/shopping" },
  { icon: Music, label: "Music", path: "/explore/music" },
  { icon: Film, label: "Movies", path: "/explore/movies" },
  { icon: Radio, label: "Live", path: "/explore/live" },
  { icon: Gamepad2, label: "Gaming", path: "/explore/gaming" },
  { icon: Newspaper, label: "News", path: "/explore/news" },
  { icon: Volleyball, label: "Sports", path: "/explore/sports" },
  { icon: GraduationCap, label: "Courses", path: "/explore/courses" },
  { icon: Shirt, label: "Fashion & Beauty", path: "/explore/fashion" },
  { icon: Mic, label: "Podcasts", path: "/explore/podcasts" },
];

const toolsItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Flag, label: "Report history", path: "/report-history" },
  { icon: HelpCircle, label: "Help", path: "/help" },
  { icon: MessageSquare, label: "Send feedback", path: "/feedback" },
];

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { sidebarCollapsed } = useAppStore();

  const isActive = (path: string) => location === path;

  return (
    <aside className={cn(
      "bg-background border-r border-border overflow-y-auto sidebar-scrollbar z-40 transition-all duration-300",
      isMobile 
        ? "w-full" 
        : "hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:block",
      !isMobile && (sidebarCollapsed ? "w-20" : "w-60")
    )}>
      <div className="py-2">
        
        {/* Main Navigation */}
        <div className="py-2 border-b border-border">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const collapsed = !isMobile && sidebarCollapsed;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "nav-item flex items-center py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-4 px-4",
                  isActive(item.path)
                    ? "active text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Library Section */}
        <div className="py-2 border-b border-border">
          {libraryItems.map((item) => {
            const Icon = item.icon;
            const collapsed = !isMobile && sidebarCollapsed;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "nav-item flex items-center py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-4 px-4",
                  isActive(item.path)
                    ? "active text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Explore Section */}
        <div className="py-2 border-b border-border">
          {(isMobile || !sidebarCollapsed) && (
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Explore
            </div>
          )}
          {exploreItems.map((item) => {
            const Icon = item.icon;
            const collapsed = !isMobile && sidebarCollapsed;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "nav-item flex items-center py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-4 px-4",
                  isActive(item.path)
                    ? "active text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Tools Section */}
        <div className="py-2 border-b border-border">
          {toolsItems.map((item) => {
            const Icon = item.icon;
            const collapsed = !isMobile && sidebarCollapsed;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "nav-item flex items-center py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-4 px-4",
                  isActive(item.path)
                    ? "active text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        
        {/* Footer Links */}
        {(isMobile || !sidebarCollapsed) && (
          <div className="px-4 py-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-about">About</a>
                <a href="#" className="hover:text-foreground" data-testid="link-press">Press</a>
                <a href="#" className="hover:text-foreground" data-testid="link-copyright">Copyright</a>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-contact">Contact us</a>
                <a href="#" className="hover:text-foreground" data-testid="link-creators">Creators</a>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-advertise">Advertise</a>
                <a href="#" className="hover:text-foreground" data-testid="link-developers">Developers</a>
              </div>
              <div className="flex flex-wrap gap-x-2 mt-2">
                <a href="#" className="hover:text-foreground" data-testid="link-terms">Terms</a>
                <a href="#" className="hover:text-foreground" data-testid="link-privacy">Privacy</a>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-policy">Policy & Safety</a>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-how-works">How CineWeave works</a>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <a href="#" className="hover:text-foreground" data-testid="link-test-features">Test new features</a>
              </div>
              <div className="mt-3 text-muted-foreground/70">
                © 2025 CineWeave Pvt. Ltd.
              </div>
            </div>
          </div>
        )}
        
      </div>
    </aside>
  );
}
