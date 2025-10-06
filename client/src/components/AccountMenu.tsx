import { 
  User, 
  LogOut, 
  UserPlus, 
  Crown, 
  Video, 
  CreditCard, 
  Palette, 
  Globe, 
  MapPin, 
  Keyboard,
  ChevronRight,
  Settings,
  UserCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AuthModal from "./AuthModal";

interface AccountMenuProps {
  onClose?: () => void;
}

export default function AccountMenu({ onClose }: AccountMenuProps) {
  const { currentUserId, personalMode, setPersonalMode } = useAppStore();
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    try {
      // Close the menu first
      onClose?.();
      
      // Clear the authentication cache immediately
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Try email logout first
      const res = await fetch('/api/auth/email/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Redirect to home page
        setLocation('/');
        // Force reload to ensure clean state
        setTimeout(() => window.location.reload(), 100);
      } else {
        // Fallback to Replit Auth logout (this will redirect)
        window.location.href = '/api/logout';
      }
    } catch (error) {
      // If email logout fails, try Replit Auth logout
      window.location.href = '/api/logout';
    }
  };

  const menuSections = [
    {
      items: [
        { icon: User, label: "Your channel", action: () => console.log("Your channel") },
        { icon: UserPlus, label: "Switch account", action: () => console.log("Switch account") },
        { icon: LogOut, label: "Sign out", action: handleSignOut }
      ]
    },
    {
      items: [
        { icon: Crown, label: "CineWeave Premium", action: () => console.log("Premium") },
        { icon: Video, label: "CineWeave Studio", action: () => console.log("Studio") },
        { icon: CreditCard, label: "Purchases and memberships", action: () => console.log("Purchases") }
      ]
    },
    {
      items: [
        { icon: Palette, label: "Appearance", value: "Device theme", hasArrow: true, link: "/appearance" },
        { icon: Globe, label: "Language", value: "English", hasArrow: true, link: "/language" },
        { icon: MapPin, label: "Location", value: "India", hasArrow: true, link: "/location" },
        { icon: Keyboard, label: "Keyboard shortcuts", hasArrow: true, link: "/keyboard-shortcuts" }
      ]
    },
    {
      items: [
        { icon: Settings, label: "Settings", link: "/settings" }
      ]
    }
  ];

  // Show auth prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <>
        <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
          <div className="p-4">
            <div className="text-center py-8">
              <UserCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Sign in to CineWeave</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Access your channels, subscriptions, and personalized content
              </p>
              <Button 
                className="w-full" 
                onClick={() => {
                  setShowAuthModal(true);
                }}
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="py-2">
              {[
                { icon: Palette, label: "Appearance", value: "Device theme", hasArrow: true, link: "/appearance" },
                { icon: Globe, label: "Language", value: "English", hasArrow: true, link: "/language" },
                { icon: MapPin, label: "Location", value: "India", hasArrow: true, link: "/location" },
                { icon: Keyboard, label: "Keyboard shortcuts", hasArrow: true, link: "/keyboard-shortcuts" },
                { icon: Settings, label: "Settings", link: "/settings" }
              ].map((item, index) => {
                const Icon = item.icon;
                if ('link' in item && item.link) {
                  return (
                    <Link
                      key={index}
                      href={item.link}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {'hasArrow' in item && item.hasArrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
        <AuthModal 
          open={showAuthModal} 
          onOpenChange={(open) => {
            setShowAuthModal(open);
            if (!open) {
              onClose?.();
            }
          }} 
        />
      </>
    );
  }

  // Show full menu for authenticated users
  return (
    <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || "https://github.com/shadcn.png"} />
            <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}</div>
            <div className="text-sm text-muted-foreground truncate">@{user?.username || 'user'}</div>
            <Link href="/channel/user" className="text-sm text-primary hover:underline">
              View your channel
            </Link>
          </div>
        </div>

        <Separator className="my-2" />
        
        {/* Personal Mode Toggle */}
        <div className="py-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <UserCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Personal Mode</span>
            </div>
            <Switch
              checked={personalMode}
              onCheckedChange={setPersonalMode}
              data-testid="switch-personal-mode"
            />
          </div>
        </div>

        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <Separator className="my-2" />
            <div className="py-2">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                
                if ('link' in item && item.link) {
                  return (
                    <Link
                      key={itemIndex}
                      href={item.link}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={itemIndex}
                    onClick={'action' in item ? item.action : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      {'value' in item && item.value && (
                        <div className="text-xs text-muted-foreground">{item.value}</div>
                      )}
                    </div>
                    {'hasArrow' in item && item.hasArrow && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
