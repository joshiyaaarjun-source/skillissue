import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, CheckCircle2, RefreshCw, X } from "lucide-react";
import { useGetTodayChallenge, getGetTodayChallengeQueryKey, useCompleteChallenge } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ColdStartWidget() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetTodayChallenge({ query: { queryKey: getGetTodayChallengeQueryKey() } });
  const completeMutation = useCompleteChallenge();
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed || !data || data.graduated) return null;

  const challenge = data.challenge;
  const completedCount = data.completedCount ?? 0;

  const handleComplete = async () => {
    if (!challenge || challenge.completed) return;
    await completeMutation.mutateAsync({ id: String(challenge.id) });
    setCompleted(true);
    queryClient.invalidateQueries({ queryKey: getGetTodayChallengeQueryKey() });
    setTimeout(() => setDismissed(true), 2000);
  };

  if (!challenge) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="bg-gradient-to-br from-[#4d0011] to-[#2a0008] rounded-2xl p-4 border border-[#ffd9d9]/10 shadow-sm relative overflow-hidden"
        >
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-[#ffd9d9]/5" />
          <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-[#ffd9d9]/30 z-10">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-4 w-4 text-[#ffd9d9]" />
            <span className="text-[10px] font-bold text-[#ffd9d9] uppercase tracking-widest">Daily Challenge</span>
            <span className="ml-auto text-[10px] text-[#ffd9d9]/40">{completedCount}/3 done</span>
          </div>

          <div className="flex gap-1 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < completedCount ? "bg-[#ffd9d9]" : "bg-white/10"}`} />
            ))}
          </div>

          <p className="text-[#ffd9d9] text-sm font-semibold leading-snug mb-3 pr-6">
            {challenge.prompt}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#ffd9d9]/40">Skill: <span className="text-[#ffd9d9]/70 font-medium">{challenge.skillContext}</span></span>
            <div className="ml-auto flex items-center gap-1.5 bg-[#ffd9d9]/10 text-[#ffd9d9] text-[10px] font-bold px-2 py-1 rounded-full">
              +5C reward
            </div>
          </div>

          {completed ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-3 flex items-center justify-center gap-2 bg-green-500/20 text-green-300 rounded-xl py-2.5 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              +5 credits earned!
            </motion.div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending || challenge.completed}
              className="mt-3 w-full bg-[#ffd9d9]/10 border border-[#ffd9d9]/20 text-[#ffd9d9] font-bold py-2.5 rounded-xl text-sm hover:bg-[#ffd9d9]/20 transition-colors disabled:opacity-40"
            >
              {challenge.completed ? "✓ Done" : completeMutation.isPending ? "Completing..." : "Mark Complete → +5C"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
