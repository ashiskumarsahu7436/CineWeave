import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Upload, MoreVertical, Eye, MessageSquare, ThumbsUp, Video, Pencil, Trash2, Play } from "lucide-react";
import { useLocation } from "wouter";
import UploadVideoDialog from "@/components/UploadVideoDialog";
import EditVideoDialog from "@/components/EditVideoDialog";

export default function StudioContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editVideoDialogOpen, setEditVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<any>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upload') === 'true') {
      setUploadDialogOpen(true);
      setLocation('/studio/content', { replace: true });
    }
  }, [location, setLocation]);

  const { data: channel } = useQuery<any>({
    queryKey: ['/api/users', user?.id, 'channel'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/channel`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: videos = [] } = useQuery<any[]>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const res = await fetch('/api/videos');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const channelVideos = videos.filter((v: any) => v.channelId === channel?.id);
  const channelShorts = channelVideos.filter((v: any) => v.isShorts === true);
  const channelLongVideos = channelVideos.filter((v: any) => !v.isShorts);

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success!",
        description: "Video deleted successfully",
      });
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const handleEditVideo = (video: any) => {
    setSelectedVideo(video);
    setEditVideoDialogOpen(true);
  };

  const handleDeleteClick = (video: any) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteVideoMutation.mutate(videoToDelete.id);
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility?.toLowerCase()) {
      case "private":
        return <Badge variant="secondary">Private</Badge>;
      case "unlisted":
        return <Badge variant="outline">Unlisted</Badge>;
      case "public":
      default:
        return <Badge variant="default">Public</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Channel content</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze your content</p>
        </div>
        <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload video
        </Button>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="shorts">Shorts</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across your channel"
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          {channelLongVideos.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Comments</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channelLongVideos.map((video: any) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                  {video.duration}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium line-clamp-2 text-sm">{video.title}</p>
                                  {video.isShorts && (
                                    <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary shrink-0">
                                      <Play className="h-3 w-3" />
                                      Short
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {video.description || 'No description'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getVisibilityBadge(video.visibility || "public")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">{video.views || 0}</TableCell>
                          <TableCell className="text-right">0</TableCell>
                          <TableCell className="text-right">
                            {video.likes || 0} ({video.dislikes ? `${(video.likes / (video.likes + video.dislikes) * 100).toFixed(1)}%` : '0%'})
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditVideo(video)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit video
                                </DropdownMenuItem>
                                <DropdownMenuItem>View analytics</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => handleDeleteClick(video)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No videos uploaded yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Start creating content for your channel. Upload your first video to get started.
                </p>
                <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Upload video
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shorts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across your shorts"
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          {channelShorts.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Short</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Comments</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channelShorts.map((video: any) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                  {video.duration}
                                </div>
                                <Badge variant="secondary" className="absolute top-1 left-1 text-xs px-1 py-0 bg-primary/90 text-white">
                                  <Play className="h-2 w-2" />
                                </Badge>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium line-clamp-2 text-sm">{video.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {video.description || 'No description'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getVisibilityBadge(video.visibility || "public")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">{video.views || 0}</TableCell>
                          <TableCell className="text-right">0</TableCell>
                          <TableCell className="text-right">
                            {video.likes || 0} ({video.dislikes ? `${(video.likes / (video.likes + video.dislikes) * 100).toFixed(1)}%` : '0%'})
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditVideo(video)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit short
                                </DropdownMenuItem>
                                <DropdownMenuItem>View analytics</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => handleDeleteClick(video)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shorts yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Create short-form vertical videos (under 60 seconds) to reach a wider audience
                </p>
                <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Upload short
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Go live</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Stream live content to connect with your audience in real-time
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Share community posts</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Engage with your subscribers through text, images, and polls
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Video className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create playlists</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Organize your videos into collections for easier viewing
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UploadVideoDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen} 
      />

      {selectedVideo && (
        <EditVideoDialog
          video={selectedVideo}
          open={editVideoDialogOpen}
          onOpenChange={setEditVideoDialogOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
