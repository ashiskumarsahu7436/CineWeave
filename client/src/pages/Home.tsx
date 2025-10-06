import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import SpaceCard from "@/components/SpaceCard";
import ChannelCreationDialog from "@/components/ChannelCreationDialog";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { VideoWithChannel, SpaceWithChannels } from "@shared/schema";

const categoryFilters = [
  { label: "All", value: "" },
  { label: "From Subscriptions", value: "subscriptions" },
  { label: "Gaming", value: "Gaming" },
  { label: "Music", value: "Music" },
  { label: "Live", value: "Live" },
  { label: "Recently uploaded", value: "recent" },
  { label: "Watched", value: "watched" },
];

export default function Home() {
  const { personalMode, searchQuery, currentUserId } = useAppStore();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("");
  const [showChannelCreation, setShowChannelCreation] = useState(false);

  // Check if user has a channel (only when authenticated)
  const { data: userChannel, isLoading: channelLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'channel'],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/users/${user.id}/channel`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch channel');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Show channel creation dialog only for authenticated users without a channel
  useEffect(() => {
    if (!channelLoading && user && !userChannel) {
      setShowChannelCreation(true);
    }
  }, [channelLoading, user, userChannel]);

  // Fetch videos based on personal mode and search query
  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos", { personalMode, searchQuery, category: activeCategory }],
    queryFn: async () => {
      if (searchQuery) {
        const response = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Failed to search videos');
        return response.json();
      } else if (personalMode) {
        // Get subscribed channels and their videos
        const subsResponse = await fetch(`/api/subscriptions/${currentUserId}`);
        if (!subsResponse.ok) return [];
        const subscriptions = await subsResponse.json();
        const channelIds = subscriptions.map((sub: any) => sub.channelId);
        
        if (channelIds.length === 0) return [];
        
        const videosResponse = await fetch(`/api/videos/by-channels?channelIds=${channelIds.join(',')}`);
        if (!videosResponse.ok) return [];
        return videosResponse.json();
      } else {
        const response = await fetch(`/api/videos?${activeCategory ? `category=${activeCategory}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch videos');
        return response.json();
      }
    }
  });

  // Fetch user spaces (only when authenticated)
  const { data: spaces = [] } = useQuery<SpaceWithChannels[]>({
    queryKey: ["/api/spaces/user", currentUserId],
    enabled: !!user?.id,
  });

  const handleVideoClick = (video: VideoWithChannel) => {
    console.log("Playing video:", video.title);
    // TODO: Navigate to video player page
  };

  const handleSpaceClick = (space: SpaceWithChannels) => {
    console.log("Viewing space:", space.name);
    // TODO: Navigate to space-specific feed
  };

  const handleCreateSpace = () => {
    console.log("Creating new space");
    // TODO: Open create space modal
  };

  if (videosLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-muted animate-pulse rounded-xl"></div>
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-muted animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {categoryFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeCategory === filter.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveCategory(filter.value)}
            className={`whitespace-nowrap ${
              activeCategory === filter.value 
                ? "bg-foreground text-background hover:bg-foreground/90" 
                : "bg-muted text-foreground hover:bg-secondary"
            }`}
            data-testid={`filter-${filter.value || 'all'}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Search results for "{searchQuery}"
          </h2>
          {videos.length === 0 && (
            <p className="text-muted-foreground">No videos found matching your search.</p>
          )}
        </div>
      )}

      {/* Personal Mode Empty State */}
      {personalMode && videos.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">No subscription content</h2>
          <p className="text-muted-foreground">
            Subscribe to channels to see their content in Personal Mode.
          </p>
        </div>
      )}

      {/* Top Video Grid (First 2-3 rows = 8-12 videos) */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.slice(0, 12).map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => handleVideoClick(video)}
            />
          ))}
        </div>
      )}

      {/* Spaces Section - Only show for authenticated users */}
      {user && !searchQuery && videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="text-2xl">📁</span>
              Your Spaces
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:underline"
              onClick={() => window.location.href = "/spaces"}
              data-testid="button-view-all-spaces"
            >
              View all →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.slice(0, 3).map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onClick={() => handleSpaceClick(space)}
              />
            ))}

            {/* Create New Space CTA */}
            <div
              className="p-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary transition cursor-pointer"
              onClick={handleCreateSpace}
              data-testid="button-create-space"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Create New Space</p>
                <p className="text-xs text-muted-foreground">Organize your favorite channels</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Videos (After Spaces) */}
      {videos.length > 12 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.slice(12).map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => handleVideoClick(video)}
            />
          ))}
        </div>
      )}

      {/* Channel Creation Dialog - Only for authenticated users */}
      {user && (
        <ChannelCreationDialog 
          open={showChannelCreation}
          onOpenChange={setShowChannelCreation}
        />
      )}
    </div>
  );
}
