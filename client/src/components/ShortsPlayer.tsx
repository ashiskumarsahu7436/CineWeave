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
  X,
  Play,
  Pause
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
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentVideo = videos[currentIndex];

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

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
        title: "Sign in required",
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
        title: "Sign in required",
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
    setShowControls(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
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
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
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
      onClick={() => setShowControls(true)}
    >
      {/* Video Player */}
      <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          className="w-full h-full object-contain bg-black"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlayPause}
        />

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-6">
              <Play className="h-16 w-16 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

        {/* Top controls */}
        <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-lg">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">Shorts</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom info & controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-6 sm:pb-8 z-20">
          <div className="flex items-end gap-3 sm:gap-4">
            {/* Video info - Mobile & Desktop optimized */}
            <div className="flex-1 text-white space-y-3">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={goToChannel}
              >
                <img
                  src={currentVideo.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"}
                  alt={currentVideo.channel.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/60 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg truncate">{currentVideo.channel.name}</span>
                    {currentVideo.channel.verified && (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 fill-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-white/70">
                    {(currentVideo.channel.subscribers || 0).toLocaleString()} subscribers
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    subscribeMutation.mutate();
                  }}
                  className={`rounded-full px-4 sm:px-6 h-9 sm:h-10 font-bold text-sm sm:text-base transition-all ${
                    isSubscribed 
                      ? "bg-white/20 text-white hover:bg-white/30" 
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </div>

              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 leading-snug">
                {currentVideo.title}
              </h3>

              {currentVideo.description && (
                <p className="text-sm sm:text-base text-white/80 line-clamp-2 leading-snug">
                  {currentVideo.description}
                </p>
              )}

              <p className="text-xs sm:text-sm text-white/60 font-medium">
                {formatViews(currentVideo.views || 0)} views
              </p>
            </div>

            {/* Action buttons - Mobile & Desktop optimized */}
            <div className="flex flex-col items-center gap-4 sm:gap-5 pb-2">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <div className="relative">
                  <Heart
                    className={`h-7 w-7 sm:h-9 sm:w-9 ${likeStatus?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold">{formatViews(stats?.likes || 0)}</span>
              </button>

              <button
                onClick={handleDislike}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <ThumbsDown
                  className={`h-6 w-6 sm:h-8 sm:w-8 ${likeStatus?.hasDisliked ? "fill-white" : ""}`}
                />
                <span className="text-xs sm:text-sm font-bold">Dislike</span>
              </button>

              <button
                onClick={() => setLocation(`/watch/${currentVideo.id}`)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <MessageCircle className="h-7 w-7 sm:h-9 sm:w-9" />
                <span className="text-xs sm:text-sm font-bold">{stats?.comments || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
              >
                <Share2 className="h-7 w-7 sm:h-9 sm:w-9" />
                <span className="text-xs sm:text-sm font-bold">Share</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform"
                onClick={() => toast({ title: "Remix", description: "Feature coming soon!" })}
              >
                <Repeat2 className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="text-xs sm:text-sm font-bold">Remix</span>
              </button>

              <button className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform">
                <MoreVertical className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation buttons - Desktop only */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="hidden md:flex absolute top-1/2 right-6 -translate-y-1/2 items-center justify-center text-white/90 hover:text-white hover:bg-white/20 rounded-full p-3 transition-all"
          >
            <ChevronUp className="h-8 w-8" />
          </button>
        )}

        {currentIndex < videos.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute bottom-[42%] right-6 items-center justify-center text-white/90 hover:text-white hover:bg-white/20 rounded-full p-3 transition-all"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        )}

        {/* Progress indicator */}
        <div className={`absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {videos.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-7 sm:w-10 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-white"
                  : idx < currentIndex
                  ? "bg-white/60"
                  : "bg-white/30"
              }`}
            />
          ))}
          {videos.length > 10 && <span className="text-white/60 text-xs sm:text-sm font-bold">+{videos.length - 10}</span>}
        </div>
      </div>
    </div>
  );
}
