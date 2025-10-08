import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RotateCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomVideoPlayerProps {
  src: string;
  onPlay?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export default function CustomVideoPlayer({ src, onPlay, onError, videoRef: externalVideoRef }: CustomVideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("Auto");

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    if (newVolume > 0 && video.muted) {
      video.muted = false;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, video.duration);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    // Hide controls after 2s on mobile, 3s on desktop
    const isMobile = window.innerWidth < 768;
    const hideDelay = isMobile ? 2000 : 3000;
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, hideDelay);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        onError={onError}
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="h-20 w-20 rounded-full bg-white/90 hover:bg-white text-black"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <Play className="h-10 w-10 ml-1" fill="currentColor" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="w-full h-2 sm:h-1 bg-white/30 rounded-full cursor-pointer mb-2 sm:mb-3 hover:h-2.5 sm:hover:h-1.5 transition-all group touch-none"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-red-600 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between text-white gap-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-5 sm:w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 sm:h-5 sm:w-5" fill="currentColor" />
              )}
            </Button>

            {/* Skip Backward 10s - Mobile & Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={skipBackward}
              title="Rewind 10 seconds"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            {/* Skip Forward 10s - Mobile & Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={skipForward}
              title="Forward 10 seconds"
            >
              <RotateCw className="h-5 w-5" />
            </Button>

            {/* Volume - hide on very small screens */}
            <div className="hidden sm:flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100"
              />
            </div>

            {/* Time */}
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Playback Speed - Now visible on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs h-8 px-2 sm:px-3"
                >
                  {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={playbackRate === rate ? 'bg-primary/10' : ''}
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quality Settings - Now visible on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setQuality("Auto")} className={quality === "Auto" ? 'bg-primary/10' : ''}>
                  Auto (Current)
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-muted-foreground">
                  1080p (Coming soon)
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-muted-foreground">
                  720p (Coming soon)
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-muted-foreground">
                  480p (Coming soon)
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-muted-foreground">
                  360p (Coming soon)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 sm:h-9 sm:w-9"
              onClick={toggleFullscreen}
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
