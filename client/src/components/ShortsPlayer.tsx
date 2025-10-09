import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Heart, 
  ThumbsDown,
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Repeat2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoWithChannel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatViews } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface ShortsPlayerProps {
  videos: VideoWithChannel[];
  initialIndex?: number;
  onClose?: () => void;
}

export default function ShortsPlayer({ videos, initialIndex = 0, onClose }: ShortsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentVideo = videos[currentIndex];

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Auto-play on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentVideo]);

  // Fetch video stats
  const { data: stats } = useQuery({
    queryKey: ["/api/videos", currentVideo?.id, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/stats`);
      if (!res.ok) return { likes: 0, dislikes: 0, comments: 0 };
      return res.json();
    },
    enabled: !!currentVideo,
  });

  // Check if user has liked/disliked the video
  const { data: likeStatus } = useQuery({
    queryKey: ["/api/videos", currentVideo?.id, "like-status"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/like-status`);
      if (!res.ok) return { hasLiked: false, hasDisliked: false };
      return res.json();
    },
    enabled: !!currentVideo && !!user,
  });

  // Check subscription status
  const { data: isSubscribed } = useQuery({
    queryKey: ["/api/subscriptions", currentVideo?.channelId, "status"],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${currentVideo.channelId}/status`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.isSubscribed;
    },
    enabled: !!currentVideo && !!user,
  });

  // Like/dislike mutation
  const likeMutation = useMutation({
    mutationFn: async (type: "like" | "dislike" | "none") => {
      const res = await fetch(`/api/videos/${currentVideo.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to update reaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", currentVideo.id, "like-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos", currentVideo.id, "stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Please sign in to react to videos",
        variant: "destructive",
      });
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/${currentVideo.channelId}`, {
        method: isSubscribed ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", currentVideo.channelId, "status"] });
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed",
        description: isSubscribed 
          ? `Unsubscribed from ${currentVideo.channel.name}` 
          : `Subscribed to ${currentVideo.channel.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like videos",
        variant: "destructive",
      });
      return;
    }
    const newType = likeStatus?.hasLiked ? "none" : "like";
    likeMutation.mutate(newType);
  };

  const handleDislike = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to dislike videos",
        variant: "destructive",
      });
      return;
    }
    const newType = likeStatus?.hasDisliked ? "none" : "dislike";
    likeMutation.mutate(newType);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/watch/${currentVideo.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentVideo.title,
          text: `Check out this short: ${currentVideo.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Short link has been copied to clipboard",
      });
    }
  };

  const goToChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/channel/${currentVideo.channelId}`);
  };

  // Touch handling for swipe
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isPlaying, isMuted, onClose]);

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white">No shorts available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Player */}
      <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlayPause}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="text-white font-semibold text-lg">Shorts</div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom info & controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6">
          <div className="flex items-end gap-3">
            {/* Video info */}
            <div className="flex-1 text-white space-y-3">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={goToChannel}
              >
                <img
                  src={currentVideo.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"}
                  alt={currentVideo.channel.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-base">{currentVideo.channel.name}</span>
                    {currentVideo.channel.verified && (
                      <CheckCircle className="h-4 w-4 text-blue-400 fill-blue-400" />
                    )}
                  </div>
                  <span className="text-xs text-white/70">
                    {(currentVideo.channel.subscribers || 0).toLocaleString()} subscribers
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    subscribeMutation.mutate();
                  }}
                  className={`rounded-full px-4 h-9 font-semibold ${
                    isSubscribed 
                      ? "bg-white/20 text-white hover:bg-white/30" 
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </div>

              <h3 className="font-medium text-base line-clamp-2 leading-snug">
                {currentVideo.title}
              </h3>

              {currentVideo.description && (
                <p className="text-sm text-white/80 line-clamp-2 leading-snug">
                  {currentVideo.description}
                </p>
              )}

              <p className="text-xs text-white/60">
                {formatViews(currentVideo.views || 0)} views
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-5 pb-2">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
              >
                <div className="relative">
                  <Heart
                    className={`h-8 w-8 ${likeStatus?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
                  />
                </div>
                <span className="text-xs font-medium">{formatViews(stats?.likes || 0)}</span>
              </button>

              <button
                onClick={handleDislike}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
              >
                <ThumbsDown
                  className={`h-7 w-7 ${likeStatus?.hasDisliked ? "fill-white" : ""}`}
                />
                <span className="text-xs font-medium">Dislike</span>
              </button>

              <button
                onClick={() => setLocation(`/watch/${currentVideo.id}`)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
              >
                <MessageCircle className="h-8 w-8" />
                <span className="text-xs font-medium">{stats?.comments || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
              >
                <Share2 className="h-8 w-8" />
                <span className="text-xs font-medium">Share</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
                onClick={() => toast({ title: "Remix", description: "Feature coming soon!" })}
              >
                <Repeat2 className="h-7 w-7" />
                <span className="text-xs font-medium">Remix</span>
              </button>

              <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
                <MoreVertical className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <ChevronUp className="h-7 w-7" />
          </button>
        )}

        {currentIndex < videos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute bottom-[40%] right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <ChevronDown className="h-7 w-7" />
          </button>
        )}

        {/* Progress indicator */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {videos.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 w-8 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-white"
                  : idx < currentIndex
                  ? "bg-white/60"
                  : "bg-white/30"
              }`}
            />
          ))}
          {videos.length > 10 && <span className="text-white/50 text-xs">...</span>}
        </div>
      </div>
    </div>
  );
}
