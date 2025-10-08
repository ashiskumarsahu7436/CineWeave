import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import StudioLayout from "@/components/StudioLayout";
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
import StudioDashboard from "@/pages/studio/Dashboard";
import StudioContent from "@/pages/studio/Content";
import StudioAnalytics from "@/pages/studio/Analytics";
import StudioSettings from "@/pages/studio/Settings";
import SearchPage from "@/pages/Search";
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

  return (
    <Switch>
      {/* Studio routes with StudioLayout */}
      <Route path="/studio">
        {() => (
          <ProtectedRoute component={() => (
            <StudioLayout>
              <StudioDashboard />
            </StudioLayout>
          )} />
        )}
      </Route>
      <Route path="/studio/content">
        {() => (
          <ProtectedRoute component={() => (
            <StudioLayout>
              <StudioContent />
            </StudioLayout>
          )} />
        )}
      </Route>
      <Route path="/studio/analytics">
        {() => (
          <ProtectedRoute component={() => (
            <StudioLayout>
              <StudioAnalytics />
            </StudioLayout>
          )} />
        )}
      </Route>
      <Route path="/studio/community">
        {() => (
          <ProtectedRoute component={() => (
            <StudioLayout>
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-2">Community</h2>
                <p className="text-muted-foreground">Manage comments and engage with your audience</p>
              </div>
            </StudioLayout>
          )} />
        )}
      </Route>
      <Route path="/studio/settings">
        {() => (
          <ProtectedRoute component={() => (
            <StudioLayout>
              <StudioSettings />
            </StudioLayout>
          )} />
        )}
      </Route>

      {/* Main app routes with Layout */}
      <Route path="/">
        {() => (
          <Layout>
            <Home />
          </Layout>
        )}
      </Route>
      <Route path="/shorts">
        {() => (
          <Layout>
            <Shorts />
          </Layout>
        )}
      </Route>
      <Route path="/trending">
        {() => (
          <Layout>
            <Trending />
          </Layout>
        )}
      </Route>
      <Route path="/subscriptions">
        {() => (
          <Layout>
            <ProtectedRoute component={Subscriptions} />
          </Layout>
        )}
      </Route>
      <Route path="/spaces">
        {() => (
          <Layout>
            <ProtectedRoute component={Spaces} />
          </Layout>
        )}
      </Route>
      <Route path="/library">
        {() => (
          <Layout>
            <ProtectedRoute component={Library} />
          </Layout>
        )}
      </Route>
      <Route path="/history">
        {() => (
          <Layout>
            <ProtectedRoute component={History} />
          </Layout>
        )}
      </Route>
      <Route path="/watch-later">
        {() => (
          <Layout>
            <ProtectedRoute component={WatchLater} />
          </Layout>
        )}
      </Route>
      <Route path="/watch/:id">
        {() => (
          <Layout>
            <Watch />
          </Layout>
        )}
      </Route>
      <Route path="/channel/:id">
        {() => (
          <Layout>
            <Channel />
          </Layout>
        )}
      </Route>
      <Route path="/explore/:category">
        {() => (
          <Layout>
            <Explore />
          </Layout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <Layout>
            <ProtectedRoute component={Settings} />
          </Layout>
        )}
      </Route>
      <Route path="/report-history">
        {() => (
          <Layout>
            <ProtectedRoute component={ReportHistory} />
          </Layout>
        )}
      </Route>
      <Route path="/help">
        {() => (
          <Layout>
            <Help />
          </Layout>
        )}
      </Route>
      <Route path="/feedback">
        {() => (
          <Layout>
            <Feedback />
          </Layout>
        )}
      </Route>
      <Route path="/notifications">
        {() => (
          <Layout>
            <ProtectedRoute component={Notifications} />
          </Layout>
        )}
      </Route>
      <Route path="/appearance">
        {() => (
          <Layout>
            <Appearance />
          </Layout>
        )}
      </Route>
      <Route path="/language">
        {() => (
          <Layout>
            <Language />
          </Layout>
        )}
      </Route>
      <Route path="/location">
        {() => (
          <Layout>
            <Location />
          </Layout>
        )}
      </Route>
      <Route path="/keyboard-shortcuts">
        {() => (
          <Layout>
            <KeyboardShortcuts />
          </Layout>
        )}
      </Route>
      <Route path="/search">
        <SearchPage />
      </Route>
      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  const { theme, setCurrentUserId } = useAppStore();
  const { user } = useAuth();

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

  // Sync authenticated user ID with store
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    } else {
      setCurrentUserId("");
    }
  }, [user, setCurrentUserId]);

  return (
    <TooltipProvider>
      <div className={theme === 'device' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}>
        <Toaster />
        <Router />
      </div>
    </TooltipProvider>
  );
}

export default App;
