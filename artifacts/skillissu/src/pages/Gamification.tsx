import { motion } from "framer-motion";
import { Flame, Trophy, Shield, Zap, Target, Award } from "lucide-react";
import { useGetGamification, getGetGamificationQueryKey } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Map string icons from API to Lucide components
const IconMap: Record<string, any> = {
  Trophy, Shield, Zap, Target, Award, Flame
};

export default function Gamification() {
  const { data: gamification, isLoading } = useGetGamification({ query: { queryKey: getGetGamificationQueryKey() } });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 pt-12 space-y-6 pb-24">
        <Skeleton className="h-48 w-full rounded-[2rem]" />
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!gamification) return null;

  const xpProgress = (gamification.xp % 1000) / 10;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="p-4 pt-12 space-y-8">
        
        {/* Big Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#4d0011] to-[#1a0008] rounded-[2rem] p-8 text-white text-center shadow-xl relative overflow-hidden"
        >
          {/* Decorative background flame */}
          <Flame className="absolute -right-4 -bottom-4 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className="bg-orange-500/20 p-4 rounded-full mb-4 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
            >
              <Flame className="w-12 h-12 text-orange-500" />
            </motion.div>
            
            <div className="text-sm font-bold tracking-widest uppercase text-[#ffd9d9] mb-1">Current Streak</div>
            <div className="text-6xl font-black mb-6 tabular-nums tracking-tighter">
              {gamification.streakDays}
            </div>
            
            <div className="w-full max-w-xs space-y-2 bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex justify-between text-sm font-medium text-[#ffd9d9]">
                <span>Level {gamification.level}</span>
                <span>{gamification.xp % 1000} / 1000 XP</span>
              </div>
              <Progress value={xpProgress} className="h-3 bg-white/10" indicatorClassName="bg-[#ffd9d9]" />
            </div>
          </div>
        </motion.div>

        {/* Next Badge */}
        {gamification.nextBadge && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border p-4 rounded-2xl shadow-sm"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Up Next</h3>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = IconMap[gamification.nextBadge.icon] || Trophy;
                  return <Icon className="w-6 h-6 text-muted-foreground" />;
                })()}
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{gamification.nextBadge.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{gamification.nextBadge.description}</p>
                {gamification.nextBadge.target && gamification.nextBadge.progress !== undefined && (
                   <Progress 
                    value={(gamification.nextBadge.progress / gamification.nextBadge.target) * 100} 
                    className="h-1.5" 
                   />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Badges Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 px-1">Trophy Case</h3>
          <div className="grid grid-cols-2 gap-4">
            {gamification.badges.map((badge, index) => {
              const Icon = IconMap[badge.icon] || Trophy;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                  key={badge.id}
                  className={cn(
                    "p-4 rounded-2xl border text-center flex flex-col items-center transition-all",
                    badge.earned 
                      ? "bg-card border-[#bd7880]/30 shadow-[0_4px_20px_-10px_rgba(77,0,17,0.15)]" 
                      : "bg-muted/50 border-transparent opacity-60 grayscale"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center mb-3",
                    badge.earned ? "bg-[#ffd9d9] text-[#4d0011] shadow-inner" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className={cn("font-bold text-sm leading-tight mb-1", !badge.earned && "text-muted-foreground")}>
                    {badge.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {badge.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
