import { MoreVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoWithChannel } from "@shared/schema";

interface VideoCardProps {
  video: VideoWithChannel;
  onClick?: () => void;
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div 
      className="video-card cursor-pointer"
      onClick={onClick}
      data-testid={`video-card-${video.id}`}
    >
      <div className="video-card-thumbnail rounded-xl overflow-hidden mb-3">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {video.isLive ? (
          <div className="live-badge">LIVE</div>
        ) : (
          <div className="duration-badge">{video.duration}</div>
        )}
      </div>
      <div className="flex gap-3">
        <div className="channel-avatar flex-shrink-0">
          <img 
            src={video.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"} 
            alt={video.channel.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
            {video.channel.name}
            {video.channel.verified && (
              <CheckCircle className="h-3 w-3 text-muted-foreground" />
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {video.isLive 
              ? `${formatViews(video.views ?? 0)} watching now`
              : `${formatViews(video.views ?? 0)} views • ${formatTimeAgo(video.uploadedAt!)}`
            }
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            // Handle options menu
          }}
          data-testid={`button-video-options-${video.id}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
