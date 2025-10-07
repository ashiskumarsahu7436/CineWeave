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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <TopNavigation />
      <div className="flex pt-14">
        <Sidebar />
        <main className={cn(
          "flex-1 p-3 sm:p-4 md:p-6 transition-all duration-300 w-full max-w-full overflow-x-hidden",
          sidebarCollapsed ? "md:ml-20" : "md:ml-60"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
