import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  RotateCw,
  RotateCcw,
  Loader2,
  PictureInPicture2,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

interface CustomVideoPlayerProps {
  src: string;
  onPlay?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

type Quality = "Auto" | "1080p" | "720p" | "480p" | "360p";

const QUALITY_HEIGHTS: Record<Exclude<Quality, "Auto">, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "360p": 360,
};

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PREFS_KEY = "cw_player_prefs_v1";

interface Prefs {
  volume?: number;
  muted?: boolean;
  rate?: number;
  quality?: Quality;
}

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs: Prefs) {
  if (typeof window === "undefined") return;
  try {
    const current = loadPrefs();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    /* ignore */
  }
}

/**
 * Build a Cloudinary URL with a height transformation applied. If the source
 * isn't a Cloudinary URL, the original src is returned unchanged.
 */
function buildQualitySrc(src: string, quality: Quality): string {
  if (quality === "Auto") return src;
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }
  const height = QUALITY_HEIGHTS[quality];
  const transform = `h_${height},c_limit,q_auto`;
  // Strip any previously injected transformation block we added.
  const cleaned = src.replace(/\/upload\/(?:h_\d+,c_limit,q_auto\/)?/, "/upload/");
  return cleaned.replace("/upload/", `/upload/${transform}/`);
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CustomVideoPlayer({
  src,
  onPlay,
  onError,
  videoRef: externalVideoRef,
}: CustomVideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const initialPrefs = useRef<Prefs>(loadPrefs());

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState<number>(initialPrefs.current.volume ?? 1);
  const [isMuted, setIsMuted] = useState<boolean>(initialPrefs.current.muted ?? false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(initialPrefs.current.rate ?? 1);
  const [quality, setQuality] = useState<Quality>(initialPrefs.current.quality ?? "Auto");
  const [showPlayPauseAnimation, setShowPlayPauseAnimation] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [skipFlash, setSkipFlash] = useState<"left" | "right" | null>(null);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const playPauseAnimationTimeout = useRef<NodeJS.Timeout | null>(null);
  const skipFlashTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ side: "left" | "right" | null; time: number }>({
    side: null,
    time: 0,
  });
  // Track the position to resume after a quality switch.
  const pendingResumeRef = useRef<{ time: number; play: boolean } | null>(null);

  // Compute the actual src after applying quality transformation.
  const effectiveSrc = buildQualitySrc(src, quality);

  // ---- Video event listeners ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Restore preferences on the underlying element.
      video.volume = volume;
      video.muted = isMuted;
      video.playbackRate = playbackRate;
      // Restore time / play state if a quality switch is pending.
      if (pendingResumeRef.current) {
        const { time, play } = pendingResumeRef.current;
        pendingResumeRef.current = null;
        try {
          video.currentTime = time;
        } catch {
          /* ignore */
        }
        if (play) {
          void video.play().catch(() => {});
        }
      }
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleProgress = () => {
      try {
        if (video.buffered.length > 0 && video.duration > 0) {
          const end = video.buffered.end(video.buffered.length - 1);
          setBuffered((end / video.duration) * 100);
        }
      } catch {
        /* ignore */
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setIsWaiting(false);
      onPlay?.();
    };
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
      savePrefs({ volume: video.volume, muted: video.muted });
    };
    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
      savePrefs({ rate: video.playbackRate });
    };
    const handleWaiting = () => setIsWaiting(true);
    const handleCanPlay = () => setIsWaiting(false);
    const handleEnded = () => setIsPlaying(false);
    const handleEnterPip = () => setIsPip(true);
    const handleLeavePip = () => setIsPip(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ratechange", handleRateChange);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("enterpictureinpicture", handleEnterPip);
    video.addEventListener("leavepictureinpicture", handleLeavePip);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ratechange", handleRateChange);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("enterpictureinpicture", handleEnterPip);
      video.removeEventListener("leavepictureinpicture", handleLeavePip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPlay]);

  // ---- Fullscreen tracking ----
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ---- Imperative actions ----
  const showSkipFlash = (side: "left" | "right") => {
    setSkipFlash(side);
    if (skipFlashTimeout.current) clearTimeout(skipFlashTimeout.current);
    skipFlashTimeout.current = setTimeout(() => setSkipFlash(null), 500);
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }

    setShowPlayPauseAnimation(true);
    if (playPauseAnimationTimeout.current) {
      clearTimeout(playPauseAnimationTimeout.current);
    }
    playPauseAnimationTimeout.current = setTimeout(
      () => setShowPlayPauseAnimation(false),
      700,
    );
  }, [videoRef]);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(
        0,
        Math.min((video.duration || 0), video.currentTime + delta),
      );
      if (delta > 0) showSkipFlash("right");
      else if (delta < 0) showSkipFlash("left");
    },
    [videoRef],
  );

  const seekToFraction = useCallback(
    (fraction: number) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;
      video.currentTime = Math.max(0, Math.min(1, fraction)) * video.duration;
    },
    [videoRef],
  );

  const setVideoVolume = useCallback(
    (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;
      const v = Math.max(0, Math.min(1, newVolume));
      video.volume = v;
      if (v > 0 && video.muted) video.muted = false;
      if (v === 0) video.muted = true;
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
    }
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      void container.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((document as any).pictureInPictureEnabled) {
        await (video as any).requestPictureInPicture();
      }
    } catch {
      /* ignore */
    }
  }, [videoRef]);

  const changePlaybackRate = useCallback(
    (rate: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = rate;
    },
    [videoRef],
  );

  const cyclePlaybackRate = useCallback(
    (direction: 1 | -1) => {
      const idx = PLAYBACK_RATES.indexOf(playbackRate);
      const nextIdx = Math.max(
        0,
        Math.min(PLAYBACK_RATES.length - 1, (idx === -1 ? 3 : idx) + direction),
      );
      changePlaybackRate(PLAYBACK_RATES[nextIdx]);
    },
    [playbackRate, changePlaybackRate],
  );

  const changeQuality = useCallback(
    (q: Quality) => {
      if (q === quality) return;
      const video = videoRef.current;
      if (video) {
        pendingResumeRef.current = {
          time: video.currentTime,
          play: !video.paused,
        };
      }
      setQuality(q);
      savePrefs({ quality: q });
    },
    [quality, videoRef],
  );

  // ---- Progress bar interactions ----
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;
    const rect = progressBar.getBoundingClientRect();
    seekToFraction((e.clientX - rect.left) / rect.width);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar || !duration) return;
    const rect = progressBar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(fraction * duration);
    setHoverX(e.clientX - rect.left);
  };

  const handleProgressLeave = () => setHoverTime(null);

  // ---- Mouse / cursor / wheel ----
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2000);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Only intercept when hovering player
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    const step = 0.05;
    setVideoVolume(video.volume + (e.deltaY < 0 ? step : -step));
  };

  // ---- Double-tap to skip (mobile) ----
  const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = videoRef.current;
    const rect = (e.currentTarget as HTMLVideoElement).getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const side: "left" | "right" =
      tapX < rect.width / 2 ? "left" : "right";
    const now = Date.now();
    if (
      lastTapRef.current.side === side &&
      now - lastTapRef.current.time < 300
    ) {
      // Double tap: skip
      seekBy(side === "left" ? -10 : 10);
      lastTapRef.current = { side: null, time: 0 };
      return;
    }
    lastTapRef.current = { side, time: now };
    // Single tap behavior: toggle play after a short delay (so double-tap wins)
    setTimeout(() => {
      if (
        lastTapRef.current.side === side &&
        Date.now() - lastTapRef.current.time >= 290
      ) {
        if (video) togglePlay();
        lastTapRef.current = { side: null, time: 0 };
      }
    }, 300);
  };

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
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
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVideoVolume(video.volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVideoVolume(video.volume - 0.1);
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "i":
        case "I":
          e.preventDefault();
          void togglePip();
          break;
        case ">":
        case ".":
          if (e.shiftKey || e.key === ">") {
            e.preventDefault();
            cyclePlaybackRate(1);
          }
          break;
        case "<":
        case ",":
          if (e.shiftKey || e.key === "<") {
            e.preventDefault();
            cyclePlaybackRate(-1);
          }
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          e.preventDefault();
          const digit = parseInt(e.key, 10);
          seekToFraction(digit / 10);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    togglePlay,
    seekBy,
    setVideoVolume,
    toggleMute,
    toggleFullscreen,
    togglePip,
    cyclePlaybackRate,
    seekToFraction,
    videoRef,
  ]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const controlsVisible = showControls || !isPlaying;
  const VolumeIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 0.5
      ? Volume1
      : Volume2;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black group select-none ${
        controlsVisible ? "cursor-default" : "cursor-none"
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
        setHoverTime(null);
      }}
      onWheel={handleWheel}
      data-testid="video-player"
    >
      <video
        ref={videoRef}
        src={effectiveSrc}
        className="w-full h-full"
        playsInline
        onClick={handleVideoTap}
        onError={onError}
        data-testid="video-element"
      />

      {/* Buffering spinner */}
      {isWaiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Loader2 className="h-12 w-12 text-white animate-spin drop-shadow-lg" />
        </div>
      )}

      {/* Play/Pause toast (center) */}
      {showPlayPauseAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/60 rounded-full p-4 sm:p-6 animate-in fade-in zoom-in duration-200">
            {isPlaying ? (
              <Play className="h-12 w-12 sm:h-16 sm:w-16 text-white" fill="white" />
            ) : (
              <Pause className="h-12 w-12 sm:h-16 sm:w-16 text-white" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Skip flash (double-tap) */}
      {skipFlash && (
        <div
          className={`absolute top-0 bottom-0 ${
            skipFlash === "left" ? "left-0 right-1/2" : "right-0 left-1/2"
          } flex items-center justify-center pointer-events-none z-10`}
        >
          <div className="bg-black/40 rounded-full p-3 animate-in fade-in zoom-in duration-200">
            {skipFlash === "left" ? (
              <RotateCcw className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            ) : (
              <RotateCw className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Big center play button (paused state) */}
      {!isPlaying && !showPlayPauseAnimation && !isWaiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Button
            size="lg"
            className="pointer-events-auto h-20 w-20 rounded-full bg-white/90 hover:bg-white text-black transition-transform hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            data-testid="button-play-center"
          >
            <Play className="h-10 w-10 ml-1" fill="currentColor" />
          </Button>
        </div>
      )}

      {/* Side skip buttons (always-visible quick controls) */}
      <div
        className={`absolute inset-0 flex items-center justify-between px-4 sm:px-8 pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            seekBy(-10);
          }}
          title="Rewind 10 seconds (J)"
          data-testid="button-skip-back"
        >
          <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            seekBy(10);
          }}
          title="Forward 10 seconds (L)"
          data-testid="button-skip-forward"
        >
          <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2 sm:px-4 pb-2 sm:pb-3 pt-8 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative w-full h-1.5 sm:h-1 bg-white/25 rounded-full cursor-pointer mb-2 sm:mb-3 hover:h-2.5 sm:hover:h-2 transition-all group/progress touch-none"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
          data-testid="progress-bar"
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Played */}
          <div
            className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>

          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-1 rounded bg-black/85 text-white text-xs font-medium whitespace-nowrap pointer-events-none"
              style={{ left: hoverX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between text-white gap-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={togglePlay}
              data-testid="button-play-pause"
              title={isPlaying ? "Pause (k)" : "Play (k)"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </Button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1 group/volume">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={toggleMute}
                data-testid="button-mute"
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
              >
                <VolumeIcon className="h-5 w-5" />
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100 accent-white cursor-pointer"
                data-testid="input-volume"
              />
            </div>

            {/* Time */}
            <span className="text-xs sm:text-sm whitespace-nowrap tabular-nums" data-testid="text-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Picture-in-Picture */}
            {typeof document !== "undefined" &&
              (document as any).pictureInPictureEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9 ${
                    isPip ? "bg-white/20" : ""
                  }`}
                  onClick={() => void togglePip()}
                  data-testid="button-pip"
                  title="Picture-in-Picture (i)"
                >
                  <PictureInPicture2 className="h-5 w-5" />
                </Button>
              )}

            {/* Settings (speed + quality combined) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
                  data-testid="button-settings"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Playback</DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center justify-between">
                    <span>Speed</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {PLAYBACK_RATES.map((rate) => (
                        <DropdownMenuItem
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className="flex items-center justify-between"
                          data-testid={`menu-speed-${rate}`}
                        >
                          <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                          {playbackRate === rate && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center justify-between">
                    <span>Quality</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      {quality}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {(["Auto", "1080p", "720p", "480p", "360p"] as Quality[]).map(
                        (q) => (
                          <DropdownMenuItem
                            key={q}
                            onClick={() => changeQuality(q)}
                            className="flex items-center justify-between"
                            data-testid={`menu-quality-${q}`}
                          >
                            <span>{q}</span>
                            {quality === q && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Shortcuts: Space/K play · J/L ±10s · ←/→ ±5s · ↑/↓ vol · M
                  mute · F fullscreen · I PiP · 0–9 jump
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={toggleFullscreen}
              data-testid="button-fullscreen"
              title={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
