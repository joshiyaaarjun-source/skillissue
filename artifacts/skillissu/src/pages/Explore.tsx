import { useState, useMemo } from "react";
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { X, Heart, Info, Star, ShieldCheck, Zap, Sparkles, Crown } from "lucide-react";
import InstantMatchModal from "@/components/InstantMatchModal";
import LiveDropsBanner from "@/components/LiveDropsBanner";
import { useGetExploreUsers, getGetExploreUsersQueryKey, useRecordSwipe, useGetMe, getGetMeQueryKey, useGetSkillDemand, getGetSkillDemandQueryKey } from "@workspace/api-client-react";
import type { SkillDemandEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ExploreUser } from "@workspace/api-client-react";
import confetti from "canvas-confetti";

function getDemandInfo(skill: string, demand: SkillDemandEntry[]): { emoji: string; label: string } | null {
  const entry = demand.find(d => d.skill.toLowerCase() === skill.toLowerCase());
  if (!entry) return null;
  if (entry.level === "high") return { emoji: "🔥", label: "High" };
  if (entry.level === "rising") return { emoji: "📈", label: "Rising" };
  return { emoji: "🧊", label: "Low" };
}

function SkillPill({ label, variant, demand }: {
  label: string;
  variant: "offered" | "wanted";
  demand?: SkillDemandEntry[];
}) {
  const info = demand ? getDemandInfo(label, demand) : null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      variant === "offered"
        ? "bg-[#bd7880] text-white"
        : "border border-[#ffd9d9]/60 text-[#ffd9d9] bg-transparent"
    }`}>
      {info && <span className="text-[10px] leading-none" title={`${info.label} demand`}>{info.emoji}</span>}
      {label}
    </span>
  );
}

function ContextBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${color}`}>
      {label}
    </span>
  );
}

function ProfilePreviewSheet({
  user,
  onClose,
  onLike,
  onPass,
}: {
  user: ExploreUser;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 280 }}
      className="fixed inset-0 z-[200] flex flex-col bg-[#0e0a0c]"
    >
      {/* Gradient header with avatar */}
      <div className="relative h-64 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#4d0011]/80 to-[#0e0a0c]" />
        <Avatar className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-28 w-28 border-4 border-[#bd7880] shadow-2xl">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-3xl font-bold bg-[#4d0011] text-[#ffd9d9]">{user.name[0]}</AvatarFallback>
        </Avatar>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-20 pb-32">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{user.name}</h2>
          <div className="flex items-center justify-center gap-3 text-[#ffd9d9]/60 text-sm">
            <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-current" />{user.credibilityScore.toFixed(1)}</span>
            <span>{user.exchangeCount} exchanges</span>
            {user.verificationStatus === "fully_verified" && (
              <span className="flex items-center gap-1 text-green-400"><ShieldCheck size={12} /> Verified</span>
            )}
          </div>
          {user.bio && <p className="text-[#ffd9d9]/70 italic text-sm mt-3 leading-relaxed">{user.bio}</p>}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-2">Can Teach</p>
            <div className="flex flex-wrap gap-2">
              {user.skillsOffered.map(s => <SkillPill key={s} label={s} variant="offered" />)}
            </div>
          </div>
          <div>
            <p className="text-[#ffd9d9]/50 text-xs font-bold uppercase tracking-widest mb-2">Wants to Learn</p>
            <div className="flex flex-wrap gap-2">
              {user.skillsWanted.map(s => <SkillPill key={s} label={s} variant="wanted" />)}
            </div>
          </div>
          {user.overlappingSkills.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 text-amber-400">Skill Overlap</p>
              <div className="flex flex-wrap gap-2">
                {user.overlappingSkills.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">{s}</span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-white">{user.matchScore}%</p>
              <p className="text-xs text-[#ffd9d9]/50 mt-0.5">Match score</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-white">{user.credits}</p>
              <p className="text-xs text-[#ffd9d9]/50 mt-0.5">Credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 bg-gradient-to-t from-[#0e0a0c] to-transparent pt-8">
        <Button
          onClick={onPass}
          variant="outline"
          className="flex-1 h-12 border-white/20 text-white bg-transparent hover:bg-white/10 font-bold rounded-2xl"
        >
          Pass
        </Button>
        <Button
          onClick={onLike}
          className="flex-1 h-12 bg-[#bd7880] hover:bg-[#bd7880]/90 text-white font-bold rounded-2xl"
        >
          <Heart size={16} className="mr-2 fill-current" /> Like
        </Button>
      </div>
    </motion.div>
  );
}

export default function Explore() {
  const { data: users, isLoading } = useGetExploreUsers({ query: { queryKey: getGetExploreUsersQueryKey() } });
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: demandData } = useGetSkillDemand({ query: { queryKey: getGetSkillDemandQueryKey() } });
  const recordSwipe = useRecordSwipe();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExploreUser | null>(null);
  const [previewUser, setPreviewUser] = useState<ExploreUser | null>(null);
  const [swipeHint, setSwipeHint] = useState<"left" | "right" | null>(null);
  const [showInstantMatch, setShowInstantMatch] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [combosOnly, setCombosOnly] = useState(false);
  const controls = useAnimation();

  const MOODS = [
    { id: "relaxed", label: "🧘 Relaxed", tags: ["yoga", "meditation", "cooking", "gardening", "music", "art", "writing"] },
    { id: "focused", label: "🎯 Focused", tags: ["coding", "design", "math", "science", "programming", "data"] },
    { id: "creative", label: "🎨 Creative", tags: ["art", "design", "writing", "photography", "music", "film", "drawing"] },
    { id: "fast", label: "⚡ Fast", tags: ["coding", "engineering", "tech", "react", "python", "javascript", "sql"] },
  ];

  const displayUsers = useMemo(() => {
    if (!users) return [];
    const myWanted = (me?.skillsWanted ?? []).map(s => s.toLowerCase());

    let filtered = users.filter(u => {
      if (combosOnly) {
        const comboCount = u.skillsOffered.filter(s => myWanted.includes(s.toLowerCase())).length;
        if (comboCount < 2) return false;
      }
      return true;
    });

    if (mood) {
      const moodEntry = MOODS.find(m => m.id === mood);
      if (moodEntry) {
        filtered = [...filtered].sort((a, b) => {
          const aScore = a.skillsOffered.filter(s => moodEntry.tags.some(t => s.toLowerCase().includes(t))).length;
          const bScore = b.skillsOffered.filter(s => moodEntry.tags.some(t => s.toLowerCase().includes(t))).length;
          return bScore - aScore;
        });
      }
    }

    return filtered;
  }, [users, mood, combosOnly, me?.skillsWanted]);

  const handleSwipe = async (direction: "left" | "right") => {
    if (!displayUsers.length) return;
    const currentUser = displayUsers[currentIndex];

    await controls.start({
      x: direction === "right" ? 520 : -520,
      opacity: 0,
      rotate: direction === "right" ? 18 : -18,
      transition: { duration: 0.28, ease: "easeIn" },
    });

    recordSwipe.mutate({ data: { targetUserId: currentUser.id, direction } }, {
      onSuccess: (result) => {
        if (result.matched) {
          setMatchedUser(currentUser);
          setShowMatchOverlay(true);
          confetti({ particleCount: 180, spread: 110, origin: { y: 0.55 }, colors: ["#bd7880", "#ffd9d9", "#f5c842", "#4d0011"] });
          setTimeout(() => {
            setShowMatchOverlay(false);
            setCurrentIndex(p => p + 1);
            controls.set({ x: 0, opacity: 1, rotate: 0 });
            queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
          }, 3200);
        } else {
          setCurrentIndex(p => p + 1);
          controls.set({ x: 0, opacity: 1, rotate: 0 });
        }
      },
      onError: () => {
        setCurrentIndex(p => p + 1);
        controls.set({ x: 0, opacity: 1, rotate: 0 });
      },
    });
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setSwipeHint(null);
    if (info.offset.x > 90) handleSwipe("right");
    else if (info.offset.x < -90) handleSwipe("left");
    else controls.start({ x: 0, y: 0, rotate: 0, opacity: 1 });
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 30) setSwipeHint("right");
    else if (info.offset.x < -30) setSwipeHint("left");
    else setSwipeHint(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
        <Skeleton className="h-[68vh] w-full max-w-sm rounded-3xl" />
        <BottomNav />
      </div>
    );
  }

  if (!users || currentIndex >= displayUsers.length) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background pb-24 text-center">
        <Sparkles className="h-12 w-12 text-[#bd7880] mb-4 opacity-60" />
        <h2 className="text-xl font-bold mb-2">No new skill crushes right now</h2>
        <p className="text-muted-foreground text-sm italic">Check back soon.</p>
        <BottomNav />
      </div>
    );
  }

  const currentUser = displayUsers[currentIndex];
  const nextUser = displayUsers[currentIndex + 1];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f7f3f4] overflow-hidden relative">
      {/* Live Drops Banner */}
      <div className="pt-14 px-0 z-10 relative">
        <LiveDropsBanner />
      </div>

      {/* Subtle header */}
      <div className="flex items-center justify-between px-5 pb-2 z-10 relative">
        <p className="text-xs font-semibold text-[#bd7880]/70 italic">we swiped right...on skills</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstantMatch(true)}
            className="flex items-center gap-1 text-xs font-bold bg-yellow-400 text-[#4d0011] px-2.5 py-1 rounded-full shadow-sm hover:bg-yellow-300 transition-colors"
          >
            <Zap className="h-3 w-3 fill-current" />
            Match Now
          </button>
          <span className="text-xs text-muted-foreground font-medium">{displayUsers.length - currentIndex} left</span>
        </div>
      </div>

      {/* Mood + Combo filters */}
      <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => setMood(mood === m.id ? null : m.id)}
            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
              mood === m.id
                ? "bg-[#4d0011] text-white border-[#4d0011]"
                : "bg-white/70 text-[#4d0011] border-[#bd7880]/40"
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setCombosOnly(!combosOnly)}
          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
            combosOnly
              ? "bg-[#102b1f] text-white border-[#102b1f]"
              : "bg-white/70 text-[#102b1f] border-[#102b1f]/30"
          }`}
        >
          🔗 Combos
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32 relative">
        {/* Next card (peeking) */}
        {nextUser && (
          <div className="absolute w-[calc(100%-3rem)] max-w-[360px] h-[66vh] max-h-[580px] rounded-3xl bg-white shadow-sm scale-[0.94] -translate-y-3 z-0 overflow-hidden pointer-events-none opacity-60">
            <div className="h-full bg-gradient-to-b from-[#4d0011]/20 to-white/10" />
          </div>
        )}

        {/* Main swipe card */}
        <motion.div
          key={currentUser.id}
          animate={controls}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          style={{ x: 0, rotate: 0 }}
          className="absolute w-[calc(100%-2rem)] max-w-[360px] h-[66vh] max-h-[580px] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden cursor-grab touch-none bg-[#1a0a0f]"
        >
          {/* Swipe hint overlays */}
          <AnimatePresence>
            {swipeHint === "right" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#bd7880]/20 z-20 pointer-events-none flex items-center justify-start pl-8"
              >
                <div className="border-4 border-[#bd7880] rounded-xl px-3 py-1 rotate-[-15deg]">
                  <Heart size={32} className="text-[#bd7880] fill-current" />
                </div>
              </motion.div>
            )}
            {swipeHint === "left" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-500/10 z-20 pointer-events-none flex items-center justify-end pr-8"
              >
                <div className="border-4 border-red-400 rounded-xl px-3 py-1 rotate-[15deg]">
                  <X size={32} className="text-red-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top half: photo + gradient overlay */}
          <div className="relative h-[55%] flex-shrink-0">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={currentUser.avatar} className="w-full h-full object-cover rounded-none" />
              <AvatarFallback className="w-full h-full rounded-none bg-gradient-to-br from-[#4d0011] to-[#bd7880] text-6xl font-bold text-white flex items-center justify-center">
                {currentUser.name[0]}
              </AvatarFallback>
            </Avatar>
            {/* Dark gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0f] via-[#1a0a0f]/30 to-transparent" />

            {/* Badges overlaid on photo */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {currentUser.verificationStatus === "fully_verified" && (
                <ContextBadge label="Verified" color="bg-green-500/90 text-white" />
              )}
              {currentUser.verificationStatus === "partial" && (
                <ContextBadge label="Quiz Passed" color="bg-amber-500/90 text-white" />
              )}
              {currentUser.isNew && (
                <ContextBadge label="New User" color="bg-[#bd7880]/90 text-white" />
              )}
              {demandData && currentUser.skillsOffered.some(s =>
                demandData.find(d => d.skill.toLowerCase() === s.toLowerCase())?.level === "high"
              ) && (
                <ContextBadge label="🔥 High Demand" color="bg-[#4d0011]/90 text-[#ffd9d9]" />
              )}
              {currentUser.credibilityScore >= 4.5 && currentUser.exchangeCount >= 5 && (
                <ContextBadge label="👑 Elite" color="bg-yellow-400/90 text-[#4d0011]" />
              )}
              {me && (() => {
                const myWanted = (me.skillsWanted ?? []).map(s => s.toLowerCase());
                const comboCount = currentUser.skillsOffered.filter(s => myWanted.includes(s.toLowerCase())).length;
                return comboCount >= 2 ? <ContextBadge label={`🔗 ${comboCount} Skills Match`} color="bg-[#102b1f]/90 text-[#ffd9d9]" /> : null;
              })()}
            </div>

            {/* Match score badge */}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
              <Zap size={10} className="text-amber-400 fill-current" />
              <span className="text-white text-xs font-bold">{currentUser.matchScore}%</span>
            </div>

            {/* Name overlaid on gradient */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
              <h2 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {currentUser.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Star size={11} className="text-yellow-400 fill-current" />
                <span className="text-white/80 text-xs font-medium">{currentUser.credibilityScore.toFixed(1)}</span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/60 text-xs">{currentUser.exchangeCount} exchanges</span>
              </div>
            </div>
          </div>

          {/* Bottom half: bio + skills */}
          <div className="flex-1 flex flex-col px-4 pt-3 pb-4 gap-3 overflow-hidden">
            {currentUser.bio && (
              <p className="text-[#ffd9d9]/70 text-xs italic leading-relaxed line-clamp-2">
                {currentUser.bio}
              </p>
            )}

            <div>
              <p className="text-[#bd7880] text-[10px] font-bold uppercase tracking-widest mb-1.5">Teaches</p>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.skillsOffered.slice(0, 4).map(s => (
                  <SkillPill key={s} label={s} variant="offered" demand={demandData} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[#ffd9d9]/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">Wants</p>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.skillsWanted.slice(0, 4).map(s => (
                  <SkillPill key={s} label={s} variant="wanted" demand={demandData} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="absolute bottom-24 w-full flex justify-center items-center gap-5 z-20 px-8">
          {/* Reject */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("left")}
            className="h-14 w-14 rounded-full border-2 border-red-300/60 bg-white text-red-400 flex items-center justify-center shadow-lg hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <X size={22} />
          </motion.button>

          {/* Info */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setPreviewUser(currentUser)}
            className="h-11 w-11 rounded-full border-2 border-[#bd7880]/40 bg-white text-[#bd7880] flex items-center justify-center shadow-md hover:border-[#bd7880] hover:bg-[#ffd9d9]/20 transition-colors"
          >
            <Info size={18} />
          </motion.button>

          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe("right")}
            className="h-14 w-14 rounded-full border-2 border-[#bd7880] bg-[#bd7880] text-white flex items-center justify-center shadow-lg hover:bg-[#bd7880]/90 transition-colors"
          >
            <Heart size={22} className="fill-current" />
          </motion.button>
        </div>
      </div>

      <BottomNav />

      {/* Profile Preview Sheet */}
      <AnimatePresence>
        {previewUser && (
          <ProfilePreviewSheet
            user={previewUser}
            onClose={() => setPreviewUser(null)}
            onLike={() => { setPreviewUser(null); handleSwipe("right"); }}
            onPass={() => { setPreviewUser(null); handleSwipe("left"); }}
          />
        )}
      </AnimatePresence>

      {/* Match Modal — full screen */}
      <AnimatePresence>
        {showMatchOverlay && matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="fixed inset-0 z-[300] bg-[#1a0408] flex flex-col items-center justify-center p-8 text-center"
            style={{ border: "2px solid #bd7880" }}
          >
            {/* Gold–rose glow behind avatars */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#bd7880]/20 rounded-full blur-3xl pointer-events-none" />

            <motion.p
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring" }}
              className="text-[#bd7880] text-xs font-bold uppercase tracking-[0.2em] mb-3"
            >
              It's a Match
            </motion.p>
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring" }}
              className="text-4xl font-black text-white mb-2 leading-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              You and {matchedUser.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#ffd9d9]/70 text-sm leading-relaxed mb-8 max-w-xs"
            >
              {matchedUser.overlappingSkills.length > 0
                ? `They can teach you ${matchedUser.skillsOffered[0]} and you can teach them ${matchedUser.skillsWanted[0]}.`
                : "You two have complementary skills — start an exchange!"}
            </motion.p>

            {/* Both photos */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
              className="flex items-center justify-center gap-4 mb-3"
            >
              <Avatar className="h-24 w-24 border-4 border-[#bd7880] shadow-2xl">
                <AvatarImage src={me?.avatar} />
                <AvatarFallback className="text-3xl font-bold bg-[#4d0011] text-[#ffd9d9]">{me?.name?.[0] ?? "A"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-1">
                <Heart size={22} className="text-[#bd7880] fill-current" />
              </div>
              <Avatar className="h-24 w-24 border-4 border-[#bd7880] shadow-2xl">
                <AvatarImage src={matchedUser.avatar} />
                <AvatarFallback className="text-3xl font-bold bg-[#4d0011] text-[#ffd9d9]">{matchedUser.name[0]}</AvatarFallback>
              </Avatar>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[#ffd9d9]/50 text-xs font-serif italic mb-8"
            >
              we swiped right...on skills
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <Button className="w-full h-12 bg-[#bd7880] hover:bg-[#bd7880]/90 text-white font-bold rounded-2xl text-base shadow-lg">
                Start Session
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowMatchOverlay(false); setCurrentIndex(p => p + 1); controls.set({ x: 0, opacity: 1, rotate: 0 }); }}
                className="w-full h-12 text-[#ffd9d9]/60 hover:text-[#ffd9d9] font-semibold rounded-2xl"
              >
                Keep Swiping
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstantMatchModal open={showInstantMatch} onClose={() => setShowInstantMatch(false)} />
    </div>
  );
}
