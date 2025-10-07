import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import VideoCard from "@/components/VideoCard";
import { VideoWithChannel } from "@shared/schema";
import { 
  ShoppingBag, Music, Film, Radio, Gamepad2, 
  Newspaper, Volleyball, GraduationCap, Shirt, Mic 
} from "lucide-react";

const categoryConfig: Record<string, { icon: any; title: string; description: string }> = {
  shopping: { icon: ShoppingBag, title: "Shopping", description: "Product reviews and shopping content" },
  music: { icon: Music, title: "Music", description: "Music videos and performances" },
  movies: { icon: Film, title: "Movies", description: "Movie trailers and reviews" },
  live: { icon: Radio, title: "Live", description: "Live streams and broadcasts" },
  gaming: { icon: Gamepad2, title: "Gaming", description: "Gaming videos and streams" },
  news: { icon: Newspaper, title: "News", description: "Latest news and current events" },
  sports: { icon: Volleyball, title: "Sports", description: "Sports highlights and analysis" },
  courses: { icon: GraduationCap, title: "Courses", description: "Educational content" },
  fashion: { icon: Shirt, title: "Fashion & Beauty", description: "Fashion and beauty content" },
  podcasts: { icon: Mic, title: "Podcasts", description: "Podcast episodes" }
};

export default function Explore() {
  const [, params] = useRoute("/explore/:category");
  const [, navigate] = useLocation();
  const category = params?.category || "gaming";
  const config = categoryConfig[category] || categoryConfig.gaming;
  const Icon = config.icon;

  const { data: videos = [], isLoading } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/explore", category],
    queryFn: async () => {
      const response = await fetch(`/api/videos?category=${config.title}`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
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
          <Icon className="h-6 w-6" />
          {config.title}
        </h1>
        <p className="text-muted-foreground mt-1">{config.description}</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No {config.title.toLowerCase()} videos available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/watch/${video.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
