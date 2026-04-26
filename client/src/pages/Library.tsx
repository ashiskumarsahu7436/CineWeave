import { BookOpen, Clock, History as HistoryIcon, ListVideo, Plus } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Playlist } from "@shared/schema";

const libraryCategories = [
  { icon: HistoryIcon, title: "History", description: "Videos you've watched", path: "/history", color: "text-blue-500" },
  { icon: Clock, title: "Watch Later", description: "Videos saved for later", path: "/watch-later", color: "text-purple-500" },
];

export default function Library() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = (user as any)?.id;
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/playlists/${userId}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/playlists', {
        name: name.trim(),
        description: description.trim() || null,
        isPublic: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', userId] });
      setName("");
      setDescription("");
      setCreateOpen(false);
      toast({ title: 'Playlist created' });
    },
    onError: () => toast({ title: 'Could not create playlist', variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Library
        </h1>
        <p className="text-muted-foreground mt-1">Your personal collection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {libraryCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.path} href={category.path}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-${category.title.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={category.color}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Playlists</h2>
          <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-playlist">
            <Plus className="h-4 w-4 mr-1" /> New playlist
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ListVideo className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No playlists yet</p>
            <p className="text-sm text-muted-foreground">Create playlists to organize your favorite videos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((p) => (
              <Card key={p.id} className="hover-elevate cursor-pointer" data-testid={`card-playlist-${p.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <ListVideo className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{p.isPublic ? 'Public' : 'Private'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My playlist" data-testid="input-playlist-name" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description (optional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} data-testid="input-playlist-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
              data-testid="button-confirm-create-playlist"
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
