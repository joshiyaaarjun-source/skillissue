import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, CheckCircle, Coffee } from "lucide-react";
import { useGetFocusSprints, useStartFocusSprint, useCompleteFocusSprint } from "@workspace/api-client-react";

interface FocusSprintProps {
  roomId?: number;
  matchId?: number;
}

export default function FocusSprint({ roomId, matchId }: FocusSprintProps) {
  const { data: sprint, refetch } = useGetFocusSprints({ roomId: roomId ? String(roomId) : undefined, matchId: matchId ? String(matchId) : undefined });
  const startSprint = useStartFocusSprint();
  const completeSprint = useCompleteFocusSprint();
  const [accomplishment, setAccomplishment] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  const isActive = sprint && sprint.status === "active" && sprint.id > 0;
  const duration = (sprint?.durationMinutes ?? 25) * 60;
  const remaining = Math.max(0, duration - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = Math.min(1, elapsed / duration);
  const isLocked = isActive && remaining > 0;

  useEffect(() => {
    if (!isActive) return;
    setElapsed(sprint.elapsedSeconds ?? 0);
    const interval = setInterval(() => {
      setElapsed(e => {
        if (e >= duration) { clearInterval(interval); setShowComplete(true); return e; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, sprint?.id]);

  const handleStart = async () => {
    await startSprint.mutateAsync({ data: { roomId, matchId, durationMinutes: 25 } });
    await refetch();
  };

  const handleComplete = async () => {
    if (!sprint || !accomplishment.trim()) return;
    await completeSprint.mutateAsync({ id: String(sprint.id), data: { accomplishment } });
    setShowComplete(false);
    setAccomplishment("");
    await refetch();
  };

  return (
    <div className="bg-[#102b1f]/10 border border-[#102b1f]/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-[#102b1f]" />
          <span className="text-sm font-bold text-[#102b1f]">Focus Sprint</span>
          {isActive && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
        </div>
        {!isActive && (
          <button onClick={handleStart} disabled={startSprint.isPending}
            className="flex items-center gap-1.5 bg-[#102b1f] text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
            <Play className="h-3 w-3" />{startSprint.isPending ? "Starting..." : "Start 25min Sprint"}
          </button>
        )}
      </div>

      {isActive && (
        <>
          <div className="text-center mb-3">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#102b1f" strokeOpacity="0.1" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#102b1f" strokeWidth="5"
                  strokeDasharray={`${progress * 138} 138`} strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <p className="text-xl font-black text-[#102b1f]">{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</p>
              </div>
            </div>
          </div>
          {isLocked ? (
            <div className="bg-[#102b1f]/10 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-[#102b1f]">🎯 Focus mode — chat unlocks in {mins}m {secs}s</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-green-700 flex items-center justify-center gap-1">
                <Coffee className="h-3.5 w-3.5" />Break time! Great work.
              </p>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-3xl p-6 max-w-sm w-full text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-1">Sprint complete! 🎉</h3>
              <p className="text-sm text-muted-foreground mb-4">What did you accomplish in this sprint?</p>
              <textarea value={accomplishment} onChange={e => setAccomplishment(e.target.value)}
                placeholder="I finished the API integration, reviewed 2 PRs..." rows={3}
                className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none resize-none mb-4" />
              <button onClick={handleComplete} disabled={!accomplishment.trim() || completeSprint.isPending}
                className="w-full bg-[#102b1f] text-white font-bold py-3 rounded-2xl disabled:opacity-50">
                {completeSprint.isPending ? "Saving..." : "Log & Finish"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
