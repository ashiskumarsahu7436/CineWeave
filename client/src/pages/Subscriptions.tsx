import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { VideoWithChannel } from "@shared/schema";
import { useAppStore } from "@/store/useAppStore";

export default function Subscriptions() {
  const { currentUserId } = useAppStore();

  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/subscriptions/videos", currentUserId],
    queryFn: async () => {
      const subsResponse = await fetch(`/api/subscriptions/${currentUserId}`);
      if (!subsResponse.ok) return [];
      const subscriptions = await subsResponse.json();
      const channelIds = subscriptions.map((sub: any) => sub.channelId);
      
      if (channelIds.length === 0) return [];
      
      const videosResponse = await fetch(`/api/videos/by-channels?channelIds=${channelIds.join(',')}`);
      if (!videosResponse.ok) return [];
      return videosResponse.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">Latest from your subscribed channels</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No subscriptions yet</p>
          <p className="text-sm text-muted-foreground">Subscribe to channels to see their videos here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => console.log('Play video:', video.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
