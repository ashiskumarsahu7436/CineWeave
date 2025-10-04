import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
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
import NotFound from "@/pages/not-found";

function Router() {
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
