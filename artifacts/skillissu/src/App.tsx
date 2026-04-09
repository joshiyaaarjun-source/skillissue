import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import Matches from "@/pages/Matches";
import Analytics from "@/pages/Analytics";
import Gamification from "@/pages/Gamification";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/explore" component={Explore} />
      <Route path="/matches" component={Matches} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/gamification" component={Gamification} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
