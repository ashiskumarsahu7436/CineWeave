import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { VideoWithChannel } from "@shared/schema";
import { useAppStore } from "@/store/useAppStore";

export default function Shorts() {
  const { currentUserId } = useAppStore();

  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos", { shorts: true }],
    queryFn: async () => {
      const response = await fetch('/api/videos?category=Shorts');
      if (!response.ok) throw new Error('Failed to fetch shorts');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Play className="h-6 w-6" />
          Shorts
        </h1>
        <p className="text-muted-foreground mt-1">Quick, vertical videos</p>
      </div>

      <div className="space-y-4">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No shorts available yet</p>
          </div>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="aspect-[9/16] bg-muted rounded-2xl overflow-hidden relative cursor-pointer group"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold mb-1">{video.title}</h3>
                <p className="text-sm opacity-90">{video.channel.name}</p>
                <p className="text-xs opacity-75 mt-1">{video.views?.toLocaleString()} views</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
