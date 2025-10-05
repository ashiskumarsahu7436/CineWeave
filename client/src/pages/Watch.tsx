import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ThumbsUp, ThumbsDown, Share2, Flag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VideoCard from "@/components/VideoCard";
import { VideoWithChannel } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

export default function Watch() {
  const [, params] = useRoute("/watch/:id");
  const videoId = params?.id;

  const { data: video, isLoading } = useQuery<VideoWithChannel>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}`);
      if (!response.ok) throw new Error('Failed to fetch video');
      return response.json();
    },
    enabled: !!videoId
  });

  const { data: relatedVideos = [] } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/related", videoId],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!videoId
  });

  if (isLoading || !video) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-muted animate-pulse rounded-xl"></div>
        <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
            <div className="h-3 bg-muted animate-pulse rounded w-1/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.channel.avatar || undefined} />
                <AvatarFallback>{video.channel.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold flex items-center gap-1">
                  {video.channel.name}
                  {video.channel.verified && (
                    <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {video.channel.subscribers?.toLocaleString()} subscribers
                </div>
              </div>
              <Button variant="default" className="ml-2">Subscribe</Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="secondary" size="sm">
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="secondary" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="secondary" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-muted rounded-lg p-4">
            <div className="flex gap-3 text-sm font-semibold mb-2">
              <span>{video.views?.toLocaleString()} views</span>
              <span>{new Date(video.uploadedAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{video.description || "No description available."}</p>
          </div>

          <Separator className="my-4" />

          <div>
            <h2 className="font-semibold mb-4">Comments</h2>
            <div className="text-center py-8 text-muted-foreground">
              <p>Comments feature coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Related Videos</h2>
        {relatedVideos.slice(0, 10).map((relatedVideo) => (
          <div key={relatedVideo.id} className="flex gap-2">
            <div className="w-40 flex-shrink-0">
              <img
                src={relatedVideo.thumbnail}
                alt={relatedVideo.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                {relatedVideo.title}
              </h3>
              <p className="text-xs text-muted-foreground">{relatedVideo.channel.name}</p>
              <p className="text-xs text-muted-foreground">
                {relatedVideo.views?.toLocaleString()} views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
