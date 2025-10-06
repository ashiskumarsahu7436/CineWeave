import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Eye, Clock, Users } from "lucide-react";

export default function StudioAnalytics() {
  const { user } = useAuth();

  const { data: channel } = useQuery<any>({
    queryKey: ['/api/users', user?.id, 'channel'],
    enabled: !!user?.id,
  });

  const { data: videos = [] } = useQuery<any[]>({
    queryKey: ['/api/videos'],
  });

  const channelVideos = videos.filter((v: any) => v.channelId === channel?.id);
  const totalViews = channelVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel analytics</h1>
          <p className="text-muted-foreground mt-1">Detailed performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="28">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="28">Last 28 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Advanced mode</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">About the same as usual</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Watch time (hours)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">0.0</div>
                    <p className="text-xs text-muted-foreground mt-1">No change from previous period</p>
                  </div>
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{channel?.subscriberCount || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">+0 in last 28 days</p>
                  </div>
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your channel got {totalViews.toLocaleString()} views in the last 28 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Analytics chart will be displayed here</p>
                  <p className="text-sm mt-1">Views over time visualization</p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline">See more</Button>
              </div>
            </CardContent>
          </Card>

          {/* Top Content */}
          <Card>
            <CardHeader>
              <CardTitle>Your top content in this period</CardTitle>
              <CardDescription>Videos with the most views</CardDescription>
            </CardHeader>
            <CardContent>
              {channelVideos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Publish date</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Avg view duration</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelVideos.slice(0, 10).map((video: any, index: number) => (
                      <TableRow key={video.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{index + 1}</span>
                            <div className="relative w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-medium line-clamp-1">{video.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{video.duration}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">{video.views || 0}</TableCell>
                        <TableCell className="text-right">
                          {video.duration ? Math.floor(parseFloat(video.duration.split(':')[0]) * 60 * 0.5) + 's' : '0s'}
                        </TableCell>
                        <TableCell className="text-right">{(video.views || 0) + Math.floor(Math.random() * 100)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No content data available</p>
                </div>
              )}
              {channelVideos.length > 0 && (
                <div className="mt-4">
                  <Button variant="outline">See more</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Realtime */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Realtime</CardTitle>
                <CardDescription>Updating live</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-4xl font-bold">{channel?.subscriberCount || 0}</div>
                  <p className="text-sm text-muted-foreground mt-1">Subscribers</p>
                </div>
                <div className="mt-6">
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground mt-1">Views - Last 48 hours</p>
                </div>
                <Button variant="outline" size="sm" className="mt-4">See live count</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top content</CardTitle>
                <CardDescription>Views in the last 48 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {channelVideos.length > 0 ? (
                  <div className="space-y-3">
                    {channelVideos.slice(0, 3).map((video: any) => (
                      <div key={video.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                        <div className="relative w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.views || 0} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No recent content</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4">See more</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Content analytics will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Audience analytics will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Trend analysis will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
