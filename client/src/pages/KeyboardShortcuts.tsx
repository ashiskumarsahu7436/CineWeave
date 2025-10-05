import { Keyboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: Shortcut[];
}

const shortcutSections: ShortcutSection[] = [
  {
    title: "Video Player",
    shortcuts: [
      { keys: ["Space", "K"], description: "Play/Pause" },
      { keys: ["←"], description: "Rewind 5 seconds" },
      { keys: ["→"], description: "Fast forward 5 seconds" },
      { keys: ["↑"], description: "Increase volume" },
      { keys: ["↓"], description: "Decrease volume" },
      { keys: ["M"], description: "Mute/Unmute" },
      { keys: ["F"], description: "Toggle fullscreen" },
      { keys: ["C"], description: "Toggle captions" },
      { keys: ["J"], description: "Rewind 10 seconds" },
      { keys: ["L"], description: "Fast forward 10 seconds" },
      { keys: ["0-9"], description: "Jump to 0%-90% of video" },
      { keys: ["<"], description: "Decrease playback speed" },
      { keys: [">"], description: "Increase playback speed" }
    ]
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["Home"], description: "Go to home page" },
      { keys: ["/"], description: "Focus search box" },
      { keys: ["Esc"], description: "Close overlays/menus" },
      { keys: ["Shift", "?"], description: "Show keyboard shortcuts" }
    ]
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open search" },
      { keys: ["N"], description: "Toggle notifications" },
      { keys: ["S"], description: "Toggle sidebar" },
      { keys: ["P"], description: "Toggle personal mode" }
    ]
  }
];

export default function KeyboardShortcuts() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Keyboard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Keyboard Shortcuts</h1>
        </div>
        <p className="text-muted-foreground">
          Use these keyboard shortcuts to navigate and control CineWeave more efficiently
        </p>
      </div>

      <div className="space-y-6">
        {shortcutSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Press <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Shift</kbd> + <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">?</kbd> to quickly access this list while browsing.
        </p>
      </div>
    </div>
  );
}
