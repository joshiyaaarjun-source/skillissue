import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Star, Flame, Zap, ArrowRight, BookOpen, User as UserIcon, Brain, ChevronDown, ChevronUp, CheckCircle2, Lightbulb, AlertCircle, RefreshCw, Map, Swords, Bell, Crown, Flag, Play, Gavel, Users, BookMarked, Sparkles, Radio, Dna, Clock } from "lucide-react";
import { useGetMe, getGetMeQueryKey, useGetNudges, getGetNudgesQueryKey, useGetExchanges, getGetExchangesQueryKey, useGetSkillCoach, getGetSkillCoachQueryKey, useGetNotifications, getGetNotificationsQueryKey, useGetSessionHistory, getGetSessionHistoryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import ColdStartWidget from "@/components/ColdStartWidget";
import SkillTwinCard from "@/components/SkillTwinCard";
import SkillForecastCard from "@/components/SkillForecastCard";
import BottomNav from "@/components/BottomNav";
import FakeNotificationBanner from "@/components/FakeNotificationBanner";
import CreditCounter from "@/components/CreditCounter";
import SkillTag from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: nudges, isLoading: nudgesLoading } = useGetNudges({ query: { queryKey: getGetNudgesQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });
  const { data: coach, isLoading: coachLoading, refetch: refetchCoach } = useGetSkillCoach({ query: { queryKey: getGetSkillCoachQueryKey() } });
  const { data: notifications } = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const { data: sessionHistory, isLoading: sessionsLoading } = useGetSessionHistory({ query: { queryKey: getGetSessionHistoryQueryKey() } });
  const [coachExpanded, setCoachExpanded] = useState(false);

  const unreadNotifCount = notifications?.filter(n => !n.read).length ?? 0;
  const isElite = me ? (me.credibilityScore >= 4.5 && me.totalExchanges >= 5) : false;
  const queryClient = useQueryClient();

  if (meLoading || nudgesLoading || exchangesLoading || sessionsLoading) {
    return (
      <div className="min-h-[100dvh] p-4 space-y-6 pb-24">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <FakeNotificationBanner />
      
      {/* Header Profile Section */}
      <div className="bg-primary text-primary-foreground pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg">
              <AvatarImage src={me.avatar} />
              <AvatarFallback className="bg-secondary text-white font-bold text-xl">
                {me.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{me.name}</h1>
              <div className="flex items-center gap-1 text-[#ffd9d9] mt-1">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">{me.credibilityScore.toFixed(1)}</span>
                <span className="text-xs opacity-80 ml-1">rating</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isElite && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3 fill-current" />
                  Elite
                </span>
              )}
              <Link href="/notifications">
                <button className="relative p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <Bell className="h-5 w-5 text-[#ffd9d9]" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-[#4d0011] text-[9px] font-black rounded-full flex items-center justify-center">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  )}
                </button>
              </Link>
              <Link href="/flags">
                <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <Flag className="h-4 w-4 text-[#ffd9d9]/60" />
                </button>
              </Link>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-[#ffd9d9] uppercase tracking-wider mb-1">Balance</div>
              <div className="text-3xl font-black tabular-nums flex items-baseline gap-1">
                <CreditCounter value={me.creditBalance} />
                <span className="text-lg text-[#ffd9d9]">C</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 space-y-6 -mt-4 relative z-20"
      >
        {/* Nudges */}
        {nudges && nudges.length > 0 && (
          <motion.div variants={itemVariants} className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 scrollbar-hide">
            {nudges.slice(0, 2).map((nudge) => (
              <Card key={nudge.id} className="min-w-[280px] snap-center shrink-0 border-none shadow-sm bg-gradient-to-br from-card to-muted">
                <CardContent className="p-4 flex gap-3 items-start">
                  <div className="bg-[#ffd9d9] p-2 rounded-full text-primary shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug mb-2">{nudge.message}</p>
                    {nudge.actionLabel && (
                      <span className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline">
                        {nudge.actionLabel} <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* AI Skill Coach */}
        <motion.div variants={itemVariants}>
          <Card className="border border-[#bd7880]/20 shadow-sm overflow-hidden bg-gradient-to-br from-[#4d0011]/5 via-white to-[#ffd9d9]/10">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#4d0011]">
                  <div className="w-7 h-7 bg-[#4d0011] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-[#ffd9d9]" />
                  </div>
                  Your Skill Coach says…
                </CardTitle>
                <button
                  onClick={() => { queryClient.invalidateQueries({ queryKey: getGetSkillCoachQueryKey() }); }}
                  className="text-muted-foreground hover:text-[#4d0011] transition-colors p-1 rounded-full hover:bg-muted"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={coachLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {coachLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : coach ? (
                <>
                  {/* Coach note */}
                  <p className="text-sm italic text-[#4d0011]/80 leading-relaxed border-l-2 border-[#bd7880] pl-3">
                    "{coach.coachNote}"
                  </p>

                  {/* Strengths preview */}
                  <div className="space-y-1.5">
                    {(coachExpanded ? coach.strengths : coach.strengths.slice(0, 2)).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expand/collapse */}
                  {coachExpanded && (
                    <div className="space-y-3 pt-1">
                      {coach.weaknesses.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Areas to grow</p>
                          {coach.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-foreground/80">{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {coach.suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Suggested actions</p>
                          {coach.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <Lightbulb size={13} className="text-[#bd7880] flex-shrink-0 mt-0.5" />
                              <span className="text-foreground/80">{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setCoachExpanded(p => !p)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#bd7880] hover:text-[#4d0011] transition-colors"
                  >
                    {coachExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Full analysis</>}
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Coach feedback loading…</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Paths CTA */}
        <motion.div variants={itemVariants}>
          <Link href="/learning-paths">
            <div className="bg-[#4d0011] text-white rounded-2xl p-4 flex items-center gap-4 shadow-md hover:bg-[#4d0011]/90 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Map className="h-6 w-6 text-[#ffd9d9]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-white leading-none">AI Learning Paths</p>
                <p className="text-xs text-[#ffd9d9]/70 mt-1 italic">Tell us your goal. We'll build the roadmap.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#ffd9d9]/60" />
            </div>
          </Link>
        </motion.div>

        {/* Cold Start Challenge */}
        <motion.div variants={itemVariants}>
          <ColdStartWidget />
        </motion.div>

        {/* Skill Twin */}
        <motion.div variants={itemVariants}>
          <SkillTwinCard />
        </motion.div>

        {/* Skill Forecast */}
        <motion.div variants={itemVariants}>
          <SkillForecastCard />
        </motion.div>

        {/* New Features Grid */}
        <motion.div variants={itemVariants}>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-3 px-1">Explore More</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/reels">
              <div className="bg-[#1a0a0f] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Play className="h-4 w-4 text-[#ffd9d9] fill-current" />
                </div>
                <p className="font-bold text-sm leading-none">Skill Reels</p>
                <p className="text-[10px] text-white/50 leading-snug">Short skill demos</p>
              </div>
            </Link>
            <Link href="/auctions">
              <div className="bg-[#4d0011] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Gavel className="h-4 w-4 text-[#ffd9d9]" />
                </div>
                <p className="font-bold text-sm leading-none">Auctions</p>
                <p className="text-[10px] text-white/50 leading-snug">Bid for sessions</p>
              </div>
            </Link>
            <Link href="/study-rooms">
              <div className="bg-[#102b1f] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <p className="font-bold text-sm leading-none">Study Rooms</p>
                <p className="text-[10px] text-white/50 leading-snug">Group sprints</p>
              </div>
            </Link>
            <Link href="/capsules">
              <div className="bg-[#bd7880] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                  <BookMarked className="h-4 w-4 text-white" />
                </div>
                <p className="font-bold text-sm leading-none">Capsules</p>
                <p className="text-[10px] text-white/60 leading-snug">Mini-courses</p>
              </div>
            </Link>
            <Link href="/live-drops">
              <div className="bg-gradient-to-br from-[#071a12] to-[#102b1f] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Radio className="h-4 w-4 text-green-400" />
                </div>
                <p className="font-bold text-sm leading-none">Live Drops</p>
                <p className="text-[10px] text-white/50 leading-snug">Unplanned sessions</p>
              </div>
            </Link>
            <Link href="/wrapped">
              <div className="bg-gradient-to-br from-[#4d0011] to-[#2a0044] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </div>
                <p className="font-bold text-sm leading-none">Skill Wrapped</p>
                <p className="text-[10px] text-white/50 leading-snug">Your month in stats</p>
              </div>
            </Link>
            <Link href="/roast">
              <div className="bg-gradient-to-br from-orange-900 to-[#4d0011] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-base">🔥</span>
                </div>
                <p className="font-bold text-sm leading-none">Skill Roast</p>
                <p className="text-[10px] text-white/50 leading-snug">Get roasted by AI</p>
              </div>
            </Link>
            <Link href="/mentorship">
              <div className="bg-gradient-to-br from-[#102b1f] to-[#1a4a35] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-base">🎓</span>
                </div>
                <p className="font-bold text-sm leading-none">Mentorship</p>
                <p className="text-[10px] text-white/50 leading-snug">Formal skill coaching</p>
              </div>
            </Link>
            <Link href="/marketplace">
              <div className="bg-gradient-to-br from-amber-900 to-[#4d0011] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-base">🏆</span>
                </div>
                <p className="font-bold text-sm leading-none">Challenges</p>
                <p className="text-[10px] text-white/50 leading-snug">Bounty challenges</p>
              </div>
            </Link>
            <Link href="/confessions">
              <div className="bg-gradient-to-br from-slate-800 to-[#4d0011] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-base">🤫</span>
                </div>
                <p className="font-bold text-sm leading-none">Confessions</p>
                <p className="text-[10px] text-white/50 leading-snug">Anonymous board</p>
              </div>
            </Link>
            <Link href="/stories">
              <div className="bg-gradient-to-br from-[#bd7880] to-[#4d0011] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-base">✨</span>
                </div>
                <p className="font-bold text-sm leading-none">Stories</p>
                <p className="text-[10px] text-white/50 leading-snug">24h skill moments</p>
              </div>
            </Link>
            <Link href="/passport">
              <div className="bg-gradient-to-br from-[#4d0011] to-slate-800 text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-base">🛂</span>
                </div>
                <p className="font-bold text-sm leading-none">Passport</p>
                <p className="text-[10px] text-white/50 leading-snug">Export your journey</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Skill Battles CTA */}
        <motion.div variants={itemVariants}>
          <Link href="/battles">
            <div className="bg-[#102b1f] text-white rounded-2xl p-4 flex items-center gap-4 shadow-md hover:bg-[#102b1f]/90 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Swords className="h-6 w-6 text-green-300" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-white leading-none">Skill Battles</p>
                <p className="text-xs text-green-300/70 mt-1 italic">Challenge the community. Prove your mastery.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-green-300/60" />
            </div>
          </Link>
        </motion.div>

        {/* Micro-Lessons CTA */}
        <motion.div variants={itemVariants}>
          <Link href="/lessons">
            <div className="bg-[#bd7880] text-white rounded-2xl p-4 flex items-center gap-4 shadow-md hover:bg-[#bd7880]/90 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-white leading-none">Micro-Lessons</p>
                <p className="text-xs text-white/70 mt-1 italic">5-minute AI lessons tailored to your skills.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/60" />
            </div>
          </Link>
        </motion.div>

        {/* Gamification Strip */}
        <motion.div variants={itemVariants} className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-950 p-2.5 rounded-xl text-orange-500">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-medium">Current Streak</div>
              <div className="text-xl font-bold">{me.streakDays} Days</div>
            </div>
          </div>
          <div className="w-px h-10 bg-border mx-2" />
          <div className="flex-1 max-w-[120px]">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span>Lvl {Math.floor(me.xp / 1000) + 1}</span>
              <span className="text-muted-foreground">{me.xp % 1000}/1000</span>
            </div>
            <Progress value={(me.xp % 1000) / 10} className="h-2" />
          </div>
        </motion.div>

        {/* Skills Identity */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> I Can Teach
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-wrap gap-2">
              {me.skillsOffered.map(skill => (
                <SkillTag key={skill} skill={skill} type="offered" />
              ))}
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> I Want to Learn
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-wrap gap-2">
              {me.skillsWanted.map(skill => (
                <SkillTag key={skill} skill={skill} type="wanted" />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skill Progress Tracker */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="text-lg">My Learning Journey</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="in_progress" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-12 p-0 px-4">
                  <TabsTrigger value="in_progress" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">In Progress</TabsTrigger>
                  <TabsTrigger value="to_start" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">TBR</TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">Done</TabsTrigger>
                </TabsList>
                
                <TabsContent value="in_progress" className="p-4 space-y-4 m-0">
                  {me.skillProgress?.filter(p => p.status === 'in_progress').map(progress => (
                    <div key={progress.id} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{progress.skill}</span>
                        <span className="text-primary">{progress.progress}%</span>
                      </div>
                      <Progress value={progress.progress} className="h-2.5" />
                    </div>
                  ))}
                  {!me.skillProgress?.some(p => p.status === 'in_progress') && (
                    <p className="text-sm text-muted-foreground text-center py-4">No skills currently in progress.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="to_start" className="p-4 m-0 flex flex-wrap gap-2">
                  {me.skillTBR?.map(skill => (
                    <Badge key={skill} variant="outline" className="text-sm py-1.5 px-3">{skill}</Badge>
                  ))}
                </TabsContent>

                <TabsContent value="completed" className="p-4 m-0 space-y-3">
                  {me.skillProgress?.filter(p => p.status === 'completed').map(progress => (
                    <div key={progress.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                      <span className="font-medium">{progress.skill}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Goals */}
        <motion.div variants={itemVariants}>
          <h3 className="font-bold text-lg mb-3 px-1">Monthly Goals</h3>
          <div className="space-y-3">
            {me.monthlyGoals?.map(goal => (
              <Card key={goal.id} className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>{goal.title}</span>
                    <span className="text-muted-foreground">{goal.progress} / {goal.target}</span>
                  </div>
                  <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Exchanges */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-lg">Recent Exchanges</h3>
            <span className="text-xs font-medium text-primary hover:underline cursor-pointer">View All</span>
          </div>
          <div className="space-y-3">
            {exchanges?.slice(0, 3).map((exchange) => (
              <div key={exchange.id} className="bg-card p-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={exchange.partnerAvatar} />
                  <AvatarFallback>{exchange.partnerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    <span className="text-muted-foreground font-normal">with</span> {exchange.partnerName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Taught {exchange.teachSkill} • Learned {exchange.learnSkill}
                  </div>
                </div>
                <div className="text-sm font-bold text-primary shrink-0">
                  -{exchange.creditsPerSession} C
                </div>
              </div>
            ))}
            {(!exchanges || exchanges.length === 0) && (
              <div className="text-center py-6 text-sm text-muted-foreground bg-card rounded-xl border border-dashed">
                No recent exchanges. Time to learn something new!
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Meetings */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-lg">Recent Meetings</h3>
            <span className="text-xs text-muted-foreground ml-auto">Completed skill sessions</span>
          </div>
          <div className="space-y-3">
            {[...(sessionHistory ?? [])]
              .filter(session => session.status === "completed")
              .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
              .slice(0, 3)
              .map(session => (
                <div key={session.id} className="bg-card p-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.partnerAvatar} />
                    <AvatarFallback>{session.partnerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{session.partnerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(session.startedAt))}
                      {" · "}
                      {Math.max(1, Math.round(session.durationSeconds / 60))} min
                    </div>
                  </div>
                  {session.creditsEarned > 0 && (
                    <div className="text-sm font-bold text-primary shrink-0">+{session.creditsEarned} C</div>
                  )}
                </div>
              ))}
            {(!sessionHistory || sessionHistory.filter(session => session.status === "completed").length === 0) && (
              <div className="text-center py-6 text-sm text-muted-foreground bg-card rounded-xl border border-dashed">
                Completed meetings will show here after your first skill session.
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
      <BottomNav />
    </div>
  );
}
