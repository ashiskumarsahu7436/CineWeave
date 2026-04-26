import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchLaterWithVideo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function WatchLater() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<WatchLaterWithVideo[]>({
    queryKey: ['/api/watch-later'],
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest('DELETE', `/api/watch-later/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watch-later'] });
    },
    onError: () => toast({ title: 'Could not remove video', variant: 'destructive' }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/watch-later');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watch-later'] });
      toast({ title: 'Watch Later cleared' });
    },
    onError: () => toast({ title: 'Could not clear list', variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Watch Later
          </h1>
          <p className="text-muted-foreground mt-1">Videos saved for later viewing</p>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            data-testid="button-clear-watch-later"
          >
            Clear All
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-60 h-32 bg-muted animate-pulse rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No videos saved yet</p>
          <p className="text-sm text-muted-foreground">Save videos to watch them later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 group hover-elevate p-2 rounded-lg cursor-pointer"
              data-testid={`watch-later-item-${item.videoId}`}
              onClick={() => setLocation(`/watch/${item.videoId}`)}
            >
              <div className="relative w-60 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                {item.video.thumbnail ? (
                  <img src={item.video.thumbnail} alt={item.video.title} className="w-full h-full object-cover" />
                ) : null}
                {item.video.duration && (
                  <span className="absolute bottom-1 right-1 text-xs bg-black/80 text-white px-1.5 py-0.5 rounded">
                    {item.video.duration}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-2">{item.video.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.video.channel?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Added {item.addedAt ? formatDistanceToNow(new Date(item.addedAt), { addSuffix: true }) : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMutation.mutate(item.videoId);
                }}
                data-testid={`button-remove-${item.videoId}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
