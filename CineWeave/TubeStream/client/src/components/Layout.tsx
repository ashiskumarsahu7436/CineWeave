import { ReactNode } from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavigation />
      <div className="flex pt-14">
        <Sidebar />
        <main className="flex-1 ml-60 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
