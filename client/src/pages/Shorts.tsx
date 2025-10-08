import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { VideoWithChannel } from "@shared/schema";
import ShortsPlayer from "@/components/ShortsPlayer";

export default function Shorts() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/shorts"],
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
      <div className="max-w-md mx-auto space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (showPlayer && videos.length > 0) {
    return <ShortsPlayer videos={videos} initialIndex={initialIndex} />;
  }

  return (
    <div className="max-w-md mx-auto p-4">
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
          videos.map((video, index) => (
            <div
              key={video.id}
              className="aspect-[9/16] bg-muted rounded-2xl overflow-hidden relative cursor-pointer group hover:ring-2 hover:ring-primary transition-all"
              onClick={() => openPlayer(index)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 rounded-full p-4">
                  <Play className="h-12 w-12 text-white fill-white" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                <div className="flex items-center gap-2">
                  <img
                    src={video.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"}
                    alt={video.channel.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <p className="text-sm opacity-90">{video.channel.name}</p>
                </div>
                <p className="text-xs opacity-75 mt-1">{video.views?.toLocaleString()} views</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
