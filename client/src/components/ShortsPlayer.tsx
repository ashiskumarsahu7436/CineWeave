import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Pause,
  Loader2,
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

const MUTE_PREF_KEY = "cw_shorts_muted";
const LOOP_PREF_KEY = "cw_shorts_loop";
const VIEW_THRESHOLD_SECONDS = 3;

function loadMutePref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_PREF_KEY) === "1";
}
function saveMutePref(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_PREF_KEY, muted ? "1" : "0");
}
function loadLoopPref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOOP_PREF_KEY) === "1";
}
function saveLoopPref(loop: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOOP_PREF_KEY, loop ? "1" : "0");
}

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

export default function ShortsPlayer({
  videos,
  initialIndex = 0,
  onClose,
}: ShortsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState<boolean>(loadMutePref());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState<boolean>(loadLoopPref());
  const [showPlayPauseFlash, setShowPlayPauseFlash] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);
  const [skipFlash, setSkipFlash] = useState<"left" | "right" | null>(null);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const viewedSetRef = useRef<Set<string>>(new Set());
  const heartIdRef = useRef(0);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });
  const skipFlashTimeout = useRef<NodeJS.Timeout | null>(null);
  const playPauseFlashTimeout = useRef<NodeJS.Timeout | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasPausedByPressRef = useRef(false);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentVideo = videos[currentIndex];

  // Indices of slides we keep mounted (current ± 1).
  const visibleIndices = useMemo(() => {
    const out: number[] = [];
    for (let i = currentIndex - 1; i <= currentIndex + 1; i++) {
      if (i >= 0 && i < videos.length) out.push(i);
    }
    return out;
  }, [currentIndex, videos.length]);

  // Track container height for translateY math.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- Active video lifecycle ----
  // Whenever the active video changes, pause others and play the active one.
  useEffect(() => {
    if (!currentVideo) return;
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (!vid) return;
      vid.muted = isMuted;
      if (id === currentVideo.id) {
        vid.currentTime = 0;
        if (isPlaying) {
          void vid.play().catch(() => {});
        }
      } else {
        vid.pause();
      }
    });
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsExpandedDesc(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.id]);

  // Keep mute/loop state synced to the active video element.
  useEffect(() => {
    Object.values(videoRefs.current).forEach((vid) => {
      if (vid) vid.muted = isMuted;
    });
  }, [isMuted]);

  // Apply play/pause to active video.
  useEffect(() => {
    const vid = videoRefs.current[currentVideo?.id ?? ""];
    if (!vid) return;
    if (isPlaying) void vid.play().catch(() => {});
    else vid.pause();
  }, [isPlaying, currentVideo?.id]);

  // Subscribe to active video events for progress / buffering.
  useEffect(() => {
    const vid = videoRefs.current[currentVideo?.id ?? ""];
    if (!vid) return;

    const handleTime = () => {
      setCurrentTime(vid.currentTime);
      if (vid.duration > 0) {
        setProgress((vid.currentTime / vid.duration) * 100);
      }
      // Fire view event after threshold.
      if (
        currentVideo &&
        vid.currentTime >= VIEW_THRESHOLD_SECONDS &&
        !viewedSetRef.current.has(currentVideo.id)
      ) {
        viewedSetRef.current.add(currentVideo.id);
        // Best effort - server may or may not have this endpoint; ignore failures.
        fetch(`/api/videos/${currentVideo.id}/view`, { method: "POST" }).catch(
          () => {},
        );
      }
    };
    const handleMeta = () => setDuration(vid.duration);
    const handleWaiting = () => setIsWaiting(true);
    const handlePlaying = () => setIsWaiting(false);
    const handleCanPlay = () => setIsWaiting(false);
    const handleEnded = () => {
      if (isLooping) {
        vid.currentTime = 0;
        void vid.play().catch(() => {});
      } else if (currentIndex < videos.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Last short - loop in place.
        vid.currentTime = 0;
        void vid.play().catch(() => {});
      }
    };

    vid.addEventListener("timeupdate", handleTime);
    vid.addEventListener("loadedmetadata", handleMeta);
    vid.addEventListener("waiting", handleWaiting);
    vid.addEventListener("playing", handlePlaying);
    vid.addEventListener("canplay", handleCanPlay);
    vid.addEventListener("ended", handleEnded);

    return () => {
      vid.removeEventListener("timeupdate", handleTime);
      vid.removeEventListener("loadedmetadata", handleMeta);
      vid.removeEventListener("waiting", handleWaiting);
      vid.removeEventListener("playing", handlePlaying);
      vid.removeEventListener("canplay", handleCanPlay);
      vid.removeEventListener("ended", handleEnded);
    };
  }, [currentVideo?.id, isLooping, currentIndex, videos.length]);

  // ---- Stats / like / subscription queries ----
  const { data: stats } = useQuery({
    queryKey: ["/api/videos", currentVideo?.id, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/stats`);
      if (!res.ok) return { likes: 0, dislikes: 0, comments: 0 };
      return res.json();
    },
    enabled: !!currentVideo,
  });

  const { data: likeStatus } = useQuery({
    queryKey: ["/api/videos", currentVideo?.id, "like-status"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${currentVideo.id}/like-status`);
      if (!res.ok) return { hasLiked: false, hasDisliked: false };
      return res.json();
    },
    enabled: !!currentVideo && !!user,
  });

  const { data: isSubscribed } = useQuery({
    queryKey: ["/api/subscriptions", currentVideo?.channelId, "status"],
    queryFn: async () => {
      const res = await fetch(
        `/api/subscriptions/${currentVideo.channelId}/status`,
      );
      if (!res.ok) return false;
      const data = await res.json();
      return data.isSubscribed;
    },
    enabled: !!currentVideo && !!user,
  });

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
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", currentVideo.id, "like-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/videos", currentVideo.id, "stats"],
      });
    },
    onError: () => {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to videos",
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/${currentVideo.channelId}`, {
        method: isSubscribed ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/subscriptions", currentVideo.channelId, "status"],
      });
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

  // ---- Actions ----
  const requireAuth = (msg: string): boolean => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: msg,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleLike = useCallback(() => {
    if (!requireAuth("Please sign in to like videos")) return;
    const newType = likeStatus?.hasLiked ? "none" : "like";
    likeMutation.mutate(newType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likeStatus?.hasLiked, user]);

  const handleDislike = () => {
    if (!requireAuth("Please sign in to dislike videos")) return;
    const newType = likeStatus?.hasDisliked ? "none" : "dislike";
    likeMutation.mutate(newType);
  };

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < videos.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, videos.length]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      saveMutePref(next);
      return next;
    });
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((l) => {
      const next = !l;
      saveLoopPref(next);
      toast({
        title: next ? "Loop on" : "Auto-advance",
        description: next
          ? "This short will replay when it ends."
          : "Will move to the next short when it ends.",
      });
      return next;
    });
  }, [toast]);

  const flashPlayPause = () => {
    setShowPlayPauseFlash(true);
    if (playPauseFlashTimeout.current) clearTimeout(playPauseFlashTimeout.current);
    playPauseFlashTimeout.current = setTimeout(
      () => setShowPlayPauseFlash(false),
      500,
    );
  };

  const togglePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
    flashPlayPause();
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const vid = videoRefs.current[currentVideo?.id ?? ""];
      if (!vid) return;
      vid.currentTime = Math.max(
        0,
        Math.min(vid.duration || 0, vid.currentTime + delta),
      );
      setSkipFlash(delta < 0 ? "left" : "right");
      if (skipFlashTimeout.current) clearTimeout(skipFlashTimeout.current);
      skipFlashTimeout.current = setTimeout(() => setSkipFlash(null), 400);
    },
    [currentVideo?.id],
  );

  const popHeart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const id = ++heartIdRef.current;
    const burst: HeartBurst = {
      id,
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    setHearts((prev) => [...prev, burst]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 800);
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
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Short link has been copied to clipboard",
      });
    }
  };

  const goToChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/channel/${currentVideo.channelId}`);
  };

  const goToWatchForComments = () => {
    setLocation(`/watch/${currentVideo.id}`);
  };

  // ---- Tap / double-tap / press / edge-skip on the video area ----
  const handleVideoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Long press to pause (TikTok-style peek).
    pressTimerRef.current = setTimeout(() => {
      const vid = videoRefs.current[currentVideo?.id ?? ""];
      if (vid && !vid.paused) {
        vid.pause();
        wasPausedByPressRef.current = true;
      }
    }, 280);
  };

  const handleVideoPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    // Cancel the press timer.
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // If the long press paused playback, resume it now and don't treat as tap.
    if (wasPausedByPressRef.current) {
      wasPausedByPressRef.current = false;
      const vid = videoRefs.current[currentVideo?.id ?? ""];
      if (vid) void vid.play().catch(() => {});
      return;
    }

    // If we were dragging vertically, don't treat as a tap.
    if (Math.abs(dragOffsetPx) > 10) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = Date.now();

    const lastTap = lastTapRef.current;
    const dx = x - lastTap.x;
    const dy = y - lastTap.y;
    const isDouble =
      now - lastTap.time < 300 && Math.hypot(dx, dy) < 40;

    if (isDouble) {
      // Double-tap: like + heart pop.
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      popHeart(e.clientX, e.clientY);
      if (user && !likeStatus?.hasLiked) {
        likeMutation.mutate("like");
      } else if (!user) {
        // Show heart anyway for feedback, but warn.
        toast({
          title: "Sign in required",
          description: "Please sign in to like videos",
          variant: "destructive",
        });
      }
      return;
    }

    lastTapRef.current = { time: now, x, y };

    // Defer single-tap action so a follow-up tap can win.
    setTimeout(() => {
      if (lastTapRef.current.time !== now) return; // a double-tap consumed it
      // Edge skip zones: outer 22% on each side = ±5s skip.
      const w = rect.width;
      if (x < w * 0.22) {
        seekBy(-5);
      } else if (x > w * 0.78) {
        seekBy(5);
      } else {
        togglePlayPause();
      }
    }, 280);
  };

  // ---- Vertical swipe (drag-follow) ----
  const handleSwipeStart = (clientY: number) => {
    if (isScrubbing) return;
    dragStartRef.current = { y: clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handleSwipeMove = (clientY: number) => {
    if (!dragStartRef.current) return;
    const delta = clientY - dragStartRef.current.y;
    // Restrict drag at boundaries.
    let limited = delta;
    if (currentIndex === 0 && delta > 0) limited = delta * 0.3;
    if (currentIndex === videos.length - 1 && delta < 0) limited = delta * 0.3;
    setDragOffsetPx(limited);
  };

  const handleSwipeEnd = () => {
    if (!dragStartRef.current) return;
    const elapsed = Date.now() - dragStartRef.current.time;
    const distance = dragOffsetPx;
    dragStartRef.current = null;
    setIsDragging(false);

    const threshold = Math.min(120, containerHeight * 0.15);
    const velocity = Math.abs(distance) / Math.max(elapsed, 1); // px/ms
    const flicked = velocity > 0.5 && Math.abs(distance) > 30;

    if (distance < -threshold || (flicked && distance < 0)) {
      goNext();
    } else if (distance > threshold || (flicked && distance > 0)) {
      goPrev();
    }
    setDragOffsetPx(0);
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) =>
    handleSwipeStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) =>
    handleSwipeMove(e.touches[0].clientY);
  const onTouchEnd = () => handleSwipeEnd();

  // ---- Progress bar scrubbing ----
  const seekToFraction = (fraction: number) => {
    const vid = videoRefs.current[currentVideo?.id ?? ""];
    if (!vid || !vid.duration) return;
    vid.currentTime = Math.max(0, Math.min(1, fraction)) * vid.duration;
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    if (!bar) return;
    setIsScrubbing(true);
    const rect = bar.getBoundingClientRect();
    seekToFraction((e.clientX - rect.left) / rect.width);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    seekToFraction((e.clientX - rect.left) / rect.width);
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    setIsScrubbing(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  // ---- Keyboard navigation ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlayPause();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(5);
          break;
        case "j":
        case "J":
          e.preventDefault();
          seekBy(-10);
          break;
        case "l":
        case "L":
          e.preventDefault();
          seekBy(10);
          break;
        case "Escape":
          if (onClose) {
            e.preventDefault();
            onClose();
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, togglePlayPause, toggleMute, seekBy, onClose]);

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-white">No shorts available</p>
      </div>
    );
  }

  const dragPct = containerHeight ? (dragOffsetPx / containerHeight) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      data-testid="shorts-player"
    >
      <div className="relative w-full h-full mx-auto max-w-[500px]">
        {/* Slide stack — current ± 1 mounted, transformed vertically */}
        {visibleIndices.map((i) => {
          const v = videos[i];
          const offsetSlots = i - currentIndex; // -1, 0, 1
          const transform = `translateY(calc(${offsetSlots * 100}% + ${dragOffsetPx}px))`;
          const isActive = i === currentIndex;
          return (
            <div
              key={v.id}
              className={`absolute inset-0 ${
                isDragging ? "" : "transition-transform duration-300 ease-out"
              }`}
              style={{ transform }}
            >
              <div
                className="relative w-full h-full bg-black flex items-center justify-center"
                onPointerDown={isActive ? handleVideoPointerDown : undefined}
                onPointerUp={isActive ? handleVideoPointerUp : undefined}
                onTouchStart={isActive ? onTouchStart : undefined}
                onTouchMove={isActive ? onTouchMove : undefined}
                onTouchEnd={isActive ? onTouchEnd : undefined}
                style={{ touchAction: "none" }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[v.id] = el;
                  }}
                  src={v.videoUrl}
                  className="w-full h-full object-contain bg-black"
                  loop={false}
                  muted={isActive ? isMuted : true}
                  playsInline
                  preload={isActive ? "auto" : "metadata"}
                  data-testid={isActive ? "video-active" : undefined}
                />

                {/* Subtle bottom gradient on every slide for readability */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
              </div>
            </div>
          );
        })}

        {/* Buffering spinner (active slide) */}
        {isWaiting && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Loader2 className="h-12 w-12 text-white animate-spin drop-shadow-lg" />
          </div>
        )}

        {/* Play / Pause flash */}
        {showPlayPauseFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/50 rounded-full p-5 animate-in fade-in zoom-in duration-200">
              {isPlaying ? (
                <Play className="h-14 w-14 text-white" fill="white" />
              ) : (
                <Pause className="h-14 w-14 text-white" fill="white" />
              )}
            </div>
          </div>
        )}

        {/* Static play button when paused */}
        {!isPlaying && !showPlayPauseFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/15 backdrop-blur-md rounded-full p-6 animate-in fade-in duration-200">
              <Play className="h-16 w-16 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Edge skip flash */}
        {skipFlash && (
          <div
            className={`absolute top-0 bottom-0 ${
              skipFlash === "left" ? "left-0 right-1/2" : "right-0 left-1/2"
            } flex items-center justify-center pointer-events-none z-10`}
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 animate-in fade-in zoom-in duration-200">
              <span className="text-white font-bold text-base">
                {skipFlash === "left" ? "−5s" : "+5s"}
              </span>
            </div>
          </div>
        )}

        {/* Heart bursts (double-tap to like) */}
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-200"
            style={{ left: h.x, top: h.y }}
          >
            <Heart
              className="h-24 w-24 text-red-500 drop-shadow-2xl"
              fill="currentColor"
              style={{
                animation:
                  "heart-pop 800ms cubic-bezier(0.2, 0.9, 0.4, 1) forwards",
              }}
            />
          </div>
        ))}

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-lg shadow-lg">
              <Play className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">
              Shorts
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={toggleMute}
              data-testid="button-mute"
              title={isMuted ? "Unmute (m)" : "Mute (m)"}
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:bg-white/20 h-10 w-10 ${
                isLooping ? "bg-white/20" : ""
              }`}
              onClick={toggleLoop}
              data-testid="button-loop"
              title={
                isLooping ? "Loop on (replay)" : "Auto-advance to next short"
              }
            >
              <Repeat2 className="h-6 w-6" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={onClose}
                data-testid="button-close"
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Position indicator (X / Y) */}
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/40 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>

        {/* Bottom info & actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-6 sm:pb-8 z-20">
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="flex-1 text-white space-y-3 min-w-0">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={goToChannel}
              >
                <img
                  src={
                    currentVideo.channel.avatar ||
                    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop"
                  }
                  alt={currentVideo.channel.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/60 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg truncate">
                      {currentVideo.channel.name}
                    </span>
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
                    if (!requireAuth("Please sign in to subscribe to channels"))
                      return;
                    subscribeMutation.mutate();
                  }}
                  className={`rounded-full px-5 sm:px-7 h-10 sm:h-11 font-bold text-sm sm:text-base transition-all shadow-lg ${
                    isSubscribed
                      ? "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  data-testid="button-subscribe"
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </div>

              <h3 className="font-semibold text-base sm:text-lg line-clamp-2 leading-snug">
                {currentVideo.title}
              </h3>

              {currentVideo.description && (
                <div>
                  <p
                    className={`text-sm sm:text-base text-white/80 leading-snug whitespace-pre-wrap ${
                      isExpandedDesc ? "" : "line-clamp-2"
                    }`}
                  >
                    {currentVideo.description}
                  </p>
                  {currentVideo.description.length > 80 && (
                    <button
                      onClick={() => setIsExpandedDesc((v) => !v)}
                      className="text-white/90 text-xs sm:text-sm font-semibold mt-1 hover:underline"
                      data-testid="button-toggle-desc"
                    >
                      {isExpandedDesc ? "less" : "…more"}
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs sm:text-sm text-white/60 font-medium">
                {formatViews(currentVideo.views || 0)} views
              </p>
            </div>

            {/* Action rail */}
            <div className="flex flex-col items-center gap-5 sm:gap-6 pb-2">
              <ActionButton
                onClick={handleLike}
                icon={
                  <Heart
                    className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors ${
                      likeStatus?.hasLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                }
                label={formatViews(stats?.likes || 0)}
                testId="button-like"
              />
              <ActionButton
                onClick={handleDislike}
                icon={
                  <ThumbsDown
                    className={`h-6 w-6 sm:h-7 sm:w-7 ${
                      likeStatus?.hasDisliked ? "fill-white" : ""
                    }`}
                  />
                }
                label="Dislike"
                testId="button-dislike"
              />
              <ActionButton
                onClick={goToWatchForComments}
                icon={<MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />}
                label={String(stats?.comments || 0)}
                testId="button-comments"
              />
              <ActionButton
                onClick={handleShare}
                icon={<Share2 className="h-6 w-6 sm:h-7 sm:w-7" />}
                label="Share"
                testId="button-share"
              />
              <ActionButton
                onClick={() =>
                  toast({
                    title: "Remix",
                    description: "Feature coming soon!",
                  })
                }
                icon={<Repeat2 className="h-6 w-6 sm:h-7 sm:w-7" />}
                label="Remix"
                testId="button-remix"
              />
              <ActionButton
                onClick={() =>
                  toast({
                    title: "More",
                    description: "More options coming soon!",
                  })
                }
                icon={<MoreVertical className="h-6 w-6 sm:h-7 sm:w-7" />}
                label=""
                testId="button-more"
              />
            </div>
          </div>

          {/* Progress bar (scrubbable) */}
          <div className="mt-3 sm:mt-4">
            <div
              ref={progressBarRef}
              className={`relative w-full bg-white/25 rounded-full cursor-pointer touch-none transition-[height] duration-200 ${
                isScrubbing ? "h-2" : "h-1 hover:h-1.5"
              }`}
              onPointerDown={handleProgressPointerDown}
              onPointerMove={handleProgressPointerMove}
              onPointerUp={handleProgressPointerUp}
              onPointerCancel={handleProgressPointerUp}
              data-testid="progress-bar"
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${progress}%` }}
              />
              {isScrubbing && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg"
                  style={{ left: `calc(${progress}% - 7px)` }}
                />
              )}
            </div>
            {isScrubbing && duration > 0 && (
              <div className="mt-1 text-center text-white/90 text-xs font-semibold tabular-nums">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="hidden md:flex absolute top-1/2 right-6 -translate-y-1/2 items-center justify-center text-white/90 hover:text-white hover:bg-white/20 rounded-full p-3 transition-all z-20"
            data-testid="button-prev"
          >
            <ChevronUp className="h-8 w-8" />
          </button>
        )}
        {currentIndex < videos.length - 1 && (
          <button
            onClick={goNext}
            className="hidden md:flex absolute bottom-[42%] right-6 items-center justify-center text-white/90 hover:text-white hover:bg-white/20 rounded-full p-3 transition-all z-20"
            data-testid="button-next"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* Heart-pop keyframes (scoped here to keep things self-contained) */}
      <style>{`
        @keyframes heart-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          25%  { transform: scale(1.25); opacity: 1; }
          60%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4) translateY(-30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function formatSeconds(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  testId?: string;
}

function ActionButton({ onClick, icon, label, testId }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 text-white hover:scale-110 active:scale-95 transition-all duration-200"
      data-testid={testId}
    >
      <div className="relative bg-white/10 rounded-full p-2 sm:p-2.5 backdrop-blur-sm hover:bg-white/20 transition-colors">
        {icon}
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-bold drop-shadow-lg">
          {label}
        </span>
      )}
    </button>
  );
}
