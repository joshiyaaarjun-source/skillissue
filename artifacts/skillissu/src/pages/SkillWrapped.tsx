import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, ChevronLeft, ChevronRight, Sparkles, Flame, Trophy, Zap, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useGetWrapped, getGetWrappedQueryKey } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SkillWrapped() {
  const [, navigate] = useLocation();
  const { data: wrapped, isLoading, error } = useGetWrapped({ query: { queryKey: getGetWrappedQueryKey() } });
  const [slide, setSlide] = useState(0);
  const [shared, setShared] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#4d0011] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[#ffd9d9]">
          <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="font-bold text-lg">Building your Wrapped...</p>
          <p className="text-sm opacity-60 mt-1">Claude is writing your story</p>
        </motion.div>
      </div>
    );
  }

  if (error || !wrapped) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-12 w-12 text-[#bd7880]/30 mb-4" />
        <p className="font-bold text-lg">Wrapped not ready yet</p>
        <p className="text-sm text-muted-foreground mt-2">Available on the 1st of each month</p>
        <button onClick={() => navigate("/dashboard")} className="mt-6 bg-[#4d0011] text-white font-bold py-3 px-8 rounded-2xl">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const monthName = MONTHS[parseInt(wrapped.month.split("-")[1]) - 1] ?? wrapped.month;
  const year = wrapped.month.split("-")[0];

  const slides = [
    {
      bg: "from-[#4d0011] to-[#2a0008]",
      content: (
        <div className="text-center text-[#ffd9d9] px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm font-semibold uppercase tracking-widest opacity-60 mb-2">
            {monthName} {year}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl font-black leading-tight mb-6">
            Your Month<br />in Skills
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white/10 rounded-2xl p-4 text-sm leading-relaxed italic">
            "{wrapped.aiCopy}"
          </motion.div>
        </div>
      ),
    },
    {
      bg: "from-[#102b1f] to-[#071a12]",
      content: (
        <div className="text-center text-white px-6 w-full">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xs font-bold uppercase tracking-widest opacity-40 mb-8">
            Your Skills
          </motion.p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { icon: <Star className="h-6 w-6 text-yellow-300 fill-current" />, label: "Top Taught", value: wrapped.topSkillTaught, color: "bg-white/10" },
              { icon: <Zap className="h-6 w-6 text-yellow-300 fill-current" />, label: "Top Learned", value: wrapped.topSkillLearned, color: "bg-white/10" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.15 }}
                className={`${item.color} rounded-2xl p-4 flex flex-col items-center gap-2`}>
                {item.icon}
                <p className="text-[10px] opacity-50 uppercase tracking-wider">{item.label}</p>
                <p className="font-black text-lg leading-tight text-center">{item.value}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Exchanges", value: wrapped.totalExchanges, suffix: "" },
              { label: "Earned", value: Math.round(wrapped.creditsEarned), suffix: "C" },
              { label: "Spent", value: Math.round(wrapped.creditsSpent), suffix: "C" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-black">{item.value}{item.suffix}</p>
                <p className="text-[10px] opacity-50 mt-0.5">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      bg: "from-[#4d0011] via-[#2a0044] to-[#4d0011]",
      content: (
        <div className="text-center text-[#ffd9d9] px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <Trophy className="h-20 w-20 mx-auto mb-4 text-yellow-300 fill-yellow-300/30" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-black mb-2">
            {wrapped.longestStreak}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm opacity-70 mb-6">
            day streak 🔥
          </motion.p>
          {wrapped.newBadges > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
              className="bg-white/10 rounded-2xl p-4 mb-6">
              <p className="text-3xl font-black">{wrapped.newBadges}</p>
              <p className="text-xs opacity-60">new badges earned</p>
            </motion.div>
          )}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg font-bold">
            See you next month 👋
          </motion.p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[100dvh] overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className={`min-h-[100dvh] bg-gradient-to-b ${slides[slide].bg} flex flex-col`}
        >
          {/* Nav */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-3">
            <button onClick={() => navigate("/dashboard")} className="text-white/60 p-1.5">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className={`h-1 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-3 bg-white/30"}`}
                />
              ))}
            </div>
            <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }} className="text-white/60 p-1.5">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Slide content */}
          <div className="flex-1 flex items-center justify-center pt-20 pb-24">
            {slides[slide].content}
          </div>

          {/* Prev/next */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-between px-4">
            <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
              className="text-white/40 disabled:opacity-0 p-2">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))} disabled={slide === slides.length - 1}
              className="text-white/60 disabled:opacity-0 p-2">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {shared && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-[#4d0011] text-sm font-bold px-4 py-2 rounded-full shadow-lg z-50">
          ✓ Copied to clipboard!
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
}
