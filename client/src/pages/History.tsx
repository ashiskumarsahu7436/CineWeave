import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { History as HistoryIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchHistoryWithVideo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = (user as any)?.id;

  const { data: history = [], isLoading } = useQuery<WatchHistoryWithVideo[]>({
    queryKey: ['/api/watch-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/watch-history/${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: !!userId,
  });

  const removeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest('DELETE', `/api/watch-history/${userId}/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history', userId] });
    },
    onError: () => toast({ title: 'Could not remove from history', variant: 'destructive' }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/watch-history/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watch-history', userId] });
      toast({ title: 'Watch history cleared' });
    },
    onError: () => toast({ title: 'Could not clear history', variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            Watch History
          </h1>
          <p className="text-muted-foreground mt-1">Videos you've watched</p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            data-testid="button-clear-history"
          >
            Clear All History
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-60 h-32 bg-muted animate-pulse rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No watch history yet</p>
          <p className="text-sm text-muted-foreground">Videos you watch will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 group hover-elevate p-2 rounded-lg cursor-pointer"
              data-testid={`history-item-${item.videoId}`}
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
                <h3 className="font-semibold line-clamp-2" data-testid={`text-title-${item.videoId}`}>
                  {item.video.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{item.video.channel?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Watched {item.watchedAt ? formatDistanceToNow(new Date(item.watchedAt), { addSuffix: true }) : ''}
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
