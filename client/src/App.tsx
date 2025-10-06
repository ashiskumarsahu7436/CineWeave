import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Shorts from "@/pages/Shorts";
import Trending from "@/pages/Trending";
import Subscriptions from "@/pages/Subscriptions";
import Spaces from "@/pages/Spaces";
import Library from "@/pages/Library";
import History from "@/pages/History";
import WatchLater from "@/pages/WatchLater";
import Watch from "@/pages/Watch";
import Channel from "@/pages/Channel";
import Explore from "@/pages/Explore";
import Settings from "@/pages/Settings";
import ReportHistory from "@/pages/ReportHistory";
import Help from "@/pages/Help";
import Feedback from "@/pages/Feedback";
import Notifications from "@/pages/Notifications";
import Appearance from "@/pages/Appearance";
import Language from "@/pages/Language";
import Location from "@/pages/Location";
import KeyboardShortcuts from "@/pages/KeyboardShortcuts";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page when not authenticated or loading
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show app layout when authenticated
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shorts" component={Shorts} />
        <Route path="/trending" component={Trending} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/spaces" component={Spaces} />
        <Route path="/library" component={Library} />
        <Route path="/history" component={History} />
        <Route path="/watch-later" component={WatchLater} />
        <Route path="/watch/:id" component={Watch} />
        <Route path="/channel/:id" component={Channel} />
        <Route path="/explore/:category" component={Explore} />
        <Route path="/settings" component={Settings} />
        <Route path="/report-history" component={ReportHistory} />
        <Route path="/help" component={Help} />
        <Route path="/feedback" component={Feedback} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/appearance" component={Appearance} />
        <Route path="/language" component={Language} />
        <Route path="/location" component={Location} />
        <Route path="/keyboard-shortcuts" component={KeyboardShortcuts} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'device') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={theme === 'device' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
