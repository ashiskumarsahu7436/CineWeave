import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ChannelCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChannelCreationDialog({ open, onOpenChange }: ChannelCreationDialogProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; username: string; description?: string }) => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create channel');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your channel has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name || !username) {
      toast({
        title: "Error",
        description: "Channel name and username are required",
        variant: "destructive",
      });
      return;
    }

    createChannelMutation.mutate({
      name,
      username: username.startsWith('@') ? username : `@${username}`,
      description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Your Channel</DialogTitle>
          <DialogDescription>
            Set up your channel to start uploading videos and building your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name *</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Channel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-username">Username *</Label>
            <Input
              id="channel-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@myawesomechannel"
            />
            <p className="text-xs text-muted-foreground">
              Your channel URL will be: cineweave.com/{username.startsWith('@') ? username : `@${username}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (Optional)</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your channel..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createChannelMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createChannelMutation.isPending}
          >
            {createChannelMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Channel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
