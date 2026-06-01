import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Star, Users, Plus, X, ChevronRight, CheckCircle } from "lucide-react";
import { useGetMentors, useGetMyMentorships, useApplyAsMentor, useCreateMentorship } from "@workspace/api-client-react";
import type { MentorProfile } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";

const SKILLS = ["React", "TypeScript", "Python", "Figma", "Node.js", "GraphQL", "UI Design", "Data Science"];

function ApplyModal({ onClose }: { onClose: () => void }) {
  const [skill, setSkill] = useState("");
  const apply = useApplyAsMentor();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const submit = async () => {
    if (!skill) return;
    const r = await apply.mutateAsync({ data: { skill } });
    setResult(r);
  };

  if (result) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl p-6 max-w-sm w-full text-center">
        <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${result.status === "approved" ? "text-green-500" : "text-[#bd7880]"}`} />
        <h3 className="font-bold text-lg mb-2">{result.status === "approved" ? "You're a Mentor! 🎉" : "Application Received"}</h3>
        <p className="text-sm text-muted-foreground mb-6">{result.message}</p>
        <button onClick={onClose} className="bg-[#4d0011] text-white font-bold py-3 px-8 rounded-2xl w-full">Done</button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Apply as Mentor</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Requirements: 10+ sessions taught & 4.2+ average rating for the skill.</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkill(s)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${skill === s ? "bg-[#4d0011] text-white border-[#4d0011]" : "border-border text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={submit} disabled={!skill || apply.isPending}
          className="w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl disabled:opacity-50">
          {apply.isPending ? "Applying..." : "Apply Now"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Mentorship() {
  const { data: mentors, isLoading } = useGetMentors();
  const { data: myMentorships } = useGetMyMentorships();
  const createMentorship = useCreateMentorship();
  const queryClient = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [tab, setTab] = useState<"browse" | "mine">("browse");

  const handleEnroll = async (mentor: MentorProfile) => {
    await createMentorship.mutateAsync({ data: { mentorId: mentor.id, skill: mentor.skill } });
    queryClient.invalidateQueries({ queryKey: ["getMyMentorships"] });
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#ffd9d9]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mentorship Tiers</h1>
              <p className="text-xs opacity-60">Formal skill mentorship with weekly check-ins</p>
            </div>
          </div>
          <button onClick={() => setShowApply(true)}
            className="bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
            Become Mentor
          </button>
        </div>
        <div className="flex gap-2">
          {(["browse", "mine"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? "bg-white text-[#4d0011]" : "bg-white/10 text-[#ffd9d9]"}`}>
              {t === "browse" ? "Browse Mentors" : "My Mentorships"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {tab === "browse" ? (
          isLoading ? [1,2,3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />) :
          !mentors?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No mentors yet</p>
              <p className="text-sm">Be the first to apply!</p>
            </div>
          ) : mentors.map((mentor, i) => (
            <motion.div key={mentor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentor.avatar} />
                  <AvatarFallback className="bg-[#4d0011] text-white text-sm">{mentor.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">{mentor.name}</span>
                    <span className="text-[10px] bg-[#4d0011]/10 text-[#4d0011] px-2 py-0.5 rounded-full font-bold">{mentor.skill}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{mentor.avgRating.toFixed(1)}</span>
                    <span>{mentor.sessionCount} sessions</span>
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{mentor.menteeCount}/3 mentees</span>
                  </div>
                </div>
                <button onClick={() => handleEnroll(mentor)} disabled={mentor.menteeCount >= 3 || createMentorship.isPending}
                  className="bg-[#4d0011] text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-40">
                  {mentor.menteeCount >= 3 ? "Full" : "3C/wk"}
                </button>
              </div>
              {mentor.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{mentor.bio}</p>}
            </motion.div>
          ))
        ) : (
          !myMentorships?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No active mentorships</p>
              <p className="text-sm">Browse mentors to get started</p>
            </div>
          ) : myMentorships.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={m.mentorId !== 1 ? m.mentorAvatar : m.menteeAvatar} />
                  <AvatarFallback className="bg-[#102b1f] text-white text-xs">{(m.mentorId !== 1 ? m.mentorName : m.menteeName)[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-sm">{m.mentorId !== 1 ? m.mentorName : m.menteeName}</p>
                  <p className="text-xs text-muted-foreground">{m.mentorId !== 1 ? "Your mentor" : "Your mentee"} · {m.skill}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{m.status}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>3 credits/week · Progress: {m.progressNotes || "No notes yet"}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>{showApply && <ApplyModal onClose={() => setShowApply(false)} />}</AnimatePresence>
      <BottomNav />
    </div>
  );
}
