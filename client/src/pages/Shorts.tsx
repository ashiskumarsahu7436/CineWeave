import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Home } from "lucide-react";
import { VideoWithChannel } from "@shared/schema";
import ShortsPlayer from "@/components/ShortsPlayer";
import { Button } from "@/components/ui/button";
import { formatViews } from "@/lib/utils";

const tabs = [
  { label: "All", value: "all", icon: Play },
  { label: "Subscriptions", value: "subscriptions", icon: Home },
  { label: "Trending", value: "trending", icon: Play },
];

export default function Shorts() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("all");

  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/shorts", activeTab],
    queryFn: async () => {
      const response = await fetch('/api/videos/shorts');
      if (!response.ok) throw new Error('Failed to fetch shorts');
      return response.json();
    }
  });

  const openPlayer = (index: number) => {
    setInitialIndex(index);
    setShowPlayer(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Desktop Header */}
        <div className="hidden md:block sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Play className="h-7 w-7 fill-current" />
                Shorts
              </h1>
              <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                  <div key={tab.value} className="h-9 w-28 bg-muted animate-pulse rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 bg-background border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Play className="h-6 w-6 fill-current" />
              Shorts
            </h1>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <div key={tab.value} className="h-8 w-24 bg-muted animate-pulse rounded-full flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showPlayer && videos.length > 0) {
    return <ShortsPlayer videos={videos} initialIndex={initialIndex} onClose={() => setShowPlayer(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-xl">
                <Play className="h-7 w-7 text-white fill-white" />
              </div>
              Shorts
            </h1>
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-full px-5 transition-all ${
                    activeTab === tab.value
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 p-1.5 rounded-lg">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
            Shorts
          </h1>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-4 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.value
                  ? "bg-foreground text-background"
                  : ""
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 p-6 rounded-full mb-6">
              <Play className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No shorts available</h2>
            <p className="text-muted-foreground max-w-md text-lg">
              {activeTab === "subscriptions" 
                ? "Subscribe to channels to see their shorts here"
                : activeTab === "trending"
                ? "Check back later for trending shorts"
                : "Be the first to upload a short!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="group cursor-pointer transform transition-all duration-200 hover:scale-105"
                onClick={() => openPlayer(index)}
              >
                <div className="aspect-[9/16] bg-muted rounded-2xl md:rounded-3xl overflow-hidden relative ring-1 ring-border/50 group-hover:ring-2 group-hover:ring-primary transition-all shadow-lg group-hover:shadow-2xl">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 md:p-5 transform scale-90 group-hover:scale-100 transition-transform shadow-2xl">
                      <Play className="h-8 w-8 md:h-10 md:w-10 text-red-600 fill-red-600" />
                    </div>
                  </div>

                  {/* Video info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-2">
                    <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 leading-tight drop-shadow-lg">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <img
                        src={video.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop"}
                        alt={video.channel.name}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full object-cover ring-2 ring-white/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/95 text-xs md:text-sm truncate font-medium drop-shadow">
                          {video.channel.name}
                        </p>
                        <p className="text-white/80 text-xs drop-shadow">
                          {formatViews(video.views || 0)} views
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
                      <span className="text-white text-xs font-semibold">{video.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
