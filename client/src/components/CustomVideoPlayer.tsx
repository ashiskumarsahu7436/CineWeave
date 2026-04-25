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
  title?: string;
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
  title,
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
      className={`relative w-full h-full bg-black group select-none overflow-hidden ${
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
        className="w-full h-full object-contain bg-black"
        playsInline
        onClick={handleVideoTap}
        onError={onError}
        data-testid="video-element"
      />

      {/* Subtle vignette for cinematic feel */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.35))]" />

      {/* Buffering spinner */}
      {isWaiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-md scale-150" />
            <Loader2 className="relative h-10 w-10 sm:h-12 sm:w-12 text-white/95 animate-spin drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]" />
          </div>
        </div>
      )}

      {/* Play / Pause flash on toggle (subtle, no big circle) */}
      {showPlayPauseAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="rounded-full p-4 sm:p-5 bg-black/45 backdrop-blur-sm animate-in fade-in zoom-in-90 duration-300">
            {isPlaying ? (
              <Play className="h-9 w-9 sm:h-12 sm:w-12 text-white drop-shadow-lg" fill="currentColor" />
            ) : (
              <Pause className="h-9 w-9 sm:h-12 sm:w-12 text-white drop-shadow-lg" fill="currentColor" />
            )}
          </div>
        </div>
      )}

      {/* Skip flash (double-tap zones) */}
      {skipFlash && (
        <div
          className={`absolute top-0 bottom-0 ${
            skipFlash === "left" ? "left-0 right-1/2" : "right-0 left-1/2"
          } flex items-center justify-center pointer-events-none z-10`}
        >
          <div className="flex flex-col items-center gap-1 bg-black/35 backdrop-blur-md rounded-2xl px-4 py-3 animate-in fade-in zoom-in-90 duration-200">
            {skipFlash === "left" ? (
              <RotateCcw className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            ) : (
              <RotateCw className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            )}
            <span className="text-white text-xs font-semibold tabular-nums">
              {skipFlash === "left" ? "− 10s" : "+ 10s"}
            </span>
          </div>
        </div>
      )}

      {/* Center play button when paused — sleek glass, not solid white */}
      {!isPlaying && !showPlayPauseAnimation && !isWaiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="pointer-events-auto group/play relative h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/25 hover:ring-white/50 hover:bg-black/55 shadow-[0_8px_30px_rgba(0,0,0,0.55)] transition-all duration-300 hover:scale-110 flex items-center justify-center"
            data-testid="button-play-center"
            aria-label="Play"
          >
            <Play
              className="h-6 w-6 sm:h-7 sm:w-7 text-white ml-[3px] drop-shadow-lg"
              fill="currentColor"
            />
            <span className="absolute inset-0 rounded-full opacity-0 group-hover/play:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_70%)]" />
          </button>
        </div>
      )}

      {/* Top bar — title + safe-area gradient (only when controls visible) */}
      <div
        className={`absolute top-0 left-0 right-0 px-3 sm:px-5 pt-3 sm:pt-4 pb-10 bg-gradient-to-b from-black/65 via-black/25 to-transparent transition-all duration-300 z-10 ${
          controlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-white text-sm sm:text-base md:text-lg font-semibold drop-shadow-md line-clamp-1 max-w-[90%]">
            {title}
          </h2>
        )}
      </div>

      {/* Bottom controls — slim, glassy */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${
          controlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft gradient under everything */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        {/* Progress bar */}
        <div className="relative px-3 sm:px-5 pb-1">
          <div
            ref={progressRef}
            className="relative w-full h-1 hover:h-1.5 bg-white/20 rounded-full cursor-pointer transition-all duration-150 group/progress touch-none"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            data-testid="progress-bar"
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/35 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Played */}
            <div
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
              style={{ width: `${progress}%` }}
            >
              {/* Scrubber dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 scale-90 group-hover/progress:scale-100 transition-all shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
            </div>

            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[11px] font-semibold whitespace-nowrap pointer-events-none ring-1 ring-white/10 tabular-nums"
                style={{ left: hoverX }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
        </div>

        {/* Buttons row */}
        <div className="relative flex items-center text-white gap-0.5 sm:gap-1 px-1 sm:px-3 pb-2 sm:pb-2.5 pt-1">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            data-testid="button-play-pause"
            title={isPlaying ? "Pause (k)" : "Play (k)"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-[18px] w-[18px]" fill="currentColor" />
            ) : (
              <Play className="h-[18px] w-[18px] ml-[1px]" fill="currentColor" />
            )}
          </button>

          {/* Skip back / forward (compact, desktop) */}
          <button
            onClick={() => seekBy(-10)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Rewind 10s (J)"
            aria-label="Rewind 10 seconds"
            data-testid="button-skip-back"
          >
            <RotateCcw className="h-[17px] w-[17px]" />
          </button>
          <button
            onClick={() => seekBy(10)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            title="Forward 10s (L)"
            aria-label="Forward 10 seconds"
            data-testid="button-skip-forward"
          >
            <RotateCw className="h-[17px] w-[17px]" />
          </button>

          {/* Volume (desktop only — mobile uses system volume) */}
          <div className="hidden sm:flex items-center group/volume ml-0.5">
            <button
              onClick={toggleMute}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
              data-testid="button-mute"
              title={isMuted ? "Unmute (m)" : "Mute (m)"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <VolumeIcon className="h-[18px] w-[18px]" />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
              className="w-0 group-hover/volume:w-24 ml-0 group-hover/volume:ml-1 mr-0 group-hover/volume:mr-1 transition-all duration-200 opacity-0 group-hover/volume:opacity-100 accent-white cursor-pointer h-1"
              data-testid="input-volume"
            />
          </div>

          {/* Time */}
          <span
            className="text-[11px] sm:text-xs whitespace-nowrap tabular-nums ml-1 sm:ml-2 text-white/95"
            data-testid="text-time"
          >
            {formatTime(currentTime)}{" "}
            <span className="text-white/55">/ {formatTime(duration)}</span>
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Picture-in-Picture */}
          {typeof document !== "undefined" &&
            (document as any).pictureInPictureEnabled && (
              <button
                onClick={() => void togglePip()}
                className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition-colors ${
                  isPip ? "bg-white/15" : ""
                }`}
                data-testid="button-pip"
                title="Picture-in-Picture (i)"
                aria-label="Picture in Picture"
              >
                <PictureInPicture2 className="h-[17px] w-[17px]" />
              </button>
            )}

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
                data-testid="button-settings"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-[18px] w-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={12}
              className="w-60 bg-zinc-900/95 backdrop-blur-md border-white/10 text-white"
            >
              <DropdownMenuLabel className="text-white/60 text-[11px] uppercase tracking-wider font-medium">
                Playback
              </DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between focus:bg-white/10 data-[state=open]:bg-white/10">
                  <span>Speed</span>
                  <span className="text-xs text-white/60 ml-auto mr-2">
                    {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-zinc-900/95 backdrop-blur-md border-white/10 text-white">
                    {PLAYBACK_RATES.map((rate) => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className="flex items-center justify-between focus:bg-white/10"
                        data-testid={`menu-speed-${rate}`}
                      >
                        <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                        {playbackRate === rate && (
                          <Check className="h-4 w-4 text-red-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center justify-between focus:bg-white/10 data-[state=open]:bg-white/10">
                  <span>Quality</span>
                  <span className="text-xs text-white/60 ml-auto mr-2">
                    {quality}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-zinc-900/95 backdrop-blur-md border-white/10 text-white">
                    {(["Auto", "1080p", "720p", "480p", "360p"] as Quality[]).map(
                      (q) => (
                        <DropdownMenuItem
                          key={q}
                          onClick={() => changeQuality(q)}
                          className="flex items-center justify-between focus:bg-white/10"
                          data-testid={`menu-quality-${q}`}
                        >
                          <span>{q}</span>
                          {quality === q && (
                            <Check className="h-4 w-4 text-red-500" />
                          )}
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-white/10" />
              <div className="px-2 py-1.5 text-[10.5px] leading-relaxed text-white/55">
                <div className="font-semibold text-white/70 mb-0.5">Shortcuts</div>
                Space / K — play · J / L — ±10s · ← / → — ±5s
                <br />
                ↑ / ↓ — volume · M — mute · F — fullscreen
                <br />
                I — PiP · &lt; / &gt; — speed · 0–9 — jump
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            data-testid="button-fullscreen"
            title={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-[18px] w-[18px]" />
            ) : (
              <Maximize className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
