import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, Clock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

const MAX_SEARCH_HISTORY = 10;

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { setSearchQuery: setGlobalSearchQuery } = useAppStore();

  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const updatedHistory = [
      query,
      ...searchHistory.filter(item => item !== query)
    ].slice(0, MAX_SEARCH_HISTORY);
    
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveToHistory(query.trim());
      setGlobalSearchQuery(query.trim());
      setLocation("/");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const deleteHistoryItem = (item: string) => {
    const updatedHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="w-10 h-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <form onSubmit={handleSubmit} className="flex-1 flex items-center bg-secondary border border-border rounded-full overflow-hidden">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder-muted-foreground border-0 rounded-none focus-visible:ring-0"
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="w-10 h-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="w-12 h-10"
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      <div className="pt-14 px-4">
        {searchHistory.length > 0 && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent searches</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllHistory}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
            
            <div className="space-y-1">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-muted rounded-md group"
                >
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <button
                    onClick={() => handleSearch(item)}
                    className="flex-1 text-left text-sm"
                  >
                    {item}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHistoryItem(item)}
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchHistory.length === 0 && (
          <div className="max-w-2xl mx-auto py-16 text-center">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No search history</p>
            <p className="text-sm text-muted-foreground mt-1">Your recent searches will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
