import { useQuery } from "@tanstack/react-query";
import { VideoWithChannel } from "@shared/schema";
import ShortsPlayer from "@/components/ShortsPlayer";
import { Play } from "lucide-react";

export default function Shorts() {
  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/shorts"],
    queryFn: async () => {
      const response = await fetch('/api/videos/shorts');
      if (!response.ok) throw new Error('Failed to fetch shorts');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-2xl">
            <Play className="h-12 w-12 text-white fill-white animate-pulse" />
          </div>
          <p className="text-white text-lg font-medium">Loading Shorts...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 p-8 rounded-full">
            <Play className="h-20 w-20 text-red-500" />
          </div>
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">No shorts available</h2>
            <p className="text-white/70 text-lg">Check back later for new shorts!</p>
          </div>
        </div>
      </div>
    );
  }

  // Directly show the shorts player (YouTube style)
  return <ShortsPlayer videos={videos} initialIndex={0} />;
}
