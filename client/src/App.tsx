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

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // For now, just render the component - auth modal will be handled by navigation
  return <Component />;
}

function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Always show app layout for all users (authenticated and unauthenticated)
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shorts" component={Shorts} />
        <Route path="/trending" component={Trending} />
        <Route path="/subscriptions">
          {() => <ProtectedRoute component={Subscriptions} />}
        </Route>
        <Route path="/spaces">
          {() => <ProtectedRoute component={Spaces} />}
        </Route>
        <Route path="/library">
          {() => <ProtectedRoute component={Library} />}
        </Route>
        <Route path="/history">
          {() => <ProtectedRoute component={History} />}
        </Route>
        <Route path="/watch-later">
          {() => <ProtectedRoute component={WatchLater} />}
        </Route>
        <Route path="/watch/:id" component={Watch} />
        <Route path="/channel/:id" component={Channel} />
        <Route path="/explore/:category" component={Explore} />
        <Route path="/settings">
          {() => <ProtectedRoute component={Settings} />}
        </Route>
        <Route path="/report-history">
          {() => <ProtectedRoute component={ReportHistory} />}
        </Route>
        <Route path="/help" component={Help} />
        <Route path="/feedback" component={Feedback} />
        <Route path="/notifications">
          {() => <ProtectedRoute component={Notifications} />}
        </Route>
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
