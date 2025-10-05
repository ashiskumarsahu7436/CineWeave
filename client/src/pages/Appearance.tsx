import { Monitor, Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore, type Theme } from "@/store/useAppStore";

export default function Appearance() {
  const { theme: selectedTheme, setTheme } = useAppStore();

  const themes = [
    {
      id: "light" as Theme,
      icon: Sun,
      label: "Light",
      description: "Bright and clean interface"
    },
    {
      id: "dark" as Theme,
      icon: Moon,
      label: "Dark",
      description: "Easy on the eyes in low light"
    },
    {
      id: "device" as Theme,
      icon: Monitor,
      label: "Device theme",
      description: "Matches your system preference"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appearance</h1>
        <p className="text-muted-foreground">
          Customize how CineWeave looks on your device
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Theme</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTheme === theme.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setTheme(theme.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="h-6 w-6" />
                      {selectedTheme === theme.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{theme.label}</h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Theme changes are applied immediately and saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
