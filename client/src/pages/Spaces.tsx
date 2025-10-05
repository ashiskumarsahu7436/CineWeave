import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpaceCard from "@/components/SpaceCard";
import { useAppStore } from "@/store/useAppStore";
import { SpaceWithChannels } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Spaces() {
  const { currentUserId } = useAppStore();
  const queryClient = useQueryClient();

  // Fetch user spaces
  const { data: spaces = [], isLoading } = useQuery<SpaceWithChannels[]>({
    queryKey: ["/api/spaces/user", currentUserId],
  });

  // Delete space mutation
  const deleteSpaceMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      await apiRequest("DELETE", `/api/spaces/${spaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/user", currentUserId] });
    },
  });

  const handleSpaceClick = (space: SpaceWithChannels) => {
    console.log("Viewing space:", space.name);
    // TODO: Navigate to space-specific feed
  };

  const handleCreateSpace = () => {
    console.log("Creating new space");
    // TODO: Open create space modal/form
  };

  const handleEditSpace = (space: SpaceWithChannels) => {
    console.log("Editing space:", space.name);
    // TODO: Open edit space modal/form
  };

  const handleDeleteSpace = (space: SpaceWithChannels) => {
    if (confirm(`Are you sure you want to delete "${space.name}"?`)) {
      deleteSpaceMutation.mutate(space.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Spaces</h1>
          <p className="text-muted-foreground">
            Organize your favorite channels into custom spaces for focused content discovery.
          </p>
        </div>
        <Button onClick={handleCreateSpace} data-testid="button-create-space">
          <Plus className="h-4 w-4 mr-2" />
          Create Space
        </Button>
      </div>

      {/* Empty State */}
      {spaces.length === 0 && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No spaces yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create your first space to organize channels by topic, mood, or any way you like. 
              Each space will have its own personalized feed.
            </p>
            <Button onClick={handleCreateSpace} data-testid="button-create-first-space">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Space
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Spaces Grid */}
      {spaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <div key={space.id} className="relative group">
              <SpaceCard
                space={space}
                onClick={() => handleSpaceClick(space)}
              />
              
              {/* Space Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSpace(space);
                    }}
                    data-testid={`button-edit-space-${space.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSpace(space);
                    }}
                    data-testid={`button-delete-space-${space.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Create New Space Card */}
          <div
            className="bg-card border-2 border-dashed border-border rounded-xl p-5 hover:border-primary transition cursor-pointer flex items-center justify-center min-h-[200px]"
            onClick={handleCreateSpace}
            data-testid="button-create-space-card"
          >
            <div className="text-center">
              <Plus className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">Create New Space</h3>
              <p className="text-sm text-muted-foreground">Organize channels by topic or mood</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Space Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Create spaces for different topics like "Gaming", "Tech News", or "Cooking"</p>
          <p>• Add multiple channels to each space for diverse content in that category</p>
          <p>• Each space has its own personalized feed with content only from those channels</p>
          <p>• Use spaces to discover new content within your areas of interest</p>
        </CardContent>
      </Card>
    </div>
  );
}
