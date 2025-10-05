import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceWithChannels } from "@shared/schema";

interface SpaceCardProps {
  space: SpaceWithChannels;
  onClick?: () => void;
}

const iconClasses: Record<string, string> = {
  blue: "from-blue-500 to-purple-600",
  green: "from-green-500 to-teal-600",
  pink: "from-pink-500 to-red-600",
  orange: "from-orange-500 to-yellow-600",
  purple: "from-purple-500 to-indigo-600",
};

const iconComponents: Record<string, string> = {
  "Gaming Space": "🎮",
  "Tech & Education": "🎓", 
  "Movies & Reviews": "🎬",
  "Music & Audio": "🎵",
  "Sports & Fitness": "⚽",
  "Default": "📁",
};

export default function SpaceCard({ space, onClick }: SpaceCardProps) {
  const gradientClass = iconClasses[space.color || "blue"] || iconClasses.blue;
  const icon = iconComponents[space.name] || iconComponents.Default;
  
  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:border-primary transition cursor-pointer"
      onClick={onClick}
      data-testid={`space-card-${space.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            // Handle space options
          }}
          data-testid={`button-space-options-${space.id}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{space.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">
        {space.channels.length} channels • {space.videoCount} videos
      </p>
      <div className="flex -space-x-2">
        {space.channels.slice(0, 3).map((channel) => (
          <div
            key={channel.id}
            className="w-8 h-8 rounded-full border-2 border-card bg-muted overflow-hidden"
          >
            <img
              src={channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"}
              alt={channel.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {space.channels.length > 3 && (
          <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium">
            +{space.channels.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
