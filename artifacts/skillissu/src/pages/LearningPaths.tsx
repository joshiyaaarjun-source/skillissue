import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, CheckCircle2, Lock, Circle, ArrowLeft, Zap, Trophy, Plus, Loader2 } from "lucide-react";
import {
  useGetLearningPaths, getGetLearningPathsQueryKey,
  useGenerateLearningPath,
  useCompleteLearningStep,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningPath, LearningPathStep } from "@workspace/api-client-react";
import { toast } from "sonner";

const GOAL_SUGGESTIONS = [
  "Become a full-stack developer",
  "Learn UI/UX design from scratch",
  "Master data analysis with Python",
  "Build confidence in public speaking",
  "Learn digital marketing",
  "Become a freelance copywriter",
];

function StepNode({ step, isLast, onComplete }: { step: LearningPathStep; isLast: boolean; onComplete: () => void }) {
  const isCompleted = step.status === "completed";
  const isAvailable = step.status === "available";
  const isLocked = step.status === "locked";

  return (
    <div className="flex flex-col items-center relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: step.order * 0.07, type: "spring" }}
        className="flex flex-col items-center"
      >
        {/* Node circle */}
        <motion.button
          onClick={isAvailable ? onComplete : undefined}
          disabled={isLocked}
          whileTap={isAvailable ? { scale: 0.92 } : {}}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all z-10
            ${isCompleted ? "bg-[#4d0011] border-4 border-[#bd7880]" : ""}
            ${isAvailable ? "bg-[#bd7880] border-4 border-[#ffd9d9] shadow-[0_0_16px_rgba(189,120,128,0.5)] cursor-pointer" : ""}
            ${isLocked ? "bg-muted border-4 border-border cursor-not-allowed" : ""}
          `}
        >
          {isCompleted && <CheckCircle2 size={28} className="text-[#ffd9d9]" />}
          {isAvailable && <Circle size={28} className="text-white fill-white/30" />}
          {isLocked && <Lock size={22} className="text-muted-foreground" />}

          {/* XP badge */}
          <div className={`absolute -top-2 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
            isCompleted ? "bg-green-500 text-white" : isAvailable ? "bg-[#ffd9d9] text-[#4d0011]" : "bg-muted text-muted-foreground"
          }`}>
            +{step.xp}
          </div>
        </motion.button>

        {/* Step info */}
        <div className={`mt-3 max-w-[160px] text-center ${isLocked ? "opacity-40" : ""}`}>
          <p className={`text-xs font-bold leading-snug ${isAvailable ? "text-[#4d0011]" : "text-foreground"}`}>
            {step.title}
          </p>
          {!isLocked && (
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{step.description}</p>
          )}
          {isAvailable && step.resources.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-1.5">
              {step.resources.slice(0, 2).map(r => (
                <span key={r} className="bg-[#ffd9d9] text-[#4d0011] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Connecting line */}
      {!isLast && (
        <div className={`w-0.5 h-10 mt-3 ${isCompleted ? "bg-[#bd7880]" : "bg-border"}`} />
      )}
    </div>
  );
}

function PathView({ path, onBack }: { path: LearningPath; onBack: () => void }) {
  const queryClient = useQueryClient();
  const completeStep = useCompleteLearningStep();
  const progress = path.completedSteps / path.steps.length;

  const handleComplete = (stepId: string) => {
    completeStep.mutate({ pathId: path.id, stepId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLearningPathsQueryKey() });
        toast.success("Step completed! XP earned.");
      },
      onError: () => toast.error("Failed to complete step"),
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#faf7f8] pb-28">
      {/* Header */}
      <div className="bg-[#4d0011] pt-12 pb-8 px-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#bd7880]/10 rounded-full -translate-y-20 translate-x-20" />
        <button onClick={onBack} className="flex items-center gap-1 text-[#ffd9d9]/70 text-sm mb-4 hover:text-[#ffd9d9] transition-colors">
          <ArrowLeft size={16} /> All Paths
        </button>
        <h1 className="text-xl font-extrabold leading-snug max-w-[280px]" style={{ fontFamily: "Georgia, serif" }}>
          {path.goal}
        </h1>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-xs text-[#ffd9d9]/80">{path.totalXp} XP total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-xs text-[#ffd9d9]/80">{path.completedSteps}/{path.steps.length} complete</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-[#bd7880] rounded-full"
          />
        </div>
      </div>

      {/* Steps path */}
      <div className="flex flex-col items-center py-8 px-4">
        {path.steps.map((step, i) => (
          <StepNode
            key={step.id}
            step={step}
            isLast={i === path.steps.length - 1}
            onComplete={() => handleComplete(step.id)}
          />
        ))}

        {path.completedSteps === path.steps.length && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 text-center"
          >
            <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Trophy size={28} className="text-white" />
            </div>
            <p className="font-bold text-[#4d0011]" style={{ fontFamily: "Georgia, serif" }}>Path Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">You earned {path.totalXp} XP</p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function LearningPaths() {
  const { data: paths, isLoading } = useGetLearningPaths({ query: { queryKey: getGetLearningPathsQueryKey() } });
  const generatePath = useGenerateLearningPath();
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (selectedPath) {
    // Re-fetch to get the latest step state
    const live = paths?.find(p => p.id === selectedPath.id) ?? selectedPath;
    return <PathView path={live} onBack={() => setSelectedPath(null)} />;
  }

  const handleGenerate = () => {
    const goal = goalInput.trim();
    if (!goal) return;
    generatePath.mutate({ data: { goal } }, {
      onSuccess: (newPath) => {
        queryClient.invalidateQueries({ queryKey: getGetLearningPathsQueryKey() });
        setGoalInput("");
        setShowInput(false);
        setSelectedPath(newPath);
        toast.success("Learning path created!");
      },
      onError: () => toast.error("Failed to generate learning path"),
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#faf7f8] pb-28">
      {/* Header */}
      <div className="bg-[#4d0011] pt-12 pb-8 px-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-[#bd7880]/10 rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
        <p className="text-[#ffd9d9]/60 text-xs font-semibold tracking-widest uppercase mb-2">AI-Powered</p>
        <h1 className="text-3xl font-extrabold leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Learning Paths
        </h1>
        <p className="text-[#ffd9d9]/70 text-sm mt-2 italic">
          Tell us your goal. We'll build the roadmap.
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Generate new path */}
        <div className="bg-white rounded-2xl border border-[#bd7880]/20 shadow-sm overflow-hidden">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#ffd9d9]/10 transition-colors"
            >
              <div className="w-10 h-10 bg-[#ffd9d9] rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-[#4d0011]" />
              </div>
              <div>
                <p className="font-bold text-[#4d0011] text-sm">Create New Path</p>
                <p className="text-xs text-muted-foreground">Let AI build your roadmap in seconds</p>
              </div>
              <ChevronRight size={16} className="ml-auto text-muted-foreground" />
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold text-[#4d0011]">What do you want to achieve?</p>
              <input
                className="w-full border border-[#bd7880]/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bd7880]/40 bg-[#faf7f8]"
                placeholder="e.g. Become a full-stack developer"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {GOAL_SUGGESTIONS.slice(0, 3).map(s => (
                  <button
                    key={s}
                    onClick={() => setGoalInput(s)}
                    className="text-[10px] border border-[#bd7880]/30 text-[#4d0011] px-2.5 py-1 rounded-full hover:bg-[#ffd9d9]/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowInput(false); setGoalInput(""); }} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!goalInput.trim() || generatePath.isPending}
                  className="flex-1 rounded-xl bg-[#4d0011] hover:bg-[#4d0011]/85 text-white"
                >
                  {generatePath.isPending ? (
                    <><Loader2 size={14} className="mr-1.5 animate-spin" /> Building…</>
                  ) : (
                    <><Sparkles size={14} className="mr-1.5" /> Generate</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing paths */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : paths && paths.length > 0 ? (
          <div>
            <h2 className="text-sm font-bold text-[#4d0011] uppercase tracking-wide mb-3 px-1">Your Paths · {paths.length}</h2>
            <div className="space-y-3">
              {paths.map((path, i) => {
                const progressPct = Math.round((path.completedSteps / path.steps.length) * 100);
                const nextStep = path.steps.find(s => s.status === "available");
                return (
                  <motion.button
                    key={path.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedPath(path)}
                    className="w-full bg-white rounded-2xl border border-[#bd7880]/15 shadow-sm p-4 text-left hover:border-[#bd7880]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-[#4d0011] text-sm leading-snug flex-1" style={{ fontFamily: "Georgia, serif" }}>
                        {path.goal}
                      </p>
                      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#bd7880] rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{path.completedSteps}/{path.steps.length} steps · {path.totalXp} XP total</span>
                      {nextStep && (
                        <span className="text-[#bd7880] font-semibold">Next: {nextStep.title}</span>
                      )}
                      {path.completedSteps === path.steps.length && (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Trophy size={10} /> Complete!
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          !showInput && (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-[#ffd9d9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-[#4d0011]" />
              </div>
              <h3 className="font-bold text-[#4d0011] mb-1" style={{ fontFamily: "Georgia, serif" }}>No paths yet</h3>
              <p className="text-sm text-muted-foreground">Create your first AI-powered learning roadmap above.</p>
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}
