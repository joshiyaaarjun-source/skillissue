import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Volume2, Flame, HelpCircle, HandMetal, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { useGetReels, getGetReelsQueryKey, useReactToReel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

type Reel = {
  id: number;
  skillTag: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  reelScore: number;
  authorName: string;
  authorAvatar: string;
  reactionCounts: { "🔥": number; "🤔": number; "👏": number };
  myReaction: string | null;
};

const REACTIONS = [
  { emoji: "🔥", label: "Impressive" },
  { emoji: "🤔", label: "Curious" },
  { emoji: "👏", label: "Taught me something" },
];

function ReelCard({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  const [showReactions, setShowReactions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const queryClient = useQueryClient();
  const reactMutation = useReactToReel();

  const react = async (emoji: string) => {
    await reactMutation.mutateAsync({ id: String(reel.id), data: { reaction: emoji } });
    queryClient.invalidateQueries({ queryKey: getGetReelsQueryKey() });
    setShowReactions(false);
  };

  const totalReactions = (reel.reactionCounts["🔥"] ?? 0) + (reel.reactionCounts["🤔"] ?? 0) + (reel.reactionCounts["👏"] ?? 0);

  return (
    <div className="relative w-full h-full bg-[#1a0a0f] flex flex-col items-center justify-center overflow-hidden">
      <Avatar className="absolute inset-0 w-full h-full rounded-none">
        <AvatarImage src={reel.thumbnailUrl} className="w-full h-full object-cover opacity-40" />
        <AvatarFallback className="w-full h-full rounded-none bg-gradient-to-b from-[#4d0011] to-[#102b1f]" />
      </Avatar>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a0a0f]/90" />

      {/* Play button */}
      <button
        onClick={() => setPlaying(p => !p)}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        {!playing && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
          >
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </motion.div>
        )}
        {playing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
          >
            <Volume2 className="h-6 w-6 text-white" />
          </motion.div>
        )}
      </button>

      {/* Skill tag */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-xs font-bold bg-[#4d0011]/90 text-[#ffd9d9] px-2.5 py-1 rounded-full">
          {reel.skillTag}
        </span>
      </div>

      {/* Duration */}
      <div className="absolute top-4 right-4 z-20 text-white/60 text-xs font-medium">
        {reel.duration}s
      </div>

      {/* Right side reactions */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-4">
        <Avatar className="h-10 w-10 border-2 border-white/30">
          <AvatarImage src={reel.authorAvatar} />
          <AvatarFallback className="text-xs bg-[#4d0011] text-white">{reel.authorName[0]}</AvatarFallback>
        </Avatar>

        <button
          onClick={() => setShowReactions(s => !s)}
          className={`flex flex-col items-center gap-1 ${reel.myReaction ? "scale-110" : ""}`}
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all ${reel.myReaction ? "bg-[#4d0011]" : "bg-white/10 backdrop-blur"}`}>
            {reel.myReaction ?? "😶"}
          </div>
          <span className="text-white text-[10px] font-semibold">{totalReactions}</span>
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white text-xs font-bold">{reel.reelScore}</span>
          <span className="text-white/40 text-[9px]">score</span>
        </div>
      </div>

      {/* Reaction picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute right-16 bottom-44 z-30 bg-[#1a0a0f]/95 backdrop-blur rounded-2xl p-3 border border-white/10 flex flex-col gap-2"
          >
            {REACTIONS.map(r => (
              <button
                key={r.emoji}
                onClick={() => react(r.emoji)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${reel.myReaction === r.emoji ? "bg-[#4d0011]" : "hover:bg-white/10"}`}
              >
                <span className="text-xl">{r.emoji}</span>
                <span className="text-white text-xs font-medium">{r.label}</span>
                <span className="text-white/40 text-[10px] ml-1">{reel.reactionCounts[r.emoji as keyof typeof reel.reactionCounts] ?? 0}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-20 z-20">
        <p className="text-white/70 text-xs font-semibold mb-1">@{reel.authorName.split(" ")[0].toLowerCase()}</p>
        <h3 className="text-white text-base font-bold leading-snug">{reel.title}</h3>
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-1">
            {Object.entries(reel.reactionCounts).map(([emoji, count]) =>
              count > 0 ? <span key={emoji} className="text-sm">{emoji} <span className="text-white/60 text-[10px]">{count}</span></span> : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkillReels() {
  const [, navigate] = useLocation();
  const { data: reels, isLoading } = useGetReels({ query: { queryKey: getGetReelsQueryKey() } });
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.WheelEvent) => {
    if (!reels) return;
    if (e.deltaY > 30 && currentIndex < reels.length - 1) setCurrentIndex(i => i + 1);
    if (e.deltaY < -30 && currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleTouchStart = useRef<number>(0);
  const onTouchStart = (e: React.TouchEvent) => { handleTouchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!reels) return;
    const diff = handleTouchStart.current - e.changedTouches[0].clientY;
    if (diff > 50 && currentIndex < reels.length - 1) setCurrentIndex(i => i + 1);
    if (diff < -50 && currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  return (
    <div className="min-h-[100dvh] bg-[#1a0a0f] overflow-hidden relative" onWheel={handleScroll} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-[#1a0a0f] to-transparent">
        <button onClick={() => navigate("/explore")} className="text-white/70 p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-white text-sm font-bold">Skill Reels</p>
          <p className="text-white/40 text-[10px]">{reels ? `${currentIndex + 1} / ${reels.length}` : "Loading..."}</p>
        </div>
        <button onClick={() => navigate("/explore")} className="text-white/70 text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-full">
          + Share
        </button>
      </div>

      {isLoading ? (
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse mx-auto" />
            <p className="text-white/40 text-sm">Loading reels...</p>
          </div>
        </div>
      ) : reels && reels.length > 0 ? (
        <div ref={containerRef} className="h-[100dvh] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0"
            >
              <ReelCard reel={reels[currentIndex] as Reel} isActive={true} />
            </motion.div>
          </AnimatePresence>

          {/* Scroll hint */}
          {currentIndex < reels.length - 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white/30 text-[10px] flex flex-col items-center gap-0.5"
              >
                <span>↓ swipe</span>
              </motion.div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[100dvh] flex items-center justify-center flex-col gap-3">
          <Play className="h-12 w-12 text-white/20" />
          <p className="text-white/40">No reels yet</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
