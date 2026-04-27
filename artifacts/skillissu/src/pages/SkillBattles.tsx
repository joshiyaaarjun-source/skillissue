import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, Star, Clock, ThumbsUp, ThumbsDown,
  Zap, Plus, ChevronRight, Loader2, CheckCircle2, XCircle, Crown
} from "lucide-react";
import {
  useGetBattles, getGetBattlesQueryKey,
  useCreateBattle, useSubmitBattleAnswers, useVoteOnBattle
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import type { SkillBattle, BattleQuestion } from "@workspace/api-client-react";

const SKILL_SUGGESTIONS = ["React", "Machine Learning", "UI Design", "Python", "Public Speaking", "Writing"];

// ── Live battle quiz ──────────────────────────────────────────────────────────
function BattleArena({ battle, onDone }: { battle: SkillBattle; onDone: (updated: SkillBattle) => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(battle.timeLimitSeconds);
  const [timeUsed, setTimeUsed] = useState(0);
  const [phase, setPhase] = useState<"answering" | "submitting" | "done">("answering");
  const startTime = useRef(Date.now());
  const submitBattle = useSubmitBattleAnswers();
  const queryClient = useQueryClient();

  const questions = battle.questions as BattleQuestion[];

  useEffect(() => {
    if (phase !== "answering") return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          handleSubmit([...answers]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleAnswer = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    setTimeout(() => {
      const newAnswers = [...answers, optIdx];
      if (qIdx + 1 < questions.length) {
        setAnswers(newAnswers);
        setQIdx(i => i + 1);
        setSelected(null);
      } else {
        handleSubmit(newAnswers);
      }
    }, 600);
  };

  const handleSubmit = (finalAnswers: number[]) => {
    if (phase !== "answering") return;
    setPhase("submitting");
    const used = Math.floor((Date.now() - startTime.current) / 1000);
    setTimeUsed(used);
    submitBattle.mutate(
      { battleId: battle.id, data: { answers: finalAnswers, timeUsedSeconds: used } },
      {
        onSuccess: (updated) => {
          setPhase("done");
          queryClient.invalidateQueries({ queryKey: getGetBattlesQueryKey() });
          setTimeout(() => onDone(updated), 1500);
        },
        onError: () => { toast.error("Failed to submit answers"); setPhase("answering"); },
      },
    );
  };

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={36} className="animate-spin text-[#bd7880]" />
        <p className="text-white/60 text-sm">Calculating results…</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle2 size={48} className="text-green-400" />
        <p className="text-white font-bold text-lg">Answers submitted!</p>
      </div>
    );
  }

  const q = questions[qIdx];
  if (!q) return null;
  const pct = (timeLeft / battle.timeLimitSeconds) * 100;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Timer bar */}
      <div className="flex items-center gap-3">
        <Clock size={14} className={`${timeLeft < 15 ? "text-red-400" : "text-[#bd7880]"}`} />
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timeLeft < 15 ? "bg-red-400" : "bg-[#bd7880]"}`}
            style={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className={`text-sm font-mono font-bold ${timeLeft < 15 ? "text-red-400" : "text-white/60"}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Progress */}
      <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-wide">
        <span>Question {qIdx + 1} of {questions.length}</span>
        <span>{answers.length} answered</span>
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-white font-semibold leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "bg-white/5 border-white/10 text-white/80";
          if (selected !== null) {
            if (i === q.correctIndex) cls = "bg-green-500/20 border-green-500/50 text-green-300";
            else if (i === selected) cls = "bg-red-500/20 border-red-500/50 text-red-300";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${cls}`}
            >
              <span className="text-white/40 mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Results card ──────────────────────────────────────────────────────────────
function BattleResultCard({ battle, onVote }: { battle: SkillBattle; onVote: () => void }) {
  const voteOnBattle = useVoteOnBattle();
  const queryClient = useQueryClient();
  const totalVotes = battle.votesForChallenger + battle.votesForOpponent;
  const challengerPct = totalVotes > 0 ? Math.round((battle.votesForChallenger / totalVotes) * 100) : 50;
  const userWon = battle.challengerScore > battle.opponentScore;

  const handleVote = (voteFor: "challenger" | "opponent") => {
    voteOnBattle.mutate({ battleId: battle.id, data: { voteFor } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBattlesQueryKey() });
        onVote();
        toast.success("Vote recorded!");
      },
    });
  };

  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-[#bd7880] text-xs font-bold uppercase tracking-wide">{battle.skill}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          userWon ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
        }`}>
          {userWon ? "You Won 🏆" : "You Lost"}
        </span>
      </div>

      {/* Scores */}
      <div className="flex items-center justify-around py-4 px-4">
        <div className="text-center">
          <div className="relative">
            <Avatar className="h-12 w-12 mx-auto border-2 border-[#bd7880]">
              <AvatarFallback className="bg-[#4d0011] text-white font-bold">Y</AvatarFallback>
            </Avatar>
            {userWon && <Crown size={14} className="absolute -top-1 -right-1 text-amber-400" />}
          </div>
          <p className="text-white text-xs font-bold mt-1">You</p>
          <p className="text-2xl font-extrabold text-white">{battle.challengerScore}</p>
        </div>

        <div className="text-[#bd7880] font-extrabold text-lg">VS</div>

        <div className="text-center">
          <div className="relative">
            <Avatar className="h-12 w-12 mx-auto border-2 border-white/20">
              <AvatarImage src={battle.opponentAvatar} />
              <AvatarFallback className="bg-white/10 text-white font-bold">{battle.opponentName[0]}</AvatarFallback>
            </Avatar>
            {!userWon && <Crown size={14} className="absolute -top-1 -right-1 text-amber-400" />}
          </div>
          <p className="text-white/60 text-xs font-bold mt-1">{battle.opponentName}</p>
          <p className="text-2xl font-extrabold text-white/60">{battle.opponentScore}</p>
        </div>
      </div>

      {/* Rewards */}
      {(battle.creditsAwarded > 0 || battle.badgeAwarded) && (
        <div className="flex items-center justify-center gap-3 py-2 bg-green-500/10 border-y border-green-500/20 px-4">
          {battle.creditsAwarded > 0 && (
            <span className="text-green-400 text-xs font-bold">+{battle.creditsAwarded} credits</span>
          )}
          {battle.badgeAwarded && (
            <span className="text-amber-400 text-xs font-bold">🏅 {battle.badgeAwarded}</span>
          )}
        </div>
      )}

      {/* Vote bar */}
      <div className="px-4 py-3">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wide mb-2">Community Vote</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white/60 text-xs w-8 text-right">{challengerPct}%</span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#bd7880] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${challengerPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <span className="text-white/40 text-xs w-8">{100 - challengerPct}%</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleVote("challenger")}
            disabled={voteOnBattle.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#bd7880]/10 border border-[#bd7880]/30 text-[#bd7880] text-xs font-bold hover:bg-[#bd7880]/20 transition-colors"
          >
            <ThumbsUp size={12} /> You ({battle.votesForChallenger})
          </button>
          <button
            onClick={() => handleVote("opponent")}
            disabled={voteOnBattle.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold hover:bg-white/10 transition-colors"
          >
            <ThumbsDown size={12} /> {battle.opponentName.split(" ")[0]} ({battle.votesForOpponent})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SkillBattles() {
  const queryClient = useQueryClient();
  const { data: battles, isLoading } = useGetBattles({ query: { queryKey: getGetBattlesQueryKey() } });
  const createBattle = useCreateBattle();

  const [activeBattle, setActiveBattle] = useState<SkillBattle | null>(null);
  const [completedBattle, setCompletedBattle] = useState<SkillBattle | null>(null);
  const [skill, setSkill] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    const s = skill.trim();
    if (!s) return;
    setCreating(true);
    createBattle.mutate({ data: { skill: s } }, {
      onSuccess: (b) => {
        setSkill("");
        setActiveBattle(b);
        setCreating(false);
        queryClient.invalidateQueries({ queryKey: getGetBattlesQueryKey() });
      },
      onError: () => { toast.error("Failed to create battle"); setCreating(false); },
    });
  };

  const handleBattleDone = (updated: SkillBattle) => {
    setActiveBattle(null);
    setCompletedBattle(updated);
  };

  const myBattles = battles?.filter(b => b.status === "voting" || b.status === "completed") ?? [];

  return (
    <div className="min-h-[100dvh] bg-[#faf7f8] pb-24">
      {/* Header */}
      <div className="bg-[#4d0011] text-white px-4 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#bd7880]/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Swords size={20} className="text-[#ffd9d9]" />
            <span className="text-[10px] font-bold text-[#ffd9d9]/50 uppercase tracking-widest">Arena</span>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "Georgia, serif" }}>Skill Battles</h1>
          <p className="text-[#ffd9d9]/60 text-xs mt-1">Challenge the community. Prove your mastery.</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Create battle */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-xs font-bold text-[#4d0011] uppercase tracking-wide mb-3">New Challenge</p>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bd7880]/30 bg-[#faf7f8]"
              placeholder="Enter a skill to battle on…"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={!skill.trim() || creating}
              className="bg-[#4d0011] hover:bg-[#4d0011]/85 text-white font-bold rounded-xl px-4"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSkill(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-[#bd7880]/30 text-[#4d0011] bg-[#ffd9d9]/30 font-medium hover:bg-[#bd7880]/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Active battle arena */}
        <AnimatePresence>
          {activeBattle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#1a0a0f] rounded-2xl overflow-hidden border border-[#bd7880]/20"
            >
              {/* Arena header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-xs font-bold uppercase tracking-wide">LIVE BATTLE — {activeBattle.skill}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <span>vs</span>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={activeBattle.opponentAvatar} />
                    <AvatarFallback className="text-[8px] bg-[#bd7880] text-white">{activeBattle.opponentName[0]}</AvatarFallback>
                  </Avatar>
                  <span>{activeBattle.opponentName}</span>
                </div>
              </div>
              <BattleArena battle={activeBattle} onDone={handleBattleDone} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Just-completed battle result */}
        <AnimatePresence>
          {completedBattle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-xs font-bold text-[#4d0011] uppercase tracking-wide mb-2">Latest Result</p>
              <BattleResultCard battle={completedBattle} onVote={() => setCompletedBattle(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past battles */}
        {!activeBattle && !completedBattle && (
          <>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#bd7880]" />
              <p className="text-xs font-bold text-[#4d0011] uppercase tracking-wide">Battle History</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#bd7880]" />
              </div>
            ) : myBattles.length === 0 ? (
              <div className="text-center py-12">
                <Swords size={40} className="text-[#bd7880]/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No battles yet.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Create your first challenge above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBattles.map(b => (
                  <BattleResultCard key={b.id} battle={b} onVote={() => queryClient.invalidateQueries({ queryKey: getGetBattlesQueryKey() })} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
