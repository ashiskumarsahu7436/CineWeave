import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { VideoWithChannel } from "@shared/schema";
import ShortsPlayer from "@/components/ShortsPlayer";
import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Subscriptions", value: "subscriptions" },
  { label: "Live", value: "live" },
  { label: "Trends", value: "trends" },
];

export default function Shorts() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("subscriptions");

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
      <div className="h-full bg-background">
        {/* Header */}
        <div className="flex items-center gap-6 px-6 py-4 border-b border-border">
          <h1 className="text-xl font-bold">Shorts</h1>
        </div>
        
        {/* Tabs skeleton */}
        <div className="flex items-center gap-4 px-6 py-3">
          {tabs.map((tab) => (
            <div key={tab.value} className="h-8 w-24 bg-muted animate-pulse rounded-full"></div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (showPlayer && videos.length > 0) {
    return <ShortsPlayer videos={videos} initialIndex={initialIndex} onClose={() => setShowPlayer(false)} />;
  }

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-6 px-6 py-4 border-b border-border">
        <h1 className="text-xl font-bold">Shorts</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-full ${
              activeTab === tab.value
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "hover:bg-secondary"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Play className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No shorts available</h2>
            <p className="text-muted-foreground max-w-md">
              {activeTab === "subscriptions" 
                ? "Subscribe to channels to see their shorts here"
                : activeTab === "live"
                ? "No live shorts at the moment"
                : "Check back later for trending shorts"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => openPlayer(index)}
              >
                <div className="aspect-[9/16] bg-muted rounded-2xl overflow-hidden relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 rounded-full p-3">
                      <Play className="h-10 w-10 text-white fill-white" />
                    </div>
                  </div>

                  {/* Video info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-1">
                      <img
                        src={video.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop"}
                        alt={video.channel.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <p className="text-white/90 text-xs truncate">
                        {video.channel.name}
                      </p>
                    </div>
                    <p className="text-white/75 text-xs">
                      {(video.views || 0).toLocaleString()} views
                    </p>
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
