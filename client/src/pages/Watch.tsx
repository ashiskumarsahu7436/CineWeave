import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ThumbsUp, ThumbsDown, Share2, Clock, Send, Edit, Trash, Reply, Heart, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
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
      return allVideos.filter((v: VideoWithChannel) => v.id !== videoId).slice(0, 15);
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
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
          <div className="space-y-4">
            <div className="aspect-video bg-muted animate-pulse rounded-2xl"></div>
            <div className="h-8 bg-muted animate-pulse rounded-lg w-3/4"></div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-muted animate-pulse rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded-lg w-1/4"></div>
                <div className="h-3 bg-muted animate-pulse rounded-lg w-1/6"></div>
              </div>
            </div>
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
      <div className={`flex gap-4 ${isReply ? 'ml-14 mt-3' : 'py-4'}`}>
        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background">
          <AvatarImage src={comment.user?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 min-w-0">
          <div>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm hover:text-primary cursor-pointer transition-colors">
                @{comment.user?.username || 'Anonymous'}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px] resize-none border-2 focus-visible:ring-2 focus-visible:ring-primary"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={updateCommentMutation.isPending}
                    className="rounded-full"
                  >
                    {updateCommentMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed break-words">{comment.content}</p>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-full hover:bg-primary/10 transition-all"
                onClick={() => handleLikeComment(comment.id)}
                disabled={likeCommentMutation.isPending}
              >
                <Heart className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">{comment.likes || 0}</span>
              </Button>
              
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-full hover:bg-primary/10 transition-all"
                  onClick={() => {
                    setReplyTo(comment.id);
                    setReplyText("");
                  }}
                >
                  <Reply className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Reply</span>
                </Button>
              )}

              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-full hover:bg-primary/10 transition-all"
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
                    className="h-9 px-3 rounded-full hover:bg-destructive/10 text-destructive transition-all"
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
            <div className="space-y-3 mt-3 bg-muted/30 rounded-xl p-4">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="min-h-[80px] resize-none bg-background"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handlePostReply(comment.id)}
                  disabled={createCommentMutation.isPending || !replyText.trim()}
                  className="rounded-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createCommentMutation.isPending ? "Posting..." : "Reply"}
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-1 mt-4">
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
    <div className="max-w-[1800px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
        {/* Main Content */}
        <div className="space-y-5">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
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

          {/* Video Title */}
          <h1 className="text-2xl font-bold leading-tight hover:text-primary/90 transition-colors cursor-default">
            {video.title}
          </h1>
          
          {/* Channel Info & Actions */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Channel Section */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background cursor-pointer hover:ring-primary transition-all">
                <AvatarImage src={video.channel.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                  {video.channel.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-base truncate hover:text-primary cursor-pointer transition-colors">
                    {video.channel.name}
                  </h2>
                  {video.channel.verified && (
                    <svg className="h-5 w-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {video.channel.subscribers?.toLocaleString()} subscribers
                </p>
              </div>
              <Button 
                variant={isSubscribed ? "secondary" : "default"} 
                className={`rounded-full px-6 h-10 font-semibold transition-all ${
                  isSubscribed 
                    ? 'hover:bg-secondary/80' 
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30'
                }`}
                onClick={handleSubscribe}
                disabled={subscribeMutation.isPending}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like/Dislike Group */}
              <div className="flex items-center bg-secondary/50 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-none h-10 px-4 ${userLike?.type === 'like' ? 'bg-primary/10 text-primary' : ''} hover:bg-primary/20 transition-all`}
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 ${userLike?.type === 'like' ? 'fill-current' : ''}`} />
                  <span className="font-semibold">{likeCounts.likes}</span>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-none h-10 px-4 ${userLike?.type === 'dislike' ? 'bg-primary/10 text-primary' : ''} hover:bg-primary/20 transition-all`}
                  onClick={handleDislike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsDown className={`h-4 w-4 ${userLike?.type === 'dislike' ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <Button variant="secondary" size="sm" className="rounded-full h-10 px-5 hover:bg-secondary/80 transition-all shadow-sm">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="font-semibold">Share</span>
              </Button>
              
              <Button variant="secondary" size="sm" className="rounded-full h-10 px-5 hover:bg-secondary/80 transition-all shadow-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-semibold">Save</span>
              </Button>
              
              <Button variant="secondary" size="sm" className="rounded-full h-10 px-3 hover:bg-secondary/80 transition-all shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-secondary/30 rounded-2xl p-5 hover:bg-secondary/40 transition-colors">
            <div className="flex gap-4 text-sm font-semibold mb-3">
              <span className="text-foreground">{video.views?.toLocaleString()} views</span>
              <span className="text-muted-foreground">
                {new Date(video.uploadedAt || Date.now()).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              {video.category && (
                <span className="px-3 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {video.category}
                </span>
              )}
            </div>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-2'}`}>
              {video.description || "No description available."}
            </div>
            {video.description && video.description.length > 100 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-foreground font-semibold hover:bg-transparent p-0 h-auto"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                {descriptionExpanded ? (
                  <>Show less <ChevronUp className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Show more <ChevronDown className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-6 pb-8">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-xl">{comments.length} Comments</h2>
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {currentUserId ? 'U' : 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[100px] resize-none border-2 focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentText("")}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePostComment}
                    disabled={createCommentMutation.isPending || !commentText.trim()}
                    className="rounded-full px-5"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createCommentMutation.isPending ? "Posting..." : "Comment"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <Separator />
            
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Send className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No comments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="space-y-3">
          <div className="sticky top-4 space-y-3">
            <h2 className="font-bold text-lg px-2">Related Videos</h2>
            <div className="space-y-3">
              {relatedVideos.map((relatedVideo) => (
                <div 
                  key={relatedVideo.id} 
                  className="group flex gap-3 cursor-pointer hover:bg-secondary/30 p-2 rounded-xl transition-all duration-200"
                  onClick={() => handleRelatedVideoClick(relatedVideo.id)}
                >
                  <div className="w-[168px] flex-shrink-0 relative rounded-lg overflow-hidden">
                    <img
                      src={relatedVideo.thumbnail}
                      alt={relatedVideo.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {relatedVideo.duration && !relatedVideo.isLive && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                        {relatedVideo.duration}
                      </div>
                    )}
                    {relatedVideo.isLive && (
                      <div className="absolute bottom-1.5 right-1.5 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase">
                        Live
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug">
                      {relatedVideo.title}
                    </h3>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                        {relatedVideo.channel.name}
                        {relatedVideo.channel.verified && (
                          <svg className="inline h-3 w-3 ml-1 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{relatedVideo.views?.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(relatedVideo.uploadedAt || Date.now()), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {relatedVideos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No related videos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
