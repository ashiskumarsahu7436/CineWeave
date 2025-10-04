import { Flag } from "lucide-react";

export default function ReportHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="h-6 w-6" />
          Report History
        </h1>
        <p className="text-muted-foreground mt-1">View your reported content</p>
      </div>

      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-2">No reports yet</p>
        <p className="text-sm text-muted-foreground">Your reported videos and channels will appear here</p>
      </div>
    </div>
  );
}
