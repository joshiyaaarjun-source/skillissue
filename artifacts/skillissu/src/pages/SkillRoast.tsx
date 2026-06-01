import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Share2, RefreshCw, ArrowLeft } from "lucide-react";
import { useGetRoast, useOptInRoast } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

export default function SkillRoast() {
  const [, navigate] = useLocation();
  const { data: roast, isLoading, refetch } = useGetRoast();
  const optIn = useOptInRoast();
  const [shared, setShared] = useState(false);
  const [generating, setGenerating] = useState(false);

  const hasRoast = roast && roast.id > 0;

  const handleOptIn = async () => {
    setGenerating(true);
    try { await optIn.mutateAsync(); await refetch(); } finally { setGenerating(false); }
  };

  const handleShare = () => {
    if (!roast) return;
    navigator.clipboard?.writeText(`"${roast.roastText}" — my skillissue roast 🔥`).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skill Roast Mode</h1>
            <p className="text-xs opacity-60">AI reviews your profile. Brutally. Playfully.</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
          <p className="font-semibold mb-1">⚠️ Opt-in only</p>
          <p className="text-xs">Claude will read your skill ratings, sessions, and feedback history to write a short, witty critique of your weakest area. It's playful — not cruel.</p>
        </div>

        {isLoading ? (
          <div className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
        ) : hasRoast ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#4d0011] to-orange-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Your Roast</span>
            </div>
            <p className="text-base leading-relaxed font-medium italic mb-4">"{roast.roastText}"</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Weakest: <strong className="text-orange-300">{roast.weakestSkill}</strong></span>
              <div className="flex gap-2">
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                  <Share2 className="h-3 w-3" />
                  {shared ? "Copied!" : "Share"}
                </button>
                <button onClick={handleOptIn} disabled={generating}
                  className="flex items-center gap-1.5 bg-orange-500/30 text-orange-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-400/30">
                  <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
                  New roast
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center">
            <Flame className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ready to be roasted?</h2>
            <p className="text-sm text-muted-foreground mb-6">Claude will analyse your skill profile and deliver a witty, honest critique. Think of it as tough love from an AI.</p>
            <button onClick={handleOptIn} disabled={generating || optIn.isPending}
              className="bg-[#4d0011] text-white font-bold py-3.5 px-8 rounded-2xl text-base w-full disabled:opacity-50">
              {generating || optIn.isPending ? "Generating roast... 🔥" : "Roast Me 🔥"}
            </button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
