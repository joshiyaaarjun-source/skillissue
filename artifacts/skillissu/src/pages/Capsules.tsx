import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Star, Users, ChevronRight, X, CheckCircle2, Lock, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useGetCapsules, getGetCapsulesQueryKey, useEnrollInCapsule, useGetCapsuleLessons, getGetCapsuleLessonsQueryKey, useCompleteCapsuleLesson } from "@workspace/api-client-react";
import type { Capsule } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

const DIFF_COLORS: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Mid: "bg-amber-100 text-amber-700",
  Advanced: "bg-red-100 text-red-700",
};

function CapsuleDetail({ capsule, onClose }: { capsule: Capsule; onClose: () => void }) {
  const queryClient = useQueryClient();
  const enroll = useEnrollInCapsule();
  const completeLesson = useCompleteCapsuleLesson();
  const { data: lessonsData, isLoading } = useGetCapsuleLessons(String(capsule.id), { query: { queryKey: getGetCapsuleLessonsQueryKey(String(capsule.id)) } });
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const handleEnroll = async () => {
    try {
      await enroll.mutateAsync({ id: String(capsule.id) });
      queryClient.invalidateQueries({ queryKey: getGetCapsulesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCapsuleLessonsQueryKey(String(capsule.id)) });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Enrollment failed");
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    await completeLesson.mutateAsync({ id: String(capsule.id), lessonId: String(lessonId) });
    queryClient.invalidateQueries({ queryKey: getGetCapsuleLessonsQueryKey(String(capsule.id)) });
  };

  const lessonsCompleted = lessonsData?.lessonsCompleted ?? 0;
  const totalLessons = lessonsData?.lessons.length ?? 0;
  const progressPct = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-x-0 bottom-0 bg-background rounded-t-3xl h-[92dvh] flex flex-col overflow-hidden"
      >
        <div className="bg-[#4d0011] text-[#ffd9d9] px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{capsule.coverEmoji}</span>
            <button onClick={onClose}><X className="h-5 w-5 text-[#ffd9d9]/60" /></button>
          </div>
          <h2 className="text-xl font-bold leading-tight">{capsule.title}</h2>
          <p className="text-sm opacity-70 mt-1">{capsule.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <Avatar className="h-6 w-6"><AvatarImage src={capsule.creatorAvatar} /><AvatarFallback className="text-[9px] bg-[#bd7880] text-white">{capsule.creatorName[0]}</AvatarFallback></Avatar>
            <span className="text-xs opacity-70">{capsule.creatorName}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLORS[capsule.difficulty] ?? "bg-muted text-muted-foreground"}`}>{capsule.difficulty}</span>
          </div>

          {capsule.enrolled && totalLessons > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] opacity-60 mb-1">
                <span>Progress</span>
                <span>{lessonsCompleted}/{totalLessons} lessons</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  className="h-1.5 rounded-full bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)
          ) : lessonsData?.lessons.map((lesson, i) => {
            const isCompleted = i < lessonsCompleted;
            const isAvailable = capsule.enrolled && i <= lessonsCompleted;
            const isExpanded = expandedLesson === lesson.id;

            return (
              <div key={lesson.id} className={`border rounded-2xl overflow-hidden transition-all ${isCompleted ? "border-green-200 bg-green-50/50" : isAvailable ? "border-[#4d0011]/20 bg-card" : "border-border bg-muted/30 opacity-60"}`}>
                <button
                  onClick={() => isAvailable && setExpandedLesson(isExpanded ? null : lesson.id)}
                  className="w-full flex items-center gap-3 p-3"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isCompleted ? "bg-green-500 text-white" : isAvailable ? "bg-[#4d0011] text-white" : "bg-muted text-muted-foreground"}`}>
                    {isCompleted ? "✓" : isAvailable ? <Play className="h-3 w-3 fill-current" /> : <Lock className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{lesson.title}</p>
                    <p className="text-[10px] text-muted-foreground">{lesson.durationMinutes} min</p>
                  </div>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{lesson.content}</p>
                        {!isCompleted && (
                          <button
                            onClick={() => handleCompleteLesson(lesson.id)}
                            disabled={completeLesson.isPending}
                            className="mt-3 w-full bg-[#102b1f] text-white font-bold py-2.5 rounded-xl text-sm"
                          >
                            Mark Complete ✓
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {!capsule.enrolled && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-muted-foreground">Enrollment cost</span>
              <span className="font-black text-xl text-[#4d0011]">{capsule.enrollmentCost}C</span>
            </div>
            <button
              onClick={handleEnroll}
              disabled={enroll.isPending}
              className="w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl text-base disabled:opacity-50"
            >
              {enroll.isPending ? "Enrolling..." : `Enroll for ${capsule.enrollmentCost} credits`}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Capsules() {
  const [, navigate] = useLocation();
  const { data: capsules, isLoading } = useGetCapsules({ query: { queryKey: getGetCapsulesQueryKey() } });
  const [selected, setSelected] = useState<Capsule | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/explore")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-[#ffd9d9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skill Capsules</h1>
            <p className="text-xs opacity-60">3–5 lesson mini-courses from top teachers</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-36 bg-muted/50 rounded-2xl animate-pulse" />)
        ) : capsules?.map((capsule, idx) => (
          <motion.div
            key={capsule.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            onClick={() => setSelected(capsule)}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#4d0011]/30 transition-colors"
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#ffd9d9]/30 flex items-center justify-center text-3xl shrink-0">
                {capsule.coverEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#4d0011]">{capsule.skillTag}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DIFF_COLORS[capsule.difficulty] ?? ""}`}>{capsule.difficulty}</span>
                  {capsule.enrolled && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Enrolled</span>}
                </div>
                <h3 className="font-bold text-sm leading-tight">{capsule.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4"><AvatarImage src={capsule.creatorAvatar} /><AvatarFallback className="text-[7px]">{capsule.creatorName[0]}</AvatarFallback></Avatar>
                    <span>{capsule.creatorName.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{capsule.avgRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    <span>{capsule.totalEnrollments}</span>
                  </div>
                  {!capsule.enrolled && <span className="ml-auto font-bold text-[#4d0011]">{capsule.enrollmentCost}C</span>}
                </div>
                {capsule.enrolled && capsule.myProgress > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1">
                      <div className="h-1 rounded-full bg-[#4d0011]" style={{ width: `${Math.min(100, capsule.myProgress * 20)}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">{capsule.myProgress}/5</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && <CapsuleDetail capsule={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
