import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WatchLater() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Watch Later
          </h1>
          <p className="text-muted-foreground mt-1">Videos saved for later viewing</p>
        </div>
        <Button variant="outline" size="sm">
          Clear All
        </Button>
      </div>

      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-2">No videos saved yet</p>
        <p className="text-sm text-muted-foreground">Save videos to watch them later</p>
      </div>
    </div>
  );
}
