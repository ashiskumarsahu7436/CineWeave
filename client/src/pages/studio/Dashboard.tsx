import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Users, TrendingUp, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudioDashboard() {
  const { user } = useAuth();

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
  const totalViews = channelVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);
  const totalVideos = channelVideos.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channel dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your creator dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channel?.subscriberCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+0</span> in last 28 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watch Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground mt-1">Last 28 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
            <p className="text-xs text-muted-foreground mt-1">Published</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Video Performance */}
      {channelVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest video performance</CardTitle>
            <CardDescription>Your most recent upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative w-40 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={channelVideos[0].thumbnail}
                  alt={channelVideos[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {channelVideos[0].duration}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium line-clamp-2">{channelVideos[0].title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{channelVideos[0].views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Published recently</span>
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm">Go to video analytics</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Channel analytics</CardTitle>
            <CardDescription>Current subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold">{channel?.subscriberCount || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-green-500">+0</span> in last 28 days
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Watch time (hours)</span>
                  <span className="font-medium">0.0</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">Go to channel analytics</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top videos</CardTitle>
            <CardDescription>Last 48 hours · Views</CardDescription>
          </CardHeader>
          <CardContent>
            {channelVideos.length > 0 ? (
              <div className="space-y-3">
                {channelVideos.slice(0, 3).map((video: any, index: number) => (
                  <div key={video.id} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
                    <div className="relative w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{video.views || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No videos yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Creator Insider */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Insider</CardTitle>
          <CardDescription>Tips and updates for creators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Grow your channel</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn best practices for creating engaging content and building your audience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Connect with your community</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Engage with comments and build a loyal subscriber base
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
