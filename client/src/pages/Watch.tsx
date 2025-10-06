import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ThumbsUp, ThumbsDown, Share2, Flag, Clock, Send, Edit, Trash, Reply, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { VideoWithChannel, Comment } from "@shared/schema";
import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

interface CommentWithUser extends Comment {
  user?: {
    id: string;
    username: string | null;
    profileImageUrl: string | null;
  };
  replies?: CommentWithUser[];
}

export default function Watch() {
  const [, params] = useRoute("/watch/:id");
  const [, setLocation] = useLocation();
  const videoId = params?.id;
  const { currentUserId } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: video, isLoading } = useQuery<VideoWithChannel>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}`);
      if (!response.ok) throw new Error('Failed to fetch video');
      return response.json();
    },
    enabled: !!videoId
  });

  const { data: likeCounts = { likes: 0, dislikes: 0 } } = useQuery({
    queryKey: ["/api/videos/likes", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/likes`);
      if (!response.ok) return { likes: 0, dislikes: 0 };
      return response.json();
    },
    enabled: !!videoId
  });

  const { data: userLike } = useQuery({
    queryKey: ["/api/videos/user-like", videoId, currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/user-like/${currentUserId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!videoId && !!currentUserId
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["/api/subscriptions", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/${currentUserId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUserId
  });

  const isSubscribed = subscriptions.some((sub: any) => sub.channelId === video?.channelId);

  const { data: comments = [] } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/videos/comments", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/comments`);
      if (!response.ok) return [];
      const data = await response.json();
      
      const topLevelComments = data.filter((c: Comment) => !c.parentId);
      const replies = data.filter((c: Comment) => c.parentId);
      
      return topLevelComments.map((comment: Comment) => ({
        ...comment,
        replies: replies.filter((r: Comment) => r.parentId === comment.id)
      }));
    },
    enabled: !!videoId
  });

  const { data: relatedVideos = [] } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/related", videoId],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      if (!response.ok) return [];
      const allVideos = await response.json();
      return allVideos.filter((v: VideoWithChannel) => v.id !== videoId).slice(0, 10);
    },
    enabled: !!videoId
  });

  const trackViewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/view`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to track view');
      return response.json();
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (type: 'like' | 'dislike') => {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error('Failed to like/dislike');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/likes", videoId] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/user-like", videoId, currentUserId] });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to like videos", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to like/dislike video", 
          variant: "destructive" 
        });
      }
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (isSubscribed) {
        const response = await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: video?.channelId })
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('UNAUTHORIZED');
          }
          throw new Error('Failed to unsubscribe');
        }
      } else {
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: video?.channelId })
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('UNAUTHORIZED');
          }
          throw new Error('Failed to subscribe');
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", currentUserId] });
      toast({
        title: isSubscribed ? "Unsubscribed" : "Subscribed",
        description: isSubscribed 
          ? `Unsubscribed from ${video?.channel.name}` 
          : `Subscribed to ${video?.channel.name}`
      });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to manage subscriptions", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: isSubscribed ? "Failed to unsubscribe" : "Failed to subscribe", 
          variant: "destructive" 
        });
      }
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: data.content,
          parentId: data.parentId || null
        })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error('Failed to post comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/comments", videoId] });
      setCommentText("");
      setReplyTo(null);
      setReplyText("");
      toast({ title: "Comment posted" });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to comment", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to post comment", 
          variant: "destructive" 
        });
      }
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      const response = await fetch(`/api/comments/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content })
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error('Failed to update comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/comments", videoId] });
      setEditingComment(null);
      setEditText("");
      toast({ title: "Comment updated" });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to edit comments", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to update comment", 
          variant: "destructive" 
        });
      }
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error('Failed to delete comment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/comments", videoId] });
      toast({ title: "Comment deleted" });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to delete comments", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to delete comment", 
          variant: "destructive" 
        });
      }
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error('Failed to like comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos/comments", videoId] });
    },
    onError: (error: Error) => {
      if (error.message === 'UNAUTHORIZED') {
        toast({ 
          title: "Authentication required", 
          description: "Please log in to like comments", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to like comment", 
          variant: "destructive" 
        });
      }
    }
  });

  const handleVideoPlay = () => {
    if (!hasTrackedView && videoId) {
      trackViewMutation.mutate();
      setHasTrackedView(true);
    }
  };

  const handleLike = () => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to like videos", variant: "destructive" });
      return;
    }
    likeMutation.mutate('like');
  };

  const handleDislike = () => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to dislike videos", variant: "destructive" });
      return;
    }
    likeMutation.mutate('dislike');
  };

  const handleSubscribe = () => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to subscribe", variant: "destructive" });
      return;
    }
    subscribeMutation.mutate();
  };

  const handlePostComment = () => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to comment", variant: "destructive" });
      return;
    }
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ content: commentText });
  };

  const handlePostReply = (parentId: string) => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to reply", variant: "destructive" });
      return;
    }
    if (!replyText.trim()) return;
    createCommentMutation.mutate({ content: replyText, parentId });
  };

  const handleEditComment = (commentId: string) => {
    if (!editText.trim()) return;
    updateCommentMutation.mutate({ id: commentId, content: editText });
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleLikeComment = (commentId: string) => {
    if (!currentUserId) {
      toast({ title: "Please log in", description: "You must be logged in to like comments", variant: "destructive" });
      return;
    }
    likeCommentMutation.mutate(commentId);
  };

  const handleRelatedVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  if (isLoading || !video) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-muted animate-pulse rounded-xl"></div>
        <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
            <div className="h-3 bg-muted animate-pulse rounded w-1/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const CommentItem = ({ comment, isReply = false }: { comment: CommentWithUser; isReply?: boolean }) => {
    const isOwner = comment.userId === currentUserId;
    const isEditing = editingComment === comment.id;
    const isReplying = replyTo === comment.id;

    return (
      <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.user?.profileImageUrl || undefined} />
          <AvatarFallback>{comment.user?.username?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.user?.username || 'Anonymous'}</span>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={updateCommentMutation.isPending}
                  >
                    {updateCommentMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditingComment(null);
                    setEditText("");
                  }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleLikeComment(comment.id)}
                disabled={likeCommentMutation.isPending}
              >
                <Heart className="h-4 w-4 mr-1" />
                {comment.likes || 0}
              </Button>
              
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setReplyTo(comment.id);
                    setReplyText("");
                  }}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}

              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditText(comment.content);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="space-y-2 mt-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handlePostReply(comment.id)}
                  disabled={createCommentMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createCommentMutation.isPending ? "Posting..." : "Reply"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setReplyTo(null);
                  setReplyText("");
                }}>Cancel</Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            className="w-full h-full"
            onPlay={handleVideoPlay}
            onError={(e) => {
              console.error("Video error:", e);
              toast({ 
                title: "Video error", 
                description: "Failed to load video. Using placeholder.", 
                variant: "destructive" 
              });
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div>
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.channel.avatar || undefined} />
                <AvatarFallback>{video.channel.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold flex items-center gap-1">
                  {video.channel.name}
                  {video.channel.verified && (
                    <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {video.channel.subscribers?.toLocaleString()} subscribers
                </div>
              </div>
              <Button 
                variant={isSubscribed ? "secondary" : "default"} 
                className="ml-2"
                onClick={handleSubscribe}
                disabled={subscribeMutation.isPending}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-full overflow-hidden">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-none border-r ${userLike?.type === 'like' ? 'bg-primary/10' : ''}`}
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 ${userLike?.type === 'like' ? 'fill-current' : ''}`} />
                  {likeCounts.likes}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-none ${userLike?.type === 'dislike' ? 'bg-primary/10' : ''}`}
                  onClick={handleDislike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsDown className={`h-4 w-4 ${userLike?.type === 'dislike' ? 'fill-current' : ''}`} />
                  {likeCounts.dislikes}
                </Button>
              </div>
              <Button variant="secondary" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="secondary" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="secondary" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-muted rounded-lg p-4">
            <div className="flex gap-3 text-sm font-semibold mb-2">
              <span>{video.views?.toLocaleString()} views</span>
              <span>{new Date(video.uploadedAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{video.description || "No description available."}</p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">{comments.length} Comments</h2>
            
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{currentUserId ? 'U' : 'G'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePostComment}
                    disabled={createCommentMutation.isPending || !commentText.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createCommentMutation.isPending ? "Posting..." : "Comment"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Related Videos</h2>
        {relatedVideos.map((relatedVideo) => (
          <div 
            key={relatedVideo.id} 
            className="flex gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
            onClick={() => handleRelatedVideoClick(relatedVideo.id)}
          >
            <div className="w-40 flex-shrink-0 relative">
              <img
                src={relatedVideo.thumbnail}
                alt={relatedVideo.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
              {relatedVideo.duration && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {relatedVideo.duration}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2 mb-1">
                {relatedVideo.title}
              </h3>
              <p className="text-xs text-muted-foreground">{relatedVideo.channel.name}</p>
              <p className="text-xs text-muted-foreground">
                {relatedVideo.views?.toLocaleString()} views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
