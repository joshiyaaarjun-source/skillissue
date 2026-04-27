import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Users, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

type InstantMatchUser = {
  id: number;
  name: string;
  avatar: string;
  skillsOffered: string[];
  skillsWanted: string[];
  credibilityScore: number;
  score: number;
  isReadyNow: boolean;
  overlap: { canTeach: string[]; canLearn: string[] };
};

type InstantMatchData = {
  isReady: boolean;
  readyCount: number;
  matches: InstantMatchUser[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function InstantMatchModal({ open, onClose }: Props) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<InstantMatchData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/instant-match")
      .then(r => r.json())
      .then((d: InstantMatchData) => {
        setData(d);
        setIsReady(d.isReady);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  const toggleReady = async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    setSearching(newReady);
    await fetch("/api/instant-match/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready: newReady }),
    });
    if (newReady) {
      setTimeout(() => setSearching(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-background w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#4d0011] px-6 pt-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-300 fill-current" />
              <h2 className="font-bold text-white text-lg">Instant Match</h2>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {searching ? (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="flex justify-center gap-1 mb-3">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-yellow-300 rounded-full"
                      animate={{ y: [-4, 4, -4] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-white/70 text-sm">Scanning for your best match...</p>
              </motion.div>
            ) : (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {isReady ? "You're live! 🟢" : "Ready to swap right now?"}
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {data?.readyCount ?? 0} other{(data?.readyCount ?? 0) !== 1 ? "s" : ""} ready now
                    </p>
                  </div>
                  <Button
                    onClick={toggleReady}
                    size="sm"
                    className={isReady
                      ? "bg-white text-[#4d0011] hover:bg-white/90 font-bold"
                      : "bg-yellow-400 text-[#4d0011] hover:bg-yellow-300 font-bold"
                    }
                  >
                    {isReady ? "Cancel" : "⚡ Go Live"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 space-y-3 pb-10 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Top Matches Right Now</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (data?.matches.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No matches found. Add more skills to find better connections!
            </p>
          ) : (
            data!.matches.map(match => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-[#4d0011]/30 transition-colors"
                onClick={() => {
                  onClose();
                  navigate("/explore");
                }}
              >
                <Avatar className="h-10 w-10 border-2 border-[#ffd9d9] shrink-0">
                  <AvatarImage src={match.avatar} />
                  <AvatarFallback className="bg-[#bd7880] text-white font-bold">
                    {match.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm leading-none">{match.name}</p>
                    {match.isReadyNow && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Live</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-[10px] text-muted-foreground">{match.credibilityScore.toFixed(1)}</span>
                  </div>
                  {match.overlap.canTeach.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Can teach: {match.overlap.canTeach.join(", ")}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
