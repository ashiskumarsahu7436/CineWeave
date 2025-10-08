import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import type { Channel } from "@shared/schema";

export default function StudioSettings() {
  const { currentUserId } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");

  const { data: channel, isLoading } = useQuery<Channel>({
    queryKey: ["/api/users/channel", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUserId}/channel`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch channel');
      return response.json();
    },
    enabled: !!currentUserId
  });

  useEffect(() => {
    if (channel) {
      setName(channel.name || "");
      setUsername(channel.username || "");
      setDescription(channel.description || "");
      setAvatar(channel.avatar || "");
    }
  }, [channel]);

  const updateChannelMutation = useMutation({
    mutationFn: async (updates: Partial<Channel>) => {
      if (!channel) throw new Error('No channel found');
      const response = await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update channel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/channel", currentUserId] });
      toast({
        title: "Channel updated!",
        description: "Your channel settings have been saved successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update channel",
        variant: "destructive"
      });
    }
  });

  const handleSaveChanges = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive"
      });
      return;
    }
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return;
    }

    updateChannelMutation.mutate({
      name: name.trim(),
      username: username.trim(),
      description: description.trim() || null,
      avatar: avatar.trim() || null
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>No Channel Found</CardTitle>
            <CardDescription>
              You need to create a channel before you can customize it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channel Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your channel information and appearance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Information</CardTitle>
          <CardDescription>
            Update your channel details that appear on your channel page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {name[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append('avatar', file);

                      try {
                        const response = await fetch('/api/upload/avatar', {
                          method: 'POST',
                          body: formData,
                          credentials: 'include'
                        });

                        if (!response.ok) throw new Error('Failed to upload avatar');

                        const data = await response.json();
                        setAvatar(data.avatarUrl);
                        toast({
                          title: "Success!",
                          description: "Avatar uploaded successfully"
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to upload avatar",
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a profile picture for your channel (JPG, PNG, or WebP)
                </p>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="Enter your channel name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your unique channel identifier. Only letters, numbers, and underscores allowed.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell viewers about your channel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveChanges}
              disabled={updateChannelMutation.isPending}
            >
              {updateChannelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <p className="text-2xl font-bold">{channel.subscribers?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{channel.verified ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
