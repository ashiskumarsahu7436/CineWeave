import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, Clock, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoCard from "@/components/VideoCard";
import { useAppStore } from "@/store/useAppStore";
import type { VideoWithChannel } from "@shared/schema";

const MAX_SEARCH_HISTORY = 10;

export default function Search() {
  const [, setLocation] = useLocation();
  const { searchQuery, setSearchQuery, searchFilters, setSearchFilters, resetSearchFilters } = useAppStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...searchHistory.filter((i) => i !== query)].slice(0, MAX_SEARCH_HISTORY);
    setSearchHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveToHistory(trimmed);
    setSearchQuery(trimmed);
  };

  const deleteHistoryItem = (item: string) => {
    const updated = searchHistory.filter((h) => h !== item);
    setSearchHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // Build query string with filters
  const queryParams = new URLSearchParams({ q: searchQuery });
  if (searchFilters.sort && searchFilters.sort !== 'relevance') queryParams.set('sort', searchFilters.sort);
  if (searchFilters.duration && searchFilters.duration !== 'any') queryParams.set('duration', searchFilters.duration);
  if (searchFilters.uploaded && searchFilters.uploaded !== 'any') queryParams.set('uploaded', searchFilters.uploaded);

  const { data: results = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ['/api/videos/search', searchQuery, searchFilters.sort, searchFilters.duration, searchFilters.uploaded],
    queryFn: async () => {
      const res = await fetch(`/api/videos/search?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const hasActiveFilters =
    searchFilters.sort !== 'relevance' ||
    searchFilters.duration !== 'any' ||
    searchFilters.uploaded !== 'any';

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 bg-background border-b border-border z-40">
        <div className="flex items-center gap-3 px-4 h-14 max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="w-10 h-10"
            data-testid="button-search-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(inputValue);
            }}
            className="flex-1 flex items-center bg-secondary border border-border rounded-full overflow-hidden"
          >
            <Input
              type="text"
              placeholder="Search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2 text-sm border-0 rounded-none focus-visible:ring-0"
              autoFocus
              data-testid="input-search"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setInputValue("")}
                className="w-10 h-10"
                data-testid="button-clear-input"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" variant="ghost" size="icon" className="w-12 h-10" data-testid="button-submit-search">
              <SearchIcon className="h-5 w-5" />
            </Button>
          </form>

          {searchQuery && (
            <Button
              variant={showFilters || hasActiveFilters ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowFilters((s) => !s)}
              className="w-10 h-10"
              data-testid="button-toggle-filters"
              title="Filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Filters panel */}
        {searchQuery && showFilters && (
          <div className="border-t border-border bg-background">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Upload date</label>
                <Select
                  value={searchFilters.uploaded}
                  onValueChange={(v) => setSearchFilters({ uploaded: v as any })}
                >
                  <SelectTrigger className="w-36 h-8" data-testid="select-uploaded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="hour">Last hour</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Duration</label>
                <Select
                  value={searchFilters.duration}
                  onValueChange={(v) => setSearchFilters({ duration: v as any })}
                >
                  <SelectTrigger className="w-36 h-8" data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="short">Under 4 min</SelectItem>
                    <SelectItem value="medium">4-20 min</SelectItem>
                    <SelectItem value="long">Over 20 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Sort by</label>
                <Select
                  value={searchFilters.sort}
                  onValueChange={(v) => setSearchFilters({ sort: v as any })}
                >
                  <SelectTrigger className="w-36 h-8" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Upload date</SelectItem>
                    <SelectItem value="views">View count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSearchFilters}
                  className="text-xs"
                  data-testid="button-reset-filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 max-w-5xl mx-auto">
        {!searchQuery && (
          <>
            {searchHistory.length > 0 ? (
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent searches</h2>
                  <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-sm text-muted-foreground hover:text-foreground" data-testid="button-clear-history">
                    Clear all
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-3 px-2 hover:bg-muted rounded-md group" data-testid={`history-item-${idx}`}>
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <button onClick={() => handleSearch(item)} className="flex-1 text-left text-sm">{item}</button>
                      <Button variant="ghost" size="icon" onClick={() => deleteHistoryItem(item)} className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No search history</p>
                <p className="text-sm text-muted-foreground mt-1">Your recent searches will appear here</p>
              </div>
            )}
          </>
        )}

        {searchQuery && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
              {isLoading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'} for "${searchQuery}"`}
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-video bg-muted animate-pulse rounded-xl" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="py-16 text-center">
                <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground mt-1">Try different keywords or remove search filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((video) => (
                  <VideoCard key={video.id} video={video} onClick={() => setLocation(`/watch/${video.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
