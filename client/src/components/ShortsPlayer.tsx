import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoWithChannel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatViews } from "@/lib/utils";

interface ShortsPlayerProps {
  videos: VideoWithChannel[];
  initialIndex?: number;
}

export default function ShortsPlayer({ videos, initialIndex = 0 }: ShortsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Check if user has liked the video
  const { data: likeStatus } = useQuery({
    queryKey: ["/api/videos", currentVideo?.id, "like-status"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/like-status`);
      if (!res.ok) return { hasLiked: false };
      return res.json();
    },
    enabled: !!currentVideo,
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: likeStatus?.hasLiked ? "none" : "like" 
        }),
      });
      if (!res.ok) throw new Error("Failed to update like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", currentVideo.id, "like-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos", currentVideo.id, "stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
  });

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isPlaying, isMuted]);

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
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="text-white font-semibold text-lg">Shorts</div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>

        {/* Bottom info & controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6">
          <div className="flex items-end gap-3">
            {/* Video info */}
            <div className="flex-1 text-white space-y-2">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={goToChannel}
              >
                <img
                  src={currentVideo.channel.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"}
                  alt={currentVideo.channel.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{currentVideo.channel.name}</span>
                    {currentVideo.channel.verified && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs text-white/80">
                    {currentVideo.channel.subscribers?.toLocaleString()} subscribers
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-base line-clamp-2">
                {currentVideo.title}
              </h3>

              {currentVideo.description && (
                <p className="text-sm text-white/90 line-clamp-2">
                  {currentVideo.description}
                </p>
              )}

              <p className="text-xs text-white/70">
                {formatViews(currentVideo.views || 0)} views
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => likeMutation.mutate()}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
              >
                <Heart
                  className={`h-7 w-7 ${likeStatus?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="text-xs">Like</span>
              </button>

              <button
                onClick={() => setLocation(`/watch/${currentVideo.id}`)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
              >
                <MessageCircle className="h-7 w-7" />
                <span className="text-xs">Comment</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
              >
                <Share2 className="h-7 w-7" />
                <span className="text-xs">Share</span>
              </button>

              <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
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
            <ChevronUp className="h-6 w-6" />
          </button>
        )}

        {currentIndex < videos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute bottom-1/3 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        )}

        {/* Progress indicator */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-1">
          {videos.map((_, idx) => (
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
        </div>
      </div>
    </div>
  );
}
