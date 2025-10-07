import { Bell, Check, Video, UserPlus, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  videoId?: string;
  channelId?: string;
  thumbnail?: string;
  isRead: boolean;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "video_upload":
      return <Video className="h-5 w-5 text-primary" />;
    case "new_subscriber":
      return <UserPlus className="h-5 w-5 text-green-500" />;
    case "like":
      return <Heart className="h-5 w-5 text-red-500" />;
    case "comment":
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notifications/${user?.id}/mark-all-read`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.videoId) {
      setLocation(`/watch/${notification.videoId}`);
    }
    
    if (!notification.isRead) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
          <p className="text-muted-foreground">
            When you get notifications, they'll show up here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                notification.isRead ? "bg-background" : "bg-muted/20"
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                {notification.thumbnail && (
                  <img
                    src={notification.thumbnail}
                    alt="Thumbnail"
                    className="w-24 h-14 object-cover rounded flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
