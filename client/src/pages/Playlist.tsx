import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, ListVideo, Play, Trash2, Edit, MoreVertical, Lock, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Playlist, PlaylistVideoWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function PlaylistPage() {
  const [, params] = useRoute("/playlist/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const playlistId = params?.id;
  const userId = (user as any)?.id;

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublic, setEditPublic] = useState(true);

  const { data: playlist, isLoading: playlistLoading } = useQuery<Playlist>({
    queryKey: ['/api/playlists/detail', playlistId],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/detail/${playlistId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Playlist not found');
      return res.json();
    },
    enabled: !!playlistId && !!userId,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<PlaylistVideoWithDetails[]>({
    queryKey: ['/api/playlists', playlistId, 'videos'],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}/videos`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!playlistId && !!userId,
  });

  const removeVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', playlistId, 'videos'] });
      toast({ title: 'Video removed from playlist' });
    },
    onError: () => toast({ title: 'Could not remove video', variant: 'destructive' }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', `/api/playlists/${playlistId}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        isPublic: editPublic,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists/detail', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', userId] });
      setEditOpen(false);
      toast({ title: 'Playlist updated' });
    },
    onError: () => toast({ title: 'Could not update playlist', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', userId] });
      toast({ title: 'Playlist deleted' });
      setLocation('/library');
    },
    onError: () => toast({ title: 'Could not delete playlist', variant: 'destructive' }),
  });

  const openEdit = () => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditDescription(playlist.description || "");
    setEditPublic(playlist.isPublic ?? true);
    setEditOpen(true);
  };

  const handleDelete = () => {
    if (confirm(`Delete playlist "${playlist?.name}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  if (playlistLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-40 h-24 bg-muted animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-16">
        <ListVideo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Playlist not found</h2>
        <Button variant="outline" onClick={() => setLocation('/library')}>Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/library')} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{playlist.name}</h1>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {playlist.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {playlist.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          {playlist.description && (
            <p className="text-muted-foreground mt-1 text-sm">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            {playlist.createdAt && ` · Created ${formatDistanceToNow(new Date(playlist.createdAt), { addSuffix: true })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {videos.length > 0 && (
            <Button
              size="sm"
              onClick={() => setLocation(`/watch/${videos[0].videoId}`)}
              data-testid="button-play-all"
            >
              <Play className="h-4 w-4 mr-1" fill="currentColor" />
              Play all
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={openEdit} data-testid="button-edit-playlist">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            data-testid="button-delete-playlist"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Videos list */}
      {videosLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-40 h-24 bg-muted animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <ListVideo className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-1">No videos in this playlist yet</p>
          <p className="text-sm text-muted-foreground">Add videos from any video's page using "Save to playlist"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((item, index) => (
            <div
              key={item.id}
              className="flex gap-3 group hover:bg-muted/50 p-2 rounded-lg cursor-pointer transition-colors"
              data-testid={`playlist-video-${item.videoId}`}
              onClick={() => setLocation(`/watch/${item.videoId}`)}
            >
              <span className="text-sm text-muted-foreground w-5 text-center flex-shrink-0 mt-8 select-none">
                {index + 1}
              </span>
              <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {item.video.thumbnail ? (
                  <img
                    src={item.video.thumbnail}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListVideo className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {item.video.duration && (
                  <span className="absolute bottom-1 right-1 text-xs bg-black/80 text-white px-1.5 py-0.5 rounded">
                    {item.video.duration}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{item.video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.video.channel?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(item.video.views || 0).toLocaleString()} views
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0 self-center"
                onClick={(e) => {
                  e.stopPropagation();
                  removeVideoMutation.mutate(item.videoId);
                }}
                data-testid={`button-remove-video-${item.videoId}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Playlist name"
                className="mt-1"
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="mt-1"
                data-testid="input-edit-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public playlist</p>
                <p className="text-xs text-muted-foreground">Anyone can view this playlist</p>
              </div>
              <Switch checked={editPublic} onCheckedChange={setEditPublic} data-testid="switch-edit-public" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!editName.trim() || editMutation.isPending}
              data-testid="button-save-edit"
            >
              {editMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
