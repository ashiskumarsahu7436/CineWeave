import { Play } from "lucide-react";
import { VideoWithChannel } from "@shared/schema";
import { formatViews } from "@/lib/utils";

interface ShortsCardProps {
  short: VideoWithChannel;
  onClick?: () => void;
}

export default function ShortsCard({ short, onClick }: ShortsCardProps) {
  return (
    <div
      className="flex-shrink-0 w-[160px] sm:w-[180px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[9/16] rounded-xl overflow-hidden relative mb-2 bg-muted">
        <img
          src={short.thumbnail}
          alt={short.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 rounded-full p-3">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>

        {/* Views count at bottom */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs font-medium">
            {formatViews(short.views || 0)} views
          </p>
        </div>
      </div>
      
      {/* Title and channel */}
      <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
        {short.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate">
        {short.channel.name}
      </p>
    </div>
  );
}
