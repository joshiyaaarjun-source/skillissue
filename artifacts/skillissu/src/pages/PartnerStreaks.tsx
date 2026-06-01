import { motion } from "framer-motion";
import { Flame, Users, Trophy, Heart } from "lucide-react";
import { useGetPartnerStreaks } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function PartnerStreaks() {
  const [, navigate] = useLocation();
  const { data: streaks, isLoading } = useGetPartnerStreaks();

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-[#ffd9d9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Partner Streaks</h1>
            <p className="text-xs opacity-60">Shared streaks with frequent collaborators</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[#ffd9d9]/30 border border-[#ffd9d9]/50 rounded-2xl p-4">
          <p className="text-sm text-[#4d0011] font-medium">Complete 3+ sessions with a match to unlock a Partner Streak. Reach 30 sessions together to earn the <strong>Ride or Die</strong> badge 🏆</p>
        </div>

        {isLoading ? [1,2,3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />) :
          !streaks?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No partner streaks yet</p>
              <p className="text-sm mt-1">Complete 3+ sessions with the same match to start one</p>
            </div>
          ) : streaks.map((streak, i) => (
            <motion.div key={streak.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={streak.partnerAvatar} />
                  <AvatarFallback className="bg-[#4d0011] text-white text-sm">{streak.partnerName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{streak.partnerName}</span>
                    <span className="text-[10px] bg-[#ffd9d9]/60 text-[#4d0011] px-1.5 py-0.5 rounded-full font-bold">{streak.skill}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Longest: {streak.longestStreak} sessions</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 bg-orange-100 px-2.5 py-1.5 rounded-xl">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-lg font-black text-orange-600">{streak.currentStreak}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">sessions</p>
                </div>
              </div>
              {streak.currentStreak >= 30 && (
                <div className="mt-3 p-2 bg-amber-100 rounded-xl flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">Ride or Die badge earned! 🎉</span>
                </div>
              )}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progress to Ride or Die</span>
                  <span>{streak.currentStreak}/30</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4d0011] to-[#bd7880] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (streak.currentStreak / 30) * 100)}%` }} />
                </div>
              </div>
            </motion.div>
          ))
        }
      </div>
      <BottomNav />
    </div>
  );
}
