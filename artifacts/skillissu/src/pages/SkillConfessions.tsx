import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Heart, Lightbulb, Plus, X, Send } from "lucide-react";
import {
  useGetConfessions, getGetConfessionsQueryKey,
  useCreateConfession, useReactToConfession
} from "@workspace/api-client-react";
import type { Confession } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";

const SKILLS = ["React", "Python", "Figma", "TypeScript", "Node.js", "UI Design", "General"];
const REACTION_META = {
  relatable: { icon: Heart, label: "Relatable", color: "text-rose-500 bg-rose-50 border-rose-200" },
  tip: { icon: Lightbulb, label: "Here's a tip", color: "text-amber-600 bg-amber-50 border-amber-200" },
  same: { icon: MessageCircle, label: "Same", color: "text-[#4d0011] bg-[#ffd9d9]/40 border-[#ffd9d9]" },
};

function ConfessionCard({ c }: { c: Confession }) {
  const react = useReactToConfession();
  const queryClient = useQueryClient();
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState("");

  const handleReact = async (type: string, tipText = "") => {
    await react.mutateAsync({ id: String(c.id), data: { type, tip: tipText } });
    queryClient.invalidateQueries({ queryKey: getGetConfessionsQueryKey() });
    setShowTip(false);
    setTip("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#4d0011]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-[#4d0011]">{c.isOwn ? "Me" : "?"}</span>
        </div>
        <div className="flex-1">
          {c.skill && <span className="text-[10px] bg-[#ffd9d9]/60 text-[#4d0011] px-2 py-0.5 rounded-full font-bold mr-2">{c.skill}</span>}
          <p className="text-sm leading-relaxed mt-1.5 text-foreground">{c.content}</p>
          <div className="flex items-center gap-2 mt-3">
            {(Object.entries(REACTION_META) as [string, typeof REACTION_META[keyof typeof REACTION_META]][]).map(([type, meta]) => {
              const Icon = meta.icon;
              const count = type === "relatable" ? c.relatableCount : type === "tip" ? c.tipCount : c.sameCount;
              const isActive = c.myReaction === type;
              return (
                <button key={type} onClick={() => type === "tip" && !isActive ? setShowTip(v => !v) : handleReact(type)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${isActive ? meta.color : "border-border text-muted-foreground"}`}>
                  <Icon className="h-3 w-3" />
                  {count > 0 && <span>{count}</span>}
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {showTip && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3">
                <div className="flex gap-2">
                  <input value={tip} onChange={e => setTip(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReact("tip", tip)}
                    placeholder="Share your tip..." className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs outline-none" />
                  <button onClick={() => handleReact("tip", tip)} disabled={!tip.trim()}
                    className="bg-[#4d0011] text-white px-3 py-2 rounded-xl disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function PostModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState("");
  const [skill, setSkill] = useState("");
  const create = useCreateConfession();
  const queryClient = useQueryClient();

  const submit = async () => {
    if (content.trim().length < 10) return;
    await create.mutateAsync({ data: { content: content.trim(), skill } });
    queryClient.invalidateQueries({ queryKey: getGetConfessionsQueryKey() });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Confess Anonymously</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Your name won't appear. Be honest — the community thrives on real struggles.</p>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="I've been calling myself a React developer for 2 years but..."
          rows={4} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3" />
        <div className="flex flex-wrap gap-2 mb-4">
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkill(prev => prev === s ? "" : s)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${skill === s ? "bg-[#4d0011] text-white border-[#4d0011]" : "border-border"}`}>{s}</button>
          ))}
        </div>
        <button onClick={submit} disabled={content.trim().length < 10 || create.isPending}
          className="w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl disabled:opacity-50">
          {create.isPending ? "Posting..." : "Confess 🤫"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function SkillConfessions() {
  const { data: confessions, isLoading } = useGetConfessions({ query: { queryKey: getGetConfessionsQueryKey() } });
  const [showPost, setShowPost] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-lg">🤫</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Skill Confessions</h1>
              <p className="text-xs opacity-60">Anonymous. Real. Relatable.</p>
            </div>
          </div>
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
            <Plus className="h-3.5 w-3.5" />Confess
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/50 rounded-2xl animate-pulse" />) :
          confessions?.map(c => <ConfessionCard key={c.id} c={c} />)}
      </div>

      <AnimatePresence>{showPost && <PostModal onClose={() => setShowPost(false)} />}</AnimatePresence>
      <BottomNav />
    </div>
  );
}
