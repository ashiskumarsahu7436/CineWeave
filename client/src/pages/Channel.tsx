import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoCard from "@/components/VideoCard";
import { VideoWithChannel } from "@shared/schema";
import type { Channel } from "@shared/schema";

export default function ChannelPage() {
  const [, params] = useRoute("/channel/:id");
  const channelId = params?.id;

  const { data: channel, isLoading: channelLoading } = useQuery<Channel>({
    queryKey: ["/api/channels", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/channels/${channelId}`);
      if (!response.ok) throw new Error('Failed to fetch channel');
      return response.json();
    },
    enabled: !!channelId
  });

  const { data: videos = [] } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos/channel", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/by-channels?channelIds=${channelId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!channelId
  });

  if (channelLoading || !channel) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-muted animate-pulse rounded-xl"></div>
        <div className="flex gap-4">
          <div className="w-32 h-32 bg-muted animate-pulse rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl"></div>

      <div className="flex items-start gap-6">
        <Avatar className="h-32 w-32 border-4 border-background">
          <AvatarImage src={channel.avatar || undefined} />
          <AvatarFallback className="text-4xl">{channel.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{channel.name}</h1>
            {channel.verified && (
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
          <p className="text-muted-foreground mb-1">@{channel.username}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {channel.subscribers?.toLocaleString()} subscribers • {videos.length} videos
          </p>
          <p className="text-sm mb-4">{channel.description || "No description available."}</p>
          <div className="flex gap-2">
            <Button>Subscribe</Button>
            <Button variant="outline">Joined</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="home" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="home" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent">Home</TabsTrigger>
          <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent">Videos</TabsTrigger>
          <TabsTrigger value="shorts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent">Shorts</TabsTrigger>
          <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent">Posts</TabsTrigger>
          <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="home" className="mt-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.slice(0, 8).map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => console.log('Play video:', video.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => console.log('Play video:', video.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shorts" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shorts yet</p>
          </div>
        </TabsContent>
        
        <TabsContent value="posts" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {channel.description || "No description available."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Stats</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{channel.subscribers?.toLocaleString()} subscribers</li>
                <li>{videos.length} videos</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
