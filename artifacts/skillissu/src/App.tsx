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
import VideoSession from "@/pages/VideoSession";
import SkillBattles from "@/pages/SkillBattles";
import MicroLessons from "@/pages/MicroLessons";
import Notifications from "@/pages/Notifications";
import FeatureFlags from "@/pages/FeatureFlags";
import SkillReels from "@/pages/SkillReels";
import Auctions from "@/pages/Auctions";
import StudyRooms from "@/pages/StudyRooms";
import SkillDna from "@/pages/SkillDna";
import Capsules from "@/pages/Capsules";
import SkillWrapped from "@/pages/SkillWrapped";
import LiveDrops from "@/pages/LiveDrops";
import Vouches from "@/pages/Vouches";
import SkillRoast from "@/pages/SkillRoast";
import Mentorship from "@/pages/Mentorship";
import SkillChallengesMarketplace from "@/pages/SkillChallengesMarketplace";
import SkillConfessions from "@/pages/SkillConfessions";
import SkillStories from "@/pages/SkillStories";
import SkillPassport from "@/pages/SkillPassport";
import PartnerStreaks from "@/pages/PartnerStreaks";

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
      <Route path="/session/:matchId" component={VideoSession} />
      <Route path="/battles" component={SkillBattles} />
      <Route path="/lessons" component={MicroLessons} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/flags" component={FeatureFlags} />
      <Route path="/reels" component={SkillReels} />
      <Route path="/auctions" component={Auctions} />
      <Route path="/study-rooms" component={StudyRooms} />
      <Route path="/skill-dna" component={SkillDna} />
      <Route path="/capsules" component={Capsules} />
      <Route path="/wrapped" component={SkillWrapped} />
      <Route path="/live-drops" component={LiveDrops} />
      <Route path="/vouches/:userId" component={({ params }) => <Vouches userId={params.userId} />} />
      <Route path="/vouches" component={() => <Vouches />} />
      <Route path="/roast" component={SkillRoast} />
      <Route path="/mentorship" component={Mentorship} />
      <Route path="/marketplace" component={SkillChallengesMarketplace} />
      <Route path="/confessions" component={SkillConfessions} />
      <Route path="/stories" component={SkillStories} />
      <Route path="/passport" component={SkillPassport} />
      <Route path="/partner-streaks" component={PartnerStreaks} />
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
