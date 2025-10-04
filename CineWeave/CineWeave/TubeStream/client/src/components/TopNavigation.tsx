import { useState } from "react";
import { Search, Menu, Bell, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";

export default function TopNavigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const { setSearchQuery: setGlobalSearchQuery } = useAppStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setGlobalSearchQuery(searchQuery.trim());
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 hover:bg-muted"
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Film className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">CineWeave</span>
        </div>
      </div>
      
      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex-1 flex items-center bg-secondary border border-border rounded-l-full overflow-hidden">
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
            className="px-6 py-2 bg-muted border border-l-0 border-border rounded-r-full hover:bg-secondary"
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 hover:bg-muted"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 overflow-hidden rounded-full p-0"
          data-testid="button-profile"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </Button>
      </div>
    </nav>
  );
}
