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
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import ChatList from "@/pages/ChatList";
import Chat from "@/pages/Chat";
import Quiz from "@/pages/Quiz";
import Upload from "@/pages/Upload";
import LearningPaths from "@/pages/LearningPaths";

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
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/profile" component={Profile} />
      <Route path="/chat" component={ChatList} />
      <Route path="/chat/:matchId" component={Chat} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/upload" component={Upload} />
      <Route path="/learning-paths" component={LearningPaths} />
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
