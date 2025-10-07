import { useState } from "react";
import { Search, Menu, Bell, UserCircle, Plus, Video, Radio, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import AccountMenu from "@/components/AccountMenu";
import Sidebar from "@/components/Sidebar";
import logoImage from "@/assets/cineweave-logo.svg";

export default function TopNavigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { setSearchQuery: setGlobalSearchQuery, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', user?.id, 'unread-count'],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setGlobalSearchQuery(searchQuery.trim());
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu - Shows on < md */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-10 h-10 hover:bg-muted"
              data-testid="button-menu-mobile"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <VisuallyHidden>
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
            </VisuallyHidden>
            <div className="pt-2">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Desktop Menu - Shows on >= md */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex w-10 h-10 hover:bg-muted"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="CineWeave Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:inline">CineWeave</span>
        </div>
      </div>
      
      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-2 sm:mx-8">
        <form onSubmit={handleSearch} className="flex items-center">
          {/* Full search bar - hidden on < sm */}
          <div className="hidden sm:flex flex-1 items-center bg-secondary border border-border rounded-l-full overflow-hidden">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder-muted-foreground border-0 rounded-none focus-visible:ring-0"
              data-testid="input-search"
            />
          </div>
          <Button
            type="submit"
            className="hidden sm:flex px-6 py-2 bg-muted border border-l-0 border-border rounded-r-full hover:bg-secondary"
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Mobile search icon - shows only on < sm */}
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="sm:hidden w-10 h-10 hover:bg-muted"
            data-testid="button-search-mobile"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 px-3 h-9 hover:bg-muted"
              data-testid="button-create"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => setLocation("/studio/content?upload=true")}
              className="gap-3 cursor-pointer"
            >
              <Video className="h-4 w-4" />
              <span>Upload video</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 cursor-pointer opacity-50" disabled>
              <Radio className="h-4 w-4" />
              <span>Go live</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 cursor-pointer opacity-50" disabled>
              <FileText className="h-4 w-4" />
              <span>Create post</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 hover:bg-muted relative"
          onClick={() => setLocation("/notifications")}
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadData && unreadData.count > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
          )}
        </Button>
        
        <Sheet open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 overflow-hidden rounded-full p-0"
              data-testid="button-profile"
            >
              {user ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || user.email || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                    {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <UserCircle className="w-8 h-8 text-muted-foreground" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80">
            <VisuallyHidden>
              <SheetHeader>
                <SheetTitle>Account Menu</SheetTitle>
              </SheetHeader>
            </VisuallyHidden>
            <AccountMenu onClose={() => setAccountMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
