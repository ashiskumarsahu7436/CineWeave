import { Bell, Check, Video, UserPlus, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "video" | "subscriber" | "like" | "comment";
  title: string;
  description: string;
  time: string;
  read: boolean;
  thumbnail?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "video",
    title: "New video from A Gamingcraft",
    description: "Uncharted Ruins of Eldoris - Epic fantasy adventure gameplay",
    time: "2 hours ago",
    read: false,
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&h=68&fit=crop"
  },
  {
    id: "2",
    type: "subscriber",
    title: "New subscriber",
    description: "TechEnthusiast subscribed to your channel",
    time: "5 hours ago",
    read: false
  },
  {
    id: "3",
    type: "like",
    title: "New likes on your video",
    description: "Your video 'Pro Tournament Live' received 1.2K likes",
    time: "1 day ago",
    read: true
  },
  {
    id: "4",
    type: "comment",
    title: "New comment",
    description: "GameMaster commented: 'Amazing content! Keep it up!'",
    time: "2 days ago",
    read: true
  },
  {
    id: "5",
    type: "video",
    title: "New video from A Filmcraft",
    description: "Exploration X: The Hidden Valleys documentary",
    time: "3 days ago",
    read: true,
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=68&fit=crop"
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="h-5 w-5 text-primary" />;
    case "subscriber":
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
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
              notification.read ? "bg-background" : "bg-muted/20"
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
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
          <p className="text-muted-foreground">
            When you get notifications, they'll show up here
          </p>
        </div>
      )}
    </div>
  );
}
