import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Shield, User, Bell, Eye, Download, History as HistoryIcon, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Channel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { currentUserId, personalMode, setPersonalMode, pauseHistory, setPauseHistory } = useAppStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);

  const userId = (user as any)?.id || currentUserId;

  // Fetch blocked channels
  const { data: blockedChannels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/users", currentUserId, "blocked-channels"],
  });

  // Unblock channel mutation
  const unblockChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await apiRequest("DELETE", `/api/users/${currentUserId}/block/${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", currentUserId, "blocked-channels"],
      });
    },
  });

  // Clear watch history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const res = await fetch(`/api/watch-history/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watch-history", userId] });
      toast({ title: "Watch history cleared" });
    },
    onError: () => toast({ title: "Could not clear history", variant: "destructive" }),
  });

  const handleUnblockChannel = (channel: Channel) => {
    if (confirm(`Unblock ${channel.name}? They will appear in your recommendations again.`)) {
      unblockChannelMutation.mutate(channel.id);
    }
  };

  const handleExportBlockList = () => {
    const exportData = {
      blockedChannels: blockedChannels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        username: channel.username,
      })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cineweave-blocked-channels-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your CineWeave experience and privacy preferences.
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Personal Mode</h3>
              <p className="text-sm text-muted-foreground">
                Show only content from subscribed channels in your feed
              </p>
            </div>
            <Switch
              checked={personalMode}
              onCheckedChange={setPersonalMode}
              data-testid="switch-personal-mode-settings"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new videos from subscribed channels
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              data-testid="switch-notifications"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Autoplay</h3>
              <p className="text-sm text-muted-foreground">
                Automatically play the next video when one ends
              </p>
            </div>
            <Switch
              checked={autoplay}
              onCheckedChange={setAutoplay}
              data-testid="switch-autoplay"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Blocking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Blocking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Blocked Channels</h3>
              <p className="text-sm text-muted-foreground">
                {blockedChannels.length} channels blocked from appearing in recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportBlockList}
                disabled={blockedChannels.length === 0}
                data-testid="button-export-blocklist"
              >
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </div>
          </div>

          {/* Blocked Channels List */}
          {blockedChannels.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <Separator />
              <h4 className="text-sm font-medium text-foreground">Blocked Channels</h4>
              {blockedChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`blocked-channel-${channel.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                      {channel.avatar && (
                        <img
                          src={channel.avatar}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockChannel(channel)}
                    data-testid={`button-unblock-${channel.id}`}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}

          {blockedChannels.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-2">No blocked channels</h3>
              <p className="text-xs text-muted-foreground">
                Block channels to prevent them from appearing in your feed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Watch History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Pause Watch History</h3>
              <p className="text-sm text-muted-foreground">
                When paused, videos you watch won't be added to your history
              </p>
            </div>
            <Switch
              checked={pauseHistory}
              onCheckedChange={setPauseHistory}
              data-testid="switch-pause-history"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Clear Watch History</h3>
              <p className="text-sm text-muted-foreground">
                Permanently remove all videos from your watch history
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Clear all watch history? This cannot be undone.")) {
                  clearHistoryMutation.mutate();
                }
              }}
              disabled={clearHistoryMutation.isPending || !userId}
              data-testid="button-clear-history"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearHistoryMutation.isPending ? "Clearing…" : "Clear History"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" data-testid="button-download-data">
              <Download className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Your data is stored securely and never shared with third parties</p>
            <p>• You can export your data or delete your account at any time</p>
            <p>• Blocked channels and spaces are stored locally to your account</p>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" data-testid="button-help-center">
              Visit Help Center
            </Button>
            <Button variant="outline" data-testid="button-contact-support">
              Contact Support
            </Button>
            <Button variant="outline" data-testid="button-report-issue">
              Report an Issue
            </Button>
            <Button variant="outline" data-testid="button-feature-request">
              Request a Feature
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
