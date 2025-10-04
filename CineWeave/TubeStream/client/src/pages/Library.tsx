import { BookOpen, Clock, History, ThumbsUp } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

const libraryCategories = [
  {
    icon: History,
    title: "History",
    description: "Videos you've watched",
    path: "/history",
    color: "text-blue-500"
  },
  {
    icon: Clock,
    title: "Watch Later",
    description: "Videos saved for later",
    path: "/watch-later",
    color: "text-purple-500"
  },
  {
    icon: ThumbsUp,
    title: "Liked Videos",
    description: "Videos you liked",
    path: "/liked",
    color: "text-green-500"
  }
];

export default function Library() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Library
        </h1>
        <p className="text-muted-foreground mt-1">Your personal collection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {libraryCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.path} href={category.path}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${category.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Playlists</h2>
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No playlists yet</p>
          <p className="text-sm text-muted-foreground">Create playlists to organize your favorite videos</p>
        </div>
      </div>
    </div>
  );
}
