import { useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Flame, Zap, ArrowRight, BookOpen, User as UserIcon } from "lucide-react";
import { useGetMe, getGetMeQueryKey, useGetNudges, getGetNudgesQueryKey, useGetExchanges, getGetExchangesQueryKey } from "@workspace/api-client-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: nudges, isLoading: nudgesLoading } = useGetNudges({ query: { queryKey: getGetNudgesQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });

  if (meLoading || nudgesLoading || exchangesLoading) {
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
          
          <div className="text-right">
            <div className="text-xs font-medium text-[#ffd9d9] uppercase tracking-wider mb-1">Balance</div>
            <div className="text-3xl font-black tabular-nums flex items-baseline gap-1">
              <CreditCounter value={me.creditBalance} />
              <span className="text-lg text-[#ffd9d9]">C</span>
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

      </motion.div>
      <BottomNav />
    </div>
  );
}
