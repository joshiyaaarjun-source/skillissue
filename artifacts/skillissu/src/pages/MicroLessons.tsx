import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle, Bookmark, ChevronRight, Clock, Zap, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";

type Lesson = {
  id: number;
  skill: string;
  title: string;
  body: string;
  tip: string;
  emoji: string;
  durationMinutes: number;
};

type CompletionReward = {
  xpGained: number;
  creditsGained: number;
};

export default function MicroLessons() {
  const [, navigate] = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [reward, setReward] = useState<CompletionReward | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    fetch("/api/lessons")
      .then(r => r.json())
      .then((data: { lessons: Lesson[] }) => {
        setLessons(data.lessons ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentLesson = lessons[currentIdx];

  const next = (dir = 1) => {
    if (currentIdx < lessons.length - 1) {
      setDirection(dir);
      setReward(null);
      setCurrentIdx(i => i + 1);
    }
  };

  const complete = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      const r = await fetch(`/api/lessons/${currentLesson.id}/complete`, { method: "POST" });
      const data = await r.json() as CompletionReward;
      setCompletedIds(prev => new Set([...prev, currentLesson.id]));
      setReward(data);
    } finally {
      setCompleting(false);
    }
  };

  const save = async () => {
    if (!currentLesson) return;
    await fetch(`/api/lessons/${currentLesson.id}/save`, { method: "POST" });
    setSavedIds(prev => new Set([...prev, currentLesson.id]));
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24 flex flex-col">
        <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
            <BookOpen className="h-4 w-4" />
            <span>Feed</span>
          </div>
          <h1 className="text-3xl font-bold">Micro-Lessons</h1>
          <p className="text-xs opacity-70 mt-1 italic">5-minute lessons, infinite growth.</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-[#4d0011]/10 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-8 w-8 text-[#4d0011]/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium text-center">
              Generating personalized lessons<br />with AI...
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-[#ffd9d9]/70 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70 mb-2">
          <BookOpen className="h-4 w-4" />
          <span>Feed</span>
        </div>
        <h1 className="text-3xl font-bold">Micro-Lessons</h1>
        <p className="text-xs opacity-70 mt-1 italic">5-minute lessons, infinite growth.</p>

        {lessons.length > 0 && (
          <div className="flex gap-1.5 mt-4">
            {lessons.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i === currentIdx ? "bg-white" : i < currentIdx ? "bg-white/50" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {lessons.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">No lessons available yet.</p>
            <p className="text-xs text-muted-foreground">Add skills to your profile to get personalized lessons.</p>
          </div>
        ) : currentLesson ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLesson.id}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-[#ffd9d9]/40 to-white border border-[#bd7880]/20 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        {currentLesson.skill}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                        <Clock className="h-3 w-3" />
                        <span>{currentLesson.durationMinutes} min</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {currentLesson.emoji} {currentLesson.title}
                    </h2>
                  </div>
                </div>

                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {currentLesson.body}
                </div>

                <div className="bg-[#102b1f]/8 border border-[#102b1f]/20 rounded-xl p-3 flex gap-2">
                  <span className="text-lg shrink-0">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-[#102b1f] mb-0.5">Pro Tip</p>
                    <p className="text-xs text-foreground/70">{currentLesson.tip}</p>
                  </div>
                </div>
              </div>

              {reward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3"
                >
                  <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-700">Lesson Complete!</p>
                    <p className="text-xs text-green-600">+{reward.xpGained} XP · +{reward.creditsGained} Credits earned</p>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                {!completedIds.has(currentLesson.id) ? (
                  <Button
                    onClick={complete}
                    disabled={completing}
                    className="flex-1 bg-[#4d0011] hover:bg-[#4d0011]/90 text-white rounded-xl h-12"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {completing ? "Marking..." : "Mark Complete"}
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="flex-1 rounded-xl h-12 border-green-300 text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Completed
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={save}
                  disabled={savedIds.has(currentLesson.id)}
                  className={`h-12 w-12 rounded-xl p-0 ${savedIds.has(currentLesson.id) ? "border-primary/40 text-primary" : "border-border"}`}
                >
                  <Bookmark className={`h-5 w-5 ${savedIds.has(currentLesson.id) ? "fill-current" : ""}`} />
                </Button>
              </div>

              {currentIdx < lessons.length - 1 && (
                <button
                  onClick={() => next(1)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 transition-colors"
                >
                  Next lesson
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {currentIdx === lessons.length - 1 && (
                <div className="text-center py-4 space-y-2">
                  <Zap className="h-8 w-8 text-yellow-500 mx-auto" />
                  <p className="text-sm font-bold">You've reached the end!</p>
                  <p className="text-xs text-muted-foreground">Come back tomorrow for fresh lessons.</p>
                </div>
              )}

              <div className="text-center text-xs text-muted-foreground">
                {currentIdx + 1} of {lessons.length} lessons
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
