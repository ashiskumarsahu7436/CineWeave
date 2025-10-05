import { ReactNode } from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavigation />
      <div className="flex pt-14">
        <Sidebar />
        <main className={cn(
          "flex-1 p-6 transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-60"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
