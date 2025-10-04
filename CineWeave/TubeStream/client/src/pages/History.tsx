import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function History() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            Watch History
          </h1>
          <p className="text-muted-foreground mt-1">Videos you've watched</p>
        </div>
        <Button variant="outline" size="sm">
          Clear All History
        </Button>
      </div>

      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-2">No watch history yet</p>
        <p className="text-sm text-muted-foreground">Videos you watch will appear here</p>
      </div>
    </div>
  );
}
